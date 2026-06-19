import { useEffect, useMemo, useState } from 'react';
import { ArrowSquareOut, ChatCenteredText, Sparkle } from '@phosphor-icons/react';
import { Button, DataTable, EmptyState, Field, PageHeader, SearchBox, StatusBadge } from '../components/ui.jsx';
import { useWorkflow } from '../app/WorkflowContext.jsx';
import {
  firstSubmissionLink,
  formatDate,
  formatDateTime,
  getProjectMetadata,
  getPublishedDeliverables,
  isAiReportCurrent,
  isUsableAdviserName,
  makeDriveViewUrl,
  normalizeStudentNumber,
  sortDeliverables
} from '../lib/workflow.js';

export function AdviserViewPage() {
  const { state, saveFeedback, triggerAiEvaluation } = useWorkflow();
  const adviserOptions = useMemo(() => buildAdviserOptions(state), [state]);
  const [adviserName, setAdviserName] = useState(adviserOptions[0] || 'Unassigned');
  const [selectedTeamCode, setSelectedTeamCode] = useState('');
  const [query, setQuery] = useState('');
  const [selectedDeliverableId, setSelectedDeliverableId] = useState('');
  const [feedback, setFeedback] = useState('');

  const teams = useMemo(() => buildAdviserTeams(state, adviserName, query), [adviserName, query, state]);
  const selectedTeam = teams.find((team) => team.teamCode === selectedTeamCode) || teams[0] || null;
  const deliverableRows = useMemo(() => selectedTeam ? buildTeamDeliverableRows(state, selectedTeam) : [], [selectedTeam, state]);
  const selectedRow = deliverableRows.find((row) => row.deliverable.id === selectedDeliverableId) || deliverableRows[0] || null;

  useEffect(() => {
    if (!selectedTeamCode && teams[0]) setSelectedTeamCode(teams[0].teamCode);
    if (selectedTeamCode && !teams.some((team) => team.teamCode === selectedTeamCode)) {
      setSelectedTeamCode(teams[0]?.teamCode || '');
    }
  }, [selectedTeamCode, teams]);

  useEffect(() => {
    setSelectedDeliverableId('');
    setFeedback('');
  }, [selectedTeamCode]);

  function submitFeedback(event) {
    event.preventDefault();
    if (!selectedRow?.latest || !feedback.trim()) return;
    saveFeedback(selectedRow.latest.id, { note: feedback, author: adviserName || 'Adviser', visibility: 'Student' });
    setFeedback('');
  }

  function runAiReview(row) {
    if (!row.latest) return;
    setSelectedDeliverableId(row.deliverable.id);
    if (!isAiReportCurrent(row.latest) || window.confirm('This response already has a current AI Review. Run it again?')) {
      triggerAiEvaluation(row.latest.id);
    }
  }

  return (
    <div className="page-stack adviser-page">
      <PageHeader
        title="Adviser View"
        description="Select an adviser, choose a team, then review one group output per deliverable."
        actions={<SearchBox value={query} onChange={setQuery} placeholder="Search team or project" />}
      />

      <section className="panel adviser-scope-panel">
        <div className="adviser-scope-grid">
          <Field label="Adviser">
            <select value={adviserName} onChange={(event) => { setAdviserName(event.target.value); setSelectedTeamCode(''); }}>
              {adviserOptions.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </Field>
          <ScopeMetric label="Teams" value={teams.length} />
          <ScopeMetric label="Students" value={teams.reduce((sum, team) => sum + team.members.length, 0)} />
          <ScopeMetric label="Responses" value={teams.reduce((sum, team) => sum + team.responseCount, 0)} />
        </div>
        {teams.length ? (
          <div className="adviser-team-strip" role="list" aria-label="Assigned teams">
            {teams.map((team) => (
              <button
                key={team.teamCode}
                type="button"
                className={`adviser-team-chip ${team.teamCode === selectedTeam?.teamCode ? 'active' : ''}`}
                onClick={() => setSelectedTeamCode(team.teamCode)}
              >
                <strong>{team.teamCode}</strong>
                <span>{team.project?.softwareName || team.project?.projectTitle || 'Project metadata not loaded'}</span>
                <small>{team.members.length} members | {team.responseCount} responses</small>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="No teams in this adviser scope" description="Import Software Project Monitor or choose another adviser." />
        )}
      </section>

      {selectedTeam ? (
        <section className="panel adviser-team-panel">
          <div className="adviser-team-header">
            <div>
              <span>Selected team</span>
              <h2>{selectedTeam.teamCode}</h2>
              <p>{selectedTeam.project?.projectTitle || 'Project metadata not loaded yet.'}</p>
              {selectedTeam.project?.demoComments ? <small>{selectedTeam.project.demoComments}</small> : null}
            </div>
            <div className="adviser-member-list">
              {selectedTeam.members.map((member) => <span key={member.studentNumber}>{member.name}</span>)}
            </div>
          </div>

          <DataTable columns={['Deliverable', 'Group response', 'Latest saved', 'Review', 'Actions']} minWidth={840} className="adviser-table">
            {deliverableRows.map((row) => {
              const fileLink = firstSubmissionLink(row.latest?.values);
              return (
                <tr
                  key={row.deliverable.id}
                  className={selectedRow?.deliverable.id === row.deliverable.id ? 'selected-row' : ''}
                  onClick={() => setSelectedDeliverableId(row.deliverable.id)}
                >
                  <td><strong>{row.deliverable.shortTitle}</strong><small>Due {formatDate(row.deliverable.dueAt)}</small></td>
                  <td><strong>{row.responses.length}/{selectedTeam.members.length} members</strong><small>{row.senderNames || 'No member has submitted yet.'}</small></td>
                  <td>{row.latest ? formatDateTime(row.latest.updatedAt || row.latest.submittedAt) : 'No response'}</td>
                  <td>
                    <div className="review-status-summary">
                      <div className="status-strip stable"><StatusBadge status={row.status} /></div>
                      <p>{row.summary}</p>
                    </div>
                  </td>
                  <td>
                    <div className="row-action-group adviser-actions-compact">
                      {fileLink ? (
                        <a className="btn btn-secondary btn-sm" href={makeDriveViewUrl(fileLink)} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                          <ArrowSquareOut weight="regular" /><span>Open file</span>
                        </a>
                      ) : null}
                      <Button size="sm" variant="secondary" icon={Sparkle} disabled={!row.latest} onClick={(event) => { event.stopPropagation(); runAiReview(row); }}>
                        {row.latest && isAiReportCurrent(row.latest) ? 'View AI' : 'AI Review'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </DataTable>

          <aside className="adviser-feedback-panel">
            {selectedRow ? (
              <SelectedFeedback row={selectedRow} feedback={feedback} setFeedback={setFeedback} onSubmit={submitFeedback} />
            ) : (
              <EmptyState title="Select a deliverable" description="Feedback and AI review details appear here." />
            )}
          </aside>
        </section>
      ) : null}
    </div>
  );
}

function SelectedFeedback({ row, feedback, setFeedback, onSubmit }) {
  const latest = row.latest;
  return (
    <>
      <div className="response-detail-head">
        <span>Selected deliverable</span>
        <h2>{row.deliverable.shortTitle}</h2>
        <p>{latest ? `${row.responses.length} response${row.responses.length === 1 ? '' : 's'} recorded for this group.` : 'No current group response yet.'}</p>
      </div>
      <div className="detail-section">
        <h3>AI Review</h3>
        <p>{latest?.aiReport?.summary || latest?.checkSummary || 'No AI Review has been run for the latest group response.'}</p>
      </div>
      <form className="detail-section adviser-feedback-form" onSubmit={onSubmit}>
        <Field label="Feedback for student">
          <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={4} placeholder="Write concise feedback students can act on." />
        </Field>
        <div className="adviser-feedback-actions">
          <Button size="sm" icon={ChatCenteredText} disabled={!latest}>Save feedback</Button>
        </div>
      </form>
      {latest?.feedback?.length ? (
        <div className="detail-section saved-feedback-list">
          <h3>Saved feedback</h3>
          {latest.feedback.slice(0, 4).map((item) => <p key={item.id}>{item.note}</p>)}
        </div>
      ) : null}
    </>
  );
}

function ScopeMetric({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildAdviserOptions(state) {
  const names = [
    ...(state.projectMetadata || []).map((project) => project.adviserName),
    ...state.students
      .map((student) => student.adviser)
      .filter((name) => name !== 'Sir Ralph Laviste')
  ].filter(isUsableAdviserName);
  return [...new Set(names)].sort().concat('Unassigned');
}

function buildAdviserTeams(state, adviserName, query) {
  const needle = query.trim().toLowerCase();
  const teamCodes = [...new Set(state.students.map((student) => student.teamCode).filter(Boolean))].sort();
  return teamCodes
    .map((teamCode) => {
      const members = state.students.filter((student) => student.teamCode === teamCode);
      const project = getProjectMetadata(state, teamCode);
      const memberAdviser = members.find((member) => member.adviser && member.adviser !== 'Unassigned' && member.adviser !== 'Sir Ralph Laviste')?.adviser;
      const assignedAdviser = isUsableAdviserName(project?.adviserName) ? project.adviserName : memberAdviser || 'Unassigned';
      const teamNumbers = new Set(members.map((member) => normalizeStudentNumber(member.studentNumber)));
      const responseCount = state.attempts.filter((response) => teamNumbers.has(normalizeStudentNumber(response.studentNumber)) || response.teamCode === teamCode).length;
      return { teamCode, members, project, assignedAdviser, responseCount };
    })
    .filter((team) => team.assignedAdviser === adviserName)
    .filter((team) => {
      if (!needle) return true;
      return `${team.teamCode} ${team.project?.projectTitle || ''} ${team.project?.softwareName || ''}`.toLowerCase().includes(needle);
    });
}


function buildTeamDeliverableRows(state, team) {
  const teamNumbers = new Set(team.members.map((member) => normalizeStudentNumber(member.studentNumber)));
  return sortDeliverables(state, getPublishedDeliverables(state)).map((deliverable) => {
    const responses = state.attempts
      .filter((response) => response.deliverableId === deliverable.id)
      .filter((response) => teamNumbers.has(normalizeStudentNumber(response.studentNumber)) || response.teamCode === team.teamCode)
      .sort((first, second) => new Date(second.updatedAt || second.submittedAt) - new Date(first.updatedAt || first.submittedAt));
    const latest = responses[0] || null;
    const status = deriveGroupStatus(responses, latest);
    const senderNames = responses
      .map((response) => team.members.find((member) => normalizeStudentNumber(member.studentNumber) === normalizeStudentNumber(response.studentNumber))?.name || response.studentName)
      .filter(Boolean)
      .slice(0, 4)
      .join(', ');
    return {
      deliverable,
      responses,
      latest,
      status,
      senderNames,
      summary: latest?.checkSummary || latest?.aiReport?.summary || (latest ? 'A group response exists. Open the submitted file link to review it.' : 'No group member has submitted this deliverable yet.')
    };
  });
}

function deriveGroupStatus(responses, latest) {
  if (!responses.length) return 'Missing';
  if (responses.some((response) => response.reviewStatus === 'Accepted')) return 'Accepted';
  if (responses.some((response) => response.reviewStatus === 'Needs Review' || (response.flags || []).some((flag) => ['Template-like', 'Too Short', 'Not PDF', 'Inaccessible'].includes(flag)))) return 'Needs Review';
  if (latest && !isAiReportCurrent(latest)) return 'Unchecked';
  return 'Received';
}
