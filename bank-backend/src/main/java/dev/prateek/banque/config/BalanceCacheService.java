// Banque - by Prateek Singh | github.com/prateeksingh
package dev.prateek.banque.config;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

@Service
public class BalanceCacheService {

    private final CacheManager cacheManager;

    public BalanceCacheService(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    public void evictAccountBalance(Long accountId) {
        Cache cache = cacheManager.getCache("account-balance");
        if (cache != null && accountId != null) {
            cache.evict(accountId);
        }
    }
}
