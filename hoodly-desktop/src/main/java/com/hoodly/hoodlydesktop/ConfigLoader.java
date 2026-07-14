package com.hoodly.hoodlydesktop;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class ConfigLoader {

    private static ConfigLoader instance;
    private final Properties properties = new Properties();

    private ConfigLoader() {
        try (InputStream input = getClass().getResourceAsStream(
                "/com/hoodly/hoodlydesktop/config.properties")) {
            if (input == null) {
                throw new RuntimeException("config.properties par défaut introuvable");
            }
            properties.load(input);
        } catch (IOException e) {
            throw new RuntimeException("Erreur de chargement de la configuration par défaut : " + e.getMessage());
        }

        try (InputStream localInput = getClass().getResourceAsStream(
                "/com/hoodly/hoodlydesktop/config-local.properties")) {
            if (localInput != null) {
                properties.load(localInput);
                System.out.println("Configuration locale (config-local.properties) chargée.");
            }
        } catch (IOException e) {
            System.err.println("Avertissement : Impossible de charger config-local.properties : " + e.getMessage());
        }
    }

    public static ConfigLoader getInstance() {
        if (instance == null) {
            instance = new ConfigLoader();
        }
        return instance;
    }

    public String get(String key) {
        String value = System.getProperty(key);
        if (value != null) {
            return value;
        }

        String envKey = key.toUpperCase().replace('.', '_');
        value = System.getenv(envKey);
        if (value != null) {
            return value;
        }

        value = properties.getProperty(key);
        if (value == null) {
            throw new RuntimeException("Clé de configuration introuvable : " + key);
        }
        return value;
    }
}