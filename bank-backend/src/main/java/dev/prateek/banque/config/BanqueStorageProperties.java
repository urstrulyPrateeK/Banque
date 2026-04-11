// Banque - by Prateek Singh | github.com/prateeksingh
package dev.prateek.banque.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.gcp")
public class BanqueStorageProperties {

    private boolean enabled;
    private String projectId;
    private String bucketName;
    private long signedUrlMinutes = 15;
    private String localStoragePath;
    private String credentialsLocation;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getBucketName() {
        return bucketName;
    }

    public void setBucketName(String bucketName) {
        this.bucketName = bucketName;
    }

    public long getSignedUrlMinutes() {
        return signedUrlMinutes;
    }

    public void setSignedUrlMinutes(long signedUrlMinutes) {
        this.signedUrlMinutes = signedUrlMinutes;
    }

    public String getLocalStoragePath() {
        return localStoragePath;
    }

    public void setLocalStoragePath(String localStoragePath) {
        this.localStoragePath = localStoragePath;
    }

    public String getCredentialsLocation() {
        return credentialsLocation;
    }

    public void setCredentialsLocation(String credentialsLocation) {
        this.credentialsLocation = credentialsLocation;
    }
}
