package edu.cit.capvault.service;

import edu.cit.capvault.domain.*;
import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.repository.*;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

import java.io.IOException;
import java.io.StringReader;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class ClassRecordImportService {
    private static final String IMPORTED_DEADLINE_DESCRIPTION = "Imported from the class record tracker deadline row.";

    public static final List<String> DEFAULT_MILESTONES = List.of(
            "ProbExploration",
            "Convergence",
            "RRL",
            "Project Proposal",
            "SRS",
            "SDD",
            "Adviser Assessment",
            "SourceCode",
            "DEMO",
            "PeerEvaluation"
    );

    private static final Map<String, String> FIELD_ALIASES = Map.of(
            "studentNumber", "STUDENT NO.",
            "studentName", "NAME OF STUDENT",
            "teamCode", "TEAM FORMATION",
            "memberNumber", "MEMBER#"
    );

    private static final Pattern DATE_PATTERN = Pattern.compile("\\d{1,2}/\\d{1,2}/\\d{4}(\\s+\\d{1,2}:\\d{2}:\\d{2})?");

    private HttpClient httpClient;
    private final ClassRecordImportRepository imports;
    private final UserAccountRepository users;
    private final CapstoneGroupRepository groups;
    private final GroupMemberRepository groupMembers;
    private final TrackerRowRepository trackerRows;
    private final DeliverableRepository deliverables;
    private final DeadlineRepository deadlines;
    private final ActivityLogService activityLog;
    private final Environment environment;

    public ClassRecordImportService(ClassRecordImportRepository imports, UserAccountRepository users, CapstoneGroupRepository groups, GroupMemberRepository groupMembers, TrackerRowRepository trackerRows, DeliverableRepository deliverables, DeadlineRepository deadlines, ActivityLogService activityLog, Environment environment) {
        this.imports = imports;
        this.users = users;
        this.groups = groups;
        this.groupMembers = groupMembers;
        this.trackerRows = trackerRows;
        this.deliverables = deliverables;
        this.deadlines = deadlines;
        this.activityLog = activityLog;
        this.environment = environment;
    }

    public CapVaultDtos.ClassRecordPreviewDto preview(String sourceUrl) {
        ParsedSheet sheet = fetch(sourceUrl);
        List<Map<String, String>> sampleRows = sheet.rows().stream().limit(8).map(row -> visibleRow(sheet.headers(), row)).toList();
        Map<String, String> suggested = new LinkedHashMap<>();
        FIELD_ALIASES.forEach((field, alias) -> findHeader(sheet.headers(), alias).ifPresent(header -> suggested.put(field, header)));
        List<String> milestones = sheet.headers().stream().filter(DEFAULT_MILESTONES::contains).toList();
        List<String> warnings = new ArrayList<>();
        FIELD_ALIASES.forEach((field, alias) -> {
            if (!suggested.containsKey(field)) {
                warnings.add("Missing expected column: " + alias);
            }
        });
        if (milestones.isEmpty()) {
            warnings.add("No tracker milestone columns were detected.");
        }
        return new CapVaultDtos.ClassRecordPreviewDto(sheet.headers(), sampleRows, suggested, milestones, warnings);
    }

    @Transactional
    public CapVaultDtos.ClassRecordImportDto sync(String sourceUrl, Map<String, String> providedMapping, UserAccount actor) {
        ParsedSheet sheet = fetch(sourceUrl);
        Map<String, String> mapping = new LinkedHashMap<>();
        FIELD_ALIASES.forEach((field, alias) -> mapping.put(field, providedMapping == null ? alias : providedMapping.getOrDefault(field, alias)));
        List<String> milestones = sheet.headers().stream().filter(DEFAULT_MILESTONES::contains).toList();
        ClassRecordImport importRecord = imports.save(new ClassRecordImport(sourceUrl, String.join(",", sheet.headers()), actor));
        int importedRows = 0;
        int errorRows = 0;
        Instant now = Instant.now();
        try {
            for (int index = 0; index < sheet.rows().size(); index++) {
                Map<String, String> row = sheet.rows().get(index);
                String studentNumber = value(row, mapping.get("studentNumber"));
                String studentName = value(row, mapping.get("studentName"));
                String teamCode = value(row, mapping.get("teamCode"));
                String memberValue = value(row, mapping.get("memberNumber"));
                if (studentNumber.isBlank() && studentName.isBlank() && teamCode.isBlank()) {
                    importDeadlines(row, milestones, actor);
                    continue;
                }
                if (studentName.isBlank() || teamCode.isBlank() || memberValue.isBlank()) {
                    errorRows++;
                    continue;
                }
                int memberNumber = parseInt(memberValue, 0);
                CapstoneGroup group = groups.findByTeamCodeIgnoreCase(teamCode)
                        .orElseGet(() -> groups.save(new CapstoneGroup(
                                teamCode,
                                "Capstone Project " + teamCode.substring(Math.max(0, teamCode.length() - 2)),
                                "CapVault Project Record " + teamCode.substring(Math.max(0, teamCode.length() - 2)),
                                "Imported from the IT332 tracker sheet.",
                                "IT332",
                                "Academic Capstone",
                                users.findByRoleOrderByDisplayNameAsc(Role.ADVISER).stream().findFirst().orElse(null)
                        )));
                UserAccount student = upsertStudent(studentNumber, studentName);
                GroupMember member = groupMembers.findByGroupAndMemberNumber(group, memberNumber)
                        .orElseGet(() -> groupMembers.save(new GroupMember(group, student, studentNumber, studentName, memberNumber)));
                member.setStudent(student);
                member.setStudentName(studentName);
                member.setStudentNumber(studentNumber);
                int sourceRowNumber = index + 2;
                TrackerRow trackerRow = trackerRows.findByTeamCodeIgnoreCaseAndMemberNumber(teamCode, memberNumber)
                        .orElseGet(() -> new TrackerRow(group, member, studentNumber, studentName, teamCode, memberNumber, sourceRowNumber));
                trackerRow.setGroup(group);
                trackerRow.setMember(member);
                trackerRow.setStudentNumber(studentNumber);
                trackerRow.setStudentName(studentName);
                trackerRow.setTeamCode(teamCode);
                trackerRow.setMemberNumber(memberNumber);
                trackerRow.setSourceRowNumber(sourceRowNumber);
                List<TrackerCell> cells = new ArrayList<>();
                for (int columnIndex = 0; columnIndex < milestones.size(); columnIndex++) {
                    String milestone = milestones.get(columnIndex);
                    String rawValue = value(row, milestone);
                    cells.add(new TrackerCell(toMilestoneKey(milestone), milestone, rawValue, normalize(rawValue), sheet.headers().indexOf(milestone) + 1, columnIndex, now));
                    ensureDeliverable(group, milestone);
                }
                trackerRow.replaceCells(cells);
                trackerRows.save(trackerRow);
                importedRows++;
            }
            importRecord.complete(importedRows, errorRows, "Class record sync stored students, groups, deliverables, tracker rows, and deadline cells.");
            activityLog.record(actor, "CLASS_RECORD_SYNCED", "ClassRecordImport", importRecord.getId(), importedRows + " tracker rows synchronized.");
        } catch (RuntimeException ex) {
            importRecord.fail(ex.getMessage());
            throw ex;
        }
        return toDto(importRecord);
    }

    public List<CapVaultDtos.ClassRecordImportDto> recentImports() {
        return imports.findTop10ByOrderByStartedAtDesc().stream().map(this::toDto).toList();
    }

    @Transactional
    public CapVaultDtos.ClassRecordResetDto resetImportedTracker(UserAccount actor) {
        if (!environment.acceptsProfiles(Profiles.of("local", "test"))) {
            throw new IllegalStateException("Class record reset is available only for developer setup profiles.");
        }
        long trackerCount = trackerRows.count();
        long importCount = imports.count();
        long deadlineCount = deadlines.deleteByDescription(IMPORTED_DEADLINE_DESCRIPTION);
        trackerRows.deleteAllInBatch();
        imports.deleteAllInBatch();
        activityLog.record(actor, "CLASS_RECORD_TRACKER_RESET", "ClassRecordImport", null, "Tracker sync state was cleared from developer setup controls.");
        return new CapVaultDtos.ClassRecordResetDto(
                trackerCount,
                importCount,
                deadlineCount,
                "Tracker rows, import history, and sheet-imported deadline rows were cleared. Groups, users, deliverables, submissions, and archives were preserved."
        );
    }

    public TrackerStatus normalize(String raw) {
        String value = raw == null ? "" : raw.trim();
        if (value.isBlank()) {
            return TrackerStatus.MISSING;
        }
        if ("#N/A".equalsIgnoreCase(value)) {
            return TrackerStatus.NOT_APPLICABLE;
        }
        if ("DONE".equalsIgnoreCase(value) || "APPROVED".equalsIgnoreCase(value) || "FINAL".equalsIgnoreCase(value)) {
            return TrackerStatus.COMPLETE;
        }
        if (DATE_PATTERN.matcher(value).matches()) {
            return TrackerStatus.COMPLETE;
        }
        if (value.matches("-?\\d+(\\.\\d+)?")) {
            double number = Double.parseDouble(value);
            return number <= 0 ? TrackerStatus.MISSING : TrackerStatus.IN_PROGRESS;
        }
        return TrackerStatus.RAW_VALUE;
    }

    private void importDeadlines(Map<String, String> row, List<String> milestones, UserAccount actor) {
        for (String milestone : milestones) {
            String raw = value(row, milestone);
            parseSheetDate(raw).ifPresent(dueAt -> {
                Deliverable global = deliverables.findByGroupIsNullOrderByDueAtAsc().stream()
                        .filter(item -> item.getMilestoneKey().equals(toMilestoneKey(milestone)))
                        .findFirst()
                        .orElseGet(() -> deliverables.save(new Deliverable(milestone, toMilestoneKey(milestone), "Class-wide tracker deadline.", dueAt, null)));
                global.setDueAt(dueAt);
                Deadline deadline = deadlines.findFirstByTitleAndDeliverableAndGroupIsNullAndTargetRole(milestone + " deadline", global, Role.STUDENT)
                        .orElseGet(() -> new Deadline(milestone + " deadline", IMPORTED_DEADLINE_DESCRIPTION, dueAt, global, null, Role.STUDENT));
                deadline.setDueAt(dueAt);
                deadline.setDescription(IMPORTED_DEADLINE_DESCRIPTION);
                deadlines.save(deadline);
                activityLog.record(actor, "DEADLINE_IMPORTED", "Deliverable", global.getId(), milestone + " deadline imported from the tracker sheet.");
            });
        }
    }

    private void ensureDeliverable(CapstoneGroup group, String milestone) {
        String key = toMilestoneKey(milestone);
        deliverables.findByGroupAndMilestoneKeyIgnoreCase(group, key)
                .orElseGet(() -> deliverables.save(new Deliverable(milestone, key, "Required capstone output tracked from the class record.", null, group)));
    }

    private UserAccount upsertStudent(String studentNumber, String studentName) {
        return users.findByStudentNumber(studentNumber).orElseGet(() -> {
            String emailLocal = studentName.toLowerCase(Locale.ROOT)
                    .replaceAll("[^a-z0-9 ]", "")
                    .trim()
                    .replaceAll("\\s+", ".")
                    .replaceAll("^\\.+|\\.+$", "");
            if (emailLocal.isBlank()) {
                emailLocal = "student." + URLEncoder.encode(studentNumber, StandardCharsets.UTF_8).replaceAll("[^a-zA-Z0-9]", "");
            }
            return users.save(new UserAccount(emailLocal + "@cit.edu", studentName, Role.STUDENT, studentNumber, true));
        });
    }

    private ParsedSheet fetch(String sourceUrl) {
        try {
            if (sourceUrl.startsWith("inline:")) {
                return parseCsv(java.net.URLDecoder.decode(sourceUrl.substring("inline:".length()), StandardCharsets.UTF_8));
            }
            String csvUrl = toCsvUrl(sourceUrl);
            HttpRequest request = HttpRequest.newBuilder(URI.create(csvUrl)).GET().build();
            HttpResponse<String> response = httpClient().send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() >= 400) {
                throw new IllegalArgumentException("Class record source returned HTTP " + response.statusCode() + ".");
            }
            return parseCsv(response.body());
        } catch (IOException ex) {
            throw new IllegalArgumentException("Unable to read the class record source: " + ex.getMessage(), ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalArgumentException("Class record fetch was interrupted.", ex);
        }
    }

    private synchronized HttpClient httpClient() {
        if (httpClient == null) {
            httpClient = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NORMAL).build();
        }
        return httpClient;
    }

    private ParsedSheet parseCsv(String csv) throws IOException {
        try (CSVParser parser = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build().parse(new StringReader(csv))) {
            List<String> headers = parser.getHeaderNames().stream().map(String::trim).toList();
            List<Map<String, String>> rows = new ArrayList<>();
            for (CSVRecord record : parser) {
                Map<String, String> row = new LinkedHashMap<>();
                for (String header : headers) {
                    row.put(header, record.isMapped(header) ? record.get(header).trim() : "");
                }
                rows.add(row);
            }
            return new ParsedSheet(headers, rows);
        }
    }

    private String toCsvUrl(String sourceUrl) {
        if (sourceUrl.contains("/pubhtml")) {
            String converted = sourceUrl.replace("/pubhtml", "/pub");
            return appendOutputCsv(converted);
        }
        if (sourceUrl.contains("/pub?")) {
            return appendOutputCsv(sourceUrl);
        }
        return sourceUrl;
    }

    private String appendOutputCsv(String url) {
        if (url.contains("output=csv")) {
            return url;
        }
        return url + (url.contains("?") ? "&" : "?") + "output=csv";
    }

    private Optional<String> findHeader(List<String> headers, String expected) {
        return headers.stream().filter(header -> header.equalsIgnoreCase(expected)).findFirst();
    }

    private Map<String, String> visibleRow(List<String> headers, Map<String, String> row) {
        Map<String, String> visible = new LinkedHashMap<>();
        headers.forEach(header -> visible.put(header, value(row, header)));
        return visible;
    }

    private String value(Map<String, String> row, String header) {
        if (header == null) {
            return "";
        }
        return row.getOrDefault(header, "").trim();
    }

    private int parseInt(String value, int fallback) {
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private Optional<Instant> parseSheetDate(String value) {
        if (value == null || value.isBlank() || !DATE_PATTERN.matcher(value.trim()).matches()) {
            return Optional.empty();
        }
        String trimmed = value.trim();
        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ofPattern("M/d/yyyy H:mm:ss"),
                DateTimeFormatter.ofPattern("M/d/yyyy")
        );
        for (DateTimeFormatter formatter : formatters) {
            try {
                if (trimmed.contains(":")) {
                    return Optional.of(LocalDateTime.parse(trimmed, formatter).atZone(ZoneId.of("Asia/Singapore")).toInstant());
                }
                return Optional.of(LocalDateTime.parse(trimmed + " 23:59:59", DateTimeFormatter.ofPattern("M/d/yyyy H:mm:ss")).atZone(ZoneId.of("Asia/Singapore")).toInstant());
            } catch (RuntimeException ignored) {
            }
        }
        return Optional.empty();
    }

    public static String toMilestoneKey(String milestone) {
        return milestone.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "_").replaceAll("(^_|_$)", "");
    }

    private CapVaultDtos.ClassRecordImportDto toDto(ClassRecordImport record) {
        return new CapVaultDtos.ClassRecordImportDto(
                record.getId(),
                record.getSourceUrl(),
                record.getStatus(),
                record.getImportedRows(),
                record.getErrorRows(),
                record.getRawHeaders(),
                record.getStartedAt(),
                record.getCompletedAt(),
                record.getMessage()
        );
    }

    private record ParsedSheet(List<String> headers, List<Map<String, String>> rows) {
    }
}
