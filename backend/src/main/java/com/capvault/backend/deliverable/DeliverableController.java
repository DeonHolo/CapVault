package com.capvault.backend.deliverable;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/deliverables")
public class DeliverableController {

    private final DeliverableService service;

    public DeliverableController(DeliverableService service) {
        this.service = service;
    }

    @GetMapping
    public List<DeliverableResponse> listDeliverables() {
        return service.listDeliverables();
    }

    @GetMapping("/{id}")
    public DeliverableResponse getDeliverable(@PathVariable UUID id) {
        return service.getDeliverable(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeliverableResponse createDeliverable(@Valid @RequestBody DeliverableRequest request) {
        return service.createDeliverable(request);
    }

    @PutMapping("/{id}")
    public DeliverableResponse updateDeliverable(
        @PathVariable UUID id,
        @Valid @RequestBody DeliverableRequest request
    ) {
        return service.updateDeliverable(id, request);
    }
}
