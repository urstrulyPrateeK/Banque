package com.bank.bankbackend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;


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
