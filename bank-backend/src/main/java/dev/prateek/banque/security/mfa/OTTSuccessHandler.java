package dev.prateek.banque.security.mfa;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.ott.OneTimeToken;
import org.springframework.security.web.authentication.ott.OneTimeTokenGenerationSuccessHandler;
import org.springframework.security.web.authentication.ott.RedirectOneTimeTokenGenerationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;

@Component
public class OTTSuccessHandler implements OneTimeTokenGenerationSuccessHandler {
    private static final Logger log = LoggerFactory.getLogger(OTTSuccessHandler.class);
    private final OneTimeTokenGenerationSuccessHandler redirectHandler = new RedirectOneTimeTokenGenerationSuccessHandler("/ott/sent");
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, OneTimeToken oneTimeToken) throws IOException, ServletException {
        String ottLink = ServletUriComponentsBuilder
                .fromCurrentContextPath()
                .path("/login/ott")
                .queryParam("token", oneTimeToken.getTokenValue())
                .toUriString();

        // Email, Sms, custom implementation etc.
        System.out.println("OTT Link:" + ottLink);
        this.redirectHandler.handle(request, response, oneTimeToken);



    }
}

