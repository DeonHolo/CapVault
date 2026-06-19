package com.capvault.backend.project;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
public class ProjectMetadataController {

    private final ProjectMetadataRepository repository;

    public ProjectMetadataController(ProjectMetadataRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<ProjectMetadataResponse> listProjects() {
        return repository.findAllByOrderByGroupCodeAsc()
            .stream()
            .map(ProjectMetadataResponse::from)
            .toList();
    }
}
