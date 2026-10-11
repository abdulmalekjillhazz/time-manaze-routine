import { lessonDraftSchema } from '@smart-routine/shared';
import { Lesson } from '../models/Lesson.js';
import { AppError } from '../lib/AppError.js';
import { logger } from '../lib/logger.js';

const unavailable = () => new AppError(503, 'UNAVAILABLE', {
  en: 'AI lesson drafting is not configured on the server.',
  bn: 'সার্ভারে AI দিয়ে পাঠ তৈরির ব্যবস্থা কনফিগার করা নেই।',
});

const failed = () => new AppError(502, 'UPSTREAM_UNAVAILABLE', {
  en: 'Gemini could not create lesson drafts. Please try again later.',
  bn: 'Gemini পাঠের খসড়া তৈরি করতে পারেনি। পরে আবার চেষ্টা করুন।',
});

function responseText(payload) {
  return payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim();
}

function parseDrafts(text, count) {
  const json = text?.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let payload;
  try {
    payload = JSON.parse(json);
  } catch {
    throw failed();
  }
  if (!Array.isArray(payload) || payload.length !== count) throw failed();
  const drafts = payload.map((item) => lessonDraftSchema.parse({ ...item, aiDrafted: true }));
  if (
    drafts.some((draft) => draft.quiz.length !== 1)
    || new Set(drafts.map((draft) => draft.slug)).size !== drafts.length
  ) throw failed();
  return drafts;
}

export async function generateLessonDraftsWithGemini(config, author, count = 12) {
  if (!config.GEMINI_API_KEY) throw unavailable();
  const existingSlugs = await Lesson.distinct('slug');
  const modelName = (config.GEMINI_MODEL || 'gemini-2.5-flash').replace(/^models\//, '');
  const endpoint = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`);
  endpoint.searchParams.set('key', config.GEMINI_API_KEY);

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: 'Create practical, original, safe learning lessons about routines, focus, habit formation, time management, rest, and wellbeing. Return only a JSON array, with every lesson fully bilingual in Bengali and English. Each lesson must have a unique lowercase-hyphen slug, an informative title, a useful body, and exactly one quiz question with four bilingual options and a correct answerIndex from 0 to 3. Never include medical advice, invented research claims, or user data. Output objects with exactly: slug, title {bn,en}, body {bn,en}, vocabulary [], quiz [{question {bn,en}, options [{bn,en} x4], answerIndex}].',
          }],
        },
        contents: [{
          role: 'user',
          parts: [{
            text: `Create exactly ${count} distinct lessons. Avoid these already-used slugs: ${existingSlugs.join(', ') || '(none)'}. Make the lessons useful to Bengali-speaking learners and vary the subjects. JSON array only.`,
          }],
        }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens: Math.min(8192, count * 850) },
      }),
    });
  } catch (err) {
    logger.warn({ errName: err.name }, 'Gemini lesson generation request failed');
    throw failed();
  }

  if (!response.ok) {
    logger.warn({ status: response.status }, 'Gemini lesson generation returned an error');
    throw failed();
  }

  let payload;
  try {
    payload = await response.json();
  } catch (err) {
    logger.warn({ errName: err.name }, 'Gemini lesson generation returned invalid JSON');
    throw failed();
  }

  let drafts;
  try {
    drafts = parseDrafts(responseText(payload), count);
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.warn({ errName: err.name }, 'Gemini lesson drafts failed validation');
    throw failed();
  }

  const duplicate = drafts.find((draft) => existingSlugs.includes(draft.slug));
  if (duplicate) throw failed();
  try {
    return await Lesson.insertMany(
      drafts.map((draft) => ({ ...draft, createdBy: author._id })),
      { ordered: true }
    );
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(409, 'CONFLICT', {
        en: 'A lesson with a generated slug already exists. Please generate again.',
        bn: 'তৈরি হওয়া একটি slug দিয়ে পাঠ আগে থেকেই আছে। আবার তৈরি করুন।',
      });
    }
    throw err;
  }
}
