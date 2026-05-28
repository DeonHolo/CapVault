package edu.cit.capvault.service;

import edu.cit.capvault.domain.ArchiveRecord;
import edu.cit.capvault.domain.HashCheck;
import edu.cit.capvault.domain.UserAccount;
import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.repository.ArchiveRecordRepository;
import edu.cit.capvault.repository.HashCheckRepository;
import edu.cit.capvault.service.storage.Hashing;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HashService {
    private final ArchiveRecordRepository archives;
    private final HashCheckRepository hashChecks;
    private final FileObjectService fileObjectService;
    private final ActivityLogService activityLog;
    private final DtoMapper mapper;
    private final AccessControlService accessControl;

    public HashService(ArchiveRecordRepository archives, HashCheckRepository hashChecks, FileObjectService fileObjectService, ActivityLogService activityLog, DtoMapper mapper, AccessControlService accessControl) {
        this.archives = archives;
        this.hashChecks = hashChecks;
        this.fileObjectService = fileObjectService;
        this.activityLog = activityLog;
        this.mapper = mapper;
        this.accessControl = accessControl;
    }

    @Transactional
    public CapVaultDtos.HashCheckDto verify(UserAccount actor, Long archiveId) {
        ArchiveRecord archive = archives.findById(archiveId).orElseThrow(() -> new IllegalArgumentException("Archive record not found."));
        accessControl.requireGroupAccess(actor, archive.getGroup());
        String stored = archive.getFileObject().getSha256();
        String current = Hashing.sha256(fileObjectService.read(archive.getFileObject()));
        String result = stored.equals(current) ? "Unchanged" : "Modified";
        HashCheck check = hashChecks.save(new HashCheck(archive, stored, current, result, actor));
        activityLog.record(actor, "HASH_VERIFIED", "ArchiveRecord", archive.getId(), archive.getTeamCode() + " archive integrity check: " + result + ".");
        return mapper.hashCheck(check);
    }

    public List<CapVaultDtos.HashCheckDto> checks(UserAccount user, Long archiveId) {
        ArchiveRecord archive = archives.findById(archiveId).orElseThrow(() -> new IllegalArgumentException("Archive record not found."));
        accessControl.requireGroupAccess(user, archive.getGroup());
        return hashChecks.findByArchiveRecordOrderByCheckedAtDesc(archive).stream().map(mapper::hashCheck).toList();
    }
}
