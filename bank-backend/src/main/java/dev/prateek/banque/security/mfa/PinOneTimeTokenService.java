package dev.prateek.banque.security.mfa;

import org.jspecify.annotations.Nullable;
import org.springframework.security.authentication.ott.*;
import org.springframework.util.Assert;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class PinOneTimeTokenService implements OneTimeTokenService {
    
    private static final int PIN_LENGTH = 6;
    private static final int MAX_PIN_VALUE = 1_000_000;

    private final Map<String, OneTimeToken> oneTimeTokenByToken = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    private Clock clock = Clock.systemUTC();
    private Duration tokenExpiresIn = Duration.ofMinutes(5);

    @Override
    public OneTimeToken generate(GenerateOneTimeTokenRequest request) {
        String token = generatePin();
        Instant expiresAt = this.clock.instant().plus(tokenExpiresIn);
        OneTimeToken ott = new DefaultOneTimeToken(token, request.getUsername(), expiresAt);
        this.oneTimeTokenByToken.put(token, ott);
        cleanExpiredTokensIfNeeded();
        return ott;
    }

    @Override
    public @Nullable OneTimeToken consume(OneTimeTokenAuthenticationToken authenticationToken) {
        OneTimeToken ott = this.oneTimeTokenByToken.remove(authenticationToken.getTokenValue());
        if (ott == null || isExpired(ott)) {
            return null;
        }
        return ott;
    }

    private String generatePin() {
        int pin = secureRandom.nextInt(MAX_PIN_VALUE);
        return String.format("%0" + PIN_LENGTH + "d", pin);
    }

    private boolean isExpired(OneTimeToken ott) {
        return this.clock.instant().isAfter(ott.getExpiresAt());
    }

    public void setTokenExpiresIn(Duration tokenExpiresIn) {
        Assert.notNull(tokenExpiresIn, "tokenExpiresIn must not be null");
        Assert.isTrue(!tokenExpiresIn.isNegative() && !tokenExpiresIn.isZero(), 
                     "tokenExpiresIn must be positive");
        this.tokenExpiresIn = tokenExpiresIn;
    }

    public void cleanExpiredTokensIfNeeded() {
        if (this.oneTimeTokenByToken.isEmpty()) {
            return;
        }
        this.oneTimeTokenByToken.entrySet().removeIf(entry -> 
            isExpired(entry.getValue())
        );
    }

    public void setClock(Clock clock) {
        Assert.notNull(clock, "clock must not be null");
        this.clock = clock;
    }
}
