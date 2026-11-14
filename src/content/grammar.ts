export interface GrammarQ { q: string; options: string[]; answer: number; why: string }
export interface GrammarLesson { id: string; title: string; level: 'Foundation' | 'Intermediate' | 'Advanced'; summary: string; points: string[]; examples: string[]; quiz: GrammarQ[] }

/** Original grammar lessons focused on errors that commonly affect IELTS bands. */
export const GRAMMAR: GrammarLesson[] = [
  {
    id: 'articles', title: 'Articles: a, an, the, or nothing', level: 'Foundation',
    summary: 'Article errors are among the most frequent in IELTS writing and they lower Grammatical Range and Accuracy.',
    points: ['Use a/an with singular countable nouns mentioned for the first time.', 'Use the when the reader knows which one you mean, or there is only one (the internet, the government).', 'Use no article for general plural or uncountable nouns: Children need exercise. Pollution is a problem.', 'Choose a/an by sound: an hour, a university.'],
    examples: ['✗ The pollution is serious problem. → ✓ Pollution is a serious problem.', '✗ Government should invest in the education. → ✓ The government should invest in education.'],
    quiz: [
      { q: '___ technology has changed how we communicate.', options: ['The', 'A', '(no article)'], answer: 2, why: 'General uncountable noun, so no article.' },
      { q: 'She is studying at ___ university in Leeds.', options: ['an', 'a', 'the'], answer: 1, why: '"University" begins with a /j/ sound, so "a".' },
      { q: '___ government announced new tax rules.', options: ['The', 'A', '(no article)'], answer: 0, why: 'A specific, known government.' },
      { q: 'It took him ___ hour to finish.', options: ['a', 'an', 'the'], answer: 1, why: '"Hour" begins with a vowel sound.' },
    ],
  },
  {
    id: 'agreement', title: 'Subject–verb agreement', level: 'Foundation',
    summary: 'The verb must agree with its subject, even when other words come between them.',
    points: ['Third-person singular present verbs take -s: She works.', '"People", "police" and "children" are plural.', 'Uncountable nouns take singular verbs: Information is…', 'With "one of the…", the verb agrees with "one": One of the problems is…'],
    examples: ['✗ People is worried. → ✓ People are worried.', '✗ One of the reasons are cost. → ✓ One of the reasons is cost.'],
    quiz: [
      { q: 'The number of students ___ risen.', options: ['have', 'has', 'are'], answer: 1, why: '"The number" is singular.' },
      { q: 'A lot of people ___ public transport.', options: ['uses', 'use', 'using'], answer: 1, why: '"People" is plural.' },
      { q: 'The advice he gave ___ very useful.', options: ['were', 'are', 'was'], answer: 2, why: '"Advice" is uncountable, so singular.' },
      { q: 'Each of the candidates ___ a number.', options: ['receives', 'receive', 'have received'], answer: 0, why: '"Each" takes a singular verb.' },
    ],
  },
  {
    id: 'tenses', title: 'Present perfect vs past simple', level: 'Foundation',
    summary: 'Use the past simple for finished times and the present perfect for experiences or changes up to now.',
    points: ['Past simple + finished time: in 2010, last year, ago.', 'Present perfect + unfinished time or no time: since, for, recently, ever.', 'In Task 1, use the past simple for past data and the present perfect for changes continuing to now.'],
    examples: ['✗ I have visited Paris in 2019. → ✓ I visited Paris in 2019.', '✓ Car use has fallen since 2000.'],
    quiz: [
      { q: 'Sales ___ sharply in 2015.', options: ['have risen', 'rose', 'rise'], answer: 1, why: 'Finished time (2015) takes the past simple.' },
      { q: 'I ___ here for three years.', options: ['live', 'lived', 'have lived'], answer: 2, why: '"For three years" up to now takes the present perfect.' },
      { q: 'Have you ever ___ abroad?', options: ['studied', 'study', 'studying'], answer: 0, why: 'Present perfect takes the past participle.' },
      { q: 'The figure ___ steadily since 2010.', options: ['grew', 'has grown', 'grows'], answer: 1, why: '"Since" takes the present perfect.' },
    ],
  },
  {
    id: 'conditionals', title: 'Conditional sentences', level: 'Intermediate',
    summary: 'Conditionals let you discuss possibilities and consequences, which is useful in Task 2 and Speaking Part 3.',
    points: ['First conditional (real future): If + present, will + verb.', 'Second conditional (hypothetical): If + past, would + verb.', 'Third conditional (past hypothetical): If + had + past participle, would have + past participle.', 'Use unless = if not; provided that = only if.'],
    examples: ['If governments invested more in transport, congestion would fall.', 'Unless action is taken, the problem will get worse.'],
    quiz: [
      { q: 'If cities ___ more parks, people would be healthier.', options: ['have', 'had', 'will have'], answer: 1, why: 'Second conditional: if + past simple.' },
      { q: 'If it rains, the event ___ cancelled.', options: ['would be', 'will be', 'was'], answer: 1, why: 'First conditional: will + verb.' },
      { q: 'If I had known, I ___ you.', options: ['would tell', 'will tell', 'would have told'], answer: 2, why: 'Third conditional.' },
      { q: '___ you book early, there may be no seats.', options: ['If', 'Unless', 'Provided'], answer: 1, why: '"Unless" = if you do not.' },
    ],
  },
  {
    id: 'relative', title: 'Relative clauses', level: 'Intermediate',
    summary: 'Relative clauses combine ideas into complex sentences, a key feature of Band 6+ grammar.',
    points: ['who for people, which for things, whose for possession, where for places.', 'Defining clauses (no commas) identify which one.', 'Non-defining clauses (with commas) add extra information; do not use "that" in them.'],
    examples: ['Students who work part-time often have less time to study.', 'The city, which has a population of two million, is expanding rapidly.'],
    quiz: [
      { q: 'The scientist ___ discovered penicillin was Fleming.', options: ['which', 'who', 'whose'], answer: 1, why: 'People take "who".' },
      { q: 'London, ___ is the capital, is very expensive.', options: ['that', 'which', 'where'], answer: 1, why: 'Non-defining clauses cannot use "that".' },
      { q: 'This is the town ___ I grew up.', options: ['which', 'where', 'who'], answer: 1, why: 'Places take "where" (= in which).' },
      { q: 'A student ___ essay won the prize…', options: ['whose', 'who', 'which'], answer: 0, why: 'Possession takes "whose".' },
    ],
  },
  {
    id: 'passive', title: 'The passive voice', level: 'Intermediate',
    summary: 'The passive is essential for describing processes (Task 1) and for formal, objective writing.',
    points: ['Form: be + past participle.', 'Use it when the action matters more than who did it.', 'Process diagrams: First, the beans are harvested. They are then dried…'],
    examples: ['The paper is shredded and mixed with water.', 'A new hospital was built in 2015.'],
    quiz: [
      { q: 'The leaves ___ by hand.', options: ['picked', 'are picked', 'are picking'], answer: 1, why: 'Present passive: are + past participle.' },
      { q: 'The bridge ___ in 1890.', options: ['was built', 'built', 'has build'], answer: 0, why: 'Past passive.' },
      { q: 'More homes ___ next year.', options: ['will build', 'will be built', 'are build'], answer: 1, why: 'Future passive.' },
      { q: 'The results ___ yet.', options: ['have not been published', 'not published', 'did not publish'], answer: 0, why: 'Present perfect passive.' },
    ],
  },
  {
    id: 'comparisons', title: 'Comparatives and superlatives', level: 'Foundation',
    summary: 'Accurate comparison language is required in every Task 1 response.',
    points: ['Short adjectives: -er / the -est (cheaper, the cheapest).', 'Long adjectives: more / the most (more expensive).', 'Never double them: more better ✗.', 'Useful patterns: twice as many as, slightly higher than, by far the largest.'],
    examples: ['Car use was twice as high as bus use.', 'Coal was by far the largest source of electricity.'],
    quiz: [
      { q: 'Wind power is ___ than coal.', options: ['more clean', 'cleaner', 'more cleaner'], answer: 1, why: 'Short adjective: -er, no "more".' },
      { q: 'It was ___ popular option.', options: ['the most', 'the more', 'most'], answer: 0, why: 'Superlative of a long adjective.' },
      { q: 'Bus use was ___ car use.', options: ['half as high as', 'half higher than', 'half as higher'], answer: 0, why: 'Pattern: half as + adj + as.' },
      { q: 'Prices rose ___ in 2020 than in 2019.', options: ['more slowly', 'slowlier', 'more slow'], answer: 0, why: 'Adverbs ending in -ly use "more".' },
    ],
  },
  {
    id: 'linking', title: 'Linking words and cohesion', level: 'Intermediate',
    summary: 'Use linking words accurately and only when needed. Overuse lowers Coherence and Cohesion.',
    points: ['Contrast: however (new sentence), although/while (+ clause), despite (+ noun/-ing).', 'Result: therefore, as a result, consequently.', 'Addition: moreover, in addition, furthermore (do not start every sentence with them).', 'Referencing: this, these, such, which help link ideas without repetition.'],
    examples: ['✗ Despite it was expensive, … → ✓ Although it was expensive, … / Despite the cost, …'],
    quiz: [
      { q: '___ the rain, the match continued.', options: ['Although', 'Despite', 'However'], answer: 1, why: '"Despite" + noun.' },
      { q: 'Prices rose. ___, sales fell.', options: ['Although', 'As a result', 'Despite'], answer: 1, why: 'Result linker starting a new sentence.' },
      { q: '___ it is cheap, it is unreliable.', options: ['Although', 'However', 'Despite'], answer: 0, why: '"Although" + clause.' },
      { q: 'Choose the best cohesive option: "Many cities have built cycle lanes. ___ have reduced traffic."', options: ['Cycle lanes', 'These lanes', 'It'], answer: 1, why: 'Referencing avoids repetition and agrees in number.' },
    ],
  },
  {
    id: 'modals', title: 'Modal verbs for speculation and advice', level: 'Advanced',
    summary: 'Modals let you hedge claims and make recommendations: important for Task 2 and Part 3.',
    points: ['Possibility: may, might, could.', 'Strong likelihood: is likely to, must (deduction).', 'Recommendation: should, ought to, it is essential that…', 'Past speculation: might have + past participle.'],
    examples: ['This policy could reduce emissions, although it might be unpopular.', 'Governments should invest in public transport.'],
    quiz: [
      { q: 'He isn’t here. He ___ missed the train.', options: ['might have', 'might', 'should'], answer: 0, why: 'Past speculation: might have + past participle.' },
      { q: 'Students ___ be given more choice.', options: ['ought', 'should', 'must to'], answer: 1, why: '"Should" + base verb.' },
      { q: 'Choose the most cautious claim:', options: ['This will solve the problem.', 'This may help to solve the problem.', 'This solves the problem.'], answer: 1, why: 'Hedging with "may help to".' },
      { q: 'It is essential that every child ___ access to education.', options: ['has', 'have', 'having'], answer: 0, why: 'In everyday British usage "has" (subjunctive "have" is also correct in formal style).' },
    ],
  },
  {
    id: 'sentences', title: 'Sentence boundaries and punctuation', level: 'Advanced',
    summary: 'Run-on sentences and comma splices are common at Band 5–6. Clear boundaries improve accuracy.',
    points: ['Two complete sentences cannot be joined with only a comma.', 'Join them with a full stop, a semicolon, or a conjunction.', 'Put a comma after an introductory clause: Although it is cheap, …', 'Use commas around non-defining relative clauses.'],
    examples: ['✗ Many people drive, this causes pollution. → ✓ Many people drive, which causes pollution.'],
    quiz: [
      { q: 'Which sentence is correct?', options: ['Prices rose, people bought less.', 'Prices rose, so people bought less.', 'Prices rose people bought less.'], answer: 1, why: 'A conjunction joins two clauses.' },
      { q: 'Which sentence is correct?', options: ['Although it was late we continued.', 'Although it was late, we continued.', 'Although, it was late we continued.'], answer: 1, why: 'Comma after the introductory clause.' },
      { q: 'Choose the correct punctuation:', options: ['My brother who lives in Rome is a chef.', 'My brother, who lives in Rome, is a chef.', 'My brother, who lives in Rome is a chef.'], answer: 1, why: 'A non-defining clause needs commas on both sides.' },
      { q: 'Which joins the ideas correctly?', options: ['Cars are convenient; however, they pollute.', 'Cars are convenient, however they pollute.', 'Cars are convenient however, they pollute.'], answer: 0, why: '"However" between clauses needs a semicolon before and a comma after.' },
    ],
  },
];

export interface PlacementQ { q: string; options: string[]; answer: number; level: 'A2' | 'B1' | 'B2' | 'C1' }

export const PLACEMENT: PlacementQ[] = [
  { q: 'I ___ to work by bus every day.', options: ['go', 'goes', 'going', 'am go'], answer: 0, level: 'A2' },
  { q: 'There isn’t ___ milk left.', options: ['some', 'any', 'many', 'a'], answer: 1, level: 'A2' },
  { q: 'She has lived here ___ 2018.', options: ['for', 'since', 'from', 'during'], answer: 1, level: 'A2' },
  { q: 'If I ___ more time, I would learn the piano.', options: ['have', 'had', 'will have', 'would have'], answer: 1, level: 'B1' },
  { q: 'The report ___ by the committee last week.', options: ['wrote', 'was written', 'has written', 'is writing'], answer: 1, level: 'B1' },
  { q: 'Choose the word closest in meaning to "reluctant":', options: ['eager', 'unwilling', 'tired', 'confused'], answer: 1, level: 'B1' },
  { q: '___ the heavy traffic, we arrived on time.', options: ['Although', 'Despite', 'However', 'Because'], answer: 1, level: 'B2' },
  { q: 'The policy had a significant ___ on unemployment.', options: ['affect', 'impact', 'result', 'cause'], answer: 1, level: 'B2' },
  { q: 'I wish I ___ harder at school.', options: ['studied', 'had studied', 'would study', 'study'], answer: 1, level: 'B2' },
  { q: 'Not only ___ late, but he also forgot the documents.', options: ['he arrived', 'did he arrive', 'he did arrive', 'arrived he'], answer: 1, level: 'C1' },
  { q: 'The findings ___ that further research is needed.', options: ['implicate', 'imply', 'infer', 'impose'], answer: 1, level: 'C1' },
  { q: 'Had the warning been heeded, the disaster ___.', options: ['would be avoided', 'might have been averted', 'was avoided', 'will be averted'], answer: 1, level: 'C1' },
];

/** Placement result → CEFR. Weighted so that harder items count more. */
export function placementLevel(correct: boolean[]): string {
  const w = { A2: 1, B1: 1.5, B2: 2, C1: 2.5 } as const;
  const max = PLACEMENT.reduce((s, q) => s + w[q.level], 0);
  const got = PLACEMENT.reduce((s, q, i) => s + (correct[i] ? w[q.level] : 0), 0);
  const r = got / max;
  return r >= 0.85 ? 'C1' : r >= 0.6 ? 'B2' : r >= 0.33 ? 'B1' : r >= 0.12 ? 'A2' : 'A1';
}
