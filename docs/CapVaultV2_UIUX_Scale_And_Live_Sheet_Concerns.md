# CapVault V2 UI/UX Scale And Live Sheet Concerns

Date captured: 2026-06-18

This document captures the latest feedback after viewing the current V2 Student Dashboard, Review page, Workspace page, and Tracker page. These notes must guide the next implementation pass. Do not simplify these into "make cards smaller." The core issue is that CapVault must work for Sir Ralph's real scale: many students, many groups, and multiple deliverables across IT and CS capstone classes.

## 1. Current Concern Summary

The current UI looks cleaner than the earlier version, but several layouts are not yet suitable for the actual workflow scale.

Key concerns:

1. Student Dashboard currently shows one large card per deliverable. This is fine with 3 deliverables, but it can become noisy if Sir publishes more deliverables.
2. Review page currently shows one large bordered card per response. This will not scale for around 100-300 capstone students times around 9 deliverables.
3. Workspace "Connect Sheet" currently behaves like a local prototype action. It stores/updates connection state, but it does not actually parse the Google Sheet and repopulate students, deliverables, tracker columns, and tracker rows.
4. Tracker page still has a vertical/internal scroll treatment that does not match the earlier legacy CapVault direction.
5. Tracker selected-row preview is not useful enough. It repeats visible tracker cells instead of summarizing meaningful student/team review context.
6. Some status pills look visually broken, especially `Missing` in the Student Dashboard, and long values such as `79 days` can wrap.
7. Link wording should be more precise: `Open submitted file` should become `Open submitted file link`.

## 2. Student Dashboard: Current Problem

The Student Dashboard currently uses large deliverable cards. This gives good breathing room for 3 items, but it does not scale if Sir adds more deliverables from the Sheet. Since deliverables should be dynamic after Sheet connection, the UI must assume there may be 8-12 deliverables or more.

If the app simply adds more large cards, students will have to scroll through too much repeated layout. The student experience should help them answer:

1. What do I still need to submit?
2. What needs attention?
3. What has already been received?
4. What did Sir's system flag?
5. Which submitted link did I send?

The dashboard should be convenient for the student's eyes and navigation. It should not feel like a staff review queue.

## 3. Student Dashboard: Proposed Direction

Recommended design:

1. Keep a compact top identity block with Student Number selector and matched student details.
2. Add a small "My status" summary row:
   - Missing
   - Needs review
   - Submitted
   - Accepted/final, if used
3. Replace large deliverable cards with a compact deliverable list/table when deliverables exceed a small threshold.
4. Suggested threshold:
   - 1-4 deliverables: card grid is acceptable.
   - 5+ deliverables: switch to compact list/table.
5. Each deliverable row should show:
   - Deliverable name
   - Due date
   - Current status
   - Last saved/last edited timestamp
   - Short file-check result
   - Primary action: `Open form`, `Edit response`, or `Open submitted file link`
6. Provide filters or tabs:
   - All
   - Missing
   - Needs attention
   - Submitted
7. Tracker values should stay below the main deliverable list, but may be collapsed by default or shown as compact chips.

Important wording:

- Change `Open submitted file` to `Open submitted file link`.
- Avoid "attempt" language in the Student Dashboard.
- Use "response" only if needed.

## 4. Student Dashboard: Status Pill Requirements

The `Missing` pill currently looks broken or inconsistent with other pages. The next pass must use one shared status component/style across the app.

Requirements:

1. All statuses should use the same shared pill component.
2. Pills should not wrap awkwardly.
3. Values like `79 days` should stay on one line.
4. Pill labels should be short and plain:
   - Missing
   - Needs Review
   - PDF OK
   - Template-like
   - Checked
   - Accepted
5. Do not stack too many pills in the student view. Show one primary status plus at most one or two important flags.

## 5. Review Page: Current Problem

The Review page currently looks good with two responses, but it is too large for Sir's actual scale.

Realistic scale:

1. About 100-300 capstone students.
2. Around 9 deliverables.
3. That means around 900-2700 possible response rows, depending on how many students/classes are active.

A card-per-response layout with thick borders and large vertical spacing will make Sir scroll too much. Sir's workflow needs quick scanning, filtering, and opening suspicious files. The review UI should prioritize speed and density.

## 6. Review Page: Proposed Direction

Recommended design:

1. Use a compact review queue table or dense row list instead of large cards.
2. Keep actions visible without horizontal scrolling.
3. Use row expansion or a side detail drawer for longer AI/file-check details.
4. Use sticky/fixed action area if a table is used.
5. Add strong filters:
   - Deliverable
   - Team
   - Student
   - Status
   - Needs attention
   - Template-like
   - Missing
   - Checked/not checked
6. Add grouping options:
   - Group by deliverable
   - Group by team
   - Group by status
7. Add pagination or virtualization when the response count grows.
8. The default view should probably show only the actionable queue:
   - Needs review
   - Broken/inaccessible
   - Template-like
   - Not checked
   - Late, if useful
9. Accepted/clean responses should be available through filters, not dominate the default review screen.

Each review row should show:

1. Student name
2. Team code
3. Deliverable
4. Submitted/edited timestamp
5. Primary status
6. One or two flags
7. AI/file-check summary preview
8. Actions:
   - `Open submitted file link`
   - `AI Review`
   - `Accept final`
   - `Archive final`

## 7. Review Page: AI Summary Placement

The current selected-row preview idea in Tracker and the Review page can be connected.

Sir likely needs a compact summary such as:

- "This student has 3 missing deliverables, 1 template-like submission, and 2 files still needing review."
- "Team 2526-sem2-it332-41 has SDD flagged as template-like and SRS missing."
- "Most recent issue: SDD appears close to the provided template."

This summary should not be vague AI fluff. It should be derived from actual file-check flags and tracker values, then optionally phrased by AI later. For now, deterministic summaries are enough.

## 8. Workspace And Google Sheet Connection: Current Reality

The current V2 frontend connection is not a real Google Sheet sync yet. It stores the Sheet URL and simulates the connected state using local seed data. It does not actually fetch and parse Sir's Sheet rows.

This is why connecting a Sheet does not repopulate:

1. Student ID numbers
2. Student names
3. Team codes
4. Member numbers
5. Tracker rows
6. Deliverable columns
7. Published form options

This must be corrected. The app's core promise is that Sir can connect his Sheet and the app uses it.

## 9. Workspace: Required Real Sheet Import Behavior

When Sir connects a Google Sheet, CapVault should:

1. Read the Sheet headers.
2. Read row data.
3. Detect or ask Sir to map identity columns:
   - Name of Student
   - Student Number, if present
   - Email/Gmail, if present
   - Team Formation / Team Code
   - Member #
4. Detect tracker/deliverable columns:
   - ProbExploration
   - Convergence
   - RRL
   - Project Proposal
   - SRS
   - SDD
   - Adviser Assessment
   - SourceCode
   - DEMO
   - PeerEvaluation, if present
   - Any new columns Sir adds later
5. Populate Student Number selector options.
6. Populate Student Dashboard tracker values.
7. Populate Form Publisher deliverable choices.
8. Populate Tracker table.
9. Allow Sir to rename/hide/edit mapped columns after import.
10. Preserve raw Sheet values.

## 10. Is Real Google Sheet Sync Hard?

There are two levels.

Level 1: Demo-friendly public Sheet sync.

If Sir provides a published/public Google Sheet link, CapVault can fetch exported CSV/HTML-like data and parse it. This is easier and may be enough for demonstration. It still needs careful parsing because Sir's published link may point to a specific `gid`.

Level 2: Proper private Google API sync.

If Sir's Sheet is private, CapVault needs Google API setup. This means OAuth or service account credentials, Google Sheets API, and probably a backend endpoint to avoid exposing credentials in the frontend. This is more correct for production.

Recommendation:

1. Implement demo-friendly public Sheet import first.
2. Keep the architecture compatible with backend Google API sync later.
3. Clearly show in the Workspace UI whether the connected Sheet is public/demo-imported or API-connected.

## 11. Workspace: Column Management UI

The current Deliverable Columns list should not appear as if it is hardcoded forever. It should feel like it came from the connected Sheet.

Requirements:

1. Before Sheet connection, show an empty/setup state.
2. After Sheet connection, show detected columns.
3. Let Sir confirm which columns are deliverables.
4. Let Sir rename display labels.
5. Let Sir mark whether the deliverable requires a PDF.
6. Let Sir hide non-deliverable columns from form publishing.
7. Show unmapped/new columns after re-sync.

## 12. Tracker Page: Legacy Reference

The legacy V1 tracker had useful ideas:

1. A selected-row detail band appeared above the tracker table.
2. The class-wide tracker table was inside a collapsible section.
3. Identity columns were treated as important first columns.
4. Milestone cells were compact raw values.
5. Status was shown subtly through styling/tooltips rather than adding extra stacked pill rows.
6. Row selection was visually clear.

Current V2 should borrow the idea, not necessarily the exact code.

## 13. Tracker Page: Current Problems

Current issues:

1. Tracker has an internal vertical scrollbar that may feel cramped.
2. Some tracker values such as `79 days` wrap into two lines.
3. The selected-row preview repeats visible milestone values and does not add much value.
4. The preview only shows a partial subset of milestones, which can feel arbitrary.

## 14. Tracker Page: Proposed Direction

Recommended tracker design:

1. Use the legacy idea of a selected-row band above the table.
2. Keep the tracker table vertically integrated with the page unless a specific max-height is truly needed.
3. If the table must scroll, make it feel intentional and comfortable, not cramped.
4. Keep raw tracker values compact:
   - `0`
   - `79`
   - `5/28/2026`
   - `#N/A`
   - blank
5. Do not display `79 days` inside cells if it causes wrapping. The number alone is closer to Sir's Sheet.
6. Show status through subtle cell style or tooltip, not extra pill stacks.
7. Keep row selection feedback.

## 15. Tracker Selected Preview: Better Use

Instead of repeating milestone cells, the selected preview should summarize the student/team's situation.

Possible preview content:

1. Student name, team code, member number.
2. Missing deliverable count.
3. Late deliverable count.
4. Needs-review/file-check count.
5. Template-like count.
6. Latest submitted/edited response.
7. Short generated summary:
   - "This student has SRS missing and SDD flagged as template-like."
   - "This team has most deliverables submitted, but SourceCode is still blank."
   - "This student has several late tracker values and one file needing review."

This preview should connect Tracker and Review data, not just repeat tracker cells.

## 16. Review And Tracker Connection

The Review page and Tracker page should share a common understanding of response status.

Examples:

1. If Review flags SDD as template-like, Tracker selected preview should mention it.
2. If Tracker shows blank SRS but no response exists, Student Dashboard should show SRS as missing.
3. If a response exists but AI/file check says template-like, the tracker may still have a lateness value, but the Review/Student Dashboard should show "Needs Review."

This distinction matters:

- Tracker answers "did they submit and when?"
- Review answers "is the submitted file usable?"
- Student Dashboard answers "what do I need to do next?"

## 17. Immediate UI Copy Fixes

Required wording changes:

1. Change `Open submitted file` to `Open submitted file link`.
2. Avoid saying `Open file` if the action opens a Drive URL rather than a stored file viewer.
3. Prefer `Open link` or `Open submitted file link`.
4. Keep `AI Review` or `Run AI Review`, not `Check File` alone.
5. Avoid "attempt" in product-facing text.

## 18. Next Implementation Priorities

Recommended order:

1. Fix Student Dashboard density and status pill consistency.
2. Fix Review page scale by moving from huge cards to compact queue rows with filters.
3. Fix Tracker layout using the legacy tracker idea:
   - selected detail band
   - compact raw cells
   - no cramped vertical scroll
   - no wrapping tracker values
4. Add real public Google Sheet import parsing for demo use.
5. Make Workspace columns truly appear from the connected Sheet import.
6. Connect Tracker selected preview to review/file-check summaries.

## 19. Resolved Discussion Points

These questions were previously open, but they have been answered in Section 20 and should no longer block implementation:

1. Student Dashboard uses a compact table/list immediately.
2. Review defaults toward items needing action, with clean/accepted responses available through filters.
3. Review is deliverable-first.
4. Tracker selected-row preview summarizes the individual student only.
5. Public published-Sheet import is enough for the next demo; backend Google API sync can come later.

## 20. Decisions From Latest Discussion

Date decided: 2026-06-18

These decisions refine the next UI/UX implementation pass.

1. Student Dashboard should use a compact table/list immediately. Do not switch between cards and tables based on deliverable count. The app should assume dynamic deliverables and avoid multi-layout complexity.
2. Review can default to items needing action first, with clean or accepted responses available through filters. This is an experimental direction that can change after feedback, but it matches the goal of reducing Sir Ralph's scanning workload.
3. Review should be deliverable-first. Sir Ralph should first see deliverables, then open the submissions under that deliverable.
4. Tracker selected-row preview should summarize the individual student only, not the whole team.
5. Public published-Sheet import is enough for the next demo because Sir's current class record is public. Backend Google API sync can come later if the Sheet becomes private or writeback needs official credentials.
6. The next demo target is July 27, 2026. The project is being continued during summer because the score was marked INC until Sir Ralph's requested workflow changes are handled.
7. The main product lens is one-person workload reduction for Sir Ralph. The app is not primarily a team operations suite. Fewer clicks, faster review, clearer queues, and fewer manual file opens matter more than broad admin features.

## 21. Deliverable-First Review Direction

The Review page should stop treating every response as an equal large card. At Sir Ralph's scale, the first screen should answer:

1. Which deliverables are active?
2. How many expected submissions are there?
3. How many have been received?
4. How many still need file checks or AI review?
5. How many have file/link/PDF/template issues?
6. Which deliverable should Sir open next?

Recommended structure:

1. A compact deliverable queue at the top or main view.
2. Each deliverable row/card shows:
   - Deliverable name
   - Due date
   - Expected count
   - Received count
   - Missing count
   - Needs check count
   - Flagged count
   - Accepted/final count
3. Primary actions per deliverable:
   - `Open submissions`
   - `Run batch AI review`
   - `Export summary`, later if useful
4. Opening a deliverable shows a compact submissions table:
   - Student
   - Team
   - Submitted/edited date
   - File status
   - AI status
   - Short summary
   - Actions
5. Single-response actions stay available:
   - `Open submitted file link`
   - `AI Review`
   - `Accept final`
   - `Archive final`

Batch AI review should be manual and Sir-controlled. It is useful after the due date or when enough submissions have arrived. It should show estimated queue size and should skip files that already have a current AI review unless Sir explicitly reruns them. This reduces cost risk and avoids constant student-triggered AI usage.

## 22. What AI Review Should Mean

AI review must not be a vague "looks good" label. Based on the IEEE Docs Evaluator reference and Sir Ralph's concern, AI review should help him avoid opening many files just to discover that the file is inaccessible, wrong, nearly empty, or mostly unchanged template content.

There should be two levels:

1. Basic file check:
   - Runs before or soon after submission.
   - Uses Drive metadata and extraction where possible.
   - Checks whether the link opens.
   - Checks whether the file is PDF for PDF-required deliverables.
   - Checks whether text can be extracted.
   - Checks whether content is extremely short.
   - Checks whether the submission appears template-like.
2. Manual AI review:
   - Triggered by Sir/adviser from Review.
   - Can be run per submission or batched per deliverable.
   - Produces a short summary, red flags, missing/weak sections, and suggested action.
   - Does not replace Sir's grading or final judgment.

The student side can show basic flags such as inaccessible link, not PDF, unreadable text, or template-like. The detailed AI review should default to Sir/adviser visibility unless Sir decides to send it to students.

## 23. IEEE Docs Evaluator Findings

Reference repo: https://github.com/Hello-Kalibutan-Team/IEEE-Docs-Evaluator

What the referenced evaluator appears to do:

1. It supports SRS, SDD, STD, and SPMP documents.
2. It uses Google Drive integration to download/render documents for AI analysis.
3. It uses Google Sheets integration for roster, allowlist verification, and submission tracking.
4. It has teacher-controlled AI evaluation, not only student-side checking.
5. It stores evaluation history/versioning.
6. It supports prompt customization per document type, including rubric, diagram analysis, and prompt-step overrides.
7. It streams progress states while analysis runs.
8. It lets teachers annotate or edit evaluation reports and send results to students.

What it evaluates:

1. Document emptiness or insufficient meaningful content.
2. Document type correctness.
3. IEEE-style rubric coverage for each document type.
4. Diagram, figure, and table presence and correctness.
5. Missing sections.
6. Weak sections with low engineering depth or vague/generic content.
7. Recommendations tied to rubric scores.
8. Strengths, summary, and conclusion.
9. Revision status when a previous evaluation exists.

Important difference for CapVault:

CapVault should not copy the full evaluator as-is. IEEE Docs Evaluator is a document-evaluation product. CapVault V2 is a class-record-connected submission workflow assistant for Sir Ralph. The useful part to borrow is the evaluation pipeline shape:

1. Drive link/file metadata check.
2. Text extraction and PDF rendering.
3. Prompt per deliverable/template.
4. Manual or batch professor-triggered evaluation.
5. Evaluation history.
6. Short teacher-facing summary plus optional longer report.

## 24. CapVault AI Review Recommendation

Recommended implementation direction:

1. Keep basic checks cheap and automatic.
2. Keep full AI review manual or batch-triggered by Sir/adviser.
3. Review by deliverable first.
4. Let Sir configure a template/rubric per deliverable.
5. Compare submitted PDF text against the official template before calling AI.
6. Use deterministic flags first:
   - Link inaccessible
   - Not PDF
   - Text unreadable
   - Very low extracted text
   - High template similarity
   - Missing expected headings
7. Use AI after those checks to produce the human-readable summary and deeper content review.

This gives Sir a practical queue:

1. "These files cannot be opened."
2. "These are not PDFs."
3. "These look template-like."
4. "These are ready for quick review."
5. "These are accepted/final/archive candidates."

## 25. Updated Next Implementation Priorities

Given the latest answers, the next implementation pass should be:

1. Student Dashboard: compact deliverable list only, shared status pills, `Open submitted file link` wording.
2. Review: deliverable-first queue with default actionable filter and compact submissions table.
3. Review actions: visible, aligned, no horizontal action hunting.
4. AI review UX: rename/reframe as `AI Review`, preserve manual and batch review concepts.
5. Tracker: selected individual preview only, using compact raw tracker values and useful student-level summary.
6. Workspace: public Sheet import that actually populates students, tracker columns, and deliverable options from Sir's Sheet.
7. Workspace: show mapped columns and let Sir rename/hide/edit them after import.

## 26. Three Source-Of-Truth Sheets

Date decided: 2026-06-18

The app should stop treating the tracker sheet as the only source of truth. Sir Ralph's workflow uses three Google Sheets/tabs that each own a different part of the data model.

Official source map:

1. `Team Formation`
   - Owns student identity.
   - Provides Student Number, student name, team code, member number, and CIT email/account.
   - Populates public form Student Number selectors, registration Student Number selectors, student dashboard lookup, and adviser/team membership.
2. `Tracker`
   - Owns class-record progress and lateness values.
   - Provides milestone/deliverable columns such as ProbExploration, Convergence, RRL, Project Proposal, SRS, SDD, Adviser Assessment, SourceCode, and DEMO.
   - Should not invent Student Numbers.
3. `Software Project Monitor`
   - Owns group-level project metadata.
   - Provides group code, project title, software name, description, proposal remarks, demo comments, adviser/status, and category.
   - Populates tracker selected-student context, review context, adviser scope, archive metadata, and group summaries.

Merge rule:

1. Load Team Formation identity first when available.
2. Attach Tracker rows by team code plus member number when possible.
3. Use normalized student name as fallback matching only when team/member matching is unavailable.
4. Attach Software Project Monitor metadata by group/team code.

Important constraint:

CapVault should never generate fake `sheet-001` Student Numbers after the Team Formation source is introduced. If Team Formation is not connected, the app should clearly say that the identity source is missing instead of pretending generated IDs are official.

## 27. Scale-Focused Redesign Plan

This implementation pass should follow the accepted scale-focused plan:

1. Replace review cards with a deliverable-first inbox, compact submissions table, and selected response detail panel.
2. Rework Command Center into a useful `Today's Work` queue that shows prioritized action rows instead of generic shortcut cards.
3. Restore the useful legacy tracker pattern: selected student band above the table, sticky identity columns, compact raw cells, and no cramped inner vertical scroll.
4. Make published forms one-per-deliverable. Editing should update the existing form; removing should unpublish only and preserve responses.
5. Use an import summary after Sheet connection to show detected columns, deadline rows, warnings, and suggested generated forms.
6. Represent AI Review as a staff-triggered assistant that produces a short summary, red flags, missing/weak sections, instruction/template comparison, and suggested action.
7. Count tracker lateness from any real submitted or edited response that changed data, even if the file later fails validation, matching Sir's current tracker behavior.

## 28. Reopened Previous Prompt Audit

Date captured: 2026-06-18

The reopened `docs/PREVIOUS PROMPT.md` confirms that the previous implementation pass still missed several high-priority workflow and UI concerns. These must be treated as active discussion items before the next implementation pass.

Key items from the reopened prompt:

1. Review must not use card-heavy or cramped layouts. Even a compact table can fail if it is placed inside a narrow panel with horizontal scrolling. Sir Ralph may handle around 318 students, so a layout that feels cramped with 2 responses will fail badly at real scale.
2. Command Center should not be a generic shortcut surface. It must give Sir immediate value by showing prioritized work, counts, and next actions.
3. Tracker must be revisited using the legacy tracker as a real reference, not only as inspiration. The legacy tracker had a dedicated tracker table, selected row band, sticky identity columns, compact raw cells, and a collapsible class-wide table.
4. AI Review should cover missing content, blank or extremely low-content files, corrupt/unreadable files, short summary, and template-instruction comparison. The desired direction is to compare official templates/instructions against submitted PDFs, then optionally use Gemini for the deeper summary.
5. Tracker values should update when a real response is submitted or edited with changed data. Lateness should count any changed submission event, even if later file review fails.
6. Form editing must update the existing form for that deliverable, not duplicate it. Each deliverable should have one published form at a time.
7. Removing a form should unpublish it and preserve responses. Responses should stay tied to the stable deliverable identity, so republishing the same deliverable can still show historical responses.
8. Form Publisher due date controls should default to today's date and `11:59 PM`, and the visible due display should use `Date | Time`.
9. Generated form links need a copy action.
10. Tracker imports may include skipped non-student rows that actually contain deadline metadata. Import summary should surface detected deadlines and offer suggested forms to generate.
11. Adviser View is still missing. Advisers should see only assigned groups and should be able to give feedback per deliverable. Student Dashboard should show adviser feedback.
12. Student Dashboard should show small group progress, such as how many group members have submitted for a deliverable and who has current responses, without turning it into a full group dashboard.
13. Project title and software name come from a separate `Software Project Monitoring` source. This metadata should be visible in more places, not only stored silently.
14. Student ID Numbers must populate from `Team Formation`, not from tracker rows or generated placeholder IDs.
15. Editing an existing response should prefill previous details, matching Google Forms edit-response behavior.

## 29. Review Page Browser Audit

The current Review page was checked in the browser after the latest scale-focused implementation. The result confirms the user's concern: the page is still too claustrophobic.

At a desktop-sized viewport of `1324 x 910`, the Review layout resolves to three columns:

1. Deliverable column: `260px`
2. Submission table column: `360px`
3. Detail panel: `340px`

This makes the middle submission table unusably narrow:

1. The table wrapper is only around `316px` wide.
2. The table itself requires around `1040px`.
3. This creates horizontal scrolling inside the most important work area.
4. The selected deliverable header becomes about `318px` wide and wraps into a tall block.
5. The detail panel is also too narrow and becomes very tall.

At a narrower browser width, the whole Review workbench collapses into one column around `650px` wide. That avoids the three-column squeeze but creates a long stacked page and still leaves the submission table with horizontal scrolling.

UX conclusion:

The current Review page should not be implemented as a permanent three-column workbench. It technically reduced cards, but it introduced a new scale problem: narrow panes with nested horizontal scrolling. For Sir Ralph's workflow, Review needs a wide primary table and a secondary detail view that does not steal table width.

## 30. Review Redesign Direction After Audit

Recommended next direction:

1. Make the deliverable list a horizontal row, segmented control, compact top strip, or left rail that does not reduce the submission table to 360px.
2. Make the submissions table the primary surface, taking most of the viewport width.
3. Move details into one of these patterns:
   - right drawer that overlays or slides over the table only when a row is opened,
   - bottom detail panel below the table,
   - expandable row for quick AI summary and actions.
4. Remove student feedback from Sir/Admin Review. Feedback belongs in Adviser View.
5. Sir/Admin Review should focus on:
   - deliverable selection,
   - expected/received/missing counts,
   - filter by needs action, unchecked, template-like, accepted,
   - open submitted file link,
   - run AI Review,
   - accept final,
   - archive final.
6. Adviser View should focus on:
   - assigned groups only,
   - group/student progress,
   - per-deliverable feedback,
   - student-visible remarks,
   - optional AI Review access depending on permissions.

The core rule is: never put the highest-volume object, the submissions table, inside the narrowest part of the screen.

## 31. Team Formation Import Correction

The linked Team Formation Sheet does not match the earlier parser assumptions. It uses a structure like:

1. `TEAM CODE`
2. `MEMBER #`
3. `STUDENT ID`
4. `LASTNAME`
5. `FIRSTNAME`
6. `EMAIL @cit.edu`

There are also non-data intro rows before the real table header. The importer must scan for the real header row instead of assuming row 1 is the header. It must also combine `LASTNAME` and `FIRSTNAME` into a display name.

Correct identity mapping:

1. Student Number: `STUDENT ID`
2. Student Name: `LASTNAME, FIRSTNAME`
3. Team Code: `TEAM CODE`
4. Member Number: `MEMBER #`
5. Institutional Email: `EMAIL @cit.edu`

This is why the previous Team Formation import produced warnings about missing Student Number columns and skipped rows. The parser was wrong for Sir's actual sheet.

## 32. Google OAuth And Student ID Linking

Google OAuth should prove the account identity, not the class-record identity.

Recommended flow:

1. A student may submit public forms without logging in.
2. A student may optionally register or sign in with Google OAuth.
3. After OAuth, the student must claim a `STUDENT ID` from the Team Formation source.
4. Once claimed, that `STUDENT ID` is locked to that account.
5. Claimed IDs disappear from the registration selector for other students.
6. Admin/Sir can release or correct a mistaken claim.
7. When a logged-in student opens a form, Student ID, name, and team code autofill from the claimed identity but can still be manually changed if the form design keeps that flexibility.

This keeps public submission friction low while still giving optional accounts a reliable identity link.

## 33. Software Project Monitoring Visibility

Software Project Monitoring currently should not be treated as an invisible metadata cache. It should appear in:

1. Tracker selected student summary:
   - project title,
   - software name,
   - adviser/status,
   - category where useful.
2. Student Dashboard:
   - a small `Your project` strip with project title and software name,
   - adviser/status if useful,
   - not a large project dashboard.
3. Adviser View:
   - assigned team list,
   - project titles/software names,
   - proposal/demo remarks when reviewing context.
4. Archive:
   - archive metadata should include project title and software name.

Decision:

Students should be allowed to see proposal remarks and demo comments from Software Project Monitoring because these sheets are already public in Sir Ralph's current workflow. Student Dashboard can surface this information as project context, but it should still be presented carefully:

1. Show project title, software name, adviser/status, category, proposal remarks, and demo comments in a readable project-context section.
2. Keep it compact by default so it does not bury submission status.
3. Use expansion or a "View project notes" affordance if remarks/comments are long.
4. Do not treat these remarks as private adviser feedback. Separate adviser feedback should still live in Adviser View and be explicitly student-facing when saved.
