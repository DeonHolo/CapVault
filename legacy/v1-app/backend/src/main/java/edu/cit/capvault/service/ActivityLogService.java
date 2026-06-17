package edu.cit.capvault.service;

import edu.cit.capvault.domain.ActivityLog;
import edu.cit.capvault.domain.UserAccount;
import edu.cit.capvault.repository.ActivityLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ActivityLogService {
    private final ActivityLogRepository activityLogs;

    public ActivityLogService(ActivityLogRepository activityLogs) {
        this.activityLogs = activityLogs;
    }

    @Transactional
    public void record(UserAccount actor, String action, String subjectType, Long subjectId, String details) {
        activityLogs.save(new ActivityLog(actor, action, subjectType, subjectId, details));
    }

    public List<ActivityLog> recent() {
        return activityLogs.findTop30ByOrderByOccurredAtDesc();
    }
}
