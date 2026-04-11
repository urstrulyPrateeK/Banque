// Banque - by Prateek Singh | github.com/prateeksingh
package dev.prateek.banque.config;

import dev.prateek.banque.security.userdetails.UserDetailsImpl;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class ServiceLoggingAspect {

    @Around("execution(* dev.prateek.banque..service..*(..))")
    public Object attachUserContext(ProceedingJoinPoint joinPoint) throws Throwable {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String previousUserId = MDC.get("userId");

        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl userDetails) {
            // Makes downstream logs searchable by user without repeating lookup logic in each service.
            MDC.put("userId", String.valueOf(userDetails.getUser().getId()));
        }

        try {
            return joinPoint.proceed();
        } finally {
            if (previousUserId == null) {
                MDC.remove("userId");
            } else {
                MDC.put("userId", previousUserId);
            }
        }
    }
}
