package com.hoodly.hoodlydesktop.controllers;

import com.hoodly.hoodlydesktop.AppContext;
import com.hoodly.hoodlydesktop.auth.TokenStore;
import com.hoodly.hoodlydesktop.db.IncidentDao;
import com.hoodly.hoodlydesktop.models.Incident;
import com.hoodly.hoodlydesktop.services.ApiClient;
import com.hoodly.hoodlydesktop.services.NetworkMonitor;
import com.hoodly.hoodlydesktop.services.SyncService;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.scene.chart.*;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class DashboardController {

    @FXML private Label adminNameLabel;
    @FXML private Label connectionStatus;
    @FXML private Label pageTitle;
    @FXML private Label openIncidentsCount;
    @FXML private Label inProgressCount;
    @FXML private Label resolvedCount;
    @FXML private Label syncPendingCount;

    @FXML private VBox incidentsPane;
    @FXML private VBox statsPane;

    @FXML private TableView<Incident> incidentsTable;
    @FXML private TableColumn<Incident, String> typeCol;
    @FXML private TableColumn<Incident, String> descCol;
    @FXML private TableColumn<Incident, String> statutCol;
    @FXML private TableColumn<Incident, String> prioriteCol;
    @FXML private TableColumn<Incident, String> dateCol;
    @FXML private TableColumn<Incident, Void> actionsCol;

    @FXML private PieChart statutChart;
    @FXML private BarChart<String, Number> typeChart;
    @FXML private BarChart<String, Number> participationChart;

    private final XYChart.Series<String, Number> typeSeries = new XYChart.Series<>();
    private final XYChart.Series<String, Number> participationSeries = new XYChart.Series<>();

    private static final String[] BAR_COLORS = {
        "#1E3A8A", "#2563EB", "#10B981", "#F59E0B", "#EF4444",
        "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#06B6D4"
    };

    private ApiClient apiClient;
    private IncidentDao incidentDao;
    private NetworkMonitor networkMonitor;
    private SyncService syncService;

    @FXML
    public void initialize() {
        AppContext ctx = AppContext.getInstance();
        apiClient = ctx.getApiClient();
        incidentDao = ctx.getIncidentDao();
        networkMonitor = ctx.getNetworkMonitor();
        syncService = ctx.getSyncService();

        adminNameLabel.setText("Modérateur");

        typeCol.setCellValueFactory(new PropertyValueFactory<>("type"));
        descCol.setCellValueFactory(new PropertyValueFactory<>("description"));
        statutCol.setCellValueFactory(new PropertyValueFactory<>("statut"));
        prioriteCol.setCellValueFactory(new PropertyValueFactory<>("priorite"));
        dateCol.setCellValueFactory(new PropertyValueFactory<>("createdAt"));
        setupActionsColumn();

        typeSeries.setName("Incidents");
        participationSeries.setName("Incidents signalés");
        ObservableList<XYChart.Series<String, Number>> typeData = FXCollections.observableArrayList();
        typeData.add(typeSeries);
        typeChart.setData(typeData);
        ObservableList<XYChart.Series<String, Number>> participationData = FXCollections.observableArrayList();
        participationData.add(participationSeries);
        participationChart.setData(participationData);

        updateConnectionStatus(networkMonitor.isOnline());
        networkMonitor.addListener(online -> {
            updateConnectionStatus(online);
            loadIncidents();
        });

        syncService.addOnSyncCompleteListener(this::loadIncidents);

        new Thread(() -> {
            if (ctx.getZoneId() == null) {
                try {
                    String zoneId = apiClient.fetchZoneId();
                    ctx.setZoneId(zoneId);
                } catch (Exception ignored) {}
            }
            Platform.runLater(this::loadIncidents);
        }).start();
    }

    private void loadIncidents() {
        new Thread(() -> {
            List<Incident> incidents = apiClient.getIncidents(AppContext.getInstance().getZoneId());
            int pending = incidentDao.countPending();

            long open = incidents.stream().filter(i -> "signale".equals(i.getStatut())).count();
            long inProgress = incidents.stream().filter(i -> "en_cours".equals(i.getStatut())).count();
            long resolved = incidents.stream().filter(i -> "resolu".equals(i.getStatut())).count();

            Platform.runLater(() -> {
                incidentsTable.setItems(FXCollections.observableArrayList(incidents));
                openIncidentsCount.setText(String.valueOf(open));
                inProgressCount.setText(String.valueOf(inProgress));
                resolvedCount.setText(String.valueOf(resolved));
                syncPendingCount.setText(String.valueOf(pending));
            });
        }).start();
    }

    private void updateConnectionStatus(boolean online) {
        connectionStatus.setText(online ? "● En ligne" : "● Hors ligne");
    }

    private void setupActionsColumn() {
        actionsCol.setCellFactory(col -> new TableCell<>() {
            private final Button btnEnCours = new Button("En cours");
            private final Button btnResolu = new Button("Résolu");
            private final HBox box = new HBox(6, btnEnCours, btnResolu);

            {
                btnEnCours.setOnAction(e -> changeStatut(getTableView().getItems().get(getIndex()), "en_cours"));
                btnResolu.setOnAction(e -> changeStatut(getTableView().getItems().get(getIndex()), "resolu"));
            }

            @Override
            protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || getIndex() < 0) {
                    setGraphic(null);
                    return;
                }
                Incident incident = getTableView().getItems().get(getIndex());
                String statut = incident.getStatut();
                btnEnCours.setDisable("en_cours".equals(statut) || "resolu".equals(statut));
                btnResolu.setDisable("resolu".equals(statut));
                setGraphic(box);
            }
        });
    }

    private void changeStatut(Incident incident, String newStatut) {
        incidentDao.updateStatutOffline(incident.getId(), newStatut);
        if ("pending_create".equals(incident.getSyncStatus())) {
            loadIncidents();
            return;
        }
        new Thread(() -> {
            try {
                apiClient.patchIncidentStatut(incident.getId(), newStatut);
                incidentDao.markSynced(incident.getId());
            } catch (Exception ignored) {}
            Platform.runLater(this::loadIncidents);
        }).start();
    }

    @FXML
    private void showIncidents() {
        incidentsPane.setVisible(true);
        incidentsPane.setManaged(true);
        statsPane.setVisible(false);
        statsPane.setManaged(false);
        pageTitle.setText("Gestion des incidents");
        loadIncidents();
    }

    @FXML
    private void showStats() {
        incidentsPane.setVisible(false);
        incidentsPane.setManaged(false);
        statsPane.setVisible(true);
        statsPane.setManaged(true);
        new Thread(() -> {
            List<Incident> incidents = incidentDao.findAll();
            Platform.runLater(() -> loadStats(incidents));
        }).start();
    }

    private void loadStats(List<Incident> incidents) {
        // PieChart — répartition par statut
        statutChart.setData(FXCollections.observableArrayList(
            new PieChart.Data("Signalé", incidents.stream().filter(i -> "signale".equals(i.getStatut())).count()),
            new PieChart.Data("En cours", incidents.stream().filter(i -> "en_cours".equals(i.getStatut())).count()),
            new PieChart.Data("Résolu", incidents.stream().filter(i -> "resolu".equals(i.getStatut())).count())
        ));

        // BarChart — incidents par type (même series, on remplace juste les données)
        Map<String, Long> byType = incidents.stream()
            .filter(i -> i.getType() != null)
            .collect(Collectors.groupingBy(Incident::getType, Collectors.counting()));
        ObservableList<XYChart.Data<String, Number>> typePoints = FXCollections.observableArrayList();
        byType.forEach((type, count) -> typePoints.add(new XYChart.Data<>(type, count)));
        typeSeries.getData().setAll(typePoints);
        applyColors(typeSeries);

        // BarChart — participation des voisins (top 10 signaleurs)
        Map<String, Long> bySignaleur = incidents.stream()
            .filter(i -> i.getSignaledPar() != null && !i.getSignaledPar().isEmpty())
            .collect(Collectors.groupingBy(Incident::getSignaledPar, Collectors.counting()));
        ObservableList<XYChart.Data<String, Number>> participationPoints = FXCollections.observableArrayList();
        bySignaleur.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(10)
            .forEach(e -> participationPoints.add(new XYChart.Data<>(e.getKey(), e.getValue())));
        participationSeries.getData().setAll(participationPoints);
        applyColors(participationSeries);
    }

    private void applyColors(XYChart.Series<String, Number> series) {
        for (int i = 0; i < series.getData().size(); i++) {
            final String color = BAR_COLORS[i % BAR_COLORS.length];
            XYChart.Data<String, Number> item = series.getData().get(i);
            if (item.getNode() != null) {
                item.getNode().setStyle("-fx-bar-fill: " + color + ";");
            } else {
                item.nodeProperty().addListener((obs, oldNode, newNode) -> {
                    if (newNode != null) newNode.setStyle("-fx-bar-fill: " + color + ";");
                });
            }
        }
    }

    @FXML
    private void handleLogout() {
        TokenStore.getInstance().clear();
        try {
            FXMLLoader loader = new FXMLLoader(
                    getClass().getResource("/com/hoodly/hoodlydesktop/views/login.fxml")
            );
            Scene scene = new Scene(loader.load(), 480, 600);
            scene.getStylesheets().add(
                    getClass().getResource("/com/hoodly/hoodlydesktop/styles/main.css").toExternalForm()
            );
            Stage stage = (Stage) adminNameLabel.getScene().getWindow();
            stage.setScene(scene);
            stage.setResizable(false);
            stage.setTitle("HOODLY");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
