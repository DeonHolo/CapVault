package com.capvault.backend.project;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProjectMetadataResponse(
    UUID id,
    String groupCode,
    String projectTitle,
    String softwareName,
    String description,
    String proposalRemarks,
    String demoComments,
    String adviserName,
    String projectStatus,
    String category,
    Integer sourceRowNumber,
    LocalDateTime updatedAt
) {

    public static ProjectMetadataResponse from(ProjectMetadata metadata) {
        return new ProjectMetadataResponse(
            metadata.getId(),
            metadata.getGroupCode(),
            metadata.getProjectTitle(),
            metadata.getSoftwareName(),
            metadata.getDescription(),
            metadata.getProposalRemarks(),
            metadata.getDemoComments(),
            metadata.getAdviserName(),
            metadata.getProjectStatus(),
            metadata.getCategory(),
            metadata.getSourceRowNumber(),
            metadata.getUpdatedAt()
        );
    }
}
