package com.capvault.backend.student;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/students")
public class StudentRecordController {

    private final StudentRecordRepository repository;

    public StudentRecordController(StudentRecordRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<StudentRecordResponse> listStudents() {
        return repository.findAllByOrderByTeamCodeAscMemberNumberAscStudentNameAsc()
            .stream()
            .map(StudentRecordResponse::from)
            .toList();
    }
}
