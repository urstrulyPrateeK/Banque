package dev.prateek.banque.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/v1/home")
public class HomeController {
    @GetMapping("/")
    public String home(){
        return "Hello World";
    }

    @GetMapping("/admin")
    public String admin(){
        return "Hello Admin";
    }

    @GetMapping("/customer")
    public String customer(){
        return "Hello Customer";
    }


    @GetMapping("/ott/sent")
    public  String ottSent(){
        return "OTP sent";
    }

}

