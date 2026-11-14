import type { Step } from '../lib/speakingMachine';
import { freshFirst, normQ, type History } from '../lib/questionHistory';

/** Original question bank written for IELTS Studio, following the public test format. */
export const PART1_INTRO = ['What is your full name?', 'Do you work or are you a student?'];

export const PART1_TOPICS: Record<string, string[]> = {
  'Work and study': ['What do you do for work or study?', 'Why did you choose that job or subject?', 'What do you enjoy most about it?', 'Would you like to change anything about it in the future?'],
  'Home and accommodation': ['Do you live in a house or a flat?', 'What is your favourite room in your home? Why?', 'What would you like to change about your home?', 'Do you plan to live there for a long time?'],
  'Hometown': ['Where is your hometown?', 'What do you like about it?', 'Has it changed much since you were a child?', 'Is it a good place for young people? Why or why not?'],
  Hobbies: ['What do you like to do in your free time?', 'Did you have the same hobbies when you were a child?', 'Do you prefer hobbies you do alone or with others?', 'Is there a new hobby you would like to try?'],
  Food: ['What kind of food do you like?', 'Do you often cook at home?', 'Is there any food you disliked as a child but like now?', 'Do you think people eat more healthily than in the past?'],
  Travel: ['Do you like travelling?', 'Where did you go on your last trip?', 'Do you prefer travelling alone or with other people?', 'Where would you like to go in the future?'],
  Technology: ['How often do you use your phone each day?', 'What do you mainly use the internet for?', 'Is there any technology you could not live without?', 'Did you use computers much when you were younger?'],
  Education: ['What was your favourite subject at school?', 'Did you enjoy going to school?', 'Do you think you will study something new in the future?', 'What makes a good teacher, in your opinion?'],
  'Daily routine': ['What is a typical weekday like for you?', 'Are you a morning person or an evening person?', 'Has your routine changed recently?', 'What part of your day do you enjoy most?'],
  Weather: ['What kind of weather do you like?', 'What is the weather usually like where you live?', 'Does the weather affect your mood?', 'Do you check the weather forecast often?'],
  Music: ['What kind of music do you enjoy?', 'Do you listen to music while you work or study?', 'Have you ever learned to play an instrument?', 'Is live music popular where you live?'],
  Reading: ['Do you enjoy reading?', 'What did you like to read when you were a child?', 'Do you prefer printed books or e-books?', 'Is there a book you would recommend to others?'],
  // Trending themes (AI, social media, online learning, sustainability), written for IELTS Studio.
  'Artificial intelligence': ['Do you use any AI tools, such as chatbots or translation apps?', 'What do you usually use them for?', 'Do you trust the answers that AI tools give you? Why or why not?', 'Is there a task you would never want a machine to do for you?'],
  'Social media': ['Which social media apps do you use most?', 'How much time do you spend on social media each day?', 'Have you ever taken a break from social media?', 'Do you post things yourself, or mostly watch what others share?'],
  'Online learning': ['Have you ever taken a course online?', 'Do you prefer learning online or in a classroom?', 'What do you find difficult about studying on a screen?', 'Do you watch videos to learn new things?'],
  'Recycling and waste': ['Do you recycle at home?', 'Is it easy to recycle where you live?', 'Do you try to buy products with less packaging?', 'Did you learn about recycling at school?'],
};

export interface CueCard { id: string; theme: string; title: string; bullets: string[]; rounding: string[]; part3: string[] }

export const CUE_CARDS: CueCard[] = [
  { id: 'c1', theme: 'Education', title: 'Describe a skill you learned that you think is useful.', bullets: ['what the skill is', 'how you learned it', 'how long it took you to learn', 'and explain why you think it is useful'], rounding: ['Do you still use this skill often?'], part3: ['What skills do you think children should learn at school?', 'Is it better to learn a skill from a teacher or from the internet? Why?', 'Why do some adults find it difficult to learn new skills?', 'How might the skills employers want change in the next twenty years?', 'Should governments pay for adults to retrain? Why or why not?'] },
  { id: 'c2', theme: 'Places', title: 'Describe a place in your town or city where people go to relax.', bullets: ['where it is', 'what it looks like', 'what people do there', 'and explain why it is a good place to relax'], rounding: ['How often do you go there?'], part3: ['Why do people in cities find it hard to relax?', 'Should cities have more green spaces? Who should pay for them?', 'How has the way people spend their free time changed in your country?', 'Do you think working hours will become shorter in the future?'] },
  { id: 'c3', theme: 'People', title: 'Describe a person who has had a positive influence on you.', bullets: ['who this person is', 'how you know them', 'what they have done for you', 'and explain how they have influenced you'], rounding: ['Have you told this person how you feel?'], part3: ['Who has more influence on young people today: parents or celebrities?', 'What qualities make someone a good role model?', 'Is it the responsibility of famous people to behave well? Why?', 'How do friends influence the decisions people make?'] },
  { id: 'c4', theme: 'Technology', title: 'Describe a piece of technology that you find useful.', bullets: ['what it is', 'when you got it', 'how often you use it', 'and explain why it is useful to you'], rounding: ['Would you recommend it to older people?'], part3: ['How has technology changed the way people communicate?', 'Do you think people rely too much on technology? Why?', 'What are the disadvantages of children using smartphones?', 'Which jobs might disappear because of automation?', 'Should older people be helped to use new technology? How?'] },
  { id: 'c5', theme: 'Environment', title: 'Describe something you do to help protect the environment.', bullets: ['what you do', 'when you started doing it', 'how easy or difficult it is', 'and explain why you think it is important'], rounding: ['Do your friends or family do the same?'], part3: ['Whose responsibility is it to protect the environment: individuals or governments?', 'Why do some people not care about environmental problems?', 'Should companies be fined for producing too much waste?', 'Do you think public transport can replace private cars in big cities?'] },
  { id: 'c6', theme: 'Events', title: 'Describe a celebration or festival you enjoyed.', bullets: ['what it was', 'when and where it took place', 'who you celebrated with', 'and explain why you enjoyed it'], rounding: ['Would you like to celebrate it in the same way again?'], part3: ['Why are traditional festivals important to a society?', 'Have festivals become too commercial? Why?', 'How do young and old people celebrate differently?', 'Is it good for countries to adopt festivals from other cultures?'] },
  { id: 'c7', theme: 'Work', title: 'Describe a job you would like to do in the future.', bullets: ['what the job is', 'what skills or qualifications it needs', 'how you could get this job', 'and explain why you would like to do it'], rounding: ['Do you know anyone who does this job?'], part3: ['What makes a job satisfying?', 'Is salary the most important factor when choosing a career?', 'Should young people be given careers advice at school?', 'How will working from home change cities?'] },
  { id: 'c8', theme: 'Media', title: 'Describe a book, film or series that made you think.', bullets: ['what it was', 'when you read or watched it', 'what it was about', 'and explain why it made you think'], rounding: ['Would you watch or read it again?'], part3: ['Do films and books influence how people behave?', 'Why do some people prefer reading to watching films?', 'Should governments limit violent content on television?', 'How is the way people consume stories changing?'] },
  { id: 'c9', theme: 'Travel', title: 'Describe a journey you remember well.', bullets: ['where you went', 'how you travelled', 'who you were with', 'and explain why you remember this journey'], rounding: ['Do you enjoy long journeys?'], part3: ['What are the benefits of international travel for young people?', 'Does tourism do more harm than good to local communities?', 'How could air travel become more environmentally friendly?', 'Will people travel more or less in the future?'] },
  { id: 'c10', theme: 'Goals', title: 'Describe a goal you hope to achieve in the next few years.', bullets: ['what the goal is', 'why you chose it', 'what you are doing to achieve it', 'and explain how you will feel when you achieve it'], rounding: ['Have you shared this goal with anyone?'], part3: ['Is it important for people to set goals? Why?', 'Why do some people give up on their goals?', 'Do young people today have different goals from their parents?', 'Should success be measured by money?'] },
  { id: 'c11', theme: 'Health', title: 'Describe a healthy habit you have.', bullets: ['what the habit is', 'when you started it', 'how it helps you', 'and explain whether you would recommend it to others'], rounding: ['Is it difficult to keep this habit?'], part3: ['Why do many people find it hard to live healthily?', 'Should unhealthy food be taxed more heavily?', 'What can schools do to improve children’s health?', 'Is mental health discussed enough in your country?'] },
  { id: 'c13', theme: 'Artificial intelligence', title: 'Describe a time when you used artificial intelligence to help you with something.', bullets: ['what the task was', 'which AI tool you used', 'how well it worked', 'and explain how you felt about using AI for this'], rounding: ['Would you use it for the same task again?'], part3: ['Does artificial intelligence create more opportunities or more risks for workers?', 'Which jobs do you think AI will never be able to do well?', 'Should students be allowed to use AI tools for homework?', 'Who should be responsible when an AI system makes a serious mistake?', 'Could AI ever replace human teachers? Why or why not?'] },
  { id: 'c14', theme: 'Social media', title: 'Describe a piece of online content that changed your mind about something.', bullets: ['what it was (a video, post or article)', 'where you saw it', 'what it was about', 'and explain how it changed your opinion'], rounding: ['Did you share it with anyone?'], part3: ['Why does false information spread so quickly online?', 'Should social media companies be responsible for what users post?', 'How can young people learn to judge whether a source is reliable?', 'Has social media made people more or less connected?', 'Will traditional news media survive in the future?'] },
  { id: 'c15', theme: 'Online learning', title: 'Describe an online course, video or app that taught you something useful.', bullets: ['what it was', 'how you found it', 'what you learned', 'and explain why it was useful to you'], rounding: ['Would you recommend it to a friend?'], part3: ['What are the advantages of learning online compared with in a classroom?', 'Will universities still need physical campuses in the future?', 'Why do many people start online courses but never finish them?', 'Should governments make online education free for everyone?'] },
  { id: 'c16', theme: 'Change', title: 'Describe a time when you had to adapt to a big change.', bullets: ['what the change was', 'when it happened', 'how you adapted', 'and explain what you learned from the experience'], rounding: ['Do you usually find change easy or difficult?'], part3: ['Why do some people resist change at work?', 'How has remote working changed the way people live?', 'Do older people find it harder to adapt to new technology? Why?', 'What changes do you expect in the way people work over the next twenty years?'] },
  { id: 'c12', theme: 'Shopping', title: 'Describe something you bought recently that you are happy with.', bullets: ['what it was', 'where you bought it', 'how much it cost', 'and explain why you are happy with it'], rounding: ['Do you usually think carefully before buying things?'], part3: ['Why do people buy things they do not need?', 'How has online shopping affected high streets?', 'Is advertising aimed at children acceptable?', 'Do you think people will own fewer things in the future?'] },
];

export const PART1_FOLLOWUPS = ['Why is that?', 'Can you give me an example?', 'Has that always been the case?', 'Why do you say that?'];

const shuffle = <T,>(a: T[], rnd: () => number) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

/** Fresh items first, but keep their original order (questions within a topic flow naturally). */
function pickFresh(items: string[], n: number, history: History, rnd: () => number) {
  const chosen = new Set(freshFirst(items, (x) => x, history, rnd).slice(0, n));
  return items.filter((q) => chosen.has(q));
}

/**
 * A full three-part examination: Part 1 (4–5 min), Part 2 (3–4 min), Part 3 (4–5 min).
 * With a question history, topics, cue cards and questions the learner has not met recently come first.
 */
export function buildSpeakingExam(seed = Date.now(), opts: { parts?: (1 | 2 | 3)[]; cardId?: string; history?: History; examiner?: string } = {}): Step[] {
  const rnd = seeded(seed);
  const h = opts.history ?? {};
  const parts = opts.parts ?? [1, 2, 3];
  const name = opts.examiner ?? 'Emma';
  const card = CUE_CARDS.find((c) => c.id === opts.cardId) ?? freshFirst(CUE_CARDS, (c) => c.title, h, rnd)[0];
  const steps: Step[] = [];
  let n = 0;
  const id = () => `s${n++}`;
  if (parts.includes(1)) {
    steps.push({ id: id(), part: 0, kind: 'say', text: `Good morning. My name is ${name}, and I will be your examiner today. This speaking test is in three parts. In Part 1, I am going to ask you some questions about yourself.` });
    steps.push({ id: id(), part: 1, kind: 'question', text: PART1_INTRO[0] });
    steps.push({ id: id(), part: 1, kind: 'question', text: PART1_INTRO[1] });
    // Topic freshness = how many of its questions have never been asked.
    const topicNames = shuffle(Object.keys(PART1_TOPICS).filter((t) => t !== 'Work and study'), rnd);
    const unseen = (t: string) => PART1_TOPICS[t].filter((q) => !h[normQ(q)]).length;
    const topics = topicNames.sort((a, b) => unseen(b) - unseen(a)).slice(0, 2);
    for (const t of topics) {
      steps.push({ id: id(), part: 1, kind: 'say', text: `Now let's talk about ${t.toLowerCase()}.` });
      for (const q of pickFresh(PART1_TOPICS[t], 3, h, rnd)) steps.push({ id: id(), part: 1, kind: 'question', text: q });
    }
  }
  if (parts.includes(2)) {
    steps.push({ id: id(), part: 2, kind: 'say', text: 'Now I am going to give you a topic, and I would like you to talk about it for one to two minutes. You have one minute to think about what you are going to say. You can make some notes if you wish.' });
    steps.push({ id: id(), part: 2, kind: 'cue', text: card.title, bullets: card.bullets });
    steps.push({ id: id(), part: 2, kind: 'prep', text: 'Preparation time', seconds: 60 });
    steps.push({ id: id(), part: 2, kind: 'talk', text: 'Please begin speaking now. You have up to two minutes.', seconds: 120 });
    steps.push({ id: id(), part: 2, kind: 'question', text: card.rounding[0] });
  }
  if (parts.includes(3)) {
    steps.push({ id: id(), part: 3, kind: 'say', text: `We have been talking about ${card.title.replace(/^Describe /, '').replace(/\.$/, '')}. I would now like to ask you some more general questions related to this.` });
    for (const q of pickFresh(card.part3, 4, h, rnd)) steps.push({ id: id(), part: 3, kind: 'question', text: q });
  }
  steps.push({ id: id(), part: 3, kind: 'say', text: 'Thank you. That is the end of the speaking test.' });
  return steps;
}

export const READ_ALOUD = [
  'The library will be closed on Monday because the heating system needs to be repaired.',
  'Many scientists believe that renewable energy could supply most of the world’s electricity by the middle of the century.',
  'I usually catch the early train, although it is often crowded with commuters and students.',
  'Several thousand people visited the exhibition during its first month.',
  'She thought the weather would be warmer, so she left her heavy jacket at home.',
  'Developing reliable public transport requires long-term investment and careful planning.',
];
