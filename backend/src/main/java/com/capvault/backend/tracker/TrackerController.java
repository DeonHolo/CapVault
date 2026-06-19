package com.capvault.backend.tracker;

import java.util.Comparator;
import java.util.List;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/tracker")
public class TrackerController {

    private final TrackerColumnRepository columnRepository;
    private final TrackerRowRepository rowRepository;
    private final TrackerCellRepository cellRepository;
    private final TrackerWritebackRepository writebackRepository;
    private final TrackerWritebackService writebackService;

    public TrackerController(
        TrackerColumnRepository columnRepository,
        TrackerRowRepository rowRepository,
        TrackerCellRepository cellRepository,
        TrackerWritebackRepository writebackRepository,
        TrackerWritebackService writebackService
    ) {
        this.columnRepository = columnRepository;
        this.rowRepository = rowRepository;
        this.cellRepository = cellRepository;
        this.writebackRepository = writebackRepository;
        this.writebackService = writebackService;
    }

    @GetMapping("/columns")
    @Transactional(readOnly = true)
    public List<TrackerColumnResponse> listColumns() {
        return columnRepository.findAllByOrderByDisplayOrderAscLabelAsc()
            .stream()
            .map(TrackerColumnResponse::from)
            .toList();
    }

    @GetMapping("/rows")
    @Transactional(readOnly = true)
    public List<TrackerRowResponse> listRows() {
        return rowRepository.findAllByOrderByTeamCodeAscMemberNumberAscStudentNameAsc()
            .stream()
            .map(row -> {
                List<TrackerCell> cells = cellRepository.findAllByTrackerRowId(row.getId())
                    .stream()
                    .sorted(Comparator.comparing(cell -> cell.getTrackerColumn().getDisplayOrder()))
                    .toList();
                return TrackerRowResponse.from(row, cells);
            })
            .toList();
    }

    @PostMapping("/writebacks")
    public TrackerWritebackResponse writeBack(@Valid @RequestBody TrackerWritebackRequest request) {
        return writebackService.writeBack(request);
    }

    @GetMapping("/writebacks")
    @Transactional(readOnly = true)
    public List<TrackerWritebackResponse> listWritebacks() {
        return writebackRepository.findTop50ByOrderByRequestedAtDesc()
            .stream()
            .map(TrackerWritebackResponse::from)
            .toList();
    }
}
