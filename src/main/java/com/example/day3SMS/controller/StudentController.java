package com.example.day3SMS.controller;

import com.example.day3SMS.model.StudentModel;
import com.example.day3SMS.service.StudentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class StudentController {
    private final StudentService service;

    public StudentController(StudentService service) {
        this.service = service;
    }
    @GetMapping("/test")
    public String test(){
        return "API is working";
    }

    // create function API
    @PostMapping("/add-student")
    public StudentModel addStudent(@RequestBody StudentModel student){
//        System.out.println(student);
        return service.addStudent(student);
    }

    @GetMapping("/students")
    public List<StudentModel> getStudents(){
        return service.getStudents();
    }
    @PutMapping("/update/{id}")
    public StudentModel updateStudent(
            @PathVariable String id,
            @RequestBody StudentModel student) {
        return service.updateStudent(id, student);
    }

    @DeleteMapping("/students/{id}")
    public String deleteStudent(@PathVariable String id) {
        return service.deleteStudent(id);
    }




}