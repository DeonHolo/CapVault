export const trackerColumns = [
  'ProbExploration',
  'Convergence',
  'RRL',
  'Project Proposal',
  'SRS',
  'SDD',
  'Adviser Assessment',
  'SourceCode',
  'DEMO'
];

export const seedStudents = [
  {
    studentNumber: '20-0649-750',
    name: 'TAGHOY, RON LUIGI F.',
    teamCode: '2526-sem2-it332-41',
    memberNumber: 1,
    section: 'IT332',
    adviser: 'Sir Ralph Laviste',
    milestones: {
      ProbExploration: 0,
      Convergence: 0,
      RRL: 9,
      'Project Proposal': 12,
      SRS: '',
      SDD: '',
      'Adviser Assessment': '#N/A',
      SourceCode: '',
      DEMO: ''
    }
  },
  {
    studentNumber: '23-2250-144',
    name: 'BARANGAN, MARK LORENZ L.',
    teamCode: '2526-sem2-it332-07',
    memberNumber: 5,
    section: 'IT332',
    adviser: 'Sir Ralph Laviste',
    milestones: {
      ProbExploration: 0,
      Convergence: 1,
      RRL: 79,
      'Project Proposal': 72,
      SRS: 51,
      SDD: 51,
      'Adviser Assessment': '#N/A',
      SourceCode: '#N/A',
      DEMO: ''
    }
  },
  {
    studentNumber: '21-0845-312',
    name: 'PACIO, MURIEL D.',
    teamCode: '2526-sem2-it332-01',
    memberNumber: 1,
    section: 'IT332',
    adviser: 'Sir Ralph Laviste',
    milestones: {
      ProbExploration: 0,
      Convergence: 0,
      RRL: 0,
      'Project Proposal': 1,
      SRS: 21,
      SDD: 21,
      'Adviser Assessment': 0,
      SourceCode: 0,
      DEMO: '5/28/2026'
    }
  },
  {
    studentNumber: '22-1021-641',
    name: 'LIM, MICHELU TIA A.',
    teamCode: '2526-sem2-it332-01',
    memberNumber: 2,
    section: 'IT332',
    adviser: 'Sir Ralph Laviste',
    milestones: {
      ProbExploration: 1,
      Convergence: 10,
      RRL: 0,
      'Project Proposal': 1,
      SRS: 21,
      SDD: 21,
      'Adviser Assessment': 0,
      SourceCode: 0,
      DEMO: '5/28/2026'
    }
  },
  {
    studentNumber: '21-3320-018',
    name: 'NARANJO, ANA CLAIRE ELLEN R.',
    teamCode: '2526-sem2-it332-02',
    memberNumber: 5,
    section: 'IT332',
    adviser: 'Engr. Mary Claire Esdrelon',
    milestones: {
      ProbExploration: 4,
      Convergence: 0,
      RRL: 0,
      'Project Proposal': 68,
      SRS: 58,
      SDD: 51,
      'Adviser Assessment': 0,
      SourceCode: '#N/A',
      DEMO: ''
    }
  },
  {
    studentNumber: '20-1188-702',
    name: 'RAMOS, JEREMIAH T.',
    teamCode: '2526-sem2-it332-04',
    memberNumber: 1,
    section: 'IT332',
    adviser: 'Sir Ralph Laviste',
    milestones: {
      ProbExploration: 0,
      Convergence: 0,
      RRL: 53,
      'Project Proposal': 46,
      SRS: 51,
      SDD: 48,
      'Adviser Assessment': 0,
      SourceCode: 0,
      DEMO: '5/26/2026'
    }
  }
];

export const seedDeliverables = [
  {
    id: 'deliv-srs',
    slug: 'week-9-srs',
    title: 'Week 9: Software Requirements Specification',
    shortTitle: 'SRS',
    dueAt: '2026-04-18T23:59:00+08:00',
    trackerColumn: 'SRS',
    audience: 'IT332 students',
    status: 'Published',
    instructions: 'Submit the final PDF version of your SRS. Editable Google Docs links are not accepted.',
    fields: [
      { id: 'documentPdf', label: 'SRS PDF Drive Link', type: 'drive', required: true, pdfRequired: true },
      { id: 'notes', label: 'Submission note', type: 'textarea', required: false, pdfRequired: false }
    ]
  },
  {
    id: 'deliv-sdd',
    slug: 'week-10-sdd',
    title: 'Week 10: Software Design Description',
    shortTitle: 'SDD',
    dueAt: '2026-04-25T23:59:00+08:00',
    trackerColumn: 'SDD',
    audience: 'IT332 students',
    status: 'Published',
    instructions: 'Submit the final PDF version of your SDD. The submission must be frozen at the timestamp.',
    fields: [
      { id: 'documentPdf', label: 'SDD PDF Drive Link', type: 'drive', required: true, pdfRequired: true },
      { id: 'notes', label: 'Submission note', type: 'textarea', required: false, pdfRequired: false }
    ]
  },
  {
    id: 'deliv-docs',
    slug: 'software-project-documentation',
    title: 'Week 14: Software Project Documentation',
    shortTitle: 'Documentation',
    dueAt: '2026-05-30T23:59:00+08:00',
    trackerColumn: 'SourceCode',
    audience: 'IT332 students',
    status: 'Published',
    instructions: 'Submit repository links and your presentation link. Repository metadata checks are advisory.',
    fields: [
      { id: 'frontendRepo', label: 'Frontend repository link', type: 'url', required: true, pdfRequired: false },
      { id: 'backendRepo', label: 'Backend repository link', type: 'url', required: true, pdfRequired: false },
      { id: 'presentation', label: 'PPT or presentation Drive link', type: 'url', required: true, pdfRequired: false },
      { id: 'notes', label: 'Submission note', type: 'textarea', required: false, pdfRequired: false }
    ]
  }
];

export const seedAttempts = [
  {
    id: 'att-001',
    deliverableId: 'deliv-srs',
    studentNumber: '23-2250-144',
    matched: true,
    submittedAt: '2026-04-19T11:04:00+08:00',
    values: {
      documentPdf: 'https://drive.google.com/file/d/sample-srs-pdf/view',
      notes: 'Resubmitted with diagrams.'
    },
    flags: ['Received', 'PDF OK', 'Needs Review'],
    aiSummary: 'SRS has core sections but requirements traceability needs checking.',
    reviewStatus: 'Needs Review',
    archiveStatus: 'Not Archived'
  },
  {
    id: 'att-002',
    deliverableId: 'deliv-sdd',
    studentNumber: '20-0649-750',
    matched: true,
    submittedAt: '2026-04-25T22:14:00+08:00',
    values: {
      documentPdf: 'https://drive.google.com/file/d/template-like-sdd-pdf/view',
      notes: 'Final SDD PDF.'
    },
    flags: ['Received', 'PDF OK', 'Template-like'],
    aiSummary: 'Document is accessible, but several template sections appear unchanged.',
    reviewStatus: 'Needs Review',
    archiveStatus: 'Not Archived'
  }
];

export const initialState = {
  classRecord: {
    name: 'ClassRec SEM2 2025-26 : IT332 Tracker',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/class-record',
    connectedAt: '2026-06-18T00:00:00+08:00',
    trackerSheet: 'IT332 Tracker'
  },
  students: seedStudents,
  deliverables: seedDeliverables,
  attempts: seedAttempts,
  archives: [],
  activity: [
    { id: 'act-001', at: '2026-06-18T00:10:00+08:00', text: 'Connected IT332 class record sheet.' },
    { id: 'act-002', at: '2026-06-18T00:15:00+08:00', text: 'Published SRS and SDD submission forms.' }
  ]
};

