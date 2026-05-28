package edu.cit.capvault.controller;

import edu.cit.capvault.dto.CapVaultDtos;
import edu.cit.capvault.security.CurrentUserService;
import edu.cit.capvault.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/review")
public class ReviewController {
    private final ReviewService reviews;
    private final CurrentUserService currentUser;

    public ReviewController(ReviewService reviews, CurrentUserService currentUser) {
        this.reviews = reviews;
        this.currentUser = currentUser;
    }

    @PatchMapping("/submissions/{submissionId}")
    @PreAuthorize("hasAnyRole('ADMIN','ADVISER')")
    public CapVaultDtos.SubmissionDto review(@PathVariable Long submissionId, @Valid @RequestBody CapVaultDtos.ReviewRequest request) {
        return reviews.review(currentUser.requireCurrentUser(), submissionId, request);
    }
}
