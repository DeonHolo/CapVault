package com.capvault.backend.workspace;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workspace/sources")
public class WorkspaceSourceController {

    private final WorkspaceSourceService service;

    public WorkspaceSourceController(WorkspaceSourceService service) {
        this.service = service;
    }

    @GetMapping
    public List<WorkspaceSourceResponse> listSources() {
        return service.listSources();
    }

    @PutMapping("/{sourceType}")
    public WorkspaceSourceResponse upsertSource(
        @PathVariable WorkspaceSourceType sourceType,
        @Valid @RequestBody WorkspaceSourceRequest request
    ) {
        return service.upsertSource(sourceType, request);
    }
}
