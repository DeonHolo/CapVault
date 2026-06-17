package edu.cit.capvault;

import edu.cit.capvault.domain.*;
import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.repository.*;
import edu.cit.capvault.security.InstitutionalEmailValidator;
import edu.cit.capvault.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CapVaultServiceIntegrationTest {
    @Autowired InstitutionalEmailValidator emailValidator;
    @Autowired UserAccountRepository users;
    @Autowired CapstoneGroupRepository groups;
    @Autowired GroupMemberRepository members;
    @Autowired DeliverableRepository deliverables;
    @Autowired SubmissionRepository submissions;
    @Autowired DocumentVersionRepository versions;
    @Autowired ArchiveRecordRepository archives;
    @Autowired ClassRecordImportService classRecords;
    @Autowired GroupService groupService;
    @Autowired TrackerService tracker;
    @Autowired SubmissionService submissionService;
    @Autowired ReviewService reviewService;
    @Autowired ArchiveService archiveService;
    @Autowired HashService hashService;
    @Autowired CalendarService calendarService;
    @Autowired ReportService reportService;
    @Autowired AccessControlService accessControl;
    @Autowired UserManagementService userManagement;

    @Test
    void validatesInstitutionalEmailAndEnforcesGroupAccess() {
        UserAccount adviser = users.save(new UserAccount("adviser@cit.edu", "Adviser One", Role.ADVISER, null, true));
        UserAccount student = users.save(new UserAccount("student@cit.edu", "Student One", Role.STUDENT, "23-0001-001", true));
        CapstoneGroup group = groups.save(new CapstoneGroup("2526-sem2-it332-99", "Access Test", "AccessTrack", "RBAC test", "IT332", "Academic Capstone", adviser));
        members.save(new GroupMember(group, student, "23-0001-001", "Student One", 1));

        assertThat(emailValidator.isValid("student@cit.edu")).isTrue();
        assertThat(emailValidator.isValid("student@example.com")).isFalse();
        assertThat(accessControl.canAccessGroup(adviser, group)).isTrue();
        assertThat(accessControl.canAccessGroup(student, group)).isTrue();
    }

    @Test
    void importsClassRecordRowsAndAllowsAdminTrackerUpdate() {
        UserAccount admin = users.save(new UserAccount("admin@cit.edu", "Admin One", Role.ADMIN, null, true));
        users.save(new UserAccount("adviser@cit.edu", "Adviser One", Role.ADVISER, null, true));
        String csv = """
                STUDENT NO.,NAME OF STUDENT,TEAM FORMATION,MEMBER#,ProbExploration,Convergence,RRL,Project Proposal,SRS,SDD,Adviser Assessment,SourceCode,DEMO,PeerEvaluation
                23-0001-001,"SAMPLE, ARDEN L.",2526-sem2-it332-88,1,0,0,12,5,55,48,#N/A,#N/A,,#N/A
                ,,,,2/14/2026 23:59:59,2/21/2026 23:59:59,3/7/2026 23:59:59,3/14/2026 23:59:59,3/28/2026 23:59:59,4/4/2026 23:59:59,5/30/2026 23:59:59,5/30/2026 23:59:59,5/30/2026 23:59:59,5/30/2026 23:59:59
                """;
        String source = "inline:" + URLEncoder.encode(csv, StandardCharsets.UTF_8);

        CapVaultDtos.ClassRecordImportDto result = classRecords.sync(source, Map.of(), admin);
        assertThat(result.importedRows()).isEqualTo(1);
        CapVaultDtos.TrackerResponse response = tracker.list(admin, "Arden", null, null, null);
        assertThat(response.rows()).hasSize(1);

        CapVaultDtos.TrackerRowDto updated = tracker.updateRow(admin, response.rows().getFirst().id(), Map.of("srs", "DONE"));
        assertThat(updated.cells().stream().filter(cell -> cell.milestoneKey().equals("srs")).findFirst().orElseThrow().normalizedStatus()).isEqualTo(TrackerStatus.COMPLETE);
    }

    @Test
    void preservesSubmissionVersionsReviewsArchivesAndVerifiesHash() {
        Fixtures fixtures = fixtures();
        MockMultipartFile v1 = new MockMultipartFile("file", "srs-v1.pdf", "application/pdf", "%PDF-1.4 v1".getBytes(StandardCharsets.UTF_8));
        MockMultipartFile v2 = new MockMultipartFile("file", "srs-v2.pdf", "application/pdf", "%PDF-1.4 v2".getBytes(StandardCharsets.UTF_8));

        CapVaultDtos.SubmissionDto first = submissionService.submit(fixtures.student(), fixtures.deliverable().getId(), "First pass", v1, null);
        CapVaultDtos.SubmissionDto second = submissionService.submit(fixtures.student(), fixtures.deliverable().getId(), "Revision pass", v2, null);
        assertThat(second.versions()).hasSize(2);
        assertThat(second.currentVersion()).isEqualTo(first.currentVersion() + 1);

        CapVaultDtos.SubmissionDto reviewed = reviewService.review(fixtures.adviser(), second.id(), new CapVaultDtos.ReviewRequest(SubmissionStatus.FINAL, "Ready for archive.", second.versions().getFirst().id()));
        assertThat(reviewed.status()).isEqualTo(SubmissionStatus.FINAL);

        CapVaultDtos.ArchiveDto archive = archiveService.archiveVersion(fixtures.adviser(), reviewed.id(), reviewed.versions().getFirst().id());
        assertThat(archive.status()).isEqualTo(ArchiveStatus.ARCHIVED);
        assertThat(submissionService.readVersion(fixtures.student(), reviewed.versions().getFirst().id())).isNotEmpty();
        CapVaultDtos.HashCheckDto check = hashService.verify(fixtures.admin(), archive.id());
        assertThat(check.result()).isEqualTo("Unchanged");
        assertThat(archives.count()).isEqualTo(1);
    }

    @Test
    void verifiesStudentNumberAgainstClassRecordMember() {
        Fixtures fixtures = fixtures();

        CapVaultDtos.StudentVerificationDto result = userManagement.findStudentAccessByNumber(fixtures.student().getStudentNumber());

        assertThat(result.group().teamCode()).isEqualTo(fixtures.group().getTeamCode());
        assertThat(groupService.list(fixtures.student())).singleElement()
                .satisfies(group -> assertThat(group.teamCode()).isEqualTo(fixtures.group().getTeamCode()));
    }

    @Test
    void rejectsStudentNumberClaimedByAnotherAccount() {
        Fixtures fixtures = fixtures();
        UserAccount impostor = users.save(new UserAccount("impostor" + System.nanoTime() + "@cit.edu", "Impostor Student", Role.STUDENT, null, true));

        assertThatThrownBy(() -> userManagement.verifyStudentNumber(impostor, fixtures.student().getStudentNumber()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already assigned");
    }

    @Test
    void rejectsDuplicateStudentNumberOnUserUpsert() {
        Fixtures fixtures = fixtures();

        assertThatThrownBy(() -> userManagement.upsert(new CapVaultDtos.UpsertUserRequest(
                "duplicate" + System.nanoTime() + "@cit.edu",
                "Duplicate Student",
                Role.STUDENT,
                fixtures.student().getStudentNumber(),
                true
        )))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already assigned");
    }

    @Test
    void createsCalendarNotificationsAndMeaningfulReports() {
        Fixtures fixtures = fixtures();
        calendarService.createDeadline(fixtures.admin(), new CapVaultDtos.DeadlineRequest("SRS review", "Review copy due.", Instant.now().plusSeconds(3600), fixtures.deliverable().getId(), fixtures.group().getId(), Role.STUDENT));
        calendarService.createAnnouncement(fixtures.admin(), new CapVaultDtos.AnnouncementRequest("Panel schedule posted", "Check your group schedule.", Role.STUDENT, null));

        assertThat(calendarService.deadlinesFor(fixtures.student())).hasSize(1);
        assertThat(reportService.summary(fixtures.admin()).groups()).isGreaterThanOrEqualTo(1);
        assertThat(reportService.report(fixtures.admin()).teamProgress()).isNotNull();
    }

    @Test
    void rejectsUnsupportedSubmissionFormats() {
        Fixtures fixtures = fixtures();
        MockMultipartFile docx = new MockMultipartFile("file", "srs.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx".getBytes(StandardCharsets.UTF_8));
        assertThatThrownBy(() -> submissionService.submit(fixtures.student(), fixtures.deliverable().getId(), "Wrong format", docx, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only PDF");
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void listsSubmissionDtosOutsideCallerTransaction() {
        Fixtures fixtures = fixtures();
        MockMultipartFile file = new MockMultipartFile("file", "srs-list.pdf", "application/pdf", "%PDF-1.4 list".getBytes(StandardCharsets.UTF_8));

        submissionService.submit(fixtures.student(), fixtures.deliverable().getId(), "List view", file, null);

        assertThat(submissionService.listFor(fixtures.student()))
                .singleElement()
                .satisfies(submission -> assertThat(submission.versions()).singleElement()
                        .satisfies(version -> assertThat(version.filename()).isEqualTo("srs-list.pdf")));
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void listsGroupDtosOutsideCallerTransaction() {
        Fixtures fixtures = fixtures();

        assertThat(groupService.list(fixtures.student()))
                .singleElement()
                .satisfies(group -> {
                    assertThat(group.teamCode()).isEqualTo(fixtures.group().getTeamCode());
                    assertThat(group.members()).singleElement()
                            .satisfies(member -> assertThat(member.email()).isEqualTo(fixtures.student().getEmail()));
                    assertThat(group.deliverables()).singleElement()
                            .satisfies(deliverable -> assertThat(deliverable.title()).isEqualTo("SRS"));
                });
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void listsArchiveDtosOutsideCallerTransaction() {
        Fixtures fixtures = fixtures();
        MockMultipartFile file = new MockMultipartFile("file", "srs-archive.pdf", "application/pdf", "%PDF-1.4 archive".getBytes(StandardCharsets.UTF_8));

        CapVaultDtos.SubmissionDto submitted = submissionService.submit(fixtures.student(), fixtures.deliverable().getId(), "Archive list", file, null);
        CapVaultDtos.SubmissionDto finalSubmission = reviewService.review(fixtures.adviser(), submitted.id(), new CapVaultDtos.ReviewRequest(SubmissionStatus.FINAL, "Ready.", submitted.versions().getFirst().id()));
        archiveService.archiveVersion(fixtures.adviser(), finalSubmission.id(), finalSubmission.versions().getFirst().id());

        assertThat(archiveService.list(fixtures.admin()))
                .anySatisfy(archive -> {
                    assertThat(archive.deliverableTitle()).isEqualTo("SRS");
                    assertThat(archive.sha256()).isNotBlank();
                });
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void buildsReportOutsideCallerTransaction() {
        Fixtures fixtures = fixtures();
        MockMultipartFile file = new MockMultipartFile("file", "srs-report.pdf", "application/pdf", "%PDF-1.4 report".getBytes(StandardCharsets.UTF_8));

        submissionService.submit(fixtures.student(), fixtures.deliverable().getId(), "Report row", file, null);

        assertThat(reportService.report(fixtures.admin()).rows())
                .anySatisfy(row -> {
                    assertThat(row.teamCode()).isEqualTo(fixtures.group().getTeamCode());
                    assertThat(row.deliverableTitle()).isEqualTo("SRS");
                });
    }

    private Fixtures fixtures() {
        UserAccount admin = users.save(new UserAccount("admin" + System.nanoTime() + "@cit.edu", "Admin Fixture", Role.ADMIN, null, true));
        UserAccount adviser = users.save(new UserAccount("adviser" + System.nanoTime() + "@cit.edu", "Adviser Fixture", Role.ADVISER, null, true));
        UserAccount student = users.save(new UserAccount("student" + System.nanoTime() + "@cit.edu", "Student Fixture", Role.STUDENT, "23-" + System.nanoTime(), true));
        CapstoneGroup group = groups.save(new CapstoneGroup("2526-sem2-it332-" + System.nanoTime(), "Fixture Project", "FixtureVault", "Fixture group", "IT332", "Academic Capstone", adviser));
        members.save(new GroupMember(group, student, student.getStudentNumber(), student.getDisplayName(), 1));
        Deliverable deliverable = deliverables.save(new Deliverable("SRS", "srs", "Software Requirements Specification", Instant.now().plusSeconds(7200), group));
        return new Fixtures(admin, adviser, student, group, deliverable);
    }

    private record Fixtures(UserAccount admin, UserAccount adviser, UserAccount student, CapstoneGroup group, Deliverable deliverable) {
    }
}
