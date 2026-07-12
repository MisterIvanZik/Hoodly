package com.hoodly.hoodlydesktop.controllers;

import com.hoodly.hoodlydesktop.models.Incident;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.*;
import javafx.stage.Modality;
import javafx.stage.Stage;

import java.util.concurrent.CompletableFuture;

public class ConflictResolutionDialog {

    public enum Resolution { KEEP_LOCAL, KEEP_SERVER }

    public static CompletableFuture<Resolution> show(Incident local, Incident server) {
        CompletableFuture<Resolution> future = new CompletableFuture<>();

        Stage stage = new Stage();
        stage.initModality(Modality.APPLICATION_MODAL);
        stage.setTitle("Conflit de synchronisation");
        stage.setMinWidth(640);

        // Titre
        Label title = new Label("⚠ Conflit détecté");
        title.setStyle("-fx-font-size: 18px; -fx-font-weight: bold; -fx-text-fill: #1E3A8A;");

        Label subtitle = new Label(
            "L'incident \"" + local.getType() + "\" a été modifié en local et sur le serveur pendant la déconnexion."
        );
        subtitle.setWrapText(true);
        subtitle.setStyle("-fx-text-fill: #64748B; -fx-font-size: 13px;");

        // Colonnes
        VBox localBox = buildVersionBox("📱 Version locale (Java)", local, "#EFF6FF", "#1E3A8A");
        VBox serverBox = buildVersionBox("🌐 Version serveur (web)", server, "#F0FDF4", "#166534");

        HBox columns = new HBox(16, localBox, serverBox);
        HBox.setHgrow(localBox, Priority.ALWAYS);
        HBox.setHgrow(serverBox, Priority.ALWAYS);

        // Boutons
        Button keepLocal = new Button("Garder la version locale");
        keepLocal.setStyle(
            "-fx-background-color: #1E3A8A; -fx-text-fill: white; -fx-font-weight: bold;" +
            "-fx-padding: 10 20 10 20; -fx-background-radius: 8; -fx-cursor: hand;"
        );

        Button keepServer = new Button("Garder la version serveur");
        keepServer.setStyle(
            "-fx-background-color: #166534; -fx-text-fill: white; -fx-font-weight: bold;" +
            "-fx-padding: 10 20 10 20; -fx-background-radius: 8; -fx-cursor: hand;"
        );

        keepLocal.setOnAction(e -> { future.complete(Resolution.KEEP_LOCAL); stage.close(); });
        keepServer.setOnAction(e -> { future.complete(Resolution.KEEP_SERVER); stage.close(); });

        // Fermeture sans choix = garder serveur par défaut
        stage.setOnCloseRequest(e -> future.complete(Resolution.KEEP_SERVER));

        HBox buttons = new HBox(16, keepLocal, keepServer);
        buttons.setAlignment(Pos.CENTER);

        VBox root = new VBox(16, title, subtitle, columns, buttons);
        root.setPadding(new Insets(24));
        root.setStyle("-fx-background-color: white;");

        stage.setScene(new Scene(root));
        stage.show();

        return future;
    }

    private static VBox buildVersionBox(String header, Incident incident, String bgColor, String accentColor) {
        Label headerLabel = new Label(header);
        headerLabel.setStyle(
            "-fx-font-weight: bold; -fx-font-size: 13px; -fx-text-fill: " + accentColor + ";"
        );

        VBox box = new VBox(8,
            headerLabel,
            field("Statut", incident.getStatut()),
            field("Priorité", incident.getPriorite()),
            field("Description", incident.getDescription()),
            field("Modifié le", formatDate(incident.getUpdatedAt()))
        );
        box.setPadding(new Insets(16));
        box.setStyle(
            "-fx-background-color: " + bgColor + "; -fx-background-radius: 10;" +
            "-fx-border-color: " + accentColor + "33; -fx-border-radius: 10; -fx-border-width: 1.5;"
        );
        return box;
    }

    private static HBox field(String label, String value) {
        Label lbl = new Label(label + " : ");
        lbl.setStyle("-fx-font-weight: bold; -fx-font-size: 12px; -fx-text-fill: #374151;");

        Label val = new Label(value != null ? value : "—");
        val.setWrapText(true);
        val.setStyle("-fx-font-size: 12px; -fx-text-fill: #111827;");

        HBox row = new HBox(4, lbl, val);
        row.setAlignment(Pos.CENTER_LEFT);
        return row;
    }

    private static String formatDate(String iso) {
        if (iso == null || iso.isEmpty()) return "—";
        // "2024-05-10T14:32:00.000Z" → "10/05/2024 14:32"
        try {
            return iso.substring(8, 10) + "/" + iso.substring(5, 7) + "/" + iso.substring(0, 4)
                + " " + iso.substring(11, 16);
        } catch (Exception e) {
            return iso;
        }
    }
}
