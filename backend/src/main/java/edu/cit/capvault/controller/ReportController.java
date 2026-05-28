package edu.cit.capvault.controller;

import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.security.CurrentUserService;
import edu.cit.capvault.service.ActivityLogService;
import edu.cit.capvault.service.DtoMapper;
import edu.cit.capvault.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reports;
    private final ActivityLogService activityLog;
    private final CurrentUserService currentUser;
    private final DtoMapper mapper;

    public ReportController(ReportService reports, ActivityLogService activityLog, CurrentUserService currentUser, DtoMapper mapper) {
        this.reports = reports;
        this.activityLog = activityLog;
        this.currentUser = currentUser;
        this.mapper = mapper;
    }

    @GetMapping("/summary")
    public CapVaultDtos.DashboardSummaryDto summary() {
        return reports.summary(currentUser.requireCurrentUser());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','ADVISER')")
    public CapVaultDtos.ReportDto report() {
        return reports.report(currentUser.requireCurrentUser());
    }

    @GetMapping("/activity")
    @PreAuthorize("hasAnyRole('ADMIN','ADVISER')")
    public List<CapVaultDtos.ActivityLogDto> activity() {
        return activityLog.recent().stream().map(mapper::activityLog).toList();
    }

    @GetMapping("/export.csv")
    @PreAuthorize("hasAnyRole('ADMIN','ADVISER')")
    public ResponseEntity<String> exportCsv() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=capvault-report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(reports.exportCsv(currentUser.requireCurrentUser()));
    }
}
