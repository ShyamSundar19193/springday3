package com.example.day3SMS.service;

import com.example.day3SMS.model.StudentModel;
import com.example.day3SMS.repository.StudentRepository;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository repository;

    public StudentService(StudentRepository repository) {
        this.repository = repository;
    }

    // CREATE Student
    public StudentModel addStudent(StudentModel student) {
        return repository.save(student);
    }

    //Display Students
    public List<StudentModel> getStudents(){
        return repository.findAll();
    }

    //Update Students
    public StudentModel updateStudent(String id,StudentModel student){
        StudentModel existingStudent=repository.findById(id)
                .orElseThrow(()->new RuntimeException("No student found"));
        existingStudent.setName(student.getName());
        existingStudent.setAge(student.getAge());
        existingStudent.setEmail(student.getEmail());

        return repository.save(existingStudent);
    }
    // delete student
    public String deleteStudent(String id) {
        StudentModel existingStudent = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("No student found"));
        repository.delete(existingStudent);
        return "Student deleted successfully";
    }



}