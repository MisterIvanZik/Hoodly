package com.hoodly.hoodlydesktop.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Incident {

    @JsonProperty("_id")
    @JsonAlias("id")
    private String id;
    private String type;
    private String description;
    private String statut;
    private String priorite;
    private String signaledPar;
    private String zoneId;
    private String photoUrl;
    private String createdAt;
    private String updatedAt;

    private String contexte;
    private String serviceId;
    private String eventId;

    @JsonIgnore
    private String syncStatus;

    public Incident() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public String getPriorite() { return priorite; }
    public void setPriorite(String priorite) { this.priorite = priorite; }

    public String getSignaledPar() { return signaledPar; }
    public void setSignaledPar(String signaledPar) { this.signaledPar = signaledPar; }

    public String getZoneId() { return zoneId; }
    public void setZoneId(String zoneId) { this.zoneId = zoneId; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getContexte() { return contexte; }
    public void setContexte(String contexte) { this.contexte = contexte; }

    public String getServiceId() { return serviceId; }
    public void setServiceId(String serviceId) { this.serviceId = serviceId; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getSyncStatus() { return syncStatus; }
    public void setSyncStatus(String syncStatus) { this.syncStatus = syncStatus; }

    @JsonIgnore
    public String getFormattedType() {
        if (contexte == null || contexte.isEmpty() || "quartier".equals(contexte)) {
            return type;
        }
        return "[" + contexte.substring(0, 1).toUpperCase() + contexte.substring(1) + "] " + type;
    }
}
