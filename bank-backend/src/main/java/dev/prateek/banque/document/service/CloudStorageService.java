// Banque - by Prateek Singh | github.com/prateeksingh
package dev.prateek.banque.document.service;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import dev.prateek.banque.config.BanqueStorageProperties;
import dev.prateek.banque.document.dto.DocumentAccessResponse;
import dev.prateek.banque.document.dto.DocumentUploadResponse;
import dev.prateek.banque.document.entity.StoredDocument;
import dev.prateek.banque.document.repository.StoredDocumentRepository;
import dev.prateek.banque.security.userdetails.UserDetailsImpl;
import dev.prateek.banque.user.entity.User;
import dev.prateek.banque.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

@Service
public class CloudStorageService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final StoredDocumentRepository storedDocumentRepository;
    private final UserRepository userRepository;
    private final BanqueStorageProperties storageProperties;
    private final Storage storage;
    private final String documentSigningSecret;

    public CloudStorageService(
            StoredDocumentRepository storedDocumentRepository,
            UserRepository userRepository,
            BanqueStorageProperties storageProperties,
            org.springframework.beans.factory.ObjectProvider<Storage> storageProvider,
            @org.springframework.beans.factory.annotation.Value("${app.documents.signing-secret}") String documentSigningSecret
    ) {
        this.storedDocumentRepository = storedDocumentRepository;
        this.userRepository = userRepository;
        this.storageProperties = storageProperties;
        this.storage = storageProvider.getIfAvailable();
        this.documentSigningSecret = documentSigningSecret;
    }

    @Transactional
    public DocumentUploadResponse uploadDocument(MultipartFile file, String documentType) {
        try {
            User currentUser = getCurrentUser();
            validateFile(file);

            String normalizedType = normalizeDocumentType(documentType);
            String sanitizedFileName = sanitizeFilename(file.getOriginalFilename());
            String objectKey = "users/" + currentUser.getId() + "/" + normalizedType.toLowerCase(Locale.ROOT)
                    + "/" + System.currentTimeMillis() + "-" + sanitizedFileName;

            String storageProvider;
            if (isGcsEnabled()) {
                uploadToGcs(file, objectKey);
                storageProvider = "GCS";
            } else {
                uploadToLocalDisk(file, objectKey);
                storageProvider = "LOCAL";
            }

            StoredDocument storedDocument = storedDocumentRepository.save(new StoredDocument(
                    currentUser.getId(),
                    normalizedType,
                    sanitizedFileName,
                    resolveContentType(file),
                    storageProvider,
                    objectKey
            ));

            String accessUrl = buildAccessUrl(storedDocument);
            if ("PROFILE_PHOTO".equals(normalizedType)) {
                currentUser.setAvatarUrl(accessUrl);
                userRepository.save(currentUser);
            }

            return new DocumentUploadResponse(
                    storedDocument.getId(),
                    storedDocument.getUserId(),
                    storedDocument.getDocumentType(),
                    storedDocument.getOriginalFileName(),
                    storedDocument.getStorageProvider(),
                    accessUrl,
                    storedDocument.getCreatedAt()
            );
        } catch (IOException ex) {
            throw new IllegalArgumentException("Unable to store document: " + ex.getMessage());
        }
    }

    public DocumentAccessResponse getLatestKycDocument(Long userId) {
        User currentUser = getCurrentUser();
        boolean ownsDocument = currentUser.getId().equals(userId);
        boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUser.getRole());
        if (!ownsDocument && !isAdmin) {
            throw new IllegalArgumentException("Access denied");
        }

        StoredDocument storedDocument = storedDocumentRepository
                .findTopByUserIdAndDocumentTypeOrderByCreatedAtDesc(userId, "KYC")
                .orElseThrow(() -> new IllegalArgumentException("KYC document not found"));

        return new DocumentAccessResponse(
                storedDocument.getId(),
                storedDocument.getUserId(),
                storedDocument.getDocumentType(),
                storedDocument.getOriginalFileName(),
                storedDocument.getContentType(),
                storedDocument.getStorageProvider(),
                buildAccessUrl(storedDocument),
                storedDocument.getCreatedAt()
        );
    }

    public DocumentResource downloadLocalDocument(Long documentId, long expiresAt, String signature) {
        if (expiresAt < System.currentTimeMillis() / 1000) {
            throw new IllegalArgumentException("Signed URL has expired");
        }

        StoredDocument storedDocument = storedDocumentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (!"LOCAL".equals(storedDocument.getStorageProvider())) {
            throw new IllegalArgumentException("Only locally stored documents can be downloaded through this endpoint");
        }

        String expectedSignature = sign(documentId + ":" + expiresAt);
        if (!expectedSignature.equals(signature)) {
            throw new IllegalArgumentException("Invalid signed URL");
        }

        Path filePath = Path.of(storageProperties.getLocalStoragePath()).resolve(storedDocument.getObjectKey());
        Resource resource;
        try {
            resource = new UrlResource(filePath.toUri());
        } catch (MalformedURLException ex) {
            throw new IllegalArgumentException("Unable to read document file");
        }
        if (!resource.exists()) {
            throw new IllegalArgumentException("Document file not found");
        }

        MediaType mediaType = MediaTypeFactory.getMediaType(storedDocument.getOriginalFileName())
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        return new DocumentResource(resource, mediaType.toString(), storedDocument.getOriginalFileName());
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("A document file is required");
        }

        long maxSizeInBytes = 10L * 1024 * 1024;
        if (file.getSize() > maxSizeInBytes) {
            throw new IllegalArgumentException("Document size must be 10MB or less");
        }
    }

    private void uploadToGcs(MultipartFile file, String objectKey) throws IOException {
        BlobInfo blobInfo = BlobInfo.newBuilder(BlobId.of(storageProperties.getBucketName(), objectKey))
                .setContentType(resolveContentType(file))
                .build();
        storage.create(blobInfo, file.getBytes());
    }

    private void uploadToLocalDisk(MultipartFile file, String objectKey) throws IOException {
        Path destination = Path.of(storageProperties.getLocalStoragePath()).resolve(objectKey);
        Files.createDirectories(destination.getParent());
        Files.write(destination, file.getBytes());
    }

    private String buildAccessUrl(StoredDocument storedDocument) {
        if ("GCS".equals(storedDocument.getStorageProvider()) && storage != null) {
            BlobInfo blobInfo = BlobInfo.newBuilder(
                    BlobId.of(storageProperties.getBucketName(), storedDocument.getObjectKey())
            ).build();
            URL signedUrl = storage.signUrl(
                    blobInfo,
                    storageProperties.getSignedUrlMinutes(),
                    TimeUnit.MINUTES,
                    Storage.SignUrlOption.withV4Signature()
            );
            return signedUrl.toString();
        }

        long expiresAt = LocalDateTime.now()
                .plusMinutes(storageProperties.getSignedUrlMinutes())
                .toEpochSecond(ZoneOffset.UTC);
        String signature = sign(storedDocument.getId() + ":" + expiresAt);
        return "/api/v1/documents/files/" + storedDocument.getId()
                + "?expiresAt=" + expiresAt
                + "&signature=" + signature;
    }

    private boolean isGcsEnabled() {
        return storageProperties.isEnabled() && storage != null;
    }

    private String normalizeDocumentType(String documentType) {
        if (documentType == null || documentType.isBlank()) {
            return "KYC";
        }
        return documentType.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
    }

    private String sanitizeFilename(String fileName) {
        String candidate = fileName == null || fileName.isBlank() ? "document" : fileName;
        return candidate.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private String resolveContentType(MultipartFile file) {
        return file.getContentType() != null ? file.getContentType() : "application/octet-stream";
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(documentSigningSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to sign document URL", ex);
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl userDetails)) {
            throw new IllegalStateException("User not authenticated");
        }
        return userDetails.getUser();
    }

    public record DocumentResource(Resource resource, String contentType, String originalFileName) {
    }
}
