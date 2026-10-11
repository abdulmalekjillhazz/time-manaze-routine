import { findDueReminders, todayInZone } from '@smart-routine/shared';
import { PushSubscription } from '../models/PushSubscription.js';
import { ReminderLog } from '../models/ReminderLog.js';
import { HolidayNotificationLog } from '../models/HolidayNotificationLog.js';
import { Routine } from '../models/Routine.js';
import { Completion } from '../models/Completion.js';
import { User } from '../models/User.js';
import { acquireLease } from './lease.js';
import { sendToUser, defaultSender } from './push.js';
import { randomToken } from '../lib/crypto.js';
import { isEnabledFor } from './flags.js';
import { logger } from '../lib/logger.js';
import { runAutomaticTraining } from './autoTraining.js';
import { formatHolidayReminderReason, getBangladeshDayOff, getHolidayNotificationSlot } from './holidays.js';
import { generateLessonDraftsWithGemini } from './geminiLessons.js';
import { writeAudit } from './audit.js';

const LEASE_NAME = 'reminders';
const LEASE_MS = 55 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_LOG_DAYS = 7;
const TRAINING_LEASE_MS = 24 * 60 * 60 * 1000;
const HOLIDAY_NOTIFICATION_LOG_DAYS = 400;
const DAILY_DRAFT_LEASE_MS = 23 * 60 * 60 * 1000;

// Routine names are private; explain the trigger without disclosing routine content.
export function routineReminderPayload(locale) {
  return locale === 'bn'
    ? {
      title: 'রুটিন শুরু হচ্ছে',
      body: 'কারণ: আপনি রুটিন রিমাইন্ডার চালু করেছেন এবং একটি রুটিনের নির্ধারিত শুরুর সময় হয়েছে।',
      url: '/app',
    }
    : {
      title: 'Routine starting soon',
      body: 'Reason: you enabled routine reminders, and a routine has reached its scheduled start time.',
      url: '/app',
    };
}

// One tick: check every user with a push subscription and send any reminders that are due.
export async function runReminderTick({ now = new Date(), owner, sender = defaultSender } = {}) {
  const leased = await acquireLease(LEASE_NAME, owner, LEASE_MS, now);
  if (!leased) return { skipped: 'lease-held', sent: 0, suppressed: 0, failed: 0 };

  const stats = { sent: 0, suppressed: 0, failed: 0 };
  const userIds = await PushSubscription.distinct('userId');

  for (const userId of userIds) {
    const user = await User.findById(userId).lean();
    if (!user || user.deletedAt) continue;

    if (!(await isEnabledFor('push.reminders', userId))) continue;
    await sendDueHolidayNotification({ user, userId, now, sender, stats });
    const routines = await Routine.find({ userId }).lean();
    if (routines.length === 0) continue;

    const dates = [todayInZone(user.timezone, now), todayInZone(user.timezone, new Date(now.getTime() - DAY_MS))];
    const completions = await Completion.find({ userId, date: { $in: dates } }).lean();
    const completedByDate = new Map();
    for (const c of completions) {
      if (!completedByDate.has(c.date)) completedByDate.set(c.date, new Set());
      completedByDate.get(c.date).add(String(c.routineId));
    }

    const due = findDueReminders({
      routines: routines.map((r) => ({ id: String(r._id), startTime: r.startTime })),
      completedByDate,
      now,
      timezone: user.timezone,
    });

    for (const reminder of due) {
      // Claim first. If another tick already claimed it, skip. This prevents duplicate sends.
      const claimed = await claimReminder(userId, reminder);
      if (!claimed) {
        stats.suppressed += 1;
        continue;
      }
      const { delivered } = await sendToUser(
        userId,
        routineReminderPayload(user.locale === 'bn' ? 'bn' : 'en'),
        sender,
        'routineReminders',
      );
      if (delivered > 0) stats.sent += 1;
      else stats.failed += 1;
    }
  }

  logger.info({ ...stats }, 'reminder tick finished');
  return stats;
}

async function sendDueHolidayNotification({ user, userId, now, sender, stats }) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: user.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const local = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const slot = getHolidayNotificationSlot(
    `${local.year}-${local.month}-${local.day}`,
    Number(local.hour),
    Number(local.minute),
  );
  if (!slot) return;

  const { date, kind } = slot;
  const locale = user.locale === 'bn' ? 'bn' : 'en';
  const summary = getBangladeshDayOff(date, locale);
  if (!summary) return;

  try {
    await HolidayNotificationLog.create({
      userId,
      date,
      kind,
      sentAt: now,
      expiresAt: new Date(now.getTime() + HOLIDAY_NOTIFICATION_LOG_DAYS * DAY_MS),
    });
  } catch (err) {
    if (err.code === 11000) {
      stats.suppressed += 1;
      return;
    }
    throw err;
  }

  const payload = {
    title: locale === 'bn'
      ? (kind === 'eve' ? 'আগামীকাল ছুটির দিন' : 'আজ ছুটির দিন')
      : (kind === 'eve' ? 'Tomorrow is a day off' : 'Today is a day off'),
    body: formatHolidayReminderReason(summary, locale),
    url: '/app',
    tag: `smart-routine-holiday-${date}-${kind}`,
  };
  const { delivered } = await sendToUser(userId, payload, sender, 'holidayReminders');
  if (delivered > 0) stats.sent += 1;
  else stats.failed += 1;
}

// Trade-off: a reminder is claimed before sending, so a failed send is not retried.
// For reminders, a missed one is better than a duplicate.
async function claimReminder(userId, { routineId, date, kind }) {
  try {
    await ReminderLog.create({
      userId,
      routineId,
      date,
      kind,
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + REMINDER_LOG_DAYS * DAY_MS),
    });
    return true;
  } catch (err) {
    if (err.code === 11000) return false;
    throw err;
  }
}

// Starts a tick every minute. Returns a function that stops it.
export function startScheduler({ intervalMs = 60 * 1000, enableReminders = true, trainingSecret, config } = {}) {
  const owner = `${process.pid}-${randomToken(8)}`;
  const timer = setInterval(() => {
    if (enableReminders) {
      runReminderTick({ owner }).catch((err) => logger.error({ errName: err.name }, 'reminder tick failed'));
    }
    if (trainingSecret) {
      const trainingOwner = `${owner}-train-${randomToken(8)}`;
      acquireLease('model-training', trainingOwner, TRAINING_LEASE_MS)
        .then((leased) => leased ? runAutomaticTraining(trainingSecret) : null)
        .then((result) => {
          if (result) logger.info(result, 'automatic model training finished');
        })
        .catch((err) => {
          const fields = { errName: err.name, code: err.code };
          if (err.code === 'TRAINING_REFUSED') fields.reason = err.message;
          logger.warn(fields, 'automatic model training did not produce a model');
        });
    }
    if (config?.GEMINI_API_KEY && isDailyLessonDraftTime(new Date())) {
        runDailyLessonDraft({ config, owner }).catch((err) => {
          logger.warn({ errName: err.name, code: err.code }, 'daily AI lesson drafting failed');
        });
    }
  }, intervalMs);
  return () => clearInterval(timer);
}

function isDailyLessonDraftTime(now) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const local = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return Number(local.hour) === 9 && Number(local.minute) < 5;
}

async function runDailyLessonDraft({ config, owner }) {
  const leased = await acquireLease('daily-ai-lesson-draft', owner, DAILY_DRAFT_LEASE_MS);
  if (!leased) return;
  const author = await User.findOne({ role: 'owner', deletedAt: null }).sort({ createdAt: 1 });
  if (!author) {
    logger.warn('daily AI lesson drafting skipped because no owner account exists');
    return;
  }
  const [lesson] = await generateLessonDraftsWithGemini(config, author, 1);
  await writeAudit({
    actor: author,
    action: 'lesson.ai_draft_daily',
    targetType: 'lesson',
    targetId: lesson._id,
    summary: `slug=${lesson.slug}`,
  });
  logger.info({ slug: lesson.slug }, 'daily AI lesson draft created');
}
