package com.capvault.backend.sheets;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import com.capvault.backend.project.ProjectMetadata;
import com.capvault.backend.project.ProjectMetadataRepository;
import com.capvault.backend.student.StudentRecord;
import com.capvault.backend.student.StudentRecordRepository;
import com.capvault.backend.tracker.TrackerCell;
import com.capvault.backend.tracker.TrackerCellRepository;
import com.capvault.backend.tracker.TrackerColumn;
import com.capvault.backend.tracker.TrackerColumnRepository;
import com.capvault.backend.tracker.TrackerRow;
import com.capvault.backend.tracker.TrackerRowRepository;
import com.capvault.backend.workspace.WorkspaceSource;
import com.capvault.backend.workspace.WorkspaceSourceRepository;
import com.capvault.backend.workspace.WorkspaceSourceStatus;
import com.capvault.backend.workspace.WorkspaceSourceType;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SheetImportService {

    private static final DateTimeFormatter OUTPUT_DEADLINE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
        DateTimeFormatter.ofPattern("M/d/yyyy", Locale.ENGLISH),
        DateTimeFormatter.ofPattern("M/d/yy", Locale.ENGLISH),
        DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.ENGLISH),
        DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH),
        DateTimeFormatter.ISO_LOCAL_DATE
    );

    private final WorkspaceSourceRepository workspaceSourceRepository;
    private final SheetImportRunRepository importRunRepository;
    private final SheetCsvClient sheetCsvClient;
    private final CsvParser csvParser;
    private final StudentRecordRepository studentRecordRepository;
    private final TrackerColumnRepository trackerColumnRepository;
    private final TrackerRowRepository trackerRowRepository;
    private final TrackerCellRepository trackerCellRepository;
    private final ProjectMetadataRepository projectMetadataRepository;
    private final ObjectMapper objectMapper;

    public SheetImportService(
        WorkspaceSourceRepository workspaceSourceRepository,
        SheetImportRunRepository importRunRepository,
        SheetCsvClient sheetCsvClient,
        CsvParser csvParser,
        StudentRecordRepository studentRecordRepository,
        TrackerColumnRepository trackerColumnRepository,
        TrackerRowRepository trackerRowRepository,
        TrackerCellRepository trackerCellRepository,
        ProjectMetadataRepository projectMetadataRepository,
        ObjectMapper objectMapper
    ) {
        this.workspaceSourceRepository = workspaceSourceRepository;
        this.importRunRepository = importRunRepository;
        this.sheetCsvClient = sheetCsvClient;
        this.csvParser = csvParser;
        this.studentRecordRepository = studentRecordRepository;
        this.trackerColumnRepository = trackerColumnRepository;
        this.trackerRowRepository = trackerRowRepository;
        this.trackerCellRepository = trackerCellRepository;
        this.projectMetadataRepository = projectMetadataRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public SheetImportResponse importSource(WorkspaceSourceType sourceType, SheetImportRequest request) {
        WorkspaceSource source = resolveSource(sourceType, request);
        SheetImportRun run = importRunRepository.save(new SheetImportRun(sourceType, source));

        try {
            String csvText = sheetCsvClient.fetchCsv(source.getSheetUrl());
            List<List<String>> rows = csvParser.parse(csvText);
            if (rows.size() < 2) {
                throw new IllegalArgumentException("The Sheet did not contain a recognizable header row and data rows.");
            }

            ImportResult result = switch (sourceType) {
                case TEAM_FORMATION -> importTeamFormation(rows);
                case TRACKER -> importTracker(rows);
                case PROJECT_MONITOR -> importProjectMonitor(rows);
            };

            source.setStatus(WorkspaceSourceStatus.IMPORTED);
            source.setLastImportedAt(LocalDateTime.now());
            workspaceSourceRepository.save(source);

            run.complete(
                SheetImportStatus.IMPORTED,
                result.rowsFound(),
                result.columnsFound(),
                String.join("\n", result.warnings()),
                toJson(result)
            );
            importRunRepository.save(run);

            return new SheetImportResponse(
                run.getId(),
                sourceType,
                SheetImportStatus.IMPORTED,
                result.rowsFound(),
                result.columnsFound(),
                result.studentsFound(),
                result.officialIdsFound(),
                result.groupsFound(),
                result.warnings(),
                result.deadlineSuggestions(),
                run.getCompletedAt()
            );
        } catch (RuntimeException exception) {
            source.setStatus(WorkspaceSourceStatus.ERROR);
            workspaceSourceRepository.save(source);
            run.complete(
                SheetImportStatus.ERROR,
                0,
                0,
                exception.getMessage(),
                "{\"error\":\"" + escapeJson(exception.getMessage()) + "\"}"
            );
            importRunRepository.save(run);
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public List<SheetImportRunResponse> listImportRuns() {
        return importRunRepository.findTop20ByOrderByStartedAtDesc()
            .stream()
            .map(SheetImportRunResponse::from)
            .toList();
    }

    private WorkspaceSource resolveSource(WorkspaceSourceType sourceType, SheetImportRequest request) {
        String requestedUrl = request == null ? null : normalizeNullable(request.sheetUrl());
        String requestedDisplayName = request == null ? null : normalizeNullable(request.displayName());

        WorkspaceSource source = workspaceSourceRepository.findBySourceType(sourceType)
            .orElse(null);

        if (requestedUrl != null) {
            String sheetId = extractSheetId(requestedUrl);
            if (source == null) {
                source = new WorkspaceSource(
                    sourceType,
                    requestedUrl,
                    sheetId,
                    requestedDisplayName,
                    WorkspaceSourceStatus.CONNECTED,
                    LocalDateTime.now()
                );
            } else {
                source.setSheetUrl(requestedUrl);
                source.setSheetId(sheetId);
                source.setStatus(WorkspaceSourceStatus.CONNECTED);
                if (requestedDisplayName != null) {
                    source.setDisplayName(requestedDisplayName);
                }
            }
            return workspaceSourceRepository.save(source);
        }

        if (source == null || source.getSheetUrl() == null || source.getSheetUrl().isBlank()) {
            throw new IllegalArgumentException("Connect a Sheet URL before importing " + sourceType + ".");
        }

        return source;
    }

    private ImportResult importTeamFormation(List<List<String>> rows) {
        HeaderRow headerRow = findBestHeaderRow(rows, SheetImportService::inferIdentityColumns, SheetImportService::scoreTeamFormationHeader);
        IdentityColumns identity = inferIdentityColumns(headerRow.headers());
        List<String> warnings = new ArrayList<>();
        int skippedRows = 0;
        int studentsFound = 0;
        int officialIdsFound = 0;

        if (identity.studentNumber() < 0) {
            warnings.add("Team Formation needs a Student Number column before public forms and registration can use official IDs.");
        }

        for (int index = headerRow.index() + 1; index < rows.size(); index += 1) {
            int sourceRowNumber = index + 1;
            List<String> row = rows.get(index);
            String studentNumber = getCell(row, identity.studentNumber());
            String name = getStudentName(row, identity);
            String teamCode = getCell(row, identity.teamCode());
            String memberNumber = getCell(row, identity.memberNumber());

            if (studentNumber.isBlank() || name.isBlank() || teamCode.isBlank()) {
                skippedRows += 1;
                continue;
            }

            StudentRecord record = findStudentRecord(studentNumber, teamCode, memberNumber)
                .orElseGet(() -> new StudentRecord(
                    studentNumber,
                    name,
                    teamCode,
                    memberNumber,
                    getCell(row, identity.section()),
                    getCell(row, identity.adviser()),
                    getCell(row, identity.email()),
                    sourceRowNumber
                ));
            record.updateFrom(
                studentNumber,
                name,
                teamCode,
                memberNumber,
                getCell(row, identity.section()),
                getCell(row, identity.adviser()),
                getCell(row, identity.email()),
                sourceRowNumber
            );
            studentRecordRepository.save(record);
            studentsFound += 1;
            officialIdsFound += studentNumber.isBlank() ? 0 : 1;
        }

        if (skippedRows > 0) {
            warnings.add("Skipped " + skippedRows + " Team Formation row" + plural(skippedRows) + " without Student Number, name, or team code.");
        }

        return new ImportResult(
            studentsFound,
            headerRow.headers().size(),
            studentsFound,
            officialIdsFound,
            0,
            warnings,
            List.of()
        );
    }

    private ImportResult importTracker(List<List<String>> rows) {
        HeaderRow headerRow = findBestHeaderRow(rows, SheetImportService::inferIdentityColumns, SheetImportService::scoreTrackerHeader);
        IdentityColumns identity = inferIdentityColumns(headerRow.headers());
        Set<Integer> identityIndexes = identity.indexes();
        List<TrackerColumn> trackerColumns = upsertTrackerColumns(headerRow.headers(), identityIndexes);
        List<String> warnings = new ArrayList<>();
        List<DeadlineSuggestionResponse> deadlineSuggestions = new ArrayList<>();
        int trackerRowsFound = 0;
        int officialIdsFound = 0;
        int skippedRows = 0;

        if (identity.studentNumber() < 0) {
            warnings.add("Tracker has no Student Number column. Official IDs are preserved from Team Formation only.");
        }

        for (int index = headerRow.index() + 1; index < rows.size(); index += 1) {
            int sourceRowNumber = index + 1;
            List<String> row = rows.get(index);
            String name = getStudentName(row, identity);
            String teamCode = getCell(row, identity.teamCode());
            String memberNumber = getCell(row, identity.memberNumber());

            if (name.isBlank() || teamCode.isBlank()) {
                deadlineSuggestions.addAll(detectDeadlineSuggestions(row, trackerColumns, sourceRowNumber));
                skippedRows += 1;
                continue;
            }

            Optional<StudentRecord> matchedStudent = findStudentRecord(getCell(row, identity.studentNumber()), teamCode, memberNumber);
            String studentNumber = firstNonBlank(getCell(row, identity.studentNumber()), matchedStudent.map(StudentRecord::getStudentNumber).orElse(""));
            String section = firstNonBlank(getCell(row, identity.section()), matchedStudent.map(StudentRecord::getSectionName).orElse(""));
            String adviser = firstNonBlank(getCell(row, identity.adviser()), matchedStudent.map(StudentRecord::getAdviserName).orElse(""));

            TrackerRow trackerRow = findTrackerRow(studentNumber, teamCode, memberNumber, name)
                .orElseGet(() -> new TrackerRow(studentNumber, name, teamCode, memberNumber, section, adviser, sourceRowNumber));
            trackerRow.updateFrom(studentNumber, name, teamCode, memberNumber, section, adviser, sourceRowNumber);
            TrackerRow savedRow = trackerRowRepository.save(trackerRow);

            for (TrackerColumn column : trackerColumns) {
                String rawValue = getCell(row, column.getSourceColumnIndex());
                String normalizedStatus = normalizeTrackerStatus(rawValue);
                TrackerCell cell = trackerCellRepository.findByTrackerRowIdAndTrackerColumnId(savedRow.getId(), column.getId())
                    .orElseGet(() -> new TrackerCell(
                        savedRow,
                        column,
                        rawValue,
                        normalizedStatus,
                        sourceRowNumber,
                        column.getSourceColumnIndex()
                    ));
                cell.updateValue(rawValue, normalizedStatus, sourceRowNumber, column.getSourceColumnIndex());
                trackerCellRepository.save(cell);
            }

            trackerRowsFound += 1;
            officialIdsFound += studentNumber.isBlank() ? 0 : 1;
        }

        if (skippedRows > 0) {
            warnings.add("Skipped " + skippedRows + " non-student row" + plural(skippedRows) + " without a name and team code.");
        }
        if (!deadlineSuggestions.isEmpty()) {
            warnings.add("Detected " + deadlineSuggestions.size() + " deadline value" + plural(deadlineSuggestions.size()) + " from skipped tracker rows.");
        }

        return new ImportResult(
            trackerRowsFound,
            trackerColumns.size(),
            trackerRowsFound,
            officialIdsFound,
            0,
            warnings,
            deadlineSuggestions
        );
    }

    private ImportResult importProjectMonitor(List<List<String>> rows) {
        HeaderRow headerRow = findBestHeaderRow(rows, SheetImportService::inferProjectColumns, SheetImportService::scoreProjectHeader);
        ProjectColumns columns = inferProjectColumns(headerRow.headers());
        List<String> warnings = new ArrayList<>();
        int groupsFound = 0;
        int skippedRows = 0;

        for (int index = headerRow.index() + 1; index < rows.size(); index += 1) {
            int sourceRowNumber = index + 1;
            List<String> row = rows.get(index);
            String groupCode = getCell(row, columns.groupCode());
            if (groupCode.isBlank()) {
                skippedRows += 1;
                continue;
            }

            String statusAdviser = getCell(row, columns.statusAdviser());
            ProjectMetadata metadata = projectMetadataRepository.findByGroupCodeIgnoreCase(groupCode)
                .orElseGet(() -> new ProjectMetadata(
                    groupCode,
                    getCell(row, columns.projectTitle()),
                    getCell(row, columns.softwareName()),
                    getCell(row, columns.description()),
                    getCell(row, columns.proposalRemarks()),
                    getCell(row, columns.demoComments()),
                    statusAdviser,
                    statusAdviser,
                    getCell(row, columns.category()),
                    sourceRowNumber
                ));
            metadata.updateFrom(
                groupCode,
                getCell(row, columns.projectTitle()),
                getCell(row, columns.softwareName()),
                getCell(row, columns.description()),
                getCell(row, columns.proposalRemarks()),
                getCell(row, columns.demoComments()),
                statusAdviser,
                statusAdviser,
                getCell(row, columns.category()),
                sourceRowNumber
            );
            projectMetadataRepository.save(metadata);
            groupsFound += 1;
        }

        if (skippedRows > 0) {
            warnings.add("Skipped " + skippedRows + " Software Project Monitor row" + plural(skippedRows) + " without a group code.");
        }

        return new ImportResult(
            groupsFound,
            headerRow.headers().size(),
            0,
            0,
            groupsFound,
            warnings,
            List.of()
        );
    }

    private List<TrackerColumn> upsertTrackerColumns(List<String> headers, Set<Integer> identityIndexes) {
        List<TrackerColumn> columns = new ArrayList<>();
        int displayOrder = 0;
        for (int index = 0; index < headers.size(); index += 1) {
            String header = headers.get(index).trim();
            if (header.isBlank() || identityIndexes.contains(index)) {
                continue;
            }
            int sourceColumnIndex = index;
            int columnDisplayOrder = displayOrder;
            TrackerColumn column = trackerColumnRepository.findByColumnKeyIgnoreCase(header)
                .orElseGet(() -> new TrackerColumn(
                    header,
                    header,
                    header,
                    sourceColumnIndex,
                    columnDisplayOrder,
                    true,
                    isLikelyPdfDeliverable(header)
                ));
            column.updateFrom(header, header, header, sourceColumnIndex, columnDisplayOrder, true, isLikelyPdfDeliverable(header));
            columns.add(trackerColumnRepository.save(column));
            displayOrder += 1;
        }
        return columns.stream()
            .sorted(Comparator.comparing(TrackerColumn::getDisplayOrder))
            .toList();
    }

    private Optional<StudentRecord> findStudentRecord(String studentNumber, String teamCode, String memberNumber) {
        if (!studentNumber.isBlank()) {
            Optional<StudentRecord> byNumber = studentRecordRepository.findByStudentNumberIgnoreCase(studentNumber);
            if (byNumber.isPresent()) {
                return byNumber;
            }
        }
        if (!teamCode.isBlank() && !memberNumber.isBlank()) {
            return studentRecordRepository.findFirstByTeamCodeIgnoreCaseAndMemberNumberIgnoreCase(teamCode, memberNumber);
        }
        return Optional.empty();
    }

    private Optional<TrackerRow> findTrackerRow(String studentNumber, String teamCode, String memberNumber, String name) {
        if (!studentNumber.isBlank()) {
            Optional<TrackerRow> byNumber = trackerRowRepository.findByStudentNumberIgnoreCase(studentNumber);
            if (byNumber.isPresent()) {
                return byNumber;
            }
        }
        if (!teamCode.isBlank() && !memberNumber.isBlank()) {
            Optional<TrackerRow> byTeamMemberName = trackerRowRepository.findFirstByTeamCodeIgnoreCaseAndMemberNumberIgnoreCaseAndStudentNameIgnoreCase(
                teamCode,
                memberNumber,
                name
            );
            if (byTeamMemberName.isPresent()) {
                return byTeamMemberName;
            }
            return trackerRowRepository.findFirstByTeamCodeIgnoreCaseAndMemberNumberIgnoreCase(teamCode, memberNumber);
        }
        return Optional.empty();
    }

    private List<DeadlineSuggestionResponse> detectDeadlineSuggestions(List<String> row, List<TrackerColumn> columns, int sourceRowNumber) {
        return columns.stream()
            .map(column -> {
                String raw = getCell(row, column.getSourceColumnIndex());
                String dueAt = coerceDueAt(raw);
                if (dueAt.isBlank()) {
                    return null;
                }
                return new DeadlineSuggestionResponse(
                    column.getColumnKey(),
                    column.getLabel() + " Submission",
                    dueAt,
                    column.getPdfRequired(),
                    raw,
                    sourceRowNumber
                );
            })
            .filter(Objects::nonNull)
            .toList();
    }

    private static HeaderRow findBestHeaderRow(
        List<List<String>> rows,
        HeaderInference headerInference,
        HeaderScoring headerScoring
    ) {
        HeaderRow best = new HeaderRow(0, rows.getFirst(), -1);
        int limit = Math.min(20, rows.size());
        for (int index = 0; index < limit; index += 1) {
            List<String> headers = rows.get(index).stream().map(String::trim).toList();
            int score = headerScoring.score(headerInference.infer(headers), headers);
            if (score > best.score()) {
                best = new HeaderRow(index, headers, score);
            }
        }
        return best;
    }

    private static IdentityColumns inferIdentityColumns(List<String> headers) {
        List<String> normalized = headers.stream().map(SheetImportService::normalizeHeader).toList();
        return new IdentityColumns(
            findHeader(normalized, "studentno", "studentnumber", "studentid", "schoolid", "idnumber", "studno"),
            findExactHeader(normalized, "nameofstudent", "studentname", "name"),
            findHeader(normalized, "lastname", "surname", "familyname"),
            findHeader(normalized, "firstname", "givenname"),
            findHeader(normalized, "teamformation", "teamcode", "team"),
            findHeader(normalized, "member", "memberno", "membernumber"),
            findHeader(normalized, "section", "classsection"),
            findExactHeader(normalized, "adviser", "advisor", "advisername", "advisorname", "facultyadviser", "capstoneadviser", "teacher", "instructor"),
            findHeader(normalized, "email", "gmail", "googleaccount", "citeduaccount", "institutionalemail", "citaccount")
        );
    }

    private static ProjectColumns inferProjectColumns(List<String> headers) {
        List<String> normalized = headers.stream().map(SheetImportService::normalizeHeader).toList();
        return new ProjectColumns(
            findHeader(normalized, "groupcode", "teamcode", "teamformation"),
            findHeader(normalized, "projecttitle", "title"),
            findHeader(normalized, "softwarename", "software"),
            findHeader(normalized, "description"),
            findHeader(normalized, "proposalremarks", "proposal"),
            findHeader(normalized, "democomments", "demo"),
            findHeader(normalized, "statusadviser", "adviser", "advisor", "status"),
            findHeader(normalized, "category")
        );
    }

    private static int scoreTeamFormationHeader(Object inferred, List<String> headers) {
        IdentityColumns identity = (IdentityColumns) inferred;
        int score = 0;
        if (identity.studentNumber() >= 0) {
            score += 3;
        }
        if (identity.teamCode() >= 0) {
            score += 3;
        }
        if (identity.memberNumber() >= 0) {
            score += 2;
        }
        if (identity.studentName() >= 0) {
            score += 2;
        }
        if (identity.lastName() >= 0) {
            score += 1;
        }
        if (identity.firstName() >= 0) {
            score += 1;
        }
        if (identity.email() >= 0) {
            score += 1;
        }
        return score;
    }

    private static int scoreTrackerHeader(Object inferred, List<String> headers) {
        int identityScore = scoreTeamFormationHeader(inferred, headers);
        List<String> trackerWords = List.of("prob", "convergence", "rrl", "proposal", "srs", "sdd", "source", "demo", "peer");
        long trackerScore = headers.stream()
            .map(SheetImportService::normalizeHeader)
            .filter(header -> trackerWords.stream().anyMatch(header::contains))
            .count();
        return identityScore + Math.toIntExact(trackerScore);
    }

    private static int scoreProjectHeader(Object inferred, List<String> headers) {
        ProjectColumns indexes = (ProjectColumns) inferred;
        int score = 0;
        if (indexes.groupCode() >= 0) {
            score += 3;
        }
        if (indexes.projectTitle() >= 0) {
            score += 2;
        }
        if (indexes.softwareName() >= 0) {
            score += 2;
        }
        if (indexes.description() >= 0) {
            score += 1;
        }
        if (indexes.proposalRemarks() >= 0) {
            score += 1;
        }
        if (indexes.demoComments() >= 0) {
            score += 1;
        }
        if (indexes.statusAdviser() >= 0) {
            score += 1;
        }
        return score;
    }

    private static String getStudentName(List<String> row, IdentityColumns identity) {
        String fullName = getCell(row, identity.studentName());
        if (!fullName.isBlank()) {
            return fullName;
        }
        String lastName = getCell(row, identity.lastName());
        String firstName = getCell(row, identity.firstName());
        if (!lastName.isBlank() && !firstName.isBlank()) {
            return lastName + ", " + firstName;
        }
        return firstNonBlank(lastName, firstName);
    }

    private static String normalizeTrackerStatus(String value) {
        String text = value == null ? "" : value.trim();
        if (text.isBlank()) {
            return "BLANK";
        }
        if (text.equalsIgnoreCase("#N/A")) {
            return "NOT_APPLICABLE";
        }
        if (text.equalsIgnoreCase("DONE")) {
            return "DONE";
        }
        if (text.matches("-?\\d+(\\.\\d+)?")) {
            double number = Double.parseDouble(text);
            if (number == 0) {
                return "ON_TIME";
            }
            if (number > 0) {
                return "LATE";
            }
        }
        if (!coerceDueAt(text).isBlank()) {
            return "DATE";
        }
        return "VALUE";
    }

    private static String coerceDueAt(String value) {
        String text = value == null ? "" : value.trim();
        if (text.isBlank() || text.equalsIgnoreCase("#N/A")) {
            return "";
        }

        String datePart = text.contains("|") ? text.substring(0, text.indexOf('|')).trim() : text;
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                LocalDate date = LocalDate.parse(datePart, formatter);
                return LocalDateTime.of(date, LocalTime.of(23, 59)).format(OUTPUT_DEADLINE_FORMAT);
            } catch (DateTimeParseException ignored) {
            }
        }

        return "";
    }

    private static String getCell(List<String> row, int index) {
        if (index < 0 || index >= row.size()) {
            return "";
        }
        return row.get(index) == null ? "" : row.get(index).trim();
    }

    private static String normalizeHeader(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private static int findHeader(List<String> headers, String... candidates) {
        for (int index = 0; index < headers.size(); index += 1) {
            String header = headers.get(index);
            for (String candidate : candidates) {
                if (header.equals(candidate) || header.contains(candidate)) {
                    return index;
                }
            }
        }
        return -1;
    }

    private static int findExactHeader(List<String> headers, String... candidates) {
        Set<String> candidateSet = Set.of(candidates);
        for (int index = 0; index < headers.size(); index += 1) {
            if (candidateSet.contains(headers.get(index))) {
                return index;
            }
        }
        return -1;
    }

    private static boolean isLikelyPdfDeliverable(String header) {
        String key = normalizeHeader(header);
        return Set.of("rrl", "projectproposal", "srs", "sdd", "adviserassessment").contains(key);
    }

    private static String extractSheetId(String value) {
        String text = value == null ? "" : value.trim();
        String marker = "/spreadsheets/d/";
        int start = text.indexOf(marker);
        if (start < 0) {
            return text;
        }
        String after = text.substring(start + marker.length());
        if (after.startsWith("e/")) {
            after = after.substring(2);
        }
        int end = after.indexOf('/');
        String idWithQuery = end >= 0 ? after.substring(0, end) : after;
        int query = idWithQuery.indexOf('?');
        return query >= 0 ? idWithQuery.substring(0, query) : idWithQuery;
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private String toJson(ImportResult result) {
        try {
            return objectMapper.writeValueAsString(result);
        } catch (JsonProcessingException exception) {
            return "{}";
        }
    }

    private static String escapeJson(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String plural(int count) {
        return count == 1 ? "" : "s";
    }

    private record HeaderRow(int index, List<String> headers, int score) {
    }

    private record IdentityColumns(
        int studentNumber,
        int studentName,
        int lastName,
        int firstName,
        int teamCode,
        int memberNumber,
        int section,
        int adviser,
        int email
    ) {

        Set<Integer> indexes() {
            return new LinkedHashSet<>(List.of(
                studentNumber,
                studentName,
                lastName,
                firstName,
                teamCode,
                memberNumber,
                section,
                adviser,
                email
            )).stream().filter(index -> index >= 0).collect(Collectors.toCollection(LinkedHashSet::new));
        }
    }

    private record ProjectColumns(
        int groupCode,
        int projectTitle,
        int softwareName,
        int description,
        int proposalRemarks,
        int demoComments,
        int statusAdviser,
        int category
    ) {
    }

    private record ImportResult(
        Integer rowsFound,
        Integer columnsFound,
        Integer studentsFound,
        Integer officialIdsFound,
        Integer groupsFound,
        List<String> warnings,
        List<DeadlineSuggestionResponse> deadlineSuggestions
    ) {
    }

    @FunctionalInterface
    private interface HeaderInference {
        Object infer(List<String> headers);
    }

    @FunctionalInterface
    private interface HeaderScoring {
        int score(Object inferred, List<String> headers);
    }
}
