import { initialState } from './seedData.js';

const STORAGE_KEY = 'capvault.v2.workflow';

export function loadWorkflowState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialState;
    const parsed = JSON.parse(stored);
    return {
      ...initialState,
      ...parsed,
      deliverables: (parsed.deliverables || initialState.deliverables).map((deliverable) => ({
        ...deliverable,
        status: deliverable.status || 'Published',
        shortTitle: deliverable.shortTitle || deliverable.trackerColumn || deliverable.title,
        instructions: normalizeDeliverableInstructions(deliverable),
        fields: (deliverable.fields || [])
          .filter((field) => field.id !== 'notes')
          .map((field) => field.pdfRequired ? { ...field, label: 'PDF Drive Link' } : field)
      })),
      attempts: (parsed.attempts || initialState.attempts).map((attempt) => ({
        ...attempt,
        flags: (attempt.flags || []).map((flag) => flag === 'AI Checked' ? 'Checked' : flag),
        primaryStatus: attempt.primaryStatus || attempt.reviewStatus || 'Received',
        checkSummary: attempt.checkSummary || attempt.aiSummary || '',
        history: attempt.history || []
      })),
      trackerColumns: parsed.trackerColumns || initialState.trackerColumns,
      projectMetadata: parsed.projectMetadata || initialState.projectMetadata || [],
      classRecord: {
        ...initialState.classRecord,
        ...(parsed.classRecord || {}),
        sources: {
          ...(initialState.classRecord.sources || {}),
          ...((parsed.classRecord || {}).sources || {})
        },
        importWarnings: (parsed.classRecord || {}).importWarnings || [],
        importSummary: (parsed.classRecord || {}).importSummary || null
      },
      templates: parsed.templates || initialState.templates,
      studentAccounts: parsed.studentAccounts || initialState.studentAccounts,
      activeStudentNumber: parsed.activeStudentNumber || ''
    };
  } catch {
    return initialState;
  }
}

function normalizeDeliverableInstructions(deliverable) {
  const text = String(deliverable.instructions || '');
  const hasOldPdfWarning = /editable google docs|frozen at the timestamp|editable document links/i.test(text);
  const hasPdfField = (deliverable.fields || []).some((field) => field.pdfRequired);
  if (hasPdfField && hasOldPdfWarning) {
    return `Submit your ${deliverable.shortTitle || deliverable.trackerColumn || 'document'} as a PDF Drive file.`;
  }
  return text;
}

export function saveWorkflowState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetWorkflowState() {
  localStorage.removeItem(STORAGE_KEY);
  return initialState;
}

export function findStudent(students, studentNumber) {
  const normalized = normalizeStudentNumber(studentNumber);
  return students.find((student) => normalizeStudentNumber(student.studentNumber) === normalized) || null;
}

export function normalizeStudentNumber(value) {
  return String(value || '').trim().replace(/\s+/g, '').toLowerCase();
}

function normalizeLoose(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function getIdentityStudents(students) {
  return students.filter((student) => String(student.studentNumber || '').trim());
}

export function getDeliverable(state, deliverableIdOrSlug) {
  return state.deliverables.find((item) => item.id === deliverableIdOrSlug || item.slug === deliverableIdOrSlug) || null;
}

export function getPublishedDeliverables(state) {
  return sortDeliverables(state, (state.deliverables || []).filter((item) => item.status !== 'Unpublished'));
}

export function sortDeliverables(state, deliverables = []) {
  const trackerOrder = new Map();
  (state.trackerColumns || initialState.trackerColumns || []).forEach((column, index) => {
    trackerOrder.set(String(column.key || '').toLowerCase(), index);
    trackerOrder.set(String(column.label || '').toLowerCase(), index);
    trackerOrder.set(String(column.sourceColumn || '').toLowerCase(), index);
  });

  return [...deliverables].sort((first, second) => {
    const firstTime = Date.parse(first.dueAt || '');
    const secondTime = Date.parse(second.dueAt || '');
    if (!Number.isNaN(firstTime) && !Number.isNaN(secondTime) && firstTime !== secondTime) {
      return firstTime - secondTime;
    }

    const firstOrder = trackerOrder.get(String(first.trackerColumn || first.shortTitle || '').toLowerCase()) ?? 9999;
    const secondOrder = trackerOrder.get(String(second.trackerColumn || second.shortTitle || '').toLowerCase()) ?? 9999;
    if (firstOrder !== secondOrder) return firstOrder - secondOrder;

    return String(first.shortTitle || first.title || '').localeCompare(String(second.shortTitle || second.title || ''));
  });
}

export function getProjectMetadata(state, teamCode) {
  const normalized = normalizeLoose(teamCode);
  return (state.projectMetadata || []).find((item) => normalizeLoose(item.groupCode) === normalized) || null;
}

export function isUsableAdviserName(value) {
  const text = String(value || '').trim();
  if (!text || text === 'Unassigned') return false;
  if (/^#?N\/A$/i.test(text)) return false;
  if (/^(none|null|pending)$/i.test(text)) return false;
  if (/^\d+$/i.test(text)) return false;
  return true;
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getStudentOptions(students, studentAccounts = []) {
  const claimed = new Set(studentAccounts.map((account) => normalizeStudentNumber(account.studentNumber)));
  return students.map((student) => ({
    ...student,
    claimed: claimed.has(normalizeStudentNumber(student.studentNumber))
  }));
}

export function getActiveTrackerColumns(state) {
  const columns = state.trackerColumns || initialState.trackerColumns;
  return columns.filter((column) => column.active !== false);
}

export function getTrackerColumn(state, key) {
  const columns = state.trackerColumns || initialState.trackerColumns;
  return columns.find((column) => column.key === key || column.label === key || column.sourceColumn === key) || null;
}

export function getResponseIdentity(response) {
  return `${normalizeStudentNumber(response.studentNumber)}::${response.deliverableId}`;
}

export function valuesChanged(previous, next) {
  return JSON.stringify(previous || {}) !== JSON.stringify(next || {});
}

export function findStudentByName(students, name) {
  const normalized = String(name || '').trim().toLowerCase();
  return students.find((student) => student.name.toLowerCase() === normalized) || null;
}

export function findStudentByTeam(students, teamCode) {
  const normalized = String(teamCode || '').trim().toLowerCase();
  return students.find((student) => student.teamCode.toLowerCase() === normalized) || null;
}

export function extractSheetId(value) {
  const match = String(value || '').match(/spreadsheets\/d\/(?:e\/)?([^/]+)/i);
  return match?.[1] || '';
}

export function buildPublishedSheetCsvUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  try {
    const url = new URL(text);
    const gid = url.searchParams.get('gid') || '0';

    if (url.pathname.includes('/pubhtml')) {
      url.pathname = url.pathname.replace('/pubhtml', '/pub');
      url.searchParams.set('gid', gid);
      url.searchParams.set('single', 'true');
      url.searchParams.set('output', 'csv');
      return url.toString();
    }

    if (url.pathname.includes('/pub')) {
      url.searchParams.set('output', 'csv');
      return url.toString();
    }

    const normalId = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/i)?.[1];
    if (normalId) {
      return `https://docs.google.com/spreadsheets/d/${normalId}/export?format=csv&gid=${encodeURIComponent(gid)}`;
    }
  } catch {
    return '';
  }

  return '';
}

export async function importPublicClassRecord(sheetUrl, existingStudents = []) {
  return importPublicSheetSource('tracker', { sheetUrl }, { students: existingStudents });
}

export async function importPublicSheetSource(sourceType, payload, current) {
  const sheetUrl = payload.sheetUrl;
  const csvUrl = buildPublishedSheetCsvUrl(sheetUrl);
  if (!csvUrl) {
    return {
      ok: false,
      sourceType,
      error: 'Use a valid Google Sheet link or published Sheet URL.'
    };
  }

  let response;
  try {
    response = await fetch(csvUrl, { cache: 'no-store' });
  } catch {
    return {
      ok: false,
      sourceType,
      csvUrl,
      error: 'Could not fetch the published Sheet. If the Sheet is private, use a published/public link for this demo import.'
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      sourceType,
      csvUrl,
      error: `Google Sheets returned ${response.status}. Check that the Sheet is published or public.`
    };
  }

  const csvText = await response.text();
  const parsed = parseCsv(csvText);
  const usableRows = parsed.filter((row) => row.some((cell) => String(cell || '').trim()));
  if (usableRows.length < 2) {
    return {
      ok: false,
      sourceType,
      csvUrl,
      error: 'The Sheet did not contain a header row and student rows.'
    };
  }

  if (sourceType === 'teamFormation') return normalizeTeamFormationRows(usableRows, current, csvUrl);
  if (sourceType === 'projectMonitor') return normalizeProjectMonitorRows(usableRows, current, csvUrl);
  return normalizeTrackerRows(usableRows, current, csvUrl);
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);
  return rows.map((items) => items.map((item) => String(item || '').trim()));
}

function normalizeTeamFormationRows(rows, current, csvUrl) {
  const headerInfo = findBestHeaderRow(rows, inferIdentityColumns, scoreTeamFormationHeader);
  const headers = headerInfo.headers;
  const identity = inferIdentityColumns(headers);
  const warnings = [];
  const existingByNumber = new Map((current.students || []).map((student) => [normalizeStudentNumber(student.studentNumber), student]));
  const existingByTeamMember = new Map((current.students || []).map((student) => [makeTeamMemberKey(student.teamCode, student.memberNumber), student]));

  if (identity.studentNumber < 0) {
    warnings.push('Team Formation needs a Student Number column before public forms and registration can use official IDs.');
  }

  let skippedRows = 0;
  const students = rows.slice(headerInfo.index + 1).map((row, rowIndex) => {
    const studentNumber = getCell(row, identity.studentNumber);
    const name = getStudentNameFromIdentity(row, identity);
    const teamCode = getCell(row, identity.teamCode);
    const memberNumber = getCell(row, identity.memberNumber);
    if (!studentNumber || !name || !teamCode) {
      skippedRows += 1;
      return null;
    }
    const existing = existingByNumber.get(normalizeStudentNumber(studentNumber)) || existingByTeamMember.get(makeTeamMemberKey(teamCode, memberNumber)) || {};
    return {
      ...existing,
      rowKey: existing.rowKey || `team-formation-${headerInfo.index + rowIndex + 2}`,
      studentNumber,
      name,
      teamCode,
      memberNumber: Number(memberNumber) || memberNumber || existing.memberNumber || '',
      section: getCell(row, identity.section) || existing.section || 'IT332',
      adviser: resolveAdviser(current, teamCode, getCell(row, identity.adviser), existing.adviser),
      email: getCell(row, identity.email) || existing.email || '',
      milestones: existing.milestones || {}
    };
  }).filter(Boolean);

  if (skippedRows) {
    warnings.push(`Skipped ${skippedRows} Team Formation row${skippedRows === 1 ? '' : 's'} without Student Number, name, or team code.`);
  }

  return {
    ok: true,
    sourceType: 'teamFormation',
    csvUrl,
    headers,
    identity,
    students,
    warnings,
    importSummary: {
      sourceType: 'Team Formation',
      studentsFound: students.length,
      officialIdsFound: students.filter((student) => student.studentNumber).length,
      columnsFound: headers.length,
      headerRow: headerInfo.index + 1,
      warnings
    }
  };
}

function normalizeTrackerRows(rows, current, csvUrl) {
  const headerInfo = findBestHeaderRow(rows, inferIdentityColumns, scoreTrackerHeader);
  const headers = headerInfo.headers;
  const identity = inferIdentityColumns(headers);
  const identityIndexes = new Set(Object.values(identity).filter((index) => index >= 0));
  const trackerColumns = headers
    .map((header, index) => ({ header, index }))
    .filter(({ header, index }) => header && !identityIndexes.has(index))
    .map(({ header }, index) => ({
      id: `col-import-${slugify(header) || index}`,
      key: header,
      label: header,
      sourceColumn: header,
      active: true,
      pdfRequired: isLikelyPdfDeliverable(header)
    }));

  const existingStudents = current.students || [];
  const existingByNameTeamMember = new Map(existingStudents.map((student) => [
    makeStudentMatchKey(student.name, student.teamCode, student.memberNumber),
    student
  ]));
  const existingByTeamMember = new Map(existingStudents.map((student) => [
    makeTeamMemberKey(student.teamCode, student.memberNumber),
    student
  ]));

  const warnings = [];
  if (identity.studentNumber < 0) {
    warnings.push('Tracker has no Student Number column. Official IDs are preserved from Team Formation only.');
  }

  let skippedRows = 0;
  const deadlineRows = [];
  const trackerRows = rows.slice(headerInfo.index + 1).map((row, rowIndex) => {
    const name = getStudentNameFromIdentity(row, identity);
    const teamCode = getCell(row, identity.teamCode);
    const memberNumber = getCell(row, identity.memberNumber);
    if (!name || !teamCode) {
      const suggestions = detectDeadlineSuggestions(row, headers, trackerColumns);
      if (suggestions.length) {
        deadlineRows.push({ rowNumber: headerInfo.index + rowIndex + 2, suggestions });
      }
      skippedRows += 1;
      return null;
    }
    const matchedExisting = existingByTeamMember.get(makeTeamMemberKey(teamCode, memberNumber)) || existingByNameTeamMember.get(makeStudentMatchKey(name, teamCode, memberNumber)) || null;
    const studentNumber = getCell(row, identity.studentNumber) || matchedExisting?.studentNumber || '';
    const milestones = Object.fromEntries(trackerColumns.map((column) => [
      column.key,
      getCell(row, headers.indexOf(column.sourceColumn))
    ]));

    return {
      ...matchedExisting,
      rowKey: matchedExisting?.rowKey || `tracker-${teamCode}-${memberNumber || rowIndex + 1}`,
      studentNumber,
      name: name || `Student ${rowIndex + 1}`,
      teamCode: teamCode || 'Unassigned',
      memberNumber: Number(memberNumber) || memberNumber || '',
      section: getCell(row, identity.section) || matchedExisting?.section || 'IT332',
      adviser: resolveAdviser(current, teamCode, getCell(row, identity.adviser), matchedExisting?.adviser),
      email: getCell(row, identity.email) || '',
      milestones
    };
  }).filter(Boolean);

  const trackerByNumber = new Map(trackerRows.filter((student) => student.studentNumber).map((student) => [normalizeStudentNumber(student.studentNumber), student]));
  const trackerByTeamMember = new Map(trackerRows.map((student) => [makeTeamMemberKey(student.teamCode, student.memberNumber), student]));
  const mergedExisting = existingStudents.length
    ? existingStudents.map((student) => {
      const tracker = trackerByNumber.get(normalizeStudentNumber(student.studentNumber)) || trackerByTeamMember.get(makeTeamMemberKey(student.teamCode, student.memberNumber));
      return tracker ? { ...student, ...tracker, studentNumber: student.studentNumber || tracker.studentNumber, email: student.email || tracker.email } : student;
    })
    : [];
  const mergedKeys = new Set(mergedExisting.map((student) => student.rowKey || makeTeamMemberKey(student.teamCode, student.memberNumber)));
  const unmatchedTrackerRows = trackerRows.filter((student) => !mergedKeys.has(student.rowKey || makeTeamMemberKey(student.teamCode, student.memberNumber)));
  const students = mergedExisting.length ? [...mergedExisting, ...unmatchedTrackerRows] : trackerRows;

  if (skippedRows) {
    warnings.push(`Skipped ${skippedRows} non-student row${skippedRows === 1 ? '' : 's'} without a name and team code.`);
  }
  if (deadlineRows.length) {
    warnings.push(`Detected ${deadlineRows.flatMap((row) => row.suggestions).length} deadline value${deadlineRows.flatMap((row) => row.suggestions).length === 1 ? '' : 's'} from skipped tracker rows.`);
  }

  const suggestedForms = deadlineRows.flatMap((row) => row.suggestions);
  return {
    ok: true,
    sourceType: 'tracker',
    csvUrl,
    headers,
    identity,
    trackerColumns,
    students,
    warnings,
    deadlineRows,
    suggestedForms,
    importSummary: {
      sourceType: 'Tracker',
      studentsFound: trackerRows.length,
      officialIdsFound: students.filter((student) => student.studentNumber).length,
      columnsFound: trackerColumns.length,
      headerRow: headerInfo.index + 1,
      deadlineRows: deadlineRows.length,
      suggestedForms,
      warnings
    }
  };
}

function normalizeProjectMonitorRows(rows, current, csvUrl) {
  const headerInfo = findBestHeaderRow(rows, inferProjectMonitorColumns, scoreProjectMonitorHeader);
  const headers = headerInfo.headers;
  const indexes = inferProjectMonitorColumns(headers);
  const warnings = [];
  let skippedRows = 0;
  const projectMetadata = rows.slice(headerInfo.index + 1).map((row) => {
    const groupCode = getCell(row, indexes.groupCode);
    if (!groupCode) {
      skippedRows += 1;
      return null;
    }
    const statusAdviser = getCell(row, indexes.statusAdviser);
    return {
      groupCode,
      projectTitle: getCell(row, indexes.projectTitle),
      softwareName: getCell(row, indexes.softwareName),
      description: getCell(row, indexes.description),
      proposalRemarks: getCell(row, indexes.proposalRemarks),
      demoComments: getCell(row, indexes.demoComments),
      adviserName: statusAdviser,
      status: statusAdviser,
      category: getCell(row, indexes.category)
    };
  }).filter(Boolean);

  if (skippedRows) warnings.push(`Skipped ${skippedRows} Software Project Monitor row${skippedRows === 1 ? '' : 's'} without a group code.`);

  return {
    ok: true,
    sourceType: 'projectMonitor',
    csvUrl,
    headers,
    projectMetadata,
    warnings,
    importSummary: {
      sourceType: 'Software Project Monitor',
      groupsFound: projectMetadata.length,
      columnsFound: headers.length,
      headerRow: headerInfo.index + 1,
      warnings
    }
  };
}

function inferIdentityColumns(headers) {
  const normalized = headers.map((header) => normalizeHeader(header));
  return {
    studentNumber: findHeader(normalized, ['studentno', 'studentnumber', 'studentid', 'schoolid', 'idnumber', 'studno']),
    studentName: findExactHeader(normalized, ['nameofstudent', 'studentname', 'name']),
    lastName: findHeader(normalized, ['lastname', 'surname', 'familyname']),
    firstName: findHeader(normalized, ['firstname', 'givenname']),
    teamCode: findHeader(normalized, ['teamformation', 'teamcode', 'team']),
    memberNumber: findHeader(normalized, ['member', 'memberno', 'membernumber']),
    section: findHeader(normalized, ['section', 'classsection']),
    adviser: findExactHeader(normalized, ['adviser', 'advisor', 'advisername', 'advisorname', 'facultyadviser', 'capstoneadviser', 'teacher', 'instructor']),
    email: findHeader(normalized, ['email', 'gmail', 'googleaccount', 'citeduaccount', 'institutionalemail', 'citaccount'])
  };
}

function findBestHeaderRow(rows, inferColumns, scoreHeader) {
  let best = { index: 0, headers: rows[0].map((header) => header.trim()), score: -1 };
  rows.slice(0, 20).forEach((row, index) => {
    const headers = row.map((header) => header.trim());
    const score = scoreHeader(inferColumns(headers), headers);
    if (score > best.score) {
      best = { index, headers, score };
    }
  });
  return best;
}

function scoreTeamFormationHeader(identity) {
  let score = 0;
  if (identity.studentNumber >= 0) score += 3;
  if (identity.teamCode >= 0) score += 3;
  if (identity.memberNumber >= 0) score += 2;
  if (identity.studentName >= 0) score += 2;
  if (identity.lastName >= 0) score += 1;
  if (identity.firstName >= 0) score += 1;
  if (identity.email >= 0) score += 1;
  return score;
}

function scoreTrackerHeader(identity, headers) {
  const identityScore = scoreTeamFormationHeader(identity);
  const trackerWords = ['prob', 'convergence', 'rrl', 'proposal', 'srs', 'sdd', 'source', 'demo', 'peer'];
  const trackerScore = headers
    .map((header) => normalizeHeader(header))
    .filter((header) => trackerWords.some((word) => header.includes(word)))
    .length;
  return identityScore + trackerScore;
}

function scoreProjectMonitorHeader(indexes) {
  let score = 0;
  if (indexes.groupCode >= 0) score += 3;
  if (indexes.projectTitle >= 0) score += 2;
  if (indexes.softwareName >= 0) score += 2;
  if (indexes.description >= 0) score += 1;
  if (indexes.proposalRemarks >= 0) score += 1;
  if (indexes.demoComments >= 0) score += 1;
  if (indexes.statusAdviser >= 0) score += 1;
  return score;
}

function getStudentNameFromIdentity(row, identity) {
  const fullName = getCell(row, identity.studentName);
  if (fullName) return fullName;

  const lastName = getCell(row, identity.lastName);
  const firstName = getCell(row, identity.firstName);
  if (lastName && firstName) return `${lastName}, ${firstName}`;
  return lastName || firstName || '';
}

function resolveAdviser(current, teamCode, explicitAdviser, existingAdviser) {
  if (isUsableAdviserName(explicitAdviser)) return explicitAdviser;
  const project = getProjectMetadata(current, teamCode);
  if (isUsableAdviserName(project?.adviserName)) return project.adviserName;
  if (isUsableAdviserName(existingAdviser) && existingAdviser !== 'Sir Ralph Laviste') return existingAdviser;
  return 'Unassigned';
}

function inferProjectMonitorColumns(headers) {
  const normalized = headers.map((header) => normalizeHeader(header));
  return {
    groupCode: findHeader(normalized, ['groupcode', 'teamcode', 'teamformation']),
    projectTitle: findHeader(normalized, ['projecttitle', 'title']),
    softwareName: findHeader(normalized, ['softwarename', 'software']),
    description: findHeader(normalized, ['description']),
    proposalRemarks: findHeader(normalized, ['proposalremarks', 'proposal']),
    demoComments: findHeader(normalized, ['democomments', 'demo']),
    statusAdviser: findHeader(normalized, ['statusadviser', 'adviser', 'advisor', 'status']),
    category: findHeader(normalized, ['category'])
  };
}

function normalizeHeader(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findHeader(headers, candidates) {
  return headers.findIndex((header) => candidates.some((candidate) => header === candidate || header.includes(candidate)));
}

function findExactHeader(headers, candidates) {
  return headers.findIndex((header) => candidates.includes(header));
}

function getCell(row, index) {
  if (index < 0 || index === undefined || index === null) return '';
  return String(row[index] || '').trim();
}

function isLikelyPdfDeliverable(header) {
  const key = normalizeHeader(header);
  return ['rrl', 'projectproposal', 'srs', 'sdd', 'adviserassessment'].includes(key);
}

function makeStudentMatchKey(name, teamCode, memberNumber) {
  return `${normalizeLoose(name)}::${normalizeLoose(teamCode)}::${String(memberNumber || '').trim()}`;
}

function makeTeamMemberKey(teamCode, memberNumber) {
  return `${normalizeLoose(teamCode)}::${String(memberNumber || '').trim()}`;
}

function detectDeadlineSuggestions(row, headers, trackerColumns) {
  return trackerColumns
    .map((column) => {
      const raw = getCell(row, headers.indexOf(column.sourceColumn));
      const dueAt = coerceDueAt(raw);
      if (!dueAt) return null;
      return {
        trackerColumn: column.key,
        shortTitle: column.label,
        title: `${column.label} Submission`,
        dueAt,
        pdfRequired: column.pdfRequired,
        sourceValue: raw
      };
    })
    .filter(Boolean);
}

function coerceDueAt(value) {
  const text = String(value || '').trim();
  if (!text || /^#N\/A$/i.test(text)) return '';
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T23:59`;
}

export function applyClassRecordImport(current, payload, imported) {
  const sourceType = imported.sourceType || payload.sourceType || 'tracker';
  const sourceName = sourceType === 'teamFormation'
    ? 'Team Formation'
    : sourceType === 'projectMonitor'
      ? 'Software Project Monitor'
      : payload.trackerSheet || 'Tracker';
  const nextSources = {
    ...(current.classRecord.sources || {}),
    [sourceType]: {
      name: sourceName,
      sheetUrl: payload.sheetUrl,
      status: imported.ok ? 'Imported' : 'Needs Attention',
      connectedAt: new Date().toISOString(),
      csvUrl: imported.csvUrl || ''
    }
  };

  return {
    ...current,
    classRecord: {
      ...current.classRecord,
      name: payload.name || current.classRecord.name,
      sheetUrl: sourceType === 'tracker' ? payload.sheetUrl : current.classRecord.sheetUrl,
      sheetId: extractSheetId(payload.sheetUrl),
      trackerSheet: payload.trackerSheet || current.classRecord.trackerSheet,
      connectedAt: new Date().toISOString(),
      status: imported.ok ? 'Imported' : 'Needs Attention',
      importedColumns: imported.headers || current.classRecord.importedColumns || [],
      importWarnings: imported.warnings || [],
      importSummary: imported.importSummary || null,
      importError: imported.ok ? '' : imported.error,
      csvUrl: sourceType === 'tracker' ? imported.csvUrl || '' : current.classRecord.csvUrl,
      sourceType: imported.ok ? 'Published Sheet CSV' : current.classRecord.sourceType,
      sources: nextSources
    },
    students: imported.ok && imported.students ? imported.students : current.students,
    trackerColumns: imported.ok && imported.trackerColumns ? imported.trackerColumns : current.trackerColumns,
    projectMetadata: imported.ok && imported.projectMetadata ? imported.projectMetadata : current.projectMetadata,
    activity: [{
      id: `act-${Date.now()}`,
      at: new Date().toISOString(),
      text: imported.ok
        ? `Imported ${sourceName}.`
        : `Class record import needs attention: ${imported.error}`
    }, ...current.activity]
  };
}

export function validateSubmission({ deliverable, values }) {
  const errors = {};
  const flags = ['Received'];

  for (const field of deliverable.fields) {
    const value = String(values[field.id] || '').trim();
    if (field.required && !value) {
      errors[field.id] = `${field.label} is required.`;
      continue;
    }
    if (!value || field.type === 'textarea') continue;

    const linkError = validateUrl(value);
    if (linkError) {
      errors[field.id] = linkError;
      continue;
    }

    if (field.pdfRequired) {
      const pdfResult = inspectDriveLink(value);
      if (!pdfResult.ok) {
        errors[field.id] = pdfResult.message;
      } else if (!flags.includes('PDF OK')) {
        flags.push('PDF OK');
      }
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    flags
  };
}

export function validateUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return 'Use a valid http or https link.';
    return '';
  } catch {
    return 'Use a complete link, including https://.';
  }
}

export function inspectDriveLink(value) {
  const lower = value.toLowerCase();
  if (lower.includes('docs.google.com/document') || lower.includes('docs.google.com/presentation') || lower.includes('docs.google.com/spreadsheets')) {
    return {
      ok: false,
      kind: 'Editable Link',
      message: 'This deliverable requires a PDF Drive link. Editable Google Docs, Slides, or Sheets links cannot be submitted.'
    };
  }
  if (lower.endsWith('.pdf') || lower.includes('.pdf?') || lower.includes('drive.google.com/file/d/')) {
    return { ok: true, kind: 'PDF' };
  }
  return {
    ok: false,
    kind: 'Unverifiable',
    message: 'Use a Google Drive file link to the PDF.'
  };
}

export function deriveAttemptFlags(values, baseFlags) {
  const flags = [...baseFlags];
  const combined = Object.values(values).join(' ').toLowerCase();
  if (combined.includes('template') && !flags.includes('Template-like')) flags.push('Template-like');
  if (combined.includes('blank') && !flags.includes('Too Short')) flags.push('Too Short');
  return flags;
}

export function isAiReportCurrent(response) {
  if (!response?.aiReport?.generatedAt) return false;
  const sourceTimestamp = response.updatedAt || response.submittedAt;
  return response.aiReport.sourceResponseUpdatedAt === sourceTimestamp;
}

export function calculateDaysLate(dueAt, submittedAt) {
  const due = new Date(dueAt);
  const submitted = new Date(submittedAt);
  if (submitted <= due) return 0;
  const diff = submitted.getTime() - due.getTime();
  return Math.max(1, Math.ceil(diff / 86_400_000));
}

export async function hashArchiveRecord(input) {
  const payload = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', payload);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

export function formatTime(value) {
  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

export function statusTone(status) {
  const key = String(status).toLowerCase();
  if (['pdf ok', 'accepted', 'archived', 'verified', 'on time', 'active', 'ready', 'connected', 'imported', 'published'].includes(key)) return 'success';
  if (['needs review', 'template-like', 'too short', 'missing', 'blank', '#n/a', 'needs check', 'unchecked', 'starter data'].includes(key)) return 'warning';
  if (['not pdf', 'editable link', 'inaccessible', 'blocked', 'needs attention', 'not connected'].includes(key)) return 'danger';
  if (['checked', 'checking', 'received', 'reviewed', 'pdf required', 'link fields', 'late', 'unpublished'].includes(key)) return 'info';
  return 'neutral';
}

export function makeDriveViewUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^https?:\/\//i.test(text)) return text;
  return `https://${text}`;
}

export function firstSubmissionLink(values) {
  return Object.values(values || {}).find((value) => /^https?:\/\//i.test(String(value || '').trim())) || '';
}
