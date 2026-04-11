package dev.prateek.banque.security.mfa;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final int OTP_LENGTH = 6;
    private static final int OTP_VALIDITY_MINUTES = 5;
    
    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Generate OTP for username
     */
    public String generateOtp(String username) {
        String otp = generateRandomOtp();
        OtpData otpData = new OtpData(otp, LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES));
        otpStore.put(username, otpData);
        
        // Clean expired OTPs
        cleanExpiredOtps();
        
        return otp;
    }

    /**
     * Validate OTP for username
     */
    public boolean validateOtp(String username, String otp) {
        OtpData otpData = otpStore.get(username);
        
        if (otpData == null) {
            return false;
        }

        // Check if OTP is expired
        if (LocalDateTime.now().isAfter(otpData.expiryTime())) {
            otpStore.remove(username);
            return false;
        }

        // Check if OTP matches
        boolean isValid = otpData.otp().equals(otp);
        
        // Remove OTP after validation (one-time use)
        if (isValid) {
            otpStore.remove(username);
        }

        return isValid;
    }

    /**
     * Invalidate OTP for username
     */
    public void invalidateOtp(String username) {
        otpStore.remove(username);
    }

    /**
     * Generate random OTP
     */
    private String generateRandomOtp() {
        int maxValue = (int) Math.pow(10, OTP_LENGTH);
        int otp = secureRandom.nextInt(maxValue);
        return String.format("%0" + OTP_LENGTH + "d", otp);
    }

    /**
     * Clean expired OTPs
     */
    private void cleanExpiredOtps() {
        LocalDateTime now = LocalDateTime.now();
        otpStore.entrySet().removeIf(entry -> 
            now.isAfter(entry.getValue().expiryTime())
        );
    }

    /**
     * Internal record to store OTP data
     */
    private record OtpData(String otp, LocalDateTime expiryTime) {}
}
