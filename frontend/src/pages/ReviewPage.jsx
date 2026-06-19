import { useMemo, useState } from 'react';
import { Archive, ArrowSquareOut, CheckCircle, Sparkle } from '@phosphor-icons/react';
import { Button, DataTable, EmptyState, PageHeader, SearchBox, StatusBadge } from '../components/ui.jsx';
import { useWorkflow } from '../app/WorkflowContext.jsx';
import {
  findStudent,
  firstSubmissionLink,
  formatDate,
  formatDateTime,
  getIdentityStudents,
  getProjectMetadata,
  isAiReportCurrent,
  makeDriveViewUrl,
  sortDeliverables
} from '../lib/workflow.js';

const reviewFilters = ['Needs Action', 'Unchecked', 'Flagged', 'All', 'Accepted'];

export function ReviewPage() {
  const { state, triggerAiEvaluation, markAccepted, archiveAttempt } = useWorkflow();
  const identityStudents = useMemo(() => getIdentityStudents(state.students), [state.students]);
  const orderedDeliverables = useMemo(() => sortDeliverables(state, state.deliverables), [state]);
  const [selectedDeliverableId, setSelectedDeliverableId] = useState(orderedDeliverables[0]?.id || '');
  const [expandedResponseId, setExpandedResponseId] = useState('');
  const [filter, setFilter] = useState('Needs Action');
  const [query, setQuery] = useState('');

  const deliverableSummaries = useMemo(() => orderedDeliverables.map((deliverable) => {
    const responses = state.attempts.filter((response) => response.deliverableId === deliverable.id);
    const accepted = responses.filter((response) => response.reviewStatus === 'Accepted').length;
    const flagged = responses.filter(isFlaggedResponse).length;
    const unchecked = responses.filter((response) => !isAiReportCurrent(response)).length;
    const needsCheck = responses.filter(needsReviewAction).length;
    const missing = Math.max(0, identityStudents.length - responses.length);
    return { deliverable, responses, expected: identityStudents.length, received: responses.length, accepted, flagged, unchecked, needsCheck, missing };
  }), [identityStudents.length, orderedDeliverables, state.attempts]);

  const selectedSummary = deliverableSummaries.find((item) => item.deliverable.id === selectedDeliverableId) || deliverableSummaries[0];
  const selectedDeliverable = selectedSummary?.deliverable || null;

  const selectedResponses = useMemo(() => {
    if (!selectedDeliverable) return [];
    const needle = query.trim().toLowerCase();
    let rows = state.attempts.filter((response) => response.deliverableId === selectedDeliverable.id);

    if (filter === 'Accepted') rows = rows.filter((response) => response.reviewStatus === 'Accepted');
    if (filter === 'Needs Action') rows = rows.filter(needsReviewAction);
    if (filter === 'Unchecked') rows = rows.filter((response) => !isAiReportCurrent(response));
    if (filter === 'Flagged') rows = rows.filter(isFlaggedResponse);

    if (needle) {
      rows = rows.filter((response) => {
        const student = findStudent(state.students, response.studentNumber);
        return `${student?.name || response.studentName} ${student?.teamCode || response.teamCode} ${response.studentNumber}`.toLowerCase().includes(needle);
      });
    }

    return rows.sort((first, second) => new Date(second.updatedAt || second.submittedAt) - new Date(first.updatedAt || first.submittedAt));
  }, [filter, query, selectedDeliverable, state.attempts, state.students]);

  const batchQueue = selectedResponses.filter((response) => !isAiReportCurrent(response));

  function chooseDeliverable(id) {
    setSelectedDeliverableId(id);
    setExpandedResponseId('');
  }

  function toggleResponse(id) {
    setExpandedResponseId((current) => current === id ? '' : id);
  }

  function runBatchReview() {
    batchQueue.forEach((response) => triggerAiEvaluation(response.id));
  }

  function runOrView(response) {
    setExpandedResponseId(response.id);
    if (!isAiReportCurrent(response)) {
      triggerAiEvaluation(response.id);
    }
  }

  function rerunWithConfirmation(response) {
    setExpandedResponseId(response.id);
    if (!isAiReportCurrent(response) || window.confirm('This response already has a current AI Review. Run it again?')) {
      triggerAiEvaluation(response.id);
    }
  }

  return (
    <div className="page-stack review-page">
      <PageHeader
        title="Submission Review"
        description="Review by deliverable first, scan compact response rows, and expand only the records that need attention."
      />

      <section className="panel review-deliverable-panel">
        <div className="panel-header">
          <div>
            <h2>Deliverables</h2>
            <p>Each row shows how much work is waiting before Sir opens the submissions table.</p>
          </div>
        </div>
        <div className="review-deliverable-strip" role="list" aria-label="Deliverable review queue">
          {deliverableSummaries.map((item) => (
            <button
              className={`review-deliverable-chip ${item.deliverable.id === selectedSummary?.deliverable.id ? 'active' : ''}`}
              key={item.deliverable.id}
              type="button"
              onClick={() => chooseDeliverable(item.deliverable.id)}
            >
              <span>{item.deliverable.shortTitle}</span>
              <strong>{item.received}/{item.expected}</strong>
              <small>{item.missing} missing</small>
              <em>{item.needsCheck} needs review</em>
            </button>
          ))}
        </div>
      </section>

      <section className="panel review-main-panel">
        {selectedDeliverable ? (
          <>
            <div className="review-main-header">
              <div>
                <span>{selectedDeliverable.trackerColumn}</span>
                <h2>{selectedDeliverable.title}</h2>
                <p>{selectedSummary.received} received out of {selectedSummary.expected} expected. Due {formatDate(selectedDeliverable.dueAt)}.</p>
              </div>
              <div className="review-count-grid" aria-label="Selected deliverable counts">
                <Count label="Missing" value={selectedSummary.missing} />
                <Count label="Unchecked" value={selectedSummary.unchecked} />
                <Count label="Flagged" value={selectedSummary.flagged} />
                <Count label="Accepted" value={selectedSummary.accepted} />
              </div>
              <Button size="sm" variant="secondary" icon={Sparkle} disabled={!batchQueue.length} onClick={runBatchReview}>
                Run batch AI review
              </Button>
            </div>

            <div className="review-toolbar">
              <div className="review-filter-row" role="tablist" aria-label="Review filter">
                {reviewFilters.map((item) => (
                  <button key={item} type="button" className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>
                    {item}
                  </button>
                ))}
              </div>
              <SearchBox value={query} onChange={setQuery} placeholder="Search student or team" />
            </div>

            <DataTable columns={['Student', 'Team', 'Submitted', 'Review', 'Actions']} minWidth={900} className="review-wide-table">
              {selectedResponses.map((response) => (
                <ReviewTableRows
                  key={response.id}
                  response={response}
                  state={state}
                  expanded={expandedResponseId === response.id}
                  onToggle={() => toggleResponse(response.id)}
                  onAiReview={() => runOrView(response)}
                  onRerun={() => rerunWithConfirmation(response)}
                  onAccept={() => markAccepted(response.id)}
                  onArchive={() => archiveAttempt(response.id)}
                />
              ))}
            </DataTable>

            {!selectedResponses.length ? (
              <EmptyState
                title="No responses in this filter"
                description={filter === 'Needs Action' ? 'No current responses need review for this deliverable.' : 'Try another filter or select another deliverable.'}
              />
            ) : null}
          </>
        ) : (
          <EmptyState title="No deliverables published" description="Publish a form before reviewing student responses." />
        )}
      </section>
    </div>
  );
}

function ReviewTableRows({ response, state, expanded, onToggle, onAiReview, onRerun, onAccept, onArchive }) {
  const student = findStudent(state.students, response.studentNumber);
  const fileLink = firstSubmissionLink(response.values);
  const project = getProjectMetadata(state, student?.teamCode || response.teamCode);
  const primary = response.primaryStatus || response.reviewStatus || 'Received';
  const secondaryFlags = (response.flags || [])
    .filter((flag) => !['Received', primary, response.reviewStatus].includes(flag))
    .slice(0, 2);

  return (
    <>
      <tr className={expanded ? 'selected-row' : ''} onClick={onToggle}>
        <td><strong>{student?.name || response.studentName || response.studentNumber}</strong><small>{response.studentNumber}</small></td>
        <td>{student?.teamCode || response.teamCode}</td>
        <td><strong>{formatDateTime(response.updatedAt || response.submittedAt)}</strong></td>
        <td>
          <div className="review-status-summary">
          <div className="status-strip stable">
            <StatusBadge status={primary} />
            {secondaryFlags.map((flag) => <StatusBadge key={flag} status={flag} />)}
          </div>
          <p>{response.checkSummary || 'No AI Review has been run yet.'}</p>
          </div>
        </td>
        <td>
          <div className="row-action-group review-actions-compact">
            {fileLink ? (
              <a className="btn btn-secondary btn-sm" href={makeDriveViewUrl(fileLink)} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                <ArrowSquareOut weight="regular" /><span>Open file</span>
              </a>
            ) : null}
            <Button size="sm" variant="secondary" icon={Sparkle} onClick={(event) => { event.stopPropagation(); onAiReview(); }}>
              {isAiReportCurrent(response) ? 'View AI' : 'AI Review'}
            </Button>
            <Button size="sm" variant="secondary" icon={CheckCircle} onClick={(event) => { event.stopPropagation(); onAccept(); }}>Accept</Button>
            <Button size="sm" variant="primary" icon={Archive} disabled={response.reviewStatus !== 'Accepted' || response.archiveStatus === 'Archived'} onClick={(event) => { event.stopPropagation(); onArchive(); }}>Archive</Button>
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr className="review-expanded-row">
          <td colSpan={5}>
            <div className="review-expanded-content">
              <section>
                <span>AI Review</span>
                <p>{response.aiReport?.summary || response.checkSummary || 'Run AI Review to generate a short teacher-facing summary.'}</p>
                {response.aiReport?.redFlags?.length ? (
                  <div className="status-strip stable">
                    {response.aiReport.redFlags.map((flag) => <StatusBadge key={flag} status={flag} />)}
                  </div>
                ) : null}
                {response.aiReport?.missingSections?.length ? (
                  <small>Missing or weak: {response.aiReport.missingSections.join(', ')}</small>
                ) : null}
              </section>
              <section>
                <span>Project context</span>
                <p>{project?.projectTitle || 'Project metadata not loaded yet.'}</p>
                {project?.softwareName ? <small>{project.softwareName}</small> : null}
                {project?.proposalRemarks ? <small>{project.proposalRemarks}</small> : null}
              </section>
              <section>
                <span>Review actions</span>
                <p>{response.aiReport?.suggestedAction || 'Open the submitted link, then accept or archive when it is ready.'}</p>
                <div className="row-action-group">
                  {fileLink ? <a className="btn btn-secondary btn-sm" href={makeDriveViewUrl(fileLink)} target="_blank" rel="noreferrer"><ArrowSquareOut weight="regular" /><span>Open submitted file link</span></a> : null}
                  <Button size="sm" variant="secondary" icon={Sparkle} onClick={onRerun}>{isAiReportCurrent(response) ? 'Rerun AI Review' : 'AI Review'}</Button>
                </div>
              </section>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Count({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function isFlaggedResponse(response) {
  return (response.flags || []).some((flag) => ['Template-like', 'Too Short', 'Not PDF', 'Inaccessible'].includes(flag));
}

function needsReviewAction(response) {
  if (response.reviewStatus === 'Accepted') return false;
  if (!isAiReportCurrent(response)) return true;
  return response.reviewStatus === 'Needs Review' || isFlaggedResponse(response);
}
