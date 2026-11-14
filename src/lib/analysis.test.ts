import { describe, expect, it } from 'vitest';
import { analyseWriting } from './writingAnalysis';
import { analyseSpeaking, audioStats, intelligibility } from './speakingAnalysis';
import { findIssues, applyFixes, mattr, words } from './text';
import { WRITING_PROMPTS } from '../content/writing';

const opinion = WRITING_PROMPTS.find((p) => p.id === 't2-opinion')!;
const line = WRITING_PROMPTS.find((p) => p.id === 'a1-line')!;
const formal = WRITING_PROMPTS.find((p) => p.id === 'g1-formal')!;

// Learner-style essays written for calibration (approximate target bands in the names).
const ESSAY_LOW = `i think university should be free because education is very important for people and people is need education. if the university is not free the poor people can not go to the university and this is very bad. government have alot of money and they can pay. also student can work after university and pay tax. so i agree university should be free for all student because it is good for the country and good for the people.`;

const ESSAY_MID = `Nowadays, many people think that university education should be free and paid by the government. I agree with this idea for some reasons.

Firstly, free education give chance to poor students. If students must pay high fees, many of them can not go to university even they are clever. For example, in my country a lot of students from villages do not study because their family has no money.

Secondly, the country will get benefit. When more people go to university, there are more doctors and engineers and the economy become better. Also graduates pay more tax so the government can get the money back.

However, some people say that it is too expensive for the government. This is true, but I think government can save money from other things.

In conclusion, I believe university should be free because it is fair and it is good for the economy.`;

describe('writing analyser: ranks proficiency levels in order', () => {
  const low = analyseWriting(ESSAY_LOW, opinion);
  const mid = analyseWriting(ESSAY_MID, opinion);
  const high = analyseWriting(opinion.model, opinion);
  it('orders bands low < mid < high', () => {
    expect(low.band).toBeLessThan(mid.band);
    expect(mid.band).toBeLessThan(high.band);
  });
  it('places samples in plausible ranges', () => {
    expect(low.band).toBeLessThanOrEqual(4.5);
    expect(mid.band).toBeGreaterThanOrEqual(5);
    expect(mid.band).toBeLessThanOrEqual(6.5);
    expect(high.band).toBeGreaterThanOrEqual(7);
  });
  it('explains every criterion', () => {
    for (const c of mid.criteria) expect(c.reasons.length).toBeGreaterThan(0);
    expect(mid.criteria.map((c) => c.name)).toEqual(['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy']);
  });
  it('flags the short, unparagraphed essay', () => {
    expect(low.wordCount).toBeLessThan(250);
    expect(low.criteria[1].reasons.join(' ')).toMatch(/paragraph/i);
  });
  it('model answers for every prompt score Band 7+', () => {
    for (const p of WRITING_PROMPTS) expect(analyseWriting(p.model, p).band, p.id).toBeGreaterThanOrEqual(6.5);
  });
});

describe('task-specific checks', () => {
  it('Academic Task 1 without an overview is penalised', () => {
    const noOverview = line.model.replace(/Overall, /, '').replace(/driving remained the most common way to commute, but it declined steadily/, 'driving was common');
    expect(analyseWriting(noOverview, line).criteria[0].band).toBeLessThan(analyseWriting(line.model, line).criteria[0].band);
  });
  it('uses Task Achievement for Task 1 and Task Response for Task 2', () => {
    expect(analyseWriting(line.model, line).criteria[0].name).toBe('Task Achievement');
    expect(analyseWriting(opinion.model, opinion).criteria[0].name).toBe('Task Response');
  });
  it('detects an informal tone in a formal letter', () => {
    const informal = formal.model.replace('Dear Sir or Madam,', 'Hey guys,').replace('Yours faithfully,', 'Cheers,') + ' gonna be great wanna hear back';
    expect(analyseWriting(informal, formal).criteria[0].band).toBeLessThan(analyseWriting(formal.model, formal).criteria[0].band);
  });
  it('does not reward rare words in place of meaning', () => {
    const fancy = 'Notwithstanding multifarious perspicacious considerations, quintessential ubiquitous paradigms. '.repeat(25);
    expect(analyseWriting(fancy, opinion).band).toBeLessThanOrEqual(5);
  });
});

describe('error checker', () => {
  it('finds and fixes common learner errors', () => {
    const t = 'People is happy. He have alot of informations. We discuss about it in nowadays.';
    const issues = findIssues(t);
    const types = issues.map((i) => i.type);
    expect(types).toEqual(expect.arrayContaining(['agreement', 'spelling', 'uncountable', 'preposition', 'expression']));
    expect(applyFixes(t, issues)).toBe('People are happy. He has a lot of information. We discuss it nowadays.');
  });
  it('avoids false positives on correct text', () => {
    expect(findIssues('An hour later, a university student made a decision. I did research.').length).toBe(0);
  });
  it('MATTR is length-robust', () => {
    expect(mattr(words('the cat '.repeat(100)))).toBeLessThan(0.1);
    expect(mattr(words(opinion.model))).toBeGreaterThan(0.7);
  });
});

describe('speaking analyser', () => {
  const short = [{ part: 1 as const, question: 'Do you like travelling?', answer: 'Yes. I like.' }, { part: 1 as const, question: 'Why?', answer: 'It is good.' }];
  const rich = [
    { part: 1 as const, question: 'Do you like travelling?', answer: 'Yes, very much. Well, I think travelling broadens your mind, because you meet people who see the world differently. For example, last year I went to Vietnam, and I was surprised by how welcoming people were, even though we could hardly understand each other.' },
    { part: 2 as const, question: 'Describe a journey', answer: 'I would like to talk about a train journey I took from Delhi to Shimla when I was at university. '.concat('It was a narrow-gauge railway which climbs through the mountains, and although the trip took almost six hours, it felt much shorter because the scenery was breathtaking. I travelled with two close friends, and we had planned it for months. What made it memorable was that halfway up, the train stopped because of a landslide, so we had to wait in a tiny village where an old man invited us for tea. If that had not happened, we would have missed the best part of the trip. On the whole, I remember it because it taught me that the unexpected moments are often the most valuable ones, and since then I have tried to travel more slowly.') },
    { part: 3 as const, question: 'Does tourism harm local communities?', answer: 'It depends. On the one hand, tourism creates jobs and brings money into areas that would otherwise be quite poor. On the other hand, if too many visitors arrive, rents go up and local people can be pushed out. I would argue that governments should limit numbers in fragile places, which is what some cities have started to do.' },
  ];
  it('ranks a developed performance above a minimal one', () => {
    expect(analyseSpeaking(rich).band).toBeGreaterThan(analyseSpeaking(short).band);
  });
  it('penalises phrases recycled across answers', () => {
    const tail = ' In my opinion it is quite important, for example when I travel with friends I learn a lot, although it can be tiring.';
    const recycled = rich.map((t) => ({ ...t, answer: 'Yes, I think so.' + tail })).concat(rich.map((t) => ({ ...t, answer: 'Maybe, it depends.' + tail })));
    const lr = (ts: typeof rich) => analyseSpeaking(ts).criteria.find((c) => c.name === 'Lexical Resource')!.band!;
    expect(lr(recycled)).toBeLessThan(lr(rich));
    expect(lr(recycled)).toBeLessThanOrEqual(6);
  });
  it('never invents a pronunciation band', () => {
    const r = analyseSpeaking(rich);
    expect(r.criteria.find((c) => c.name === 'Pronunciation')!.band).toBeNull();
    expect(r.provisional).toBe(true);
  });
  it('uses audio timing when available', () => {
    const withAudio = rich.map((t) => ({ ...t, audio: { duration: 30, voiced: 25, longPauses: 0 } }));
    expect(analyseSpeaking(withAudio).wpm).toBeGreaterThan(0);
    expect(analyseSpeaking(rich).wpm).toBeNull();
  });
});

describe('audio helpers', () => {
  it('measures voiced time and long pauses from PCM', () => {
    const rate = 16000;
    const pcm = new Float32Array(rate * 6);
    const tone = (from: number, to: number) => { for (let i = from * rate; i < to * rate; i++) pcm[i] = Math.sin(i / 5) * 0.5; };
    tone(0, 2); tone(4, 6); // 2 s gap
    const s = audioStats(pcm, rate);
    expect(s.duration).toBeCloseTo(6, 1);
    expect(s.voiced).toBeGreaterThan(3.5);
    expect(s.longPauses).toBe(1);
  });
  it('scores read-aloud intelligibility', () => {
    const r = intelligibility('The library will be closed on Monday', 'the library will be close on monday');
    expect(r.ratio).toBeCloseTo(6 / 7, 2);
    expect(r.missed).toEqual(['closed']);
  });
});
