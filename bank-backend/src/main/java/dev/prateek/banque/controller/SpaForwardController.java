// Banque - by Prateek Singh | github.com/prateeksingh
package dev.prateek.banque.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping({
            "/dashboard",
            "/accounts",
            "/accounts/**",
            "/transactions",
            "/transactions/**",
            "/transfers",
            "/transfers/**",
            "/payments",
            "/payments/**",
            "/cards",
            "/cards/**",
            "/user",
            "/user/**",
            "/auth",
            "/auth/**",
            "/about",
            "/contact",
            "/privacy",
            "/terms",
            "/faq"
    })
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
