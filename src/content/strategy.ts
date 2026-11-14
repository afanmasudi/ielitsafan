import type { QType } from './types';

/**
 * Band 8.5+ strategy guide. Written for IELTS Studio in our own words, based on the public
 * band descriptors, official IELTS/IDP/British Council preparation pages and widely taught
 * approaches (see GUIDE_SOURCES). Examples are original.
 */
export interface StrategyCard {
  id: string;
  title: string;
  /** Question types this card explains (links from the tests). */
  types?: QType[];
  look: string;
  steps: string[];
  dos: string[];
  donts: string[];
  trick: string;
  example: { task: string; thinking: string; answer: string };
  route?: string;
}

export interface SkillGuide { skill: 'reading' | 'listening' | 'writing' | 'speaking'; label: string; band85: string[]; timePlan: string[]; cards: StrategyCard[] }

export const GUIDES: SkillGuide[] = [
  {
    skill: 'reading', label: 'Reading',
    band85: ['About 37–38 of 40 correct (Academic) or 39–40 (General Training). You can afford about 3 mistakes.', 'You never run out of time: Passage 3 gets the most minutes.', 'You answer from the text, never from what you already know.'],
    timePlan: ['Passage 1: 17 min', 'Passage 2: 20 min', 'Passage 3: 23 min (hardest)', 'No extra transfer time on computer, so answer as you go.'],
    cards: [
      {
        id: 'reading-approach', title: 'How to read any passage', route: '/reading',
        look: 'Look at the questions before the passage. Note each type, the word limit, and any names, dates or capital letters you can scan for.',
        steps: ['Read the title and the first line of each paragraph (about 1 minute) to build a map.', 'Take the questions in order: most types follow the order of the text.', 'Scan for the keyword (or its synonym), then read 2–3 sentences around it carefully.', 'Answer, mark the place in the text, and move on. Don’t re-read the whole passage.'],
        dos: ['Underline paraphrases: "rose" ↔ "increased", "most" ↔ "the majority".', 'Guess if you are stuck. There is no penalty.', 'Flag hard questions and return at the end.'],
        donts: ['Don’t read every word first. That wastes 10+ minutes.', 'Don’t spend more than 2 minutes on one question.', 'Don’t use your own knowledge.'],
        trick: '“Map, scan, zoom”: map the paragraphs, scan for the keyword, zoom into the sentence.',
        example: { task: 'Q: When did the museum first open to the public?', thinking: 'Scan for a year or a date near “opened / public / visitors”. Paragraph C says: “Visitors were first admitted in 1902.” Admitted = opened to the public.', answer: '1902' },
      },
      {
        id: 'tfng', title: 'True / False / Not Given (and Yes / No / Not Given)', types: ['tfng', 'ynng'], route: '/reading',
        look: 'TFNG checks facts; YNNG checks the writer’s opinions. Read each statement for its qualifiers: all, some, only, always, never, first, most.',
        steps: ['Underline the keywords and the qualifier in the statement.', 'Find the matching sentence in the text (answers come in order).', 'Ask: does the text say the same thing, the opposite, or nothing about this exact point?', 'Check the qualifier: “some” in the text vs “all” in the statement = False.'],
        dos: ['TRUE = same meaning in different words.', 'FALSE = the text clearly contradicts it.', 'NOT GIVEN = the text is silent on that exact point.'],
        donts: ['Don’t pick True just because the same words appear.', 'Don’t pick False because something is merely missing (that’s Not Given).', 'Don’t write T/F for a Yes/No question.'],
        trick: 'Contradiction test: “Could I quote a line that proves this wrong?” Yes → FALSE. No line at all → NOT GIVEN.',
        example: { task: 'Text: “Some early bicycles had no pedals.” Statement: “All early bicycles lacked pedals.”', thinking: 'The topic is found. The text says “some”, the statement says “all”, so the qualifier contradicts it.', answer: 'FALSE' },
      },
      {
        id: 'headings', title: 'Matching headings', types: ['headings'], route: '/reading',
        look: 'There are more headings than paragraphs. Headings describe the main idea of a whole paragraph, not one detail.',
        steps: ['Read paragraph by paragraph (not the headings first). Summarise each in 5 words.', 'Compare your summary with the headings and choose the closest main idea.', 'Cross out used headings (unless told otherwise).', 'Do the shortest or clearest paragraphs first; leave the hardest for last.'],
        dos: ['Focus on the first two and last sentences, but check the middle.', 'Watch for contrast words (however, but) that change the main point.'],
        donts: ['Don’t match a heading because it shares one word with the paragraph.', 'Don’t write the heading text when the instructions ask for the number (i, ii, iii).'],
        trick: '“What is this paragraph FOR?” Explain, compare, criticise, give history, propose a solution? Match the purpose.',
        example: { task: 'Paragraph: describes three studies, then says “however, none could be repeated”. Options: (i) Successful experiments (ii) Doubts about early findings.', thinking: 'The point of the paragraph is the “however”: the results could not be repeated.', answer: 'ii' },
      },
      {
        id: 'matching', title: 'Matching information, features and sentence endings', types: ['matching-info', 'matching-features', 'endings'], route: '/reading',
        look: 'Matching features: scan for names (easy, capital letters). Matching information: which paragraph contains a detail (anywhere, not in order). Sentence endings: grammar must fit.',
        steps: ['Features: underline every name in the text first, then read what each person claims.', 'Information: identify the type of detail (an example, a reason, a number), then scan.', 'Endings: read the beginning and predict the meaning; check the ending is grammatical too.', 'Check leftover options last: they are often distractors.'],
        dos: ['Expect paraphrase of what people say.', 'Remember a letter can be used more than once if the instructions say so.'],
        donts: ['Don’t assume matching-information answers are in order.', 'Don’t choose an ending that is true in general but not what the text says.'],
        trick: 'For endings, read the full sentence aloud in your head: if it sounds wrong grammatically, it is wrong.',
        example: { task: 'Beginning: “Researchers who studied sleeping rats…” Endings: A …found the brain replays experiences. B …a smell improves memory.', thinking: 'Rats + replay matches the Wilson paragraph; the smell was a human study.', answer: 'A' },
      },
      {
        id: 'completion', title: 'Summary, note, table, sentence and short-answer completion', types: ['summary', 'notes', 'table', 'sentence', 'short', 'flow', 'form'], route: '/reading',
        look: 'Check the word limit first (“ONE WORD ONLY”, “NO MORE THAN TWO WORDS AND/OR A NUMBER”). Then predict the type of word for each gap: noun, verb, number, adjective.',
        steps: ['Read around the gap and predict the grammar (a/an + noun? a plural?).', 'Find the section of the text (gaps follow the order of the text, except some summaries).', 'Copy the word(s) exactly as they appear in the text.', 'Re-read the completed sentence: grammar and meaning must both work.'],
        dos: ['Copy spelling exactly from the text.', 'Use singular/plural as the text and grammar require.'],
        donts: ['Don’t exceed the word limit. Over the limit = wrong, even if correct.', 'Don’t change the word form (e.g. “safe” for “safety”).'],
        trick: 'Grammar before meaning: “a ___” needs a singular noun; “they ___ the plan” needs a verb.',
        example: { task: 'Summary: “Plants cool the air through a process called ___.” (ONE WORD ONLY)', thinking: '“a process called” + noun. The text: “plants cool the air through evapotranspiration”.', answer: 'evapotranspiration' },
      },
      {
        id: 'mcq', title: 'Multiple choice', types: ['mcq'], route: '/reading',
        look: 'Read the question stem first and underline its key idea. The options are usually all mentioned in the text; only one answers the question.',
        steps: ['Find the part of the text that answers the stem.', 'Read that part carefully before reading the options.', 'Eliminate options that are false, not mentioned, or true but not the answer.', 'Choose the option that matches the meaning, not the words.'],
        dos: ['Cross out wrong options one by one.', 'Watch for options that are too extreme (“always”, “all”).'],
        donts: ['Don’t pick the option with the most words from the text: it is often the trap.'],
        trick: '“True but irrelevant” is the classic trap: an option can be correct information and still not answer the question.',
        example: { task: 'Q: Why did Drais build his machine? A faster than walking · B horses were costly · C cheap to build', thinking: 'The text links the invention to horses being expensive to feed after bad harvests. A may be true but isn’t the reason given.', answer: 'B' },
      },
    ],
  },
  {
    skill: 'listening', label: 'Listening',
    band85: ['About 37–38 of 40 correct (Band 8.5). Band 9 is 39–40.', 'Every spelling, plural and number is exact.', 'You are reading the next question while the audio is still talking.'],
    timePlan: ['Use every pause to read ahead: underline keywords, predict answers.', 'Computer test: about 2 minutes to check at the end. Paper test: 10 minutes to transfer answers.', 'Part 1 and 2 are easier: aim for 19–20/20 there.'],
    cards: [
      {
        id: 'listening-approach', title: 'How to listen to any part', route: '/listening',
        look: 'Before the audio: read the instructions (word limit!), the context line and every question in the section.',
        steps: ['Predict each answer type: name, number, date, noun, adjective.', 'Follow the questions in order: answers come in the order you hear them.', 'If you miss one, let it go and catch the next, then guess at the end.', 'Use the check time for spelling, plurals and word limits.'],
        dos: ['Listen for signposts: “first”, “the main reason”, “but actually”, “finally”.', 'Write numbers as digits (15, not fifteen) to save time.'],
        donts: ['Don’t write the first thing you hear: speakers often correct themselves.', 'Don’t leave any blank; there is no penalty for guessing.', 'Don’t get stuck on one gap and lose the next three.'],
        trick: '“Wait for the BUT”: “I was going to come on Tuesday… but actually Thursday is better.” The answer comes after the change.',
        example: { task: 'Form: Day of appointment: ___', thinking: 'Audio: “Monday’s fully booked, so… Wednesday morning? Oh wait, the doctor is off then. Let’s say Thursday.” Monday and Wednesday are distractors.', answer: 'Thursday' },
      },
      {
        id: 'l-completion', title: 'Form, note, table, flow-chart and sentence completion', types: ['form', 'notes', 'table', 'flow', 'sentence', 'short'], route: '/listening',
        look: 'Word limit, then grammar of each gap. Forms (Part 1) usually ask for names, numbers, addresses, dates and spelled words.',
        steps: ['Predict the type of answer and write a tiny note (e.g. “£?”, “day?”).', 'Listen for the speaker spelling names letter by letter. Write them in capitals as you hear them.', 'Check that the word fits the sentence grammatically.', 'Check spelling and plural -s at the end.'],
        dos: ['Know the spoken forms: “double L” = LL, “oh” = 0, “nine fifteen” = 9:15.', 'Learn the spelling of common topic words (accommodation, environment, government).'],
        donts: ['Don’t add words already printed next to the gap.', 'Don’t forget units if the gap needs them (but don’t repeat a printed “£”).'],
        trick: 'Part 1 = “the phone call”: names, numbers, dates, prices. Practise writing dictated phone numbers and postcodes.',
        example: { task: 'Address: 42 ___ Lane', thinking: 'Audio: “It’s Mill Lane… M-I-double L.” Word limit: one word.', answer: 'Mill' },
      },
      {
        id: 'l-mcq', title: 'Multiple choice and matching', types: ['mcq', 'matching-features'], route: '/listening',
        look: 'All options are usually mentioned. The speakers paraphrase the correct one and reject or qualify the others.',
        steps: ['Underline the difference between the options before the audio.', 'Listen for agreement and disagreement in conversations (“I’m not sure that’s right…”).', 'Matching: write the letters next to each item as you hear them; the list is not in audio order.', 'Decide only after the speaker has finished that point.'],
        dos: ['Note who agrees with whom in Part 3 discussions.', 'Expect synonyms: “out of date” for “too old”.'],
        donts: ['Don’t choose an option just because you heard its exact word.'],
        trick: 'Tick the options you hear rejected. The one left standing is usually the answer.',
        example: { task: 'Why did the students choose canteens? A tutor suggested it · B own data · C households overstudied', thinking: '“Mainly because we can collect our own data”: the word “mainly” signals the reason.', answer: 'B' },
      },
      {
        id: 'l-map', title: 'Maps and plans', types: ['map'], route: '/listening',
        look: 'Find the starting point (entrance, “you are here”) and the compass or orientation. Note the features already labelled.',
        steps: ['Put your finger on the starting point.', 'Follow the directions as they speak: left/right, opposite, next to, at the end of.', 'Answers come in order: when you hear the next place, move on.', 'Write the letter only.'],
        dos: ['Learn direction language: opposite, adjacent to, beyond, in the corner, alongside, the far side.'],
        donts: ['Don’t confuse left and right when the speaker faces a different direction from you on the map.'],
        trick: 'Turn your head (or the map in your mind) to face the way the speaker is walking.',
        example: { task: 'Where is the cloakroom?', thinking: '“Immediately on your right as you come through the main entrance” → the room just inside the entrance, on the right.', answer: 'H' },
      },
    ],
  },
  {
    skill: 'writing', label: 'Writing',
    band85: ['Task: fully answers every part with well-developed, extended ideas (Task 2: a clear position throughout).', 'Cohesion that is natural and almost invisible, with logical paragraphs.', 'Wide, precise vocabulary used naturally, with only rare slips.', 'A wide range of structures. Most sentences are error-free.'],
    timePlan: ['Task 1: 20 min (3 plan · 14 write · 3 check), 170–190 words.', 'Task 2: 40 min (5 plan · 30 write · 5 check), 270–320 words.', 'Do Task 2 first if you tend to run out of time: it is worth double.'],
    cards: [
      {
        id: 'task1-academic', title: 'Academic Task 1: charts, tables, maps, processes', route: '/writing',
        look: 'Ask: what are the 2–3 biggest features? (Highest/lowest, biggest change, overall trend, start versus end.) For maps: what was built or removed? For processes: how many stages, and what goes in versus what comes out?',
        steps: ['Introduction: paraphrase the question in one sentence.', 'Overview: 1–2 sentences on the main trends, with no numbers.', 'Body 1 and Body 2: group the data logically (e.g. rising items vs falling items) with key figures.', 'Compare as you go: twice as many as, whereas, compared with.'],
        dos: ['Put the overview right after the introduction so it is never missed.', 'Use a range of trend language: rose steadily, peaked at, plateaued, fell sharply.', 'Use the passive for processes and maps: “is heated”, “was replaced by”.'],
        donts: ['Don’t give opinions or reasons. Describe only.', 'Don’t list every number. Select and compare.', 'Don’t write a “conclusion” that just repeats details.'],
        trick: '“I-O-B-B”: Introduction, Overview, Body, Body. No overview = no Band 7+.',
        example: { task: 'Line graph: car use fell from 58% to 35% (2000–2020) while cycling rose from 5% to 25%.', thinking: 'Biggest features: the car decline and the cycling rise. Bus and walking were stable, so that’s Body 2.', answer: 'Overview: “Overall, driving declined steadily while cycling grew rapidly, whereas bus use and walking changed little.”' },
      },
      {
        id: 'task1-letter', title: 'General Training Task 1: letters', route: '/writing',
        look: 'Who are you writing to? That decides the tone. There are three bullet points, and each needs its own paragraph.',
        steps: ['Opening: state the purpose in the first sentence (“I am writing to…”).', 'One paragraph per bullet point, each developed with a detail.', 'Closing line: what you want to happen next.', 'Sign-off that matches the greeting.'],
        dos: ['Formal: “Dear Sir or Madam,” → “Yours faithfully,”. Named, formal: “Dear Mr Lee,” → “Yours sincerely,”.', 'Informal: contractions, friendly phrases, “Best wishes,”.', 'Invent believable details (dates, prices, names).'],
        donts: ['Don’t mix tones (“Hey” and “Yours faithfully”).', 'Don’t miss a bullet point: it caps your Task Achievement.', 'Don’t write addresses.'],
        trick: '“Faithfully when you don’t know the name; sincerely when you do.”',
        example: { task: 'Complain to a company about a late delivery.', thinking: 'Formal and no name, so “Dear Sir or Madam” and “Yours faithfully”. Bullets: what you ordered / the problem / what you want.', answer: 'Opening: “I am writing to complain about a bookcase I ordered on 3 March, which arrived five hours late and damaged.”' },
      },
      {
        id: 'task2', title: 'Task 2 essay: any question type', route: '/writing',
        look: 'Identify the type: opinion (agree/disagree), discussion (both views + yours), advantages/disadvantages, problem/solution, or two-part. Underline every part of the question: you must answer all of them.',
        steps: ['Plan for 5 minutes: decide your position and 2 main ideas with an example each.', 'Introduction: paraphrase the topic + clear position (2 sentences).', 'Two or three body paragraphs, each one idea using PEEL.', 'Conclusion: restate your position and main reasons (no new ideas).', 'Proofread for 3–5 minutes with the A-S-P-T checklist.'],
        dos: ['Keep the same position from the introduction to the conclusion.', 'Use specific examples (a country, a policy, a study) rather than “many people”.', 'Use a mix of complex sentences: although, which, if…would, not only…but also.'],
        donts: ['Don’t memorise templates or phrases like “It is a burning issue in this day and age”.', 'Don’t start every sentence with Firstly / Moreover / Furthermore.', 'Don’t use rare words you are unsure of. Precision beats complexity.'],
        trick: 'PEEL each paragraph: Point → Explain → Example → Link back to the question. Proofread with A-S-P-T: Articles, Subject–verb agreement, Plurals, Tense.',
        example: { task: '“Some say university should be free for all. To what extent do you agree?”', thinking: 'Opinion essay. Position: largely agree. Ideas: (1) equal opportunity, e.g. Germany abolished fees; (2) society benefits through tax and skilled jobs. Concession paragraph: the cost to taxpayers.', answer: 'Intro: “While free tuition is costly, I largely agree that higher education should be state-funded, because it widens opportunity and benefits society as a whole.”' },
      },
      {
        id: 'w-ai', title: 'Trending topic: AI, social media and online life in Task 2', route: '/writing',
        look: 'Technology essays usually ask about effects (jobs, education, health, privacy) and who should act (governments, companies, individuals, schools).',
        steps: ['Pick a clear position early; balanced essays still need a view.', 'Use one specific example per body paragraph (a sector, a country, a type of app).', 'Name the actor and the action in solutions: “Platforms should label…”, “Schools should teach digital literacy…”.', 'Show awareness of trade-offs (convenience vs privacy; speed vs accuracy).'],
        dos: ['Idea bank, benefits: efficiency, personalised learning, medical diagnosis, accessibility (translation, captions).', 'Idea bank, risks: job loss in routine work, misinformation and deepfakes, bias, privacy, over-reliance.', 'Idea bank, solutions: retraining, regulation, transparency, fact-checking, digital literacy education.'],
        donts: ['Don’t predict extremes (“robots will do every job”).', 'Don’t copy a memorised AI paragraph into an unrelated question.'],
        trick: 'For any tech question, ask “Who gains, who loses, who should act?”: three ideas for three paragraphs.',
        example: { task: '“Social media does more harm than good to young people. Do you agree?”', thinking: 'Who gains: connection, creativity. Who loses: mental health, misinformation. Who should act: platforms (age design), schools (digital literacy). Position: partly agree.', answer: 'Body sentence: “Social media allows teenagers to find communities and showcase creative work; however, algorithms that reward outrage can expose them to misinformation and harmful comparisons.”' },
      },
      {
        id: 'w-language', title: 'Language for Band 8: vocabulary and grammar', route: '/grammar',
        look: 'Band 8 vocabulary is precise and natural, not rare. Band 8 grammar is varied, and most sentences have no errors at all.',
        steps: ['Swap vague words: “a big problem” → “a pressing concern”; “good” → “beneficial / effective”.', 'Use collocations: “have a significant impact on”, “tackle the issue”, “a growing body of evidence”.', 'Vary sentence openings: “Although…”, “Faced with…”, “What matters most is…”.', 'Check every sentence once for one type of error at a time.'],
        dos: ['Paraphrase the question words in your introduction.', 'Use hedging for balance: tend to, are likely to, may well.'],
        donts: ['Don’t use idioms in essays (“a piece of cake”).', 'Don’t repeat the same key word 6 times; use synonyms and pronouns.'],
        trick: '“Clear beats clever”: one accurate complex sentence is worth more than three tangled ones.',
        example: { task: 'Improve: “Pollution is a very big problem and it makes many bad effects.”', thinking: 'Vague adjectives, wrong collocation (“makes effects”).', answer: '“Pollution is a pressing problem with serious consequences for public health.”' },
      },
    ],
  },
  {
    skill: 'speaking', label: 'Speaking',
    band85: ['Fluent with only rare hesitation, and any pauses are for ideas, not for words.', 'Wide, natural vocabulary including some idiomatic phrases, used accurately.', 'A full range of structures; most sentences are error-free.', 'Easy to understand throughout: stress, rhythm and intonation help meaning. Accent is not penalised.'],
    timePlan: ['Part 1 (4–5 min): 2–3 sentences per answer.', 'Part 2 (3–4 min): 1 min notes, speak for the full 2 minutes.', 'Part 3 (4–5 min): 4–6 sentences per answer, developed and balanced.'],
    cards: [
      {
        id: 'part1', title: 'Part 1: familiar topics', route: '/speaking',
        look: 'Simple personal questions. The examiner wants natural, extended answers, not speeches.',
        steps: ['Answer directly in the first few words.', 'Add a reason.', 'Add an example or detail (time, place, person).', 'Stop. Let the examiner ask the next question.'],
        dos: ['Use natural openers: “Well, to be honest…”, “Actually, …”.', 'Use different tenses: “I used to… but now I…”.'],
        donts: ['Don’t give one-word answers.', 'Don’t recite memorised answers: examiners notice and it can lower your score.'],
        trick: 'A-R-E: Answer → Reason → Example. Two or three sentences, every time.',
        example: { task: '“Do you like cooking?”', thinking: 'Answer + reason + example.', answer: '“Yes, I really enjoy it, mainly because it helps me unwind after work. Last weekend, for instance, I tried making a Thai curry from scratch, and it turned out surprisingly well.”' },
      },
      {
        id: 'part2', title: 'Part 2: the long turn (cue card)', route: '/speaking',
        look: 'You get a card with 3–4 prompts and 1 minute to prepare. Speak for up to 2 minutes; the examiner will stop you.',
        steps: ['Notes: 3–5 keywords per bullet, not sentences.', 'Start with one sentence that introduces your topic.', 'Tell it as a story: when, where, who, what happened, how you felt.', 'Spend the most time on the last “explain why” bullet. It is where you show range.', 'Keep talking until the examiner stops you.'],
        dos: ['Use past tenses accurately for past events.', 'Add sensory details and feelings to extend naturally.', 'Choose a topic you can speak about easily (it can be partly invented).'],
        donts: ['Don’t stop at one minute.', 'Don’t read your notes word by word.', 'Don’t panic over a perfect topic. Any honest example works.'],
        trick: 'Story frame: Set the scene → What happened → Why it mattered → How I feel now.',
        example: { task: '“Describe a skill you learned.”', thinking: 'Notes: swimming / age 25 / friend taught / scared of deep water / now swim weekly / confidence.', answer: '“I’d like to talk about learning to swim, which I only did when I was twenty-five…” (then follow the frame for 2 minutes)' },
      },
      {
        id: 'part3', title: 'Part 3: discussion', route: '/speaking',
        look: 'Abstract questions about society, not your personal life. The examiner tests how well you can explain, compare, speculate and justify.',
        steps: ['Give your opinion clearly.', 'Explain the reason.', 'Support it with a general example (a group of people, a country, a trend).', 'Consider the other side or the future, then round off.'],
        dos: ['Generalise: “Younger people tend to…”, “In many cities…”.', 'Use speculative language: “It’s likely that…”, “If governments…, we might see…”.', 'It’s fine to say “That’s a tricky question” and think briefly.'],
        donts: ['Don’t answer only with personal stories.', 'Don’t ask the examiner for their opinion; they can’t give it.'],
        trick: 'O-R-E-O: Opinion → Reason → Example → Other side (or Outcome).',
        example: { task: '“Should cities have more green spaces?”', thinking: 'Opinion: yes. Reason: health. Example: a park in a dense city. Other side: cost/land, with a solution.', answer: '“Definitely. Green spaces improve both physical and mental health. Seoul, for example, turned a motorway into a stream park that is now packed every weekend. Land is expensive, of course, but even rooftop gardens can make a real difference.”' },
      },
      {
        id: 's-ai', title: 'Trending topic: AI and technology questions', route: '/speaking',
        look: 'AI, social media and online learning now appear in every part of the test. Part 1 asks about your own use; Part 3 asks about jobs, education, risks and responsibility.',
        steps: ['Part 1: say which tool you use, what for, and one honest reaction (useful? trustworthy?).', 'Part 3: give a balanced view: one clear benefit, one real risk, then your position.', 'Support it with a concrete example: a chatbot in customer service, AI in medical scans, automatic translation.', 'Finish with a condition or prediction: “…as long as…”, “In the next decade, I expect…”.'],
        dos: ['Use precise topic words: automate, algorithm, rely heavily on, accountability, reskill.', 'Hedge sensibly: “AI is likely to…”, “It could, in some cases…”.', 'Give your own opinion; examiners want reasoning, not expert knowledge.'],
        donts: ['Don’t say “AI is good” or “AI is bad” and stop.', 'Don’t use buzzwords you can’t explain (“neural network”) just to sound clever.', 'Don’t worry if you rarely use AI; talk about what you have seen or read.'],
        trick: '“Benefit, Risk, Rule”: say what AI does well, what could go wrong, and the rule or condition that makes it work.',
        example: { task: 'Part 3: “Could AI ever replace human teachers?”', thinking: 'Benefit (personal explanations any time), Risk (no motivation or care, copying), Rule (AI supports, teachers lead).', answer: '“Not entirely, I think. AI tutors are brilliant at explaining a concept in different ways at midnight, but they can’t notice that a student is anxious or motivate a whole class. So I’d expect AI to take over routine marking, while teachers focus on the human side of learning.”' },
      },
      {
        id: 's-delivery', title: 'Fluency and pronunciation', route: '/speaking',
        look: 'Fluency means keeping going naturally, not speaking fast. Pronunciation means being easy to understand, not having a particular accent.',
        steps: ['Speak in chunks of 4–8 words with small pauses between ideas.', 'Stress the key word in each chunk.', 'Use fillers sparingly and naturally (“Let me think…”), not “um… um…”.', 'Record yourself and listen for mumbling or flat intonation.'],
        dos: ['Paraphrase when you forget a word: “the thing you use to… / a kind of…”.', 'Self-correct briefly and continue.'],
        donts: ['Don’t rush: speed causes errors and mumbling.', 'Don’t try to sound British or American. Clarity matters, not accent.'],
        trick: 'If you lose a word, describe it. Paraphrasing is rewarded, and silence is not.',
        example: { task: 'You forget the word “commute”.', thinking: 'Describe the idea instead of stopping.', answer: '“…the journey I make to work and back every day, which takes about an hour.”' },
      },
    ],
  },
];

export const EXAM_DAY = {
  before: ['Sleep normally the night before; no new material on the last day.', 'Bring the same ID you registered with. Arrive 30–45 minutes early.', 'Eat and drink water before you go in. The written papers run about 2 h 40 min without a break.'],
  during: ['Read every instruction: word limits and “letter only” cost easy marks.', 'Never leave a blank in Reading or Listening.', 'Watch the clock: move on after 2 minutes on one question.', 'Writing: plan first, then keep 3–5 minutes to proofread.', 'Speaking: ask “Could you repeat the question?” if you need to. It is allowed and not penalised.'],
  after: ['Don’t replay mistakes before Speaking. Each paper is scored separately.', 'If one skill went badly, IELTS One Skill Retake may be available (check your centre).'],
};

export const GUIDE_SOURCES = [
  { label: 'IELTS.org: Writing and Speaking band descriptors (public versions)', url: 'https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail' },
  { label: 'IDP: What Band 8 IELTS speakers do differently', url: 'https://ielts.com.au/australia/about/news-and-articles/article-what-band-8-ielts-speakers-do-differently-and-how-you-can-too' },
  { label: 'IDP: 10 tips for IELTS Speaking', url: 'https://ielts.idp.com/uae/prepare/article-10-tips-ielts-speaking' },
  { label: 'IDP: Listening mistakes to avoid', url: 'https://ielts.idp.com/bangladesh/about/news-and-articles/article-ielts-listening-mistakes-to-avoid' },
  { label: 'IDP: Academic Task 1, reaching Band 7 in Task Achievement', url: 'https://ielts.idp.com/prepare/article-ielts-academic-writing-task-1-how-to-reach-a-band-7-or-higher-in-task-achievement' },
  { label: 'IDP: The overview in Academic Task 1', url: 'https://ielts.idp.com/prepare/article-overview-task-1-ielts-academic-writing' },
  { label: 'IELTS Liz: True / False / Not Given tips', url: 'https://ieltsliz.com/category/ielts-reading/page/2/' },
];

/** Card that explains a given question type. Shared types (e.g. sentence completion) prefer the skill given. */
export function cardForType(type: QType, skill: 'reading' | 'listening'): StrategyCard | undefined {
  const g = GUIDES.find((x) => x.skill === skill)!;
  return g.cards.find((c) => c.types?.includes(type)) ?? GUIDES.flatMap((x) => x.cards).find((c) => c.types?.includes(type));
}

export const ALL_TRICKS = GUIDES.flatMap((g) => g.cards.map((c) => ({ skill: g.label, title: c.title, trick: c.trick, id: c.id })));
export const tipOfTheDay = (d = new Date()) => ALL_TRICKS[Math.floor(d.getTime() / 86_400_000) % ALL_TRICKS.length];
