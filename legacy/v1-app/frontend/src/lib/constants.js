export const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vS01I-ERT-9M0I5O0TDyFKFrhARge3kyRcjqKpB4xkUZczo-JS3PaeXTcT78JpW0uLlafzljGIBDJxX/pubhtml?gid=1971664293&single=true';

export const TRACKER_MILESTONES = [
  { key: 'probexploration', label: 'ProbExploration' },
  { key: 'convergence', label: 'Convergence' },
  { key: 'rrl', label: 'RRL' },
  { key: 'project_proposal', label: 'Project Proposal' },
  { key: 'srs', label: 'SRS' },
  { key: 'sdd', label: 'SDD' },
  { key: 'adviser_assessment', label: 'Adviser Assessment' },
  { key: 'sourcecode', label: 'SourceCode' },
  { key: 'demo', label: 'DEMO' },
  { key: 'peerevaluation', label: 'PeerEvaluation' }
];

export const SUBMISSION_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'NEEDS_REVISION',
  'APPROVED',
  'REJECTED',
  'FINAL'
];

export const ROLE_LABELS = {
  ADMIN: 'Admin',
  ADVISER: 'Adviser',
  STUDENT: 'Student'
};
