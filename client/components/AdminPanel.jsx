'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../lib/appStore.js';
import { AiBadge } from './ui/AiBadge.jsx';
import { Button } from './ui/Button.jsx';
import { Card } from './ui/Card.jsx';
import { StatusChip } from './ui/StatusChip.jsx';

const COPY = {
  en: {
    title: 'Administration', signIn: 'Sign in', loading: 'Checking your account…', noAccess: 'Access Denied: Your account role is \'user\'.',
    bootstrap: 'After you have an account, an administrator can grant a role. For the first owner, run this from the repository root:',
    mfaSetup: 'Set up two-factor authentication', mfaSetupHelp: 'Add this secret to your authenticator app, then enter its current six-digit code.',
    secret: 'Base32 secret', otp: 'Authenticator URI', code: 'Six-digit code', confirm: 'Confirm setup', verify: 'Verify code',
    alreadyVerified: 'Two-factor verification is active for this session.', needVerify: 'Verify with your authenticator app to unlock staff tools.',
    role: 'Role', reload: 'Refresh data', lessons: 'Lessons', audit: 'Audit log', cleanup: 'Clean up unused uploads',
    cleanupResult: (result) => `Marked orphaned: ${result.markedOrphaned}; deleted: ${result.deleted}; failed: ${result.failed}.`,
    createDraft: 'Create lesson draft', slug: 'URL slug', bnTitle: 'Bangla title', enTitle: 'English title',
    bnBody: 'Bangla body', enBody: 'English body', quizQuestionBn: 'Quiz question (Bangla)', quizQuestionEn: 'Quiz question (English)',
    options: 'Four answer options', correct: 'Correct answer', create: 'Create draft', status: 'Status', created: 'Created',
    author: 'Author ID', submitReview: 'Submit for review', publish: 'Publish', archive: 'Archive',
    submitSelfOnly: 'Only the author can submit this draft.', secondPerson: 'A different staff member must publish the author’s draft.',
    roleManagement: 'Change user role', userId: 'Target user ID', newRole: 'New role', updateRole: 'Update role',
    auditTitle: 'Audit log', action: 'Action', actor: 'Actor ID', metadata: 'Metadata', timestamp: 'Timestamp',
    more: 'Load older entries', noLessons: 'No lessons found.', noAudit: 'No audit entries found.',
    error: 'Request failed.', success: 'Changes saved.', dismiss: 'Dismiss', ownerOnly: 'Owner only',
    editorOnly: 'Editors and owners', viewerAllowed: 'Available to staff', slugHelp: 'Lowercase letters, digits, and hyphens.',
    option: (n) => `Option ${n}`, noDatabase: 'The API or database is currently unavailable.',
    email: 'Email', password: 'Password', signInSubmit: 'Sign in to admin panel', tabs: 'Admin sections',
    rolesTab: 'User roles', maintenance: 'Maintenance', lessonsTab: 'Lessons', auditTab: 'Audit log',
    promoteHelp: 'To promote this account to owner, run in your terminal:',
    createLessonButton: 'Create lesson', setupInstructions: 'Enter this base32 secret in Google Authenticator or 1Password, then enter the current six-digit code.',
    generateAiDrafts: 'Generate 12 AI lesson drafts', dailyAiDrafts: 'Gemini will prepare one new draft each day at 9:00 a.m. Bangladesh time. AI drafts stay unpublished until you review them.',
    aiDraftsCreated: (count) => `Created ${count} bilingual lesson drafts for review.`,
    aiDraft: 'AI draft',
    flagRollout: 'Rollout percentage', saveFlag: 'Save feature flag', enabled: 'Enabled', summary: 'Summary', actions: 'Actions',
    accessRestricted: 'This section requires the owner role.',
    media: 'Lesson photo/video', chooseMedia: 'Choose image or video', uploadMedia: 'Upload media', removeMedia: 'Remove media',
    mediaHelp: 'JPG, PNG, WebP up to 5 MB; MP4 or WebM up to 50 MB.',
    uploadError: 'The upload failed. Check the file and Cloudinary configuration, then try again.',
    uploadFormatError: 'Choose a JPG, PNG, WebP, MP4, or WebM file.',
    uploadTooLarge: 'This file exceeds the upload size limit.',
    uploadVerifyError: 'The upload could not be verified or attached to the lesson.',
    uploadComplete: 'Media uploaded and attached to the lesson.',
    languageToggle: 'বাংলা', themeDark: 'Switch to dark mode', themeLight: 'Switch to light mode',
  },
  bn: {
    title: 'অ্যাডমিন প্যানেল', signIn: 'সাইন ইন', loading: 'অ্যাকাউন্ট যাচাই হচ্ছে…', noAccess: 'Access Denied: Your account role is \'user\'.',
    bootstrap: 'অ্যাকাউন্ট তৈরির পর অনুমোদিত অ্যাডমিন role দিতে পারবেন। প্রথম owner করতে repository root থেকে চালান:',
    mfaSetup: 'দুই-ধাপ যাচাই চালু করুন', mfaSetupHelp: 'এই secret authenticator app-এ যোগ করে বর্তমান ৬ সংখ্যার কোড দিন।',
    secret: 'Base32 secret', otp: 'Authenticator URI', code: '৬ সংখ্যার কোড', confirm: 'সেটআপ নিশ্চিত করুন', verify: 'কোড যাচাই করুন',
    alreadyVerified: 'এই session-এ দুই-ধাপ যাচাই সক্রিয় আছে।', needVerify: 'স্টাফ টুল ব্যবহারের আগে authenticator app-এর কোড যাচাই করুন।',
    role: 'ভূমিকা', reload: 'তথ্য রিফ্রেশ', lessons: 'পাঠসমূহ', audit: 'অডিট লগ', cleanup: 'অব্যবহৃত আপলোড পরিষ্কার',
    cleanupResult: (result) => `Orphan চিহ্নিত: ${result.markedOrphaned}; মোছা: ${result.deleted}; ব্যর্থ: ${result.failed}।`,
    createDraft: 'পাঠের খসড়া তৈরি', slug: 'URL slug', bnTitle: 'বাংলা শিরোনাম', enTitle: 'ইংরেজি শিরোনাম',
    bnBody: 'বাংলা পাঠ্য', enBody: 'ইংরেজি পাঠ্য', quizQuestionBn: 'কুইজ প্রশ্ন (বাংলা)', quizQuestionEn: 'কুইজ প্রশ্ন (ইংরেজি)',
    options: 'চারটি উত্তর', correct: 'সঠিক উত্তর', create: 'খসড়া তৈরি', status: 'অবস্থা', created: 'তৈরির সময়',
    author: 'লেখকের ID', submitReview: 'পর্যালোচনায় পাঠান', publish: 'প্রকাশ করুন', archive: 'আর্কাইভ',
    submitSelfOnly: 'শুধু লেখক নিজের খসড়া পর্যালোচনায় পাঠাতে পারেন।', secondPerson: 'লেখকের খসড়া প্রকাশে অন্য স্টাফ সদস্য লাগবে।',
    roleManagement: 'ব্যবহারকারীর ভূমিকা বদলান', userId: 'লক্ষ্য ব্যবহারকারীর ID', newRole: 'নতুন ভূমিকা', updateRole: 'ভূমিকা বদলান',
    auditTitle: 'অডিট লগ', action: 'কাজ', actor: 'Actor ID', metadata: 'বিবরণ', timestamp: 'সময়',
    more: 'পুরোনো তথ্য দেখুন', noLessons: 'কোনো পাঠ নেই।', noAudit: 'কোনো অডিট তথ্য নেই।',
    error: 'অনুরোধ ব্যর্থ হয়েছে।', success: 'পরিবর্তন সংরক্ষিত হয়েছে।', dismiss: 'বন্ধ করুন', ownerOnly: 'শুধু owner',
    editorOnly: 'Editor ও owner', viewerAllowed: 'স্টাফদের জন্য', slugHelp: 'ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন।',
    option: (n) => `উত্তর ${n}`, noDatabase: 'API অথবা database এখন পাওয়া যাচ্ছে না।',
    email: 'ইমেইল', password: 'পাসওয়ার্ড', signInSubmit: 'অ্যাডমিন প্যানেলে সাইন ইন', tabs: 'অ্যাডমিন বিভাগ',
    rolesTab: 'ব্যবহারকারীর ভূমিকা', maintenance: 'রক্ষণাবেক্ষণ', lessonsTab: 'পাঠসমূহ', auditTab: 'অডিট লগ',
    promoteHelp: 'এই অ্যাকাউন্টকে owner করতে টার্মিনালে চালান:',
    createLessonButton: 'পাঠ তৈরি করুন', setupInstructions: 'এই base32 secret Google Authenticator বা 1Password-এ যোগ করে বর্তমান ছয় সংখ্যার কোড দিন।',
    generateAiDrafts: 'AI দিয়ে ১২টি পাঠের খসড়া তৈরি', dailyAiDrafts: 'Gemini প্রতিদিন বাংলাদেশ সময় সকাল ৯টায় একটি নতুন খসড়া তৈরি করবে। তোমার পর্যালোচনার আগে AI খসড়া প্রকাশ হবে না।',
    aiDraftsCreated: (count) => `পর্যালোচনার জন্য ${count}টি দ্বিভাষিক পাঠের খসড়া তৈরি হয়েছে।`,
    aiDraft: 'AI খসড়া',
    flagRollout: 'রোলআউট শতাংশ', saveFlag: 'ফিচার ফ্ল্যাগ সংরক্ষণ', enabled: 'চালু', summary: 'সারাংশ', actions: 'কাজ',
    accessRestricted: 'এই বিভাগ ব্যবহারে owner ভূমিকা প্রয়োজন।',
    media: 'পাঠের ছবি/ভিডিও', chooseMedia: 'ছবি বা ভিডিও বেছে নিন', uploadMedia: 'মিডিয়া আপলোড', removeMedia: 'মিডিয়া সরান',
    mediaHelp: 'JPG, PNG, WebP সর্বোচ্চ ৫ MB; MP4 বা WebM সর্বোচ্চ ৫০ MB।',
    uploadError: 'আপলোড ব্যর্থ হয়েছে। ফাইল ও Cloudinary সেটিং পরীক্ষা করে আবার চেষ্টা করুন।',
    uploadFormatError: 'JPG, PNG, WebP, MP4 অথবা WebM ফাইল বেছে নিন।',
    uploadTooLarge: 'ফাইলটি আপলোডের নির্ধারিত আকারের চেয়ে বড়।',
    uploadVerifyError: 'আপলোড যাচাই করা যায়নি অথবা পাঠের সাথে যুক্ত করা যায়নি।',
    uploadComplete: 'মিডিয়া আপলোড করে পাঠের সাথে যুক্ত করা হয়েছে।',
    languageToggle: 'English', themeDark: 'ডার্ক মোড চালু করুন', themeLight: 'লাইট মোড চালু করুন',
  },
};

const ROLES = ['user', 'viewer', 'editor', 'owner'];
const STAFF_ROLES = ['viewer', 'editor', 'owner'];
const FLAG_KEYS = ['lessons.quiz', 'push.reminders', 'ml.predictions'];

function errorText(error, lang) {
  const message = error?.body?.error?.message;
  if (typeof message === 'string') return message;
  if (message && typeof message === 'object') return message[lang] || message.en || message.bn || COPY[lang].error;
  return error?.message || COPY[lang].error;
}

async function api(path, { method = 'GET', body, query } = {}) {
  const url = query ? `${path}?${new URLSearchParams(query)}` : path;
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && method !== 'HEAD') {
    const response = await fetch('/api/auth/csrf', { credentials: 'include' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || typeof result.csrfToken !== 'string') {
      const error = new Error('Could not get a security token. Reload the page and try again.');
      error.status = response.status;
      error.body = result;
      throw error;
    }
    headers['X-CSRF-Token'] = result.csrfToken;
  }

  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(`Request failed (${response.status}).`);
    error.status = response.status;
    error.body = result;
    throw error;
  }
  return result;
}

function Field({ label, ...props }) {
  return (
    <label className="block space-y-1">
      <span>{label}</span>
      <input {...props} className="block w-full rounded border border-ink/40 bg-paper p-3 text-ink" />
    </label>
  );
}

function LocalizedText({ bnLabel, enLabel, name, multiline = false, required = true }) {
  const Input = multiline ? 'textarea' : 'input';
  const className = 'block w-full rounded border border-ink/40 bg-paper p-3 text-ink';
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block space-y-1">
        <span>{bnLabel}</span>
        <Input name={`${name}-bn`} required={required} className={className} lang="bn" dir="auto" rows={multiline ? 5 : undefined} maxLength={multiline ? 5000 : 200} />
      </label>
      <label className="block space-y-1">
        <span>{enLabel}</span>
        <Input name={`${name}-en`} required={required} className={className} lang="en" dir="auto" rows={multiline ? 5 : undefined} maxLength={multiline ? 5000 : 200} />
      </label>
    </div>
  );
}

export function AdminPanel() {
  const [user, setUser] = useState(null);
  const [adminStatus, setAdminStatus] = useState(null);
  const [authState, setAuthState] = useState('loading');
  const [setup, setSetup] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [audit, setAudit] = useState([]);
  const [auditCursor, setAuditCursor] = useState(null);
  const [auditLoaded, setAuditLoaded] = useState(false);
  const [flags, setFlags] = useState({});
  const [activeTab, setActiveTab] = useState('lessons');
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState({});
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const storedLanguage = useAppStore((state) => state.language);
  const setStoredLanguage = useAppStore((state) => state.setLanguage);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const lang = storedLanguage === 'en' ? 'en' : 'bn';
  const [uiReady, setUiReady] = useState(false);
  const copy = COPY[lang];

  const showError = useCallback((err) => {
    setError(errorText(err, lang));
    setNotice('');
  }, [lang]);
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;

  useEffect(() => {
    let active = true;
    useAppStore.persist.rehydrate()
      .then(() => { if (active) setUiReady(true); })
      .catch((err) => {
        if (!active) return;
        showErrorRef.current(err);
        setUiReady(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const refreshStatus = useCallback(async () => {
    const [{ user: currentUser }, status] = await Promise.all([
      api('/api/me'),
      api('/api/admin/status'),
    ]);
    setUser(currentUser);
    if (!useAppStore.getState().language) setStoredLanguage(currentUser.locale === 'en' ? 'en' : 'bn');
    setAdminStatus(status);
    return status;
  }, [setStoredLanguage]);

  const loadLessons = useCallback(async () => {
    const result = await api('/api/admin/lessons');
    setLessons(result.lessons);
  }, []);

  const loadFlags = useCallback(async () => {
    const result = await api('/api/admin/flags');
    setFlags(result.flags);
  }, []);

  const loadAudit = useCallback(async (before, append = false) => {
    const result = await api('/api/admin/audit-log', { query: { limit: '50', ...(before ? { before } : {}) } });
    setAudit((current) => append ? [...current, ...result.entries] : result.entries);
    setAuditCursor(result.nextCursor);
    setAuditLoaded(true);
  }, []);

  const loadAdminData = useCallback(async () => {
    if (!adminStatus?.mfaVerified || !STAFF_ROLES.includes(adminStatus.role)) return;
    const requests = [loadLessons(), loadAudit()];
    if (adminStatus.role === 'owner') requests.push(loadFlags());
    const results = await Promise.allSettled(requests);
    const rejected = results.find((result) => result.status === 'rejected');
    if (rejected) showError(rejected.reason);
  }, [adminStatus, loadAudit, loadFlags, loadLessons, showError]);

  useEffect(() => {
    if (!uiReady) return undefined;
    let active = true;
    Promise.all([api('/api/me'), api('/api/admin/status')])
      .then(([profile, status]) => {
        if (!active) return;
        setUser(profile.user);
        if (!useAppStore.getState().language) setStoredLanguage(profile.user.locale === 'en' ? 'en' : 'bn');
        setAdminStatus(status);
        setAuthState('signed-in');
      })
      .catch((err) => {
        if (!active) return;
        if (err.status === 401) setAuthState('signed-out');
        else {
          showErrorRef.current(err);
          setAuthState('error');
        }
      });
    return () => { active = false; };
  }, [uiReady, setStoredLanguage]);

  useEffect(() => {
    if (!adminStatus?.mfaVerified || !STAFF_ROLES.includes(adminStatus.role)) return;
    loadAdminData().catch(showError);
  }, [adminStatus, loadAdminData, showError]);

  async function perform(action, successMessage = copy.success) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await action();
      setNotice(successMessage);
      return result;
    } catch (err) {
      showError(err);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function beginMfaSetup() {
    const result = await perform(() => api('/api/admin/mfa/setup', { method: 'POST', body: {} }));
    if (result) setSetup(result);
  }

  async function completeMfa(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get('code') || '');
    const confirmed = await perform(() => api('/api/admin/mfa/confirm', { method: 'POST', body: { code } }), copy.success);
    if (!confirmed) return;
    setSetup(null);
    const status = await perform(refreshStatus);
    if (status) setAdminStatus(status);
  }

  async function verifyMfa(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get('code') || '');
    const verified = await perform(() => api('/api/admin/mfa/verify', { method: 'POST', body: { code } }), copy.success);
    if (!verified) return;
    const status = await perform(refreshStatus);
    if (status) setAdminStatus(status);
  }

  async function createLesson(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const optionValues = [0, 1, 2, 3].map((index) => ({
      bn: String(form.get(`option-${index}-bn`) || ''),
      en: String(form.get(`option-${index}-en`) || ''),
    }));
    const quiz = [];
    const questionBn = String(form.get('quizQuestion-bn') || '').trim();
    const questionEn = String(form.get('quizQuestion-en') || '').trim();
    if (questionBn || questionEn || optionValues.some((option) => option.bn || option.en)) {
      quiz.push({
        question: { bn: questionBn, en: questionEn },
        options: optionValues,
        answerIndex: Number(form.get('answerIndex')),
      });
    }
    const payload = {
      slug: String(form.get('slug') || '').trim(),
      title: {
        bn: String(form.get('title-bn') || '').trim(),
        en: String(form.get('title-en') || '').trim(),
      },
      body: {
        bn: String(form.get('body-bn') || '').trim(),
        en: String(form.get('body-en') || '').trim(),
      },
      vocabulary: [],
      quiz,
      aiDrafted: false,
    };
    const created = await perform(() => api('/api/admin/lessons', { method: 'POST', body: payload }));
    if (!created) return;
    formElement.reset();
    setLessonFormOpen(false);
    await loadAdminData();
  }

  async function generateAiDrafts() {
    const result = await perform(
      () => api('/api/admin/lessons/ai-drafts', { method: 'POST', body: { count: 12 } }),
      copy.aiDraftsCreated(12)
    );
    if (result) await loadAdminData();
  }

  async function lessonAction(slug, action) {
    const result = await perform(() => api(`/api/admin/lessons/${encodeURIComponent(slug)}/${action}`, { method: 'POST', body: {} }));
    if (result) await loadAdminData();
  }

  async function uploadLessonMedia(slug) {
    const file = mediaFiles[slug];
    if (!file) return;
    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
    const allowedTypes = resourceType === 'video'
      ? ['video/mp4', 'video/webm']
      : ['image/jpeg', 'image/png', 'image/webp'];
    const maxBytes = resourceType === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) {
      setError(copy.uploadFormatError);
      return;
    }
    if (file.size > maxBytes) {
      setError(copy.uploadTooLarge);
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');
    try {
      const signed = await api('/api/admin/uploads/signature', {
        method: 'POST',
        body: { resourceType },
      });
      if (
        typeof signed.cloudName !== 'string' || typeof signed.apiKey !== 'string'
        || typeof signed.signature !== 'string' || typeof signed.publicId !== 'string'
        || typeof signed.timestamp !== 'number' || typeof signed.allowedFormats !== 'string'
        || typeof signed.maxBytes !== 'number'
      ) {
        throw new Error(copy.uploadError);
      }
      if (file.size > signed.maxBytes) {
        throw new Error(copy.uploadTooLarge);
      }

      const form = new FormData();
      form.set('file', file);
      form.set('api_key', signed.apiKey);
      form.set('timestamp', String(signed.timestamp));
      form.set('signature', signed.signature);
      form.set('public_id', signed.publicId);
      form.set('allowed_formats', signed.allowedFormats);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/${resourceType}/upload`, {
        method: 'POST',
        body: form,
      });
      const uploaded = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(uploaded?.error?.message || `${copy.uploadError} (${response.status})`);
      }
      if (uploaded?.public_id !== signed.publicId || uploaded?.resource_type !== resourceType) {
        throw new Error(copy.uploadVerifyError);
      }
      const attached = await api(`/api/admin/lessons/${encodeURIComponent(slug)}/media`, {
        method: 'POST',
        body: { publicId: signed.publicId, resourceType },
      });
      if (attached.lesson?.media?.type !== resourceType || !attached.lesson.media.url) {
        throw new Error(copy.uploadVerifyError);
      }
      setMediaFiles((current) => {
        const next = { ...current };
        delete next[slug];
        return next;
      });
      setNotice(copy.uploadComplete);
      try {
        await loadLessons();
      } catch (err) {
        showError(err);
      }
    } catch (err) {
      if (err?.status) showError(err);
      else setError(err?.message || copy.uploadError);
    } finally {
      setBusy(false);
    }
  }

  async function removeLessonMedia(slug) {
    const result = await perform(() => api(`/api/admin/lessons/${encodeURIComponent(slug)}/media`, { method: 'DELETE' }));
    if (result) await loadLessons();
  }

  async function runCleanup() {
    const result = await perform(() => api('/api/admin/uploads/cleanup', { method: 'POST', body: {} }), '');
    if (result) setNotice(copy.cleanupResult(result));
  }

  async function changeRole(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const id = String(form.get('userId') || '').trim();
    const role = String(form.get('role') || '');
    const updated = await perform(() => api(`/api/admin/users/${encodeURIComponent(id)}/role`, {
      method: 'POST',
      body: { role },
    }));
    if (updated) {
      formElement.reset();
      await loadAudit();
    }
  }

  async function signIn(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      await api('/api/auth/login', {
        method: 'POST',
        body: {
          email: String(form.get('email') || '').trim(),
          password: String(form.get('password') || ''),
        },
      });
      const status = await refreshStatus();
      setAdminStatus(status);
      setAuthState('signed-in');
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  async function saveFlag(event, key) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const value = flags[key];
    const result = await perform(() => api(`/api/admin/flags/${encodeURIComponent(key)}`, {
      method: 'POST',
      body: { enabled: value.enabled, rolloutPercent: Number(value.rolloutPercent) },
    }));
    if (result) setFlags((current) => ({ ...current, [key]: result.flag }));
  }

  async function refreshAll() {
    setBusy(true);
    setError('');
    try {
      const status = await refreshStatus();
      setAdminStatus(status);
      if (status.mfaVerified) {
        const requests = [loadLessons(), loadAudit()];
        if (status.role === 'owner') requests.push(loadFlags());
        await Promise.all(requests);
      }
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  const preferences = (
    <div className="flex gap-2">
      <Button variant="secondary" aria-label={theme === 'dark' ? copy.themeLight : copy.themeDark} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </Button>
      <Button variant="secondary" aria-label={copy.languageToggle} onClick={() => setStoredLanguage(lang === 'bn' ? 'en' : 'bn')}>
        {lang === 'bn' ? '🇺🇸 English' : '🇧🇩 বাংলা'}
      </Button>
    </div>
  );

  if (authState === 'loading') {
    return (
      <main className="mx-auto max-w-5xl space-y-4 py-8">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">{copy.title}</h1>
          {uiReady ? preferences : null}
        </header>
        <p role="status">{copy.loading}</p>
      </main>
    );
  }
  if (authState === 'signed-out') {
    return (
      <main className="mx-auto max-w-3xl space-y-4 py-8">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">{copy.title}</h1>
          {preferences}
        </header>
        {error ? <p role="alert">{error}</p> : null}
        <Card as="form" className="max-w-lg space-y-4" onSubmit={signIn}>
          <h2 className="text-xl font-semibold">{copy.signIn}</h2>
          <Field label={copy.email} name="email" type="email" autoComplete="username" required />
          <Field label={copy.password} name="password" type="password" autoComplete="current-password" required />
          <Button type="submit" disabled={busy}>{busy ? copy.loading : copy.signInSubmit}</Button>
        </Card>
      </main>
    );
  }
  if (authState === 'error') {
    return <main className="mx-auto max-w-5xl space-y-4 py-8"><header className="flex items-center justify-between gap-3"><h1 className="text-3xl font-bold">{copy.title}</h1>{preferences}</header><p role="alert">{error || copy.noDatabase}</p></main>;
  }

  const isStaff = STAFF_ROLES.includes(adminStatus?.role);
  const isOwner = adminStatus?.role === 'owner';

  return (
    <main className="mx-auto max-w-6xl space-y-5 py-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{copy.title}</h1>
          <p>{user?.displayName} · {copy.role}: {adminStatus?.role}</p>
        </div>
        <div className="flex items-center gap-2">
          {adminStatus?.mfaVerified ? <StatusChip lang={lang} status="done" /> : null}
          {preferences}
        </div>
      </header>

      {error ? (
        <Card role="alert" className="border-gold">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>{error}</p>
            <Button variant="secondary" onClick={() => setError('')}>{copy.dismiss}</Button>
          </div>
        </Card>
      ) : null}
      {notice ? <Card role="status">{notice}</Card> : null}

      {adminStatus?.role === 'user' ? (
        <Card className="space-y-3">
          <h2 className="text-xl font-semibold">{copy.noAccess}</h2>
          <p>{copy.promoteHelp}</p>
          <pre className="overflow-x-auto rounded bg-ink p-3 text-paper">node server/scripts/grant-role.js your-email@example.com owner</pre>
          <p>and refresh this page.</p>
        </Card>
      ) : null}

      {isStaff && !adminStatus.mfaEnabled ? (
        <Card className="space-y-4">
          <h2 className="text-2xl font-semibold">{copy.mfaSetup}</h2>
          {!setup ? (
            <Button disabled={busy} onClick={beginMfaSetup}>{copy.mfaSetup}</Button>
          ) : (
            <>
              <p>{copy.mfaSetupHelp}</p>
              <p>{copy.setupInstructions}</p>
              <Field label={copy.secret} readOnly value={setup.secret} />
              <Field label={copy.otp} readOnly value={setup.otpauthUrl} />
              <form className="flex flex-wrap items-end gap-3" onSubmit={completeMfa}>
                <Field label={copy.code} name="code" required inputMode="numeric" pattern="[0-9]{6}" maxLength="6" autoComplete="one-time-code" />
                <Button type="submit" disabled={busy}>{copy.confirm}</Button>
              </form>
            </>
          )}
        </Card>
      ) : null}

      {isStaff && adminStatus.mfaEnabled && !adminStatus.mfaVerified ? (
        <Card className="space-y-4">
          <h2 className="text-2xl font-semibold">{copy.needVerify}</h2>
          <form className="flex flex-wrap items-end gap-3" onSubmit={verifyMfa}>
            <Field label={copy.code} name="code" required inputMode="numeric" pattern="[0-9]{6}" maxLength="6" autoComplete="one-time-code" />
            <Button type="submit" disabled={busy}>{copy.verify}</Button>
          </form>
        </Card>
      ) : null}

      {isStaff && adminStatus.mfaVerified ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p role="status">{copy.alreadyVerified} · {copy.role}: {adminStatus.role}</p>
            <Button variant="secondary" disabled={busy} onClick={refreshAll}>{copy.reload}</Button>
          </div>

          <nav aria-label={copy.tabs} role="tablist" className="flex flex-wrap gap-2 border-b border-sapphire/20 pb-2">
            {[
              ['lessons', copy.lessonsTab],
              ['audit', copy.auditTab],
              ['roles', copy.rolesTab],
              ['maintenance', copy.maintenance],
            ].map(([tab, label]) => (
              <button
                key={tab}
                id={`admin-tab-${tab}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`admin-panel-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`min-h-11 rounded-md px-4 py-2 font-semibold ${activeTab === tab ? 'bg-sapphire text-on-sapphire' : 'border border-sapphire/30'}`}
              >
                {label}
              </button>
            ))}
          </nav>

          {activeTab === 'lessons' ? (
          <section id="admin-panel-lessons" role="tabpanel" aria-labelledby="admin-tab-lessons" className="space-y-4">
            <h2 className="text-2xl font-semibold">{copy.lessons}</h2>
            {['editor', 'owner'].includes(adminStatus.role) ? (
              <>
              {isOwner ? (
                <Card className="space-y-3">
                  <p>{copy.dailyAiDrafts}</p>
                  <Button disabled={busy} onClick={generateAiDrafts}><AiBadge lang={lang} /><span className="ml-2">{copy.generateAiDrafts}</span></Button>
                </Card>
              ) : null}
              <Button disabled={busy} onClick={() => setLessonFormOpen((current) => !current)}>{copy.createLessonButton}</Button>
              {lessonFormOpen ? (
              <Card as="form" className="space-y-4" onSubmit={createLesson}>
                <h3 className="text-xl font-semibold">{copy.createDraft}</h3>
                <div className="max-w-xl">
                  <label className="block space-y-1">
                    <span>{copy.slug}</span>
                    <input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength="80" className="block w-full rounded border border-ink/40 bg-paper p-3 text-ink" />
                    <span className="text-sm">{copy.slugHelp}</span>
                  </label>
                </div>
                <LocalizedText name="title" bnLabel={copy.bnTitle} enLabel={copy.enTitle} />
                <LocalizedText name="body" bnLabel={copy.bnBody} enLabel={copy.enBody} multiline />
                <details className="space-y-4">
                  <summary className="cursor-pointer font-semibold">{copy.quizQuestionBn} / {copy.quizQuestionEn}</summary>
                  <LocalizedText name="quizQuestion" bnLabel={copy.quizQuestionBn} enLabel={copy.quizQuestionEn} required={false} />
                  <h4 className="font-semibold">{copy.options}</h4>
                  <div className="space-y-3">
                    {[0, 1, 2, 3].map((index) => (
                      <div key={index} className="grid gap-3 sm:grid-cols-[auto_1fr_1fr]">
                        <span className="self-center">{copy.option(index + 1)}</span>
                        <input name={`option-${index}-bn`} aria-label={`${copy.option(index + 1)} — বাংলা`} maxLength="120" className="rounded border border-ink/40 bg-paper p-3 text-ink" />
                        <input name={`option-${index}-en`} aria-label={`${copy.option(index + 1)} — English`} maxLength="120" className="rounded border border-ink/40 bg-paper p-3 text-ink" />
                      </div>
                    ))}
                  </div>
                  <label className="block max-w-md space-y-1">
                    <span>{copy.correct}</span>
                    <select name="answerIndex" defaultValue="0" className="block w-full rounded border border-ink/40 bg-paper p-3 text-ink">
                      {[0, 1, 2, 3].map((index) => <option key={index} value={index}>{copy.option(index + 1)}</option>)}
                    </select>
                  </label>
                </details>
                <Button type="submit" disabled={busy}>{copy.create}</Button>
              </Card>
              ) : null}
              </>
            ) : (
              <p>{copy.viewerAllowed}</p>
            )}

            {lessons.length ? (
              <div className="overflow-x-auto rounded-md border border-sapphire/20">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead><tr className="bg-sapphire/10">
                    <th className="p-3">{copy.slug}</th><th className="p-3">{copy.status}</th>
                    <th className="p-3">{copy.author}</th><th className="p-3">{copy.created}</th><th className="p-3">{copy.media}</th><th className="p-3">{copy.actions}</th>
                  </tr></thead>
                  <tbody>{lessons.map((lesson) => {
                  const authoredByMe = lesson.authorId === user.id;
                  const canPublish = !authoredByMe || (lesson.aiDrafted && isOwner);
                  return (
                    <tr key={lesson.id} className="border-t border-sapphire/20">
                      <td className="p-3 font-semibold">{lesson.slug}{lesson.aiDrafted ? <span className="ml-2 inline-flex"><span className="ai-lightmark" role="img" aria-label={copy.aiDraft} title={copy.aiDraft}><span className="ai-lightmark__text">AI</span></span></span> : null}</td>
                      <td className="p-3"><StatusChip lang={lang} status={lesson.status} /></td>
                      <td className="break-all p-3">{lesson.authorId}</td>
                      <td className="p-3">{new Date(lesson.createdAt).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en')}</td>
                      <td className="p-3">
                        {lesson.media?.type === 'image' ? <img src={lesson.media.url} alt={lesson.slug} className="mb-2 max-h-24 max-w-40 rounded object-contain" /> : null}
                        {lesson.media?.type === 'video' ? <video src={lesson.media.url} controls className="mb-2 max-h-24 max-w-40 rounded" /> : null}
                        {['editor', 'owner'].includes(adminStatus.role) ? (
                          <div className="space-y-2">
                            <label className="block text-sm">
                              <span className="sr-only">{copy.chooseMedia}: {lesson.slug}</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                                aria-label={`${copy.chooseMedia}: ${lesson.slug}`}
                                disabled={busy}
                                onChange={(event) => setMediaFiles((current) => ({ ...current, [lesson.slug]: event.target.files?.[0] }))}
                              />
                            </label>
                            <p className="text-xs">{copy.mediaHelp}</p>
                            <Button variant="secondary" disabled={busy || !mediaFiles[lesson.slug]} onClick={() => uploadLessonMedia(lesson.slug)}>{copy.uploadMedia}</Button>
                            {lesson.media ? <Button variant="secondary" disabled={busy} onClick={() => removeLessonMedia(lesson.slug)}>{copy.removeMedia}</Button> : null}
                          </div>
                        ) : lesson.media ? null : <span>—</span>}
                      </td>
                      <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {lesson.status === 'draft' && ['editor', 'owner'].includes(adminStatus.role) ? (
                          <Button variant="secondary" disabled={busy || !authoredByMe} title={!authoredByMe ? copy.submitSelfOnly : undefined} onClick={() => lessonAction(lesson.slug, 'submit')}>{copy.submitReview}</Button>
                        ) : null}
                        {lesson.status === 'review' && ['editor', 'owner'].includes(adminStatus.role) ? (
                          <Button disabled={busy || !canPublish} title={!canPublish ? copy.secondPerson : undefined} onClick={() => lessonAction(lesson.slug, 'publish')}>{copy.publish}</Button>
                        ) : null}
                        {lesson.status !== 'archived' && isOwner ? (
                          <Button variant="secondary" disabled={busy} onClick={() => {
                            if (globalThis.confirm(copy.archive)) lessonAction(lesson.slug, 'archive');
                          }}>{copy.archive}</Button>
                        ) : null}
                        {lesson.status === 'review' && authoredByMe && !canPublish ? <p className="self-center text-sm">{copy.secondPerson}</p> : null}
                      </div>
                      </td>
                    </tr>
                  );
                })}</tbody>
                </table>
              </div>
            ) : <Card>{copy.noLessons}</Card>}
          </section>
          ) : null}

          {activeTab === 'audit' ? <section id="admin-panel-audit" role="tabpanel" aria-labelledby="admin-tab-audit" className="space-y-3">
            <h2 className="text-2xl font-semibold">{copy.auditTitle}</h2>
            {audit.length ? (
              <div className="overflow-x-auto rounded-md border border-sapphire/20">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead><tr className="bg-sapphire/10">
                    <th className="p-3">{copy.action}</th><th className="p-3">{copy.actor}</th>
                    <th className="p-3">{copy.timestamp}</th><th className="p-3">{copy.summary}</th>
                  </tr></thead>
                  <tbody>
                    {audit.map((entry) => (
                      <tr key={entry.id} className="border-t border-sapphire/20">
                        <td className="p-3">{entry.action} · {entry.actorRole}</td>
                        <td className="break-all p-3">{entry.actorId || 'CLI'}</td>
                        <td className="p-3">{new Date(entry.createdAt).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en')}</td>
                        <td className="p-3">{entry.targetType} {entry.targetId} {entry.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : auditLoaded ? <Card>{copy.noAudit}</Card> : null}
            {auditCursor ? <Button variant="secondary" disabled={busy} onClick={() => perform(() => loadAudit(auditCursor, true))}>{copy.more}</Button> : null}
          </section>
          : null}

          {activeTab === 'roles' ? (
            <section id="admin-panel-roles" role="tabpanel" aria-labelledby="admin-tab-roles" className="space-y-3">
            {isOwner ? (
              <Card className="space-y-3">
                <h2 className="text-xl font-semibold">{copy.roleManagement}</h2>
                <form className="space-y-3" onSubmit={changeRole}>
                  <Field label={copy.userId} name="userId" required pattern="[a-fA-F0-9]{24}" maxLength="24" />
                  <label className="block space-y-1">
                    <span>{copy.newRole}</span>
                    <select name="role" defaultValue="user" className="block w-full rounded border border-ink/40 bg-paper p-3 text-ink">
                      {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </label>
                  <Button type="submit" disabled={busy}>{copy.updateRole}</Button>
                </form>
              </Card>
            ) : <Card>{copy.accessRestricted}</Card>}
            </section>
          ) : null}

          {activeTab === 'maintenance' ? (
            <section id="admin-panel-maintenance" role="tabpanel" aria-labelledby="admin-tab-maintenance" className="space-y-4">
              {isOwner ? (
                <>
                  <Card className="space-y-3">
                    <h2 className="text-xl font-semibold">{copy.cleanup}</h2>
                    <Button disabled={busy} onClick={runCleanup}>{copy.cleanup}</Button>
                  </Card>
                  <div className="grid gap-4 md:grid-cols-2">
                    {FLAG_KEYS.map((key) => flags[key] ? (
                      <Card as="form" key={key} className="space-y-3" onSubmit={(event) => saveFlag(event, key)}>
                        <h2 className="text-lg font-semibold">{key}</h2>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={flags[key].enabled}
                            onChange={(event) => setFlags((current) => ({ ...current, [key]: { ...current[key], enabled: event.target.checked } }))}
                          />
                          {copy.enabled}
                        </label>
                        <Field
                          label={copy.flagRollout}
                          type="number"
                          required
                          min="0"
                          max="100"
                          step="1"
                          value={flags[key].rolloutPercent}
                          onChange={(event) => setFlags((current) => ({ ...current, [key]: { ...current[key], rolloutPercent: event.target.value } }))}
                        />
                        <Button type="submit" disabled={busy}>{copy.saveFlag}</Button>
                      </Card>
                    ) : null)}
                  </div>
                </>
              ) : <Card>{copy.accessRestricted}</Card>}
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
