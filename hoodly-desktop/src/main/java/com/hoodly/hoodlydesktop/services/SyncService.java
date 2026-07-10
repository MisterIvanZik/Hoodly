package com.hoodly.hoodlydesktop.services;

import com.hoodly.hoodlydesktop.controllers.ConflictResolutionDialog;
import com.hoodly.hoodlydesktop.db.IncidentDao;
import com.hoodly.hoodlydesktop.models.Incident;
import javafx.application.Platform;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SyncService {

    private final ApiClient apiClient;
    private final IncidentDao incidentDao;
    private final ExecutorService executor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "sync-service");
        t.setDaemon(true);
        return t;
    });

    private final List<Runnable> onSyncCompleteListeners = new CopyOnWriteArrayList<>();

    public SyncService(ApiClient apiClient, IncidentDao incidentDao) {
        this.apiClient = apiClient;
        this.incidentDao = incidentDao;
    }

    public void addOnSyncCompleteListener(Runnable listener) {
        onSyncCompleteListeners.add(listener);
    }

    public void syncNow() {
        executor.submit(() -> {
            List<Incident> pending = incidentDao.findPending();
            for (Incident local : pending) {
                try {
                    if ("pending_create".equals(local.getSyncStatus())) {
                        Incident created = apiClient.createIncident(local);
                        incidentDao.markSyncedWithNewId(local.getId(), created.getId());

                    } else if ("pending_update".equals(local.getSyncStatus())) {
                        if (hasConflict(local)) {
                            Incident server = apiClient.getIncident(local.getId());
                            resolveConflict(local, server);
                        } else {
                            apiClient.patchIncidentStatut(local.getId(), local.getStatut());
                            incidentDao.markSynced(local.getId());
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Échec de sync pour l'incident " + local.getId() + " : " + e.getMessage());
                }
            }
            Platform.runLater(() -> onSyncCompleteListeners.forEach(Runnable::run));
        });
    }

    private boolean hasConflict(Incident local) {
        try {
            String syncedAt = incidentDao.getSyncedAt(local.getId());
            if (syncedAt == null) return false;

            Incident server = apiClient.getIncident(local.getId());
            if (server.getUpdatedAt() == null) return false;

            return server.getUpdatedAt().compareTo(syncedAt) > 0;
        } catch (Exception e) {
            System.err.println("hasConflict: impossible de vérifier le conflit pour " + local.getId() + " : " + e.getMessage());
            return false;
        }
    }

    private void resolveConflict(Incident local, Incident server) {
        CompletableFuture<ConflictResolutionDialog.Resolution> future = new CompletableFuture<>();

        Platform.runLater(() -> {
            ConflictResolutionDialog.show(local, server).thenAccept(future::complete);
        });

        try {
            ConflictResolutionDialog.Resolution resolution = future.get();
            if (resolution == ConflictResolutionDialog.Resolution.KEEP_LOCAL) {
                apiClient.patchIncidentStatut(local.getId(), local.getStatut());
                incidentDao.markSynced(local.getId());
            } else {
                // Accepter la version serveur : écraser le local
                incidentDao.markSynced(local.getId());
                incidentDao.upsertFromServer(server);
            }
        } catch (Exception e) {
            System.err.println("Erreur lors de la résolution du conflit : " + e.getMessage());
        }
    }
}
