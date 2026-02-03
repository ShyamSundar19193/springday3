package com.example.day3SMS.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Map;

@Getter
@AllArgsConstructor

public class ErrorResponse {
    private int status;
    private String message;
//    private Map<String,String> errors;

    public ErrorResponse(int i, String validationFailed, Map<String, String> errorMap) {
    }
}
