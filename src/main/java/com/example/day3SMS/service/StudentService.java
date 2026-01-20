package com.example.day3SMS.service;

import com.example.day3SMS.model.StudentModel;
import com.example.day3SMS.repository.StudentRepository;
import org.springframework.stereotype.Service;

@Service
public class StudentService {

    private StudentRepository repository;

    public StudentService(StudentRepository repository) {
        this.repository = repository;
    }
    // create

   public StudentModel addStudent(StudentModel student){
        return repository.save(student);
   }
}
