package com.example.day3SMS.repository;

import com.example.day3SMS.model.StudentModel;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface StudentRepository extends MongoRepository <StudentModel,String>{

}


