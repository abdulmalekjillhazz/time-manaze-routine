import { afterEach, describe, expect, it, vi } from 'vitest';
import { Lesson } from '../../src/models/Lesson.js';
import { generateLessonDraftsWithGemini } from '../../src/services/geminiLessons.js';

function generatedLesson(overrides = {}) {
  return {
    slug: 'steady-morning-routine',
    title: { bn: 'সকালের রুটিন', en: 'A steady morning routine' },
    body: { bn: 'ছোট একটি অভ্যাস বেছে নিন।', en: 'Choose one small habit.' },
    vocabulary: [],
    quiz: [{
      question: { bn: 'কী দিয়ে শুরু করবেন?', en: 'What should you start with?' },
      options: [
        { bn: 'ছোট অভ্যাস', en: 'A small habit' },
        { bn: 'অনেক কাজ', en: 'Many tasks' },
        { bn: 'কোনোটিই নয়', en: 'None' },
        { bn: 'সব একসাথে', en: 'Everything at once' },
      ],
      answerIndex: 0,
    }],
    ...overrides,
  };
}

describe('Gemini lesson drafts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('requires server-side Gemini configuration', async () => {
    await expect(generateLessonDraftsWithGemini({}, { _id: 'owner-id' }, 12)).rejects.toMatchObject({
      status: 503,
      code: 'UNAVAILABLE',
    });
  });

  it('validates generated bilingual quizzes and stores them as owner-attributed drafts', async () => {
    vi.spyOn(Lesson, 'distinct').mockResolvedValue(['existing-lesson']);
    vi.spyOn(Lesson, 'insertMany').mockImplementation(async (drafts) => drafts);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify([generatedLesson()]) }] } }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const created = await generateLessonDraftsWithGemini(
      { GEMINI_API_KEY: 'test-only-key', GEMINI_MODEL: 'gemini-2.5-flash' },
      { _id: 'owner-id' },
      1
    );

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ slug: 'steady-morning-routine', aiDrafted: true, createdBy: 'owner-id' });
    expect(fetchMock.mock.calls[0][0].searchParams.get('key')).toBe('test-only-key');
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(requestBody.contents[0].parts[0].text).toContain('existing-lesson');
    expect(requestBody.contents[0].parts[0].text).not.toContain('owner-id');
  });

  it('rejects invalid generated lesson content without saving it', async () => {
    vi.spyOn(Lesson, 'distinct').mockResolvedValue([]);
    const insertMany = vi.spyOn(Lesson, 'insertMany');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify([generatedLesson({ quiz: [] })]) }] } }],
    }), { status: 200 })));

    await expect(generateLessonDraftsWithGemini(
      { GEMINI_API_KEY: 'test-only-key' },
      { _id: 'owner-id' },
      1
    )).rejects.toMatchObject({ status: 502, code: 'UPSTREAM_UNAVAILABLE' });
    expect(insertMany).not.toHaveBeenCalled();
  });
});
