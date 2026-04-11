// Banque - by Prateek Singh | github.com/prateeksingh
package dev.prateek.banque.document.repository;

import dev.prateek.banque.document.entity.StoredDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StoredDocumentRepository extends JpaRepository<StoredDocument, Long> {

    Optional<StoredDocument> findTopByUserIdAndDocumentTypeOrderByCreatedAtDesc(Long userId, String documentType);
}
