package edu.cit.capvault.config;

import edu.cit.capvault.domain.*;
import edu.cit.capvault.repository.*;
import edu.cit.capvault.service.ActivityLogService;
import edu.cit.capvault.service.ClassRecordImportService;
import edu.cit.capvault.service.FileObjectService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {
    private final CapVaultProperties properties;
    private final UserAccountRepository users;
    private final CapstoneGroupRepository groups;
    private final GroupMemberRepository members;
    private final AdviserAssignmentRepository adviserAssignments;
    private final DeliverableRepository deliverables;
    private final TrackerRowRepository trackerRows;
    private final SubmissionRepository submissions;
    private final DocumentVersionRepository versions;
    private final ArchiveRecordRepository archives;
    private final DeadlineRepository deadlines;
    private final AnnouncementRepository announcements;
    private final NotificationRepository notifications;
    private final FileObjectService files;
    private final ActivityLogService activityLog;

    public DataInitializer(CapVaultProperties properties, UserAccountRepository users, CapstoneGroupRepository groups, GroupMemberRepository members, AdviserAssignmentRepository adviserAssignments, DeliverableRepository deliverables, TrackerRowRepository trackerRows, SubmissionRepository submissions, DocumentVersionRepository versions, ArchiveRecordRepository archives, DeadlineRepository deadlines, AnnouncementRepository announcements, NotificationRepository notifications, FileObjectService files, ActivityLogService activityLog) {
        this.properties = properties;
        this.users = users;
        this.groups = groups;
        this.members = members;
        this.adviserAssignments = adviserAssignments;
        this.deliverables = deliverables;
        this.trackerRows = trackerRows;
        this.submissions = submissions;
        this.versions = versions;
        this.archives = archives;
        this.deadlines = deadlines;
        this.announcements = announcements;
        this.notifications = notifications;
        this.files = files;
        this.activityLog = activityLog;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (properties.seed() != null && !properties.seed().enabled()) {
            return;
        }
        if (users.count() > 0) {
            return;
        }
        UserAccount admin = users.save(new UserAccount("admin@cit.edu", "IT332 Records Admin", Role.ADMIN, null, true));
        UserAccount adviser = users.save(new UserAccount("mae.reyes@cit.edu", "Engr. Mae Reyes", Role.ADVISER, null, true));
        UserAccount adviserAlt = users.save(new UserAccount("roberto.lim@cit.edu", "Dr. Roberto Lim", Role.ADVISER, null, true));

        CapstoneGroup team41 = group("2526-sem2-it332-41", "CapVault: A Capstone Project Tracking and Archival Management System", "CapVault", "Class record sync, live project tracker, document versioning, archive integrity, and reports.", adviser);
        CapstoneGroup team04 = group("2526-sem2-it332-04", "Barangay Records Retrieval and Review Portal", "RecordRail", "A document tracking workflow for barangay record requests.", adviserAlt);
        CapstoneGroup team01 = group("2526-sem2-it332-01", "Academic Consultation Logbook and Evidence Vault", "ConsultLedger", "A capstone consultation tracking and evidence preservation system.", adviser);

        List<GroupMember> team41Members = List.of(
                member(team41, "23-3597-554", "SIA, DAVID RYAN D.", "david.ryan.sia@cit.edu", 1),
                member(team41, "23-2250-144", "FERNANDEZ, HOMER O.", "homer.fernandez@cit.edu", 2),
                member(team41, "23-0148-359", "TABANAS, PRINCE DANIEL R.", "prince.tabanas@cit.edu", 3),
                member(team41, "20-0649-750", "TAGHOY, RON LUIGI F.", "ron.taghoy@cit.edu", 4)
        );
        List<GroupMember> team04Members = List.of(
                member(team04, "20-7429-858", "RAMOS, JEREMIAH T.", "jeremiah.ramos@cit.edu", 1),
                member(team04, "23-1795-734", "VILLAS, ERVIN LOUIS B.", "ervin.villas@cit.edu", 2),
                member(team04, "23-1889-639", "DABON, KENN XAVIER C.", "kenn.dabon@cit.edu", 3),
                member(team04, "12-0470-443", "MIGALLOS, FLORENCE AZRIEL R.", "florence.migallos@cit.edu", 4),
                member(team04, "23-1925-986", "ABEL, ZYDRIC Q.", "zydric.abel@cit.edu", 5)
        );
        List<GroupMember> team01Members = List.of(
                member(team01, "23-1603-575", "PACIO, MURIEL D.", "muriel.pacio@cit.edu", 1),
                member(team01, "17-0545-444", "LIM, MICHELU TIA A.", "michelu.lim@cit.edu", 2),
                member(team01, "23-2297-300", "CASAS, ELISSA MAE B.", "elissa.casas@cit.edu", 3),
                member(team01, "23-1754-768", "BASE, JASCHA B.", "jascha.base@cit.edu", 4),
                member(team01, "23-4573-522", "LEANDA, JOHN LUIS C.", "john.leanda@cit.edu", 5)
        );

        List<Deliverable> team41Deliverables = deliverables(team41);
        deliverables(team04);
        deliverables(team01);

        tracker(team41, team41Members, List.of(
                List.of("0", "0", "76", "69", "56", "49", "#N/A", "#N/A", "", "#N/A"),
                List.of("0", "0", "77", "70", "56", "49", "#N/A", "#N/A", "", "#N/A"),
                List.of("0", "0", "17", "11", "55", "48", "#N/A", "#N/A", "", "#N/A"),
                List.of("102", "0", "81", "74", "56", "49", "#N/A", "#N/A", "", "#N/A")
        ));
        tracker(team04, team04Members, List.of(
                List.of("0", "0", "53", "46", "51", "48", "0", "0", "5/26/2026", "#N/A"),
                List.of("0", "0", "53", "46", "51", "48", "0", "0", "5/26/2026", "#N/A"),
                List.of("0", "0", "53", "46", "51", "49", "0", "0", "5/26/2026", "#N/A"),
                List.of("0", "0", "53", "46", "51", "49", "0", "0", "5/26/2026", "#N/A"),
                List.of("0", "0", "53", "46", "51", "48", "0", "0", "5/26/2026", "#N/A")
        ));
        tracker(team01, team01Members, List.of(
                List.of("0", "0", "0", "1", "21", "21", "#N/A", "0", "", "DONE"),
                List.of("1", "10", "0", "1", "21", "21", "#N/A", "0", "", "DONE"),
                List.of("0", "0", "0", "1", "#N/A", "21", "#N/A", "0", "", "DONE"),
                List.of("1", "0", "0", "1", "21", "21", "#N/A", "0", "", "DONE"),
                List.of("0", "0", "0", "1", "21", "22", "#N/A", "0", "", "DONE")
        ));

        seedSubmissions(admin, adviser, team41, team41Members.getFirst(), team41Deliverables);
        deadlines.save(new Deadline("SRS final review", "Submission window for the SRS review copy.", date(2026, 3, 28), team41Deliverables.get(4), team41, Role.STUDENT));
        deadlines.save(new Deadline("Archive integrity check", "Monthly archive hash verification for approved records.", date(2026, 5, 30), null, null, Role.ADMIN));
        announcements.save(new Announcement("Tracker sync window", "Class record sync is open for the IT332 tracker sheet. Review mapped columns before confirming import.", Role.ADMIN, Instant.now(), null, admin));

        notifications.save(new Notification(team41Members.getFirst().getStudent(), NotificationType.FEEDBACK, "Feedback available", "Engr. Mae Reyes posted remarks for SRS version 2.", "/submissions"));
        notifications.save(new Notification(adviser, NotificationType.SUBMISSION, "Version ready for review", team41.getTeamCode() + " submitted SRS version 2.", "/review"));
        notifications.save(new Notification(admin, NotificationType.ARCHIVE, "Archive verified", team41.getTeamCode() + " SRS archive hash is unchanged.", "/archive"));

        activityLog.record(admin, "SEED_DATA_READY", "System", null, "CapVault developer setup data loaded.");
    }

    private CapstoneGroup group(String teamCode, String projectTitle, String softwareName, String description, UserAccount adviser) {
        CapstoneGroup group = groups.save(new CapstoneGroup(teamCode, projectTitle, softwareName, description, "IT332", "Academic Capstone", adviser));
        adviserAssignments.save(new AdviserAssignment(group, adviser));
        return group;
    }

    private GroupMember member(CapstoneGroup group, String studentNumber, String studentName, String email, int memberNumber) {
        UserAccount student = users.save(new UserAccount(email, studentName, Role.STUDENT, studentNumber, true));
        return members.save(new GroupMember(group, student, studentNumber, studentName, memberNumber));
    }

    private List<Deliverable> deliverables(CapstoneGroup group) {
        List<String> labels = ClassRecordImportService.DEFAULT_MILESTONES;
        List<Deliverable> result = new ArrayList<>();
        for (int i = 0; i < labels.size(); i++) {
            String label = labels.get(i);
            result.add(deliverables.save(new Deliverable(label, ClassRecordImportService.toMilestoneKey(label), "Required capstone deliverable tracked from class records.", date(2026, 2, 14).plusSeconds((long) i * 7 * 24 * 60 * 60), group)));
        }
        return result;
    }

    private void tracker(CapstoneGroup group, List<GroupMember> groupMembers, List<List<String>> values) {
        for (int i = 0; i < groupMembers.size(); i++) {
            GroupMember member = groupMembers.get(i);
            TrackerRow row = new TrackerRow(group, member, member.getStudentNumber(), member.getStudentName(), group.getTeamCode(), member.getMemberNumber(), i + 2);
            List<TrackerCell> cells = new ArrayList<>();
            for (int j = 0; j < ClassRecordImportService.DEFAULT_MILESTONES.size(); j++) {
                String label = ClassRecordImportService.DEFAULT_MILESTONES.get(j);
                String raw = values.get(i).get(j);
                cells.add(new TrackerCell(ClassRecordImportService.toMilestoneKey(label), label, raw, normalize(raw), j + 5, j, Instant.now()));
            }
            row.replaceCells(cells);
            trackerRows.save(row);
        }
    }

    private TrackerStatus normalize(String raw) {
        if (raw == null || raw.isBlank() || "0".equals(raw)) {
            return TrackerStatus.MISSING;
        }
        if ("#N/A".equalsIgnoreCase(raw)) {
            return TrackerStatus.NOT_APPLICABLE;
        }
        if ("DONE".equalsIgnoreCase(raw) || raw.contains("/")) {
            return TrackerStatus.COMPLETE;
        }
        return TrackerStatus.IN_PROGRESS;
    }

    private void seedSubmissions(UserAccount admin, UserAccount adviser, CapstoneGroup team, GroupMember submitter, List<Deliverable> groupDeliverables) {
        Deliverable srs = groupDeliverables.stream().filter(item -> item.getMilestoneKey().equals("srs")).findFirst().orElseThrow();
        FileObject firstFile = files.store("submissions/srs", "capvault-srs-v1.pdf", "application/pdf", pdf("CapVault SRS version 1").getBytes(StandardCharsets.UTF_8));
        Submission submission = submissions.save(new Submission(srs, team, submitter.getStudent(), SubmissionStatus.APPROVED, 1, Instant.now().minusSeconds(172800), "Initial SRS submission."));
        versions.save(new DocumentVersion(submission, 1, firstFile, "UPLOAD", null, submitter.getStudent()));
        FileObject secondFile = files.store("submissions/srs", "capvault-srs-v2.pdf", "application/pdf", pdf("CapVault SRS version 2 with adviser revisions").getBytes(StandardCharsets.UTF_8));
        submission.setCurrentVersion(2);
        submission.setStatus(SubmissionStatus.FINAL);
        submission.setAdviserRemarks("Version 2 is accepted for archival preservation. Keep prior versions available for panel traceability.");
        DocumentVersion version2 = versions.save(new DocumentVersion(submission, 2, secondFile, "UPLOAD", null, submitter.getStudent()));
        ArchiveRecord archive = archives.save(new ArchiveRecord(team, srs, submission, version2, secondFile, adviser, ArchiveStatus.ARCHIVED));
        team.setArchiveStatus("Archived");
        activityLog.record(adviser, "DOCUMENT_ARCHIVED", "ArchiveRecord", archive.getId(), "Seed SRS archive created for " + team.getTeamCode() + ".");
    }

    private Instant date(int year, int month, int day) {
        return LocalDate.of(year, month, day).atTime(23, 59, 59).atZone(ZoneId.of("Asia/Singapore")).toInstant();
    }

    private String pdf(String line) {
        return """
                %%PDF-1.4
                1 0 obj
                << /Type /Catalog /Pages 2 0 R >>
                endobj
                2 0 obj
                << /Type /Pages /Kids [3 0 R] /Count 1 >>
                endobj
                3 0 obj
                << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
                endobj
                4 0 obj
                << /Length 72 >>
                stream
                BT /F1 14 Tf 72 720 Td (%s) Tj ET
                endstream
                endobj
                5 0 obj
                << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
                endobj
                trailer
                << /Root 1 0 R >>
                %%EOF
                """.formatted(line);
    }
}
