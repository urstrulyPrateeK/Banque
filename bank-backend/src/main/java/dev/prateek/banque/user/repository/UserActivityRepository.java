package dev.prateek.banque.user.repository;

import dev.prateek.banque.user.entity.UserActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {

    Page<UserActivity> findByUserIdOrderByCreatedAtDesc(
            Long userId,
            Pageable pageable
    );
}

