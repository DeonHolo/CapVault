import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  calculateDaysLate,
  deriveAttemptFlags,
  findStudent,
  getDeliverable,
  hashArchiveRecord,
  loadWorkflowState,
  resetWorkflowState,
  saveWorkflowState,
  validateSubmission
} from '../lib/workflow.js';

const WorkflowContext = createContext(null);

export function WorkflowProvider({ children }) {
  const [state, setState] = useState(() => loadWorkflowState());

  useEffect(() => {
    saveWorkflowState(state);
  }, [state]);

  const publishDeliverable = useCallback((payload) => {
    setState((current) => {
      const id = payload.id || `deliv-${Date.now()}`;
      const slug = payload.slug || payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const deliverable = {
        id,
        slug,
        status: 'Published',
        fields: payload.fields,
        ...payload
      };
      return {
        ...current,
        deliverables: [deliverable, ...current.deliverables],
        activity: [{ id: `act-${Date.now()}`, at: new Date().toISOString(), text: `Published ${deliverable.title}.` }, ...current.activity]
      };
    });
  }, []);

  const submitPublicForm = useCallback((slug, payload) => {
    const deliverable = getDeliverable(state, slug);
    if (!deliverable) return { ok: false, formError: 'This submission form was not found.' };
    const validation = validateSubmission({ deliverable, values: payload.values });
    if (!validation.ok) return { ok: false, fieldErrors: validation.errors };

    const student = findStudent(state.students, payload.studentNumber);
    const submittedAt = new Date().toISOString();
    const flags = deriveAttemptFlags(payload.values, validation.flags);
    if (!student) flags.push('Unmatched Student Number');

    const attempt = {
      id: `att-${Date.now()}`,
      deliverableId: deliverable.id,
      studentNumber: payload.studentNumber,
      matched: Boolean(student),
      submittedAt,
      values: payload.values,
      flags,
      aiSummary: '',
      reviewStatus: flags.includes('Unmatched Student Number') || flags.includes('Template-like') ? 'Needs Review' : 'Received',
      archiveStatus: 'Not Archived'
    };

    setState((current) => {
      const nextStudents = current.students.map((item) => {
        if (!student || item.studentNumber !== student.studentNumber) return item;
        const existing = current.attempts.find((oldAttempt) => oldAttempt.studentNumber === student.studentNumber && oldAttempt.deliverableId === deliverable.id);
        if (existing) return item;
        return {
          ...item,
          milestones: {
            ...item.milestones,
            [deliverable.trackerColumn]: calculateDaysLate(deliverable.dueAt, submittedAt)
          }
        };
      });
      return {
        ...current,
        students: nextStudents,
        attempts: [attempt, ...current.attempts],
        activity: [{ id: `act-${Date.now()}`, at: submittedAt, text: `${student?.name || payload.studentNumber} submitted ${deliverable.shortTitle}.` }, ...current.activity]
      };
    });

    return { ok: true, attempt, student, deliverable };
  }, [state]);

  const triggerAiEvaluation = useCallback((attemptId) => {
    setState((current) => ({
      ...current,
      attempts: current.attempts.map((attempt) => {
        if (attempt.id !== attemptId) return attempt;
        const summary = attempt.flags.includes('Template-like')
          ? 'AI triage found accessible PDF content, but several sections appear template-like and need manual review.'
          : 'AI triage found an accessible PDF with recognizable capstone sections. Manual review is still required.';
        return {
          ...attempt,
          aiSummary: summary,
          flags: attempt.flags.includes('AI Checked') ? attempt.flags : [...attempt.flags, 'AI Checked'],
          reviewStatus: 'Needs Review'
        };
      }),
      activity: [{ id: `act-${Date.now()}`, at: new Date().toISOString(), text: 'AI triage completed for a submission.' }, ...current.activity]
    }));
  }, []);

  const markAccepted = useCallback((attemptId) => {
    setState((current) => ({
      ...current,
      attempts: current.attempts.map((attempt) => attempt.id === attemptId ? { ...attempt, reviewStatus: 'Accepted', flags: attempt.flags.includes('Accepted') ? attempt.flags : [...attempt.flags, 'Accepted'] } : attempt)
    }));
  }, []);

  const archiveAttempt = useCallback(async (attemptId) => {
    const attempt = state.attempts.find((item) => item.id === attemptId);
    if (!attempt) return;
    const deliverable = getDeliverable(state, attempt.deliverableId);
    const student = findStudent(state.students, attempt.studentNumber);
    const hash = await hashArchiveRecord(`${attempt.id}|${attempt.submittedAt}|${JSON.stringify(attempt.values)}`);
    const archive = {
      id: `arc-${Date.now()}`,
      attemptId,
      deliverableTitle: deliverable?.title || 'Unknown deliverable',
      teamCode: student?.teamCode || 'Unmatched',
      studentName: student?.name || attempt.studentNumber,
      archivedAt: new Date().toISOString(),
      storageKey: `archive/finals/${student?.teamCode || 'unmatched'}/${deliverable?.shortTitle || 'file'}/${attempt.id}.pdf`,
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

  const reset = useCallback(() => {
    setState(resetWorkflowState());
  }, []);

  const value = useMemo(() => ({
    state,
    publishDeliverable,
    submitPublicForm,
    triggerAiEvaluation,
    markAccepted,
    archiveAttempt,
    reset
  }), [archiveAttempt, markAccepted, publishDeliverable, reset, state, submitPublicForm, triggerAiEvaluation]);

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) throw new Error('useWorkflow must be used within WorkflowProvider');
  return context;
}
