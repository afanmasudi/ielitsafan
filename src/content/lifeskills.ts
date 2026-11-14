import type { LifeLevel } from '../lib/db';

export interface LifeTask { kind: 'examiner' | 'partner' | 'listen'; prompt: string; partnerLine?: string; listenText?: string; question?: string; options?: string[]; answer?: number }

export interface LifeTest { level: LifeLevel; minutes: number; topic: string; criteria: string[]; tasks: LifeTask[] }

/**
 * IELTS Life Skills is a Speaking and Listening test taken with an examiner and one other
 * candidate, graded Pass/Fail at A1, A2 or B1. Here the other candidate is simulated, which
 * cannot fully reproduce a real paired test.
 */
export const LIFE_TESTS: LifeTest[] = [
  {
    level: 'A1', minutes: 17, topic: 'Daily life and family',
    criteria: ['Answer simple questions', 'Ask simple questions', 'Understand short spoken information', 'Take part in a simple exchange'],
    tasks: [
      { kind: 'examiner', prompt: 'What is your name, and where do you live?' },
      { kind: 'examiner', prompt: 'Tell me about your family.' },
      { kind: 'partner', prompt: 'Ask your partner a question about their weekend.', partnerLine: 'Hi! I like to go to the park at the weekend. What about you?' },
      { kind: 'listen', prompt: 'Listen and answer.', listenText: 'The shop opens at nine o’clock and closes at half past five. It is closed on Sundays.', question: 'When is the shop closed?', options: ['Saturday', 'Sunday', 'Monday'], answer: 1 },
      { kind: 'partner', prompt: 'Your partner wants to meet for coffee. Agree on a day and a time.', partnerLine: 'Shall we have coffee this week? I am free on Tuesday or Thursday afternoon.' },
    ],
  },
  {
    level: 'A2', minutes: 20, topic: 'Shopping, services and health',
    criteria: ['Give information and describe experiences', 'Ask for and give simple opinions', 'Understand the main points of spoken information', 'Interact with a partner'],
    tasks: [
      { kind: 'examiner', prompt: 'Tell me about a shop you often go to. Why do you like it?' },
      { kind: 'examiner', prompt: 'What do you do when you feel ill?' },
      { kind: 'listen', prompt: 'Listen to the message and answer.', listenText: 'Hello, this is the Green Street dental surgery. Your appointment on Wednesday has been moved to Friday at ten fifteen. Please call us if this time is not convenient.', question: 'When is the new appointment?', options: ['Wednesday at 10.15', 'Friday at 10.15', 'Friday at 10.50'], answer: 1 },
      { kind: 'partner', prompt: 'Plan a birthday present for a friend with your partner. Discuss two ideas and choose one.', partnerLine: 'Our friend Sara loves cooking. Maybe we could buy her a recipe book, or take her to a restaurant. What do you think?' },
      { kind: 'partner', prompt: 'Ask your partner about their favourite way to travel around town.', partnerLine: 'I usually take the bus, but it is often late. How do you travel?' },
    ],
  },
  {
    level: 'B1', minutes: 22, topic: 'Work, education and community',
    criteria: ['Develop answers with reasons and examples', 'Express and justify opinions', 'Understand detailed spoken information', 'Negotiate and reach agreement with a partner'],
    tasks: [
      { kind: 'examiner', prompt: 'Describe a course or training you would like to do. How would it help you?' },
      { kind: 'examiner', prompt: 'Some people think local councils should spend more on parks. What is your opinion?' },
      { kind: 'listen', prompt: 'Listen to the announcement and answer.', listenText: 'Attention please. Because of engineering works, trains to Manchester will leave from platform six instead of platform two. A replacement bus service will run between Stockport and Manchester after eight p.m.', question: 'What will happen after 8 pm?', options: ['Trains will leave from platform two.', 'A bus will replace some trains.', 'The station will close.'], answer: 1 },
      { kind: 'partner', prompt: 'Your community centre has money for one new project: a youth club, a library corner or a community garden. Discuss with your partner and agree.', partnerLine: 'I think a youth club would be best, because teenagers here have nowhere to go in the evenings. But a community garden could bring different ages together. Which do you prefer, and why?' },
      { kind: 'partner', prompt: 'Your partner disagrees with you. Respond politely and try to reach an agreement.', partnerLine: 'I see your point, but I still think the youth club is more important. Could we find a compromise?' },
    ],
  },
];
