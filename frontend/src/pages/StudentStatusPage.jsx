import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowSquareOut, Student, X } from '@phosphor-icons/react';
import { Button, EmptyState, Field, PublicHeader, SearchableSelect, StatusBadge } from '../components/ui.jsx';
import { useWorkflow } from '../app/WorkflowContext.jsx';
import { findStudent, firstSubmissionLink, formatDate, formatDateTime, getActiveTrackerColumns, getIdentityStudents, getProjectMetadata, getPublishedDeliverables, isUsableAdviserName, makeDriveViewUrl, normalizeStudentNumber } from '../lib/workflow.js';

export function StudentStatusPage() {
  const { state, setActiveStudentNumber } = useWorkflow();
  const [studentNumber, setStudentNumber] = useState(state.activeStudentNumber || state.students[0]?.studentNumber || '');
  const [activeFeedback, setActiveFeedback] = useState(null);
  const identityStudents = useMemo(() => getIdentityStudents(state.students), [state.students]);
  const studentNumberHelper = identityStudents.length
    ? `${identityStudents.length} Student Numbers loaded from Team Formation. Search by ID or name.`
    : 'Student Numbers appear after Sir imports the Team Formation sheet in Workspace.';
  const [filter, setFilter] = useState('All');
  const student = useMemo(() => findStudent(state.students, studentNumber), [state.students, studentNumber]);
  const project = useMemo(() => student ? getProjectMetadata(state, student.teamCode) : null, [state, student]);
  const adviserLabel = isUsableAdviserName(project?.adviserName)
    ? project.adviserName
    : isUsableAdviserName(student?.adviser)
      ? student.adviser
      : 'Unassigned';
  const responses = state.attempts.filter((response) => normalizeStudentNumber(response.studentNumber) === normalizeStudentNumber(studentNumber));
  const activeColumns = getActiveTrackerColumns(state);
  const visibleDeliverables = useMemo(() => {
    const published = getPublishedDeliverables(state);
    const responseDeliverableIds = new Set(responses.map((response) => response.deliverableId));
    const historical = state.deliverables.filter((deliverable) => responseDeliverableIds.has(deliverable.id) && !published.some((item) => item.id === deliverable.id));
    return [...published, ...historical];
  }, [responses, state]);
  const deliverableRows = useMemo(() => visibleDeliverables.map((deliverable) => {
    const response = responses.find((item) => item.deliverableId === deliverable.id);
    return buildStudentDeliverableRow(deliverable, response);
  }), [responses, visibleDeliverables]);
  const filteredDeliverables = useMemo(() => {
    if (filter === 'All') return deliverableRows;
    if (filter === 'Missing') return deliverableRows.filter((row) => row.primaryStatus === 'Missing');
    if (filter === 'Needs Review') return deliverableRows.filter((row) => row.primaryStatus === 'Needs Review');
    if (filter === 'Submitted') return deliverableRows.filter((row) => row.response);
    return deliverableRows;
  }, [deliverableRows, filter]);
  const summary = useMemo(() => ({
    missing: deliverableRows.filter((row) => row.primaryStatus === 'Missing').length,
    needsReview: deliverableRows.filter((row) => row.primaryStatus === 'Needs Review').length,
    submitted: deliverableRows.filter((row) => row.response).length,
    accepted: deliverableRows.filter((row) => row.primaryStatus === 'Accepted').length
  }), [deliverableRows]);
  const groupProgress = useMemo(() => {
    if (!student) return null;
    const teamMembers = state.students.filter((item) => item.teamCode === student.teamCode);
    const teamNumbers = new Set(teamMembers.map((item) => normalizeStudentNumber(item.studentNumber)));
    const submittedMembers = new Set(
      state.attempts
        .filter((response) => teamNumbers.has(normalizeStudentNumber(response.studentNumber)))
        .map((response) => normalizeStudentNumber(response.studentNumber))
    );
    return {
      teamSize: teamMembers.length,
      submittedMembers: submittedMembers.size,
      names: teamMembers
        .filter((member) => submittedMembers.has(normalizeStudentNumber(member.studentNumber)))
        .map((member) => member.name)
        .slice(0, 4)
    };
  }, [state.attempts, state.students, student]);

  useEffect(() => {
    if (studentNumber) setActiveStudentNumber(studentNumber);
  }, [setActiveStudentNumber, studentNumber]);

  useEffect(() => {
    if (!student && identityStudents[0]) setStudentNumber(identityStudents[0].studentNumber);
  }, [identityStudents, student]);

  return (
    <main className="public-page dashboard-page">
      <PublicHeader subtitle="Student dashboard" />
      <section className="student-dashboard">
        <div className="dashboard-hero">
          <div>
            <h1>Student Dashboard</h1>
            <p>Check your own submission status, file check results, and tracker values.</p>
          </div>
          <Link className="btn btn-secondary btn-md" to="/submit/week-9-srs"><span>Open sample form</span></Link>
        </div>

        <section className="panel">
          <div className="student-lookup-grid">
            <Field label="Student Number" helper={studentNumberHelper}>
              <SearchableSelect
                value={studentNumber}
                onChange={(value) => setStudentNumber(value)}
                options={identityStudents}
                placeholder="Search Student Number"
                getValue={(item) => item.studentNumber}
                getLabel={(item) => `${item.name} | ${item.teamCode}`}
              />
            </Field>
            {student ? (
              <div className="identity-card matched no-margin">
                <Student weight="regular" />
                <div>
                  <span>Matched student</span>
                  <strong>{student.name}</strong>
                  <small>{student.studentNumber} | {student.teamCode} | Member {student.memberNumber} | {adviserLabel}</small>
                </div>
              </div>
            ) : (
              <div className="identity-card warning no-margin">
                <Student weight="regular" />
                <div>
                  <span>No match</span>
                  <strong>Choose a class record entry</strong>
                  <small>The student dashboard only shows records from the connected Sheet.</small>
                </div>
              </div>
            )}
          </div>
        </section>

        {student ? (
          <>
            <section className="panel student-project-panel">
              <div className="student-project-main">
                <div>
                  <span>Your project</span>
                  <strong>{project?.projectTitle || 'Project metadata not loaded yet'}</strong>
                  <small>{project?.softwareName || student.teamCode} | {adviserLabel}</small>
                </div>
                {project?.category ? <StatusBadge status={project.category} /> : null}
              </div>
              {(project?.proposalRemarks || project?.demoComments) ? (
                <div className="student-project-notes">
                  {project?.proposalRemarks ? <p><strong>Proposal remarks</strong>{project.proposalRemarks}</p> : null}
                  {project?.demoComments ? <p><strong>Demo comments</strong>{project.demoComments}</p> : null}
                </div>
              ) : null}
            </section>

            <section className="panel student-status-panel">
              <div className="student-status-summary">
                <SummaryPill label="Missing" value={summary.missing} />
                <SummaryPill label="Needs review" value={summary.needsReview} />
                <SummaryPill label="Submitted" value={summary.submitted} />
                <SummaryPill label="Accepted" value={summary.accepted} />
              </div>
              {groupProgress ? (
                <div className="group-progress-strip">
                  <div>
                    <span>Group progress</span>
                    <strong>{groupProgress.submittedMembers}/{groupProgress.teamSize} members have current responses</strong>
                    <small>{groupProgress.names.length ? groupProgress.names.join(', ') : 'No teammates have current responses yet.'}</small>
                  </div>
                </div>
              ) : null}
              <div className="student-feedback-guide">Adviser feedback appears under each submitted deliverable once it is saved.</div>
              <div className="student-filter-row" role="tablist" aria-label="Filter deliverables">
                {['All', 'Missing', 'Needs Review', 'Submitted'].map((item) => (
                  <button key={item} type="button" className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>
                    {item}
                  </button>
                ))}
              </div>
              <div className="student-deliverable-list">
                {filteredDeliverables.map((row) => (
                  <article className="student-deliverable-row" key={row.deliverable.id}>
                    <div className="student-deliverable-main">
                      <span>{row.deliverable.shortTitle}</span>
                      <strong>{row.deliverable.title}</strong>
                      <small>Due {formatDate(row.deliverable.dueAt)} | {row.deliverable.trackerColumn}</small>
                    </div>
                    <div className="student-deliverable-status">
                      <StatusBadge status={row.primaryStatus} />
                      {row.flags.map((flag) => <StatusBadge key={flag} status={flag} />)}
                    </div>
                    <div className="student-deliverable-message">
                      <p className="student-deliverable-note">{row.summary}</p>
                      {row.feedback ? (
                        <div className="student-feedback-note">
                          <span>Adviser feedback</span>
                          <strong>{row.feedback.author}</strong>
                          <p>{row.feedback.note}</p>
                          <button type="button" onClick={() => setActiveFeedback({ ...row.feedback, deliverable: row.deliverable.title })}>
                            Read full feedback
                          </button>
                        </div>
                      ) : row.response ? <small className="student-feedback-empty">No adviser feedback yet.</small> : null}
                    </div>
                    <div className="student-deliverable-actions">
                      {row.link ? (
                        <a className="text-link inline-action" href={makeDriveViewUrl(row.link)} target="_blank" rel="noreferrer">
                          <ArrowSquareOut weight="regular" /> Open submitted file link
                        </a>
                      ) : (
                        <Link className="text-link" to={`/submit/${row.deliverable.slug}?student=${encodeURIComponent(studentNumber)}`}>Open form</Link>
                      )}
                      {row.response ? <Link className="text-link" to={`/submit/${row.deliverable.slug}?student=${encodeURIComponent(studentNumber)}`}>Edit response</Link> : null}
                    </div>
                  </article>
                ))}
                {!filteredDeliverables.length ? (
                  <EmptyState title="Nothing in this filter" description="Try another filter to see your current deliverables." />
                ) : null}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Tracker values</h2>
                  <p>These are your own class-record tracker values.</p>
                </div>
              </div>
              <div className="tracker-chip-grid">
                {activeColumns.map((column) => (
                  <div key={column.id}>
                    <span>{column.label}</span>
                    <strong>{student.milestones[column.key] === '' || student.milestones[column.key] === undefined ? 'Blank' : student.milestones[column.key]}</strong>
                  </div>
                ))}
              </div>
            </section>

            {activeFeedback ? (
              <div className="modal-backdrop" role="presentation">
                <section className="modal-panel feedback-modal" role="dialog" aria-modal="true" aria-label="Adviser feedback">
                  <button className="icon-close" type="button" onClick={() => setActiveFeedback(null)} aria-label="Close feedback">
                    <X weight="regular" />
                  </button>
                  <div className="panel-header">
                    <div>
                      <h2>Adviser feedback</h2>
                      <p>{activeFeedback.deliverable}</p>
                    </div>
                  </div>
                  <div className="feedback-full-text">
                    <span>{activeFeedback.author}</span>
                    <p>{activeFeedback.note}</p>
                  </div>
                  <div className="button-row">
                    <Button variant="secondary" onClick={() => setActiveFeedback(null)}>Close</Button>
                  </div>
                </section>
              </div>
            ) : null}
          </>
        ) : (
          <section className="panel">
            <EmptyState title="Choose a Student Number" description="Your dashboard appears after selecting a class record entry." />
          </section>
        )}
      </section>
    </main>
  );
}

function buildStudentDeliverableRow(deliverable, response) {
  if (!response) {
    return {
      deliverable,
      response: null,
      primaryStatus: 'Missing',
      flags: [],
      link: '',
      summary: 'No response has been recorded for this deliverable.',
      feedback: null
    };
  }

  const flags = (response.flags || [])
    .filter((flag) => !['Received', response.primaryStatus, response.reviewStatus].includes(flag))
    .slice(0, 2);
  const hasAttention = flags.some((flag) => ['Template-like', 'Too Short', 'Not PDF', 'Inaccessible'].includes(flag));
  const hasFeedback = Boolean(response.feedback?.length);
  const primaryStatus = response.primaryStatus === 'Accepted'
    ? 'Accepted'
    : hasFeedback
      ? 'Reviewed'
      : hasAttention
      ? 'Needs Review'
      : response.primaryStatus || response.reviewStatus || 'Received';

  return {
    deliverable,
    response,
    primaryStatus,
    flags,
    link: firstSubmissionLink(response.values),
    summary: response.checkSummary || `Last saved ${formatDateTime(response.updatedAt || response.submittedAt)}. File check notes will appear here when available.`,
    feedback: response.feedback?.[0] || null
  };
}

function SummaryPill({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
