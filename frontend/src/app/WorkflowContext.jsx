import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateDaysLate,
  applyClassRecordImport,
  deriveAttemptFlags,
  findStudent,
  firstSubmissionLink,
  getDeliverable,
  getResponseIdentity,
  getTrackerColumn,
  hashArchiveRecord,
  importPublicClassRecord,
  importPublicSheetSource,
  loadWorkflowState,
  makeDriveViewUrl,
  normalizeStudentNumber,
  resetWorkflowState,
  saveWorkflowState,
  slugify,
  sortDeliverables,
  validateSubmission,
  valuesChanged
} from '../lib/workflow.js';
import {
  getApiBaseUrl,
  getBackendSnapshot,
  importSheetSource as importBackendSheetSource
} from '../lib/api.js';

const WorkflowContext = createContext(null);

export function WorkflowProvider({ children }) {
  const [state, setState] = useState(() => loadWorkflowState());
  const backendBootstrapped = useRef(false);

  const refreshBackendData = useCallback(async ({ silent = false } = {}) => {
    try {
      const snapshot = await getBackendSnapshot();
      setState((current) => applyBackendSnapshot(current, snapshot, {
        status: 'Backend data loaded.',
        enabled: true
      }));
      return { ok: true, snapshot };
    } catch (error) {
      if (!silent) {
        setState((current) => ({
          ...current,
          backendSync: {
            enabled: false,
            apiBaseUrl: getApiBaseUrl(),
            status: 'Backend unavailable',
            lastError: error.message,
            lastLoadedAt: new Date().toISOString()
          }
        }));
      }
      return { ok: false, error: error.message };
    }
  }, []);

  useEffect(() => {
    if (backendBootstrapped.current) return;
    backendBootstrapped.current = true;
    if (state.backendSync?.enabled) {
      refreshBackendData({ silent: true });
    }
  }, [refreshBackendData, state.backendSync?.enabled]);

  useEffect(() => {
    saveWorkflowState(state);
  }, [state]);

  const publishDeliverable = useCallback((payload) => {
    setState((current) => {
      const existingByColumn = current.deliverables.find((item) => item.trackerColumn === payload.trackerColumn);
      const id = payload.id || existingByColumn?.id || `deliv-${Date.now()}`;
      const trackerColumn = getTrackerColumn(current, payload.trackerColumn);
      const shortTitle = payload.shortTitle || trackerColumn?.label || payload.trackerColumn;
      const title = payload.title || `${shortTitle} Submission`;
      const slug = payload.slug || slugify(title);
      const deliverable = {
        ...(existingByColumn || {}),
        id,
        slug,
        title,
        shortTitle,
        status: payload.status || 'Published',
        fields: payload.fields,
        ...payload
      };
      const existing = current.deliverables.some((item) => item.id === id);
      const nextDeliverables = existing
        ? current.deliverables.map((item) => item.id === id ? deliverable : item)
        : [...current.deliverables.filter((item) => item.trackerColumn !== payload.trackerColumn), deliverable];
      return {
        ...current,
        deliverables: sortDeliverables(current, nextDeliverables),
        activity: [{ id: `act-${Date.now()}`, at: new Date().toISOString(), text: `${existing ? 'Updated' : 'Published'} ${deliverable.title}.` }, ...current.activity]
      };
    });
  }, []);

  const removeDeliverable = useCallback((deliverableId) => {
    setState((current) => {
      const deliverable = current.deliverables.find((item) => item.id === deliverableId);
      return {
        ...current,
        deliverables: current.deliverables.map((item) => item.id === deliverableId ? { ...item, status: 'Unpublished' } : item),
        activity: [{ id: `act-${Date.now()}`, at: new Date().toISOString(), text: `Unpublished ${deliverable?.title || 'a form'}. Responses were preserved.` }, ...current.activity]
      };
    });
  }, []);

  const connectSheetSource = useCallback(async (sourceType, payload) => {
    try {
      const backendImport = await importBackendSheetSource(sourceType, {
        ...payload,
        displayName: sourceType === 'tracker' ? payload.trackerSheet : payload.name
      });
      const snapshot = await getBackendSnapshot();
      const imported = buildBackendImportResult(sourceType, backendImport, snapshot);
      setState((current) => {
        const next = applyClassRecordImport(current, { ...payload, sourceType }, imported);
        return applyBackendSnapshot(next, snapshot, {
          enabled: true,
          status: `${imported.importSummary?.sourceType || 'Sheet'} imported through backend.`
        });
      });
      return imported;
    } catch (backendError) {
      const imported = await importPublicSheetSource(sourceType, payload, state);
      const fallbackImport = {
        ...imported,
        backendError: backendError.message
      };
      setState((current) => {
        const next = applyClassRecordImport(current, { ...payload, sourceType }, fallbackImport);
        return {
          ...next,
          backendSync: {
            enabled: false,
            apiBaseUrl: getApiBaseUrl(),
            status: imported.ok ? 'Local Sheet import used.' : 'Import failed.',
            lastError: backendError.message,
            lastLoadedAt: new Date().toISOString()
          }
        };
      });
      return fallbackImport;
    }
  }, [state]);

  const connectClassRecord = useCallback(async (payload) => {
    return connectSheetSource('tracker', payload);
  }, [connectSheetSource]);

  const generateFormsFromSuggestions = useCallback((suggestions = []) => {
    if (!suggestions.length) return;
    setState((current) => {
      const now = Date.now();
      const nextDeliverables = [...current.deliverables];
      const created = [];
      const sortedSuggestions = [...suggestions].sort((first, second) => {
        const firstTime = Date.parse(first.dueAt || '');
        const secondTime = Date.parse(second.dueAt || '');
        if (!Number.isNaN(firstTime) && !Number.isNaN(secondTime) && firstTime !== secondTime) return firstTime - secondTime;
        const firstColumn = getTrackerColumn(current, first.trackerColumn);
        const secondColumn = getTrackerColumn(current, second.trackerColumn);
        const columns = current.trackerColumns || [];
        const firstIndex = columns.findIndex((column) => column.id === firstColumn?.id);
        const secondIndex = columns.findIndex((column) => column.id === secondColumn?.id);
        return (firstIndex < 0 ? 9999 : firstIndex) - (secondIndex < 0 ? 9999 : secondIndex);
      });
      sortedSuggestions.forEach((suggestion, index) => {
        const trackerColumn = getTrackerColumn(current, suggestion.trackerColumn);
        const shortTitle = trackerColumn?.label || suggestion.shortTitle || suggestion.trackerColumn;
        const existingIndex = nextDeliverables.findIndex((item) => item.trackerColumn === suggestion.trackerColumn);
        const existing = existingIndex >= 0 ? nextDeliverables[existingIndex] : null;
        const deliverable = {
          ...(existing || {}),
          id: existing?.id || `deliv-generated-${now}-${index}`,
          slug: existing?.slug || slugify(suggestion.title || `${shortTitle} Submission`),
          title: suggestion.title || `${shortTitle} Submission`,
          shortTitle,
          dueAt: `${suggestion.dueAt}:00+08:00`,
          trackerColumn: suggestion.trackerColumn,
          audience: 'Students',
          status: 'Published',
          instructions: suggestion.pdfRequired ? `Submit your ${shortTitle} as a PDF Drive file.` : `Submit the required link for ${shortTitle}.`,
          fields: suggestion.pdfRequired
            ? [{ id: 'documentPdf', label: 'PDF Drive Link', type: 'drive', required: true, pdfRequired: true }]
            : [{ id: 'primaryLink', label: 'Submission Link', type: 'url', required: true, pdfRequired: false }]
        };
        if (existingIndex >= 0) nextDeliverables[existingIndex] = deliverable;
        else nextDeliverables.push(deliverable);
        created.push(shortTitle);
      });
      return {
        ...current,
        deliverables: sortDeliverables(current, nextDeliverables),
        activity: [{ id: `act-${Date.now()}`, at: new Date().toISOString(), text: `Generated forms for ${created.join(', ')} from detected deadlines.` }, ...current.activity]
      };
    });
  }, []);

  const registerStudentAccount = useCallback((payload) => {
    const existing = state.studentAccounts.find((account) => normalizeStudentNumber(account.studentNumber) === normalizeStudentNumber(payload.studentNumber) && account.email !== payload.email);
    if (existing) return { ok: false, error: 'This Student Number is already connected to another account.' };
    const student = findStudent(state.students, payload.studentNumber);
    if (!student) return { ok: false, error: 'Choose a Student Number from the connected class record.' };

    setState((current) => {
      const account = {
        id: payload.id || `acct-${Date.now()}`,
        email: payload.email,
        authMethod: payload.authMethod || 'Email',
        studentNumber: payload.studentNumber,
        studentName: student?.name || '',
        teamCode: student?.teamCode || '',
        createdAt: new Date().toISOString()
      };
      return {
        ...current,
        studentAccounts: [
          account,
          ...current.studentAccounts.filter((item) => item.email !== payload.email)
        ],
        activeStudentNumber: account.studentNumber,
        activity: [{ id: `act-${Date.now()}`, at: account.createdAt, text: `${account.studentName || account.email} registered a student account.` }, ...current.activity]
      };
    });

    return { ok: true };
  }, [state.studentAccounts]);

  const loginStudentAccount = useCallback((payload) => {
    const account = state.studentAccounts.find((item) => item.email.toLowerCase() === String(payload.email || '').toLowerCase());
    if (!account) return { ok: false, error: 'No student account found for that email.' };
    setState((current) => ({ ...current, activeStudentNumber: account.studentNumber }));
    return { ok: true, account };
  }, [state.studentAccounts]);

  const setActiveStudentNumber = useCallback((studentNumber) => {
    setState((current) => ({ ...current, activeStudentNumber: studentNumber }));
  }, []);

  const submitPublicForm = useCallback((slug, payload) => {
    const deliverable = getDeliverable(state, slug);
    if (!deliverable) return { ok: false, formError: 'This submission form was not found.' };
    if (deliverable.status === 'Unpublished') return { ok: false, formError: 'This submission form is not currently accepting responses.' };
    const validation = validateSubmission({ deliverable, values: payload.values });
    if (!validation.ok) return { ok: false, fieldErrors: validation.errors };

    const student = findStudent(state.students, payload.studentNumber);
    if (!student) return { ok: false, formError: 'Choose a Student Number from the class record list.' };
    const submittedAt = new Date().toISOString();
    const flags = deriveAttemptFlags(payload.values, validation.flags);
    const existing = state.attempts.find((oldAttempt) => normalizeStudentNumber(oldAttempt.studentNumber) === normalizeStudentNumber(student.studentNumber) && oldAttempt.deliverableId === deliverable.id);
    const identityChanged = existing && (
      existing.studentName !== (payload.studentName || student.name) ||
      existing.teamCode !== (payload.teamCode || student.teamCode)
    );
    const changed = !existing || identityChanged || valuesChanged(existing.values, payload.values);

    if (existing && !changed) {
      return { ok: true, unchanged: true, attempt: existing, student, deliverable };
    }

    const attempt = {
      id: existing?.id || `resp-${Date.now()}`,
      deliverableId: deliverable.id,
      studentNumber: payload.studentNumber,
      studentName: payload.studentName || student?.name || '',
      teamCode: payload.teamCode || student?.teamCode || '',
      matched: Boolean(student),
      submittedAt,
      updatedAt: submittedAt,
      values: payload.values,
      flags,
      checkSummary: '',
      primaryStatus: flags.includes('Template-like') ? 'Needs Review' : 'Received',
      reviewStatus: flags.includes('Template-like') ? 'Needs Review' : 'Received',
      archiveStatus: existing?.archiveStatus || 'Not Archived',
      feedback: existing?.feedback || [],
      aiReport: existing?.aiReport || null,
      history: existing ? [
        {
          id: `hist-${Date.now()}`,
          changedAt: submittedAt,
          previousValues: existing.values,
          previousStudentName: existing.studentName,
          previousTeamCode: existing.teamCode
        },
        ...(existing.history || [])
      ] : []
    };

    setState((current) => {
      const nextStudents = current.students.map((item) => {
        if (item.studentNumber !== student.studentNumber) return item;
        return {
          ...item,
          milestones: {
            ...item.milestones,
            [deliverable.trackerColumn]: calculateDaysLate(deliverable.dueAt, submittedAt)
          }
        };
      });
      const withoutExisting = current.attempts.filter((oldAttempt) => getResponseIdentity(oldAttempt) !== getResponseIdentity(attempt));
      return {
        ...current,
        students: nextStudents,
        attempts: [attempt, ...withoutExisting],
        activity: [{ id: `act-${Date.now()}`, at: submittedAt, text: `${payload.studentName || student?.name || payload.studentNumber} ${existing ? 'updated' : 'submitted'} ${deliverable.shortTitle}.` }, ...current.activity]
      };
    });

    return { ok: true, updated: Boolean(existing), attempt, student, deliverable };
  }, [state]);

  const triggerAiEvaluation = useCallback((attemptId) => {
    setState((current) => ({
      ...current,
      attempts: current.attempts.map((attempt) => {
        if (attempt.id !== attemptId) return attempt;
        const issueFlags = attempt.flags.filter((flag) => ['Template-like', 'Too Short', 'Not PDF', 'Inaccessible'].includes(flag));
        const summary = attempt.flags.includes('Template-like')
          ? 'File opens, but several sections appear close to the provided template. Open this before accepting it.'
          : attempt.flags.includes('Too Short')
            ? 'File opens, but extracted content appears too short for the selected deliverable.'
            : 'File opens and contains readable capstone sections. Review can proceed from this submission.';
        return {
          ...attempt,
          checkSummary: summary,
          aiReport: {
            status: 'Current',
            summary,
            flags: attempt.flags,
            redFlags: issueFlags.length ? issueFlags : ['No major automatic flags'],
            missingSections: attempt.flags.includes('Template-like') ? ['Sections may still contain unchanged template instructions'] : [],
            suggestedAction: attempt.flags.includes('Template-like') ? 'Open the submitted link before accepting; compare against the official template.' : 'Review content normally, then accept when ready.',
            generatedBy: 'Sir/adviser',
            generatedAt: new Date().toISOString(),
            sourceResponseUpdatedAt: attempt.updatedAt || attempt.submittedAt
          },
          flags: attempt.flags.includes('Checked') ? attempt.flags : [...attempt.flags, 'Checked'],
          primaryStatus: 'Needs Review',
          reviewStatus: 'Needs Review'
        };
      }),
      activity: [{ id: `act-${Date.now()}`, at: new Date().toISOString(), text: 'File check completed.' }, ...current.activity]
    }));
  }, []);

  const saveFeedback = useCallback((attemptId, payload) => {
    const note = String(payload.note || '').trim();
    if (!note) return;
    setState((current) => ({
      ...current,
      attempts: current.attempts.map((attempt) => attempt.id === attemptId ? {
        ...attempt,
        feedback: [
          {
            id: `fb-${Date.now()}`,
            note,
            author: payload.author || 'Sir/adviser',
            visibility: payload.visibility || 'Student',
            createdAt: new Date().toISOString()
          },
          ...(attempt.feedback || [])
        ]
      } : attempt)
    }));
  }, []);

  const markAccepted = useCallback((attemptId) => {
    setState((current) => ({
      ...current,
      attempts: current.attempts.map((attempt) => attempt.id === attemptId ? { ...attempt, primaryStatus: 'Accepted', reviewStatus: 'Accepted', flags: attempt.flags.includes('Accepted') ? attempt.flags : [...attempt.flags, 'Accepted'] } : attempt)
    }));
  }, []);

  const archiveAttempt = useCallback(async (attemptId) => {
    const attempt = state.attempts.find((item) => item.id === attemptId);
    if (!attempt) return;
    const deliverable = getDeliverable(state, attempt.deliverableId);
    const student = findStudent(state.students, attempt.studentNumber);
    const project = (state.projectMetadata || []).find((item) => String(item.groupCode || '').toLowerCase() === String(student?.teamCode || attempt.teamCode || '').toLowerCase());
    const hash = await hashArchiveRecord(`${attempt.id}|${attempt.submittedAt}|${JSON.stringify(attempt.values)}`);
    const archive = {
      id: `arc-${Date.now()}`,
      attemptId,
      deliverableTitle: deliverable?.title || 'Unknown deliverable',
      teamCode: student?.teamCode || attempt.teamCode || 'No team',
      studentName: student?.name || attempt.studentName || attempt.studentNumber,
      projectTitle: project?.projectTitle || '',
      softwareName: project?.softwareName || '',
      adviserName: project?.adviserName || student?.adviser || '',
      archivedAt: new Date().toISOString(),
      storageKey: `archive/finals/${student?.teamCode || 'unmatched'}/${deliverable?.shortTitle || 'file'}/${attempt.id}.pdf`,
      sourceLink: firstSubmissionLink(attempt.values),
      sha256: hash,
      verified: true
    };
    setState((current) => ({
      ...current,
      archives: [archive, ...current.archives],
      attempts: current.attempts.map((item) => item.id === attemptId ? { ...item, archiveStatus: 'Archived', flags: item.flags.includes('Archived') ? item.flags : [...item.flags, 'Archived'] } : item),
      activity: [{ id: `act-${Date.now()}`, at: archive.archivedAt, text: `Archived ${archive.deliverableTitle} for ${archive.teamCode}.` }, ...current.activity]
    }));
  }, [state]);

  const updateTrackerColumn = useCallback((columnId, updates) => {
    setState((current) => ({
      ...current,
      trackerColumns: current.trackerColumns.map((column) => column.id === columnId ? { ...column, ...updates } : column)
    }));
  }, []);

  const addTrackerColumn = useCallback((label) => {
    const clean = String(label || '').trim();
    if (!clean) return;
    setState((current) => ({
      ...current,
      trackerColumns: [
        ...current.trackerColumns,
        {
          id: `col-${Date.now()}`,
          key: clean,
          label: clean,
          sourceColumn: clean,
          active: true,
          pdfRequired: false
        }
      ],
      classRecord: {
        ...current.classRecord,
        importedColumns: [...new Set([...(current.classRecord.importedColumns || []), clean])]
      }
    }));
  }, []);

  const saveTemplate = useCallback((payload) => {
    setState((current) => {
      const template = {
        id: payload.id || `tpl-${Date.now()}`,
        deliverable: payload.deliverable,
        name: payload.name,
        link: makeDriveViewUrl(payload.link),
        status: 'Active',
        extractedAt: new Date().toISOString()
      };
      return {
        ...current,
        templates: payload.id
          ? current.templates.map((item) => item.id === payload.id ? template : item)
          : [template, ...current.templates]
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      ...resetWorkflowState(),
      backendSync: {
        enabled: false,
        apiBaseUrl: getApiBaseUrl(),
        status: 'Starter data restored.',
        lastError: '',
        lastLoadedAt: new Date().toISOString()
      }
    });
  }, []);

  const value = useMemo(() => ({
    state,
    addTrackerColumn,
    connectClassRecord,
    connectSheetSource,
    generateFormsFromSuggestions,
    loginStudentAccount,
    publishDeliverable,
    refreshBackendData,
    registerStudentAccount,
    removeDeliverable,
    saveTemplate,
    setActiveStudentNumber,
    submitPublicForm,
    triggerAiEvaluation,
    updateTrackerColumn,
    saveFeedback,
    markAccepted,
    archiveAttempt,
    reset
  }), [addTrackerColumn, archiveAttempt, connectClassRecord, connectSheetSource, generateFormsFromSuggestions, loginStudentAccount, markAccepted, publishDeliverable, refreshBackendData, registerStudentAccount, removeDeliverable, reset, saveFeedback, saveTemplate, setActiveStudentNumber, state, submitPublicForm, triggerAiEvaluation, updateTrackerColumn]);

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) throw new Error('useWorkflow must be used within WorkflowProvider');
  return context;
}

function applyBackendSnapshot(current, snapshot, options = {}) {
  const mapped = mapBackendSnapshot(snapshot);
  return {
    ...current,
    ...(mapped.students.length ? { students: mapped.students } : {}),
    ...(mapped.trackerColumns.length ? { trackerColumns: mapped.trackerColumns } : {}),
    ...(mapped.projectMetadata.length ? { projectMetadata: mapped.projectMetadata } : {}),
    ...(mapped.deliverables.length ? { deliverables: sortDeliverables(current, mergeDeliverables(current.deliverables, mapped.deliverables)) } : {}),
    backendSync: {
      enabled: options.enabled ?? true,
      apiBaseUrl: getApiBaseUrl(),
      status: options.status || 'Backend data loaded.',
      lastError: '',
      lastLoadedAt: new Date().toISOString()
    }
  };
}

function buildBackendImportResult(sourceType, backendImport, snapshot) {
  const mapped = mapBackendSnapshot(snapshot);
  const suggestedForms = (backendImport.deadlineSuggestions || []).map((item) => ({
    trackerColumn: item.trackerColumnKey,
    shortTitle: item.trackerColumnKey,
    title: item.title,
    dueAt: item.dueAt,
    pdfRequired: item.pdfRequired,
    sourceValue: item.sourceValue,
    sourceRowNumber: item.sourceRowNumber
  }));
  const importSummary = {
    sourceType: sourceType === 'teamFormation'
      ? 'Team Formation'
      : sourceType === 'projectMonitor'
        ? 'Software Project Monitor'
        : 'Tracker',
    studentsFound: backendImport.studentsFound,
    officialIdsFound: backendImport.officialIdsFound,
    groupsFound: backendImport.groupsFound,
    columnsFound: backendImport.columnsFound,
    deadlineRows: suggestedForms.length ? 1 : 0,
    suggestedForms,
    warnings: backendImport.warnings || []
  };

  return {
    ok: true,
    sourceType,
    headers: [],
    csvUrl: '',
    warnings: backendImport.warnings || [],
    suggestedForms,
    importSummary,
    ...(mapped.students.length ? { students: mapped.students } : {}),
    ...(mapped.trackerColumns.length ? { trackerColumns: mapped.trackerColumns } : {}),
    ...(mapped.projectMetadata.length ? { projectMetadata: mapped.projectMetadata } : {}),
    ...(mapped.deliverables.length ? { deliverables: mapped.deliverables } : {})
  };
}

function mapBackendSnapshot(snapshot) {
  const projectMetadata = (snapshot.projects || []).map((project) => ({
    id: project.id,
    groupCode: project.groupCode,
    projectTitle: project.projectTitle || '',
    softwareName: project.softwareName || '',
    description: project.description || '',
    proposalRemarks: project.proposalRemarks || '',
    demoComments: project.demoComments || '',
    adviserName: project.adviserName || '',
    status: project.projectStatus || '',
    category: project.category || ''
  }));
  const trackerColumns = (snapshot.trackerColumns || []).map((column) => ({
    id: column.id,
    key: column.columnKey,
    label: column.label,
    sourceColumn: column.sourceColumn,
    active: column.active,
    pdfRequired: column.pdfRequired
  }));
  const studentRecords = (snapshot.students || []).map((student) => ({
    rowKey: student.id,
    studentNumber: student.studentNumber || '',
    name: student.studentName,
    teamCode: student.teamCode,
    memberNumber: student.memberNumber || '',
    section: student.sectionName || '',
    adviser: student.adviserName || '',
    email: student.institutionalEmail || '',
    milestones: {}
  }));
  const studentByNumber = new Map(studentRecords.filter((student) => student.studentNumber).map((student) => [normalizeStudentNumber(student.studentNumber), student]));
  const studentByTeamMember = new Map(studentRecords.map((student) => [`${String(student.teamCode).toLowerCase()}::${String(student.memberNumber).toLowerCase()}`, student]));
  const trackerRows = (snapshot.trackerRows || []).map((row) => {
    const matched = row.studentNumber
      ? studentByNumber.get(normalizeStudentNumber(row.studentNumber))
      : studentByTeamMember.get(`${String(row.teamCode).toLowerCase()}::${String(row.memberNumber || '').toLowerCase()}`);
    const milestones = Object.fromEntries((row.cells || []).map((cell) => [cell.columnKey, cell.rawValue || '']));
    return {
      ...(matched || {}),
      rowKey: row.id,
      studentNumber: row.studentNumber || matched?.studentNumber || '',
      name: row.studentName || matched?.name || '',
      teamCode: row.teamCode || matched?.teamCode || '',
      memberNumber: row.memberNumber || matched?.memberNumber || '',
      section: row.sectionName || matched?.section || '',
      adviser: row.adviserName || matched?.adviser || '',
      email: matched?.email || '',
      milestones
    };
  });
  const students = trackerRows.length ? trackerRows : studentRecords;
  const deliverables = (snapshot.deliverables || []).map((deliverable) => ({
    id: deliverable.id,
    slug: deliverable.slug,
    title: deliverable.title,
    shortTitle: deliverable.trackerColumnKey,
    dueAt: normalizeBackendDueAt(deliverable.dueAt),
    trackerColumn: deliverable.trackerColumnKey,
    audience: 'Students',
    status: titleCase(String(deliverable.status || 'PUBLISHED').toLowerCase()),
    instructions: deliverable.instructions || '',
    fields: deliverable.pdfRequired
      ? [{ id: 'documentPdf', label: 'PDF Drive Link', type: 'drive', required: true, pdfRequired: true }]
      : [{ id: 'primaryLink', label: 'Submission Link', type: 'url', required: true, pdfRequired: false }]
  }));

  return {
    students,
    trackerColumns,
    projectMetadata,
    deliverables
  };
}

function mergeDeliverables(existingDeliverables, backendDeliverables) {
  const byId = new Map((existingDeliverables || []).map((deliverable) => [deliverable.id, deliverable]));
  for (const deliverable of backendDeliverables) {
    byId.set(deliverable.id, { ...(byId.get(deliverable.id) || {}), ...deliverable });
  }
  return Array.from(byId.values());
}

function titleCase(value) {
  return String(value || '')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeBackendDueAt(value) {
  const text = String(value || '');
  if (!text) return new Date().toISOString();
  if (/[zZ]|[+-]\d\d:\d\d$/.test(text)) return text;
  return `${text.length === 16 ? `${text}:00` : text}+08:00`;
}
