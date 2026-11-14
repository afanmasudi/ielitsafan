import type { QGroup } from './types';
import type { VoiceKey } from '../ai/tts';

export interface Line { speaker: string; voice: VoiceKey; text: string; say?: string }
export interface ListeningPart { id: string; part: 1 | 2 | 3 | 4; title: string; context: string; lines: Line[]; groups: QGroup[] }

/** Original scripts written for IELTS Studio and voiced in the browser. Checked by content.test.ts. */
export const LISTENING: ListeningPart[] = [
  {
    id: 'l1-leisure', part: 1, title: 'Joining a leisure centre', context: 'A man telephones a leisure centre to ask about membership.',
    lines: [
      { speaker: 'Receptionist', voice: 'ukF2', text: 'Good morning, Greenfield Leisure Centre. How can I help you?' },
      { speaker: 'Thomas', voice: 'ukM2', text: 'Hello. I’m thinking of joining the centre, and I wanted to ask a few questions.' },
      { speaker: 'Receptionist', voice: 'ukF2', text: 'Of course. I can take your details now and post you an application pack. Could I start with your name?' },
      { speaker: 'Thomas', voice: 'ukM2', text: 'Yes, it’s Thomas Hartley.' },
      { speaker: 'Receptionist', voice: 'ukF2', text: 'Could you spell your surname for me?' },
      { speaker: 'Thomas', voice: 'ukM2', text: 'Sure. H, A, R, T, L, E, Y.', say: 'Sure. H. A. R. T. L. E. Y.' },
      { speaker: 'Receptionist', voice: 'ukF2', text: 'Thank you. And what’s your address?' },
      { speaker: 'Thomas', voice: 'ukM2', text: 'It’s 42 Mill Lane, Westbury.', say: 'It’s forty-two Mill Lane, Westbury.' },
      { speaker: 'Receptionist', voice: 'ukF2', text: 'Is that Mill as in a windmill?' },
      { speaker: 'Thomas', voice: 'ukM2', text: 'That’s right, M, I, double L.', say: 'That’s right. M. I. double L.' },
      { speaker: 'Receptionist', voice: 'ukF2', text: 'And a contact number?' },
      { speaker: 'Thomas', voice: 'ukM2', text: 'My mobile is 07700 954318.', say: 'My mobile is zero seven seven zero zero, nine five four, three one eight.' },
      { speaker: 'Receptionist', voice: 'ukF2', text: 'Lovely. Now, we have three types of membership: standard, family and off-peak. Do you know which one you’d like?' },
      { speaker: 'Thomas', voice: 'ukM2', text: 'Well, I work shifts, so I’m usually free during the day. I think off-peak would suit me best.' },
      { speaker: 'Receptionist', voice: 'ukF2', text: 'Good choice. Off-peak members can use the centre on weekdays before 5 pm and all day at weekends.', say: 'Good choice. Off-peak members can use the centre on weekdays before five p.m. and all day at weekends.' },
      { speaker: 'Thomas', voice: 'ukM2', text: 'Before five? I thought it was before four.' },
      { speaker: 'Receptionist', voice: 'ukF2', text: 'It used to be, but we changed it in January. Can I ask how you heard about us?' },
      { speaker: 'Thomas', voice: 'ukM2', text: 'A colleague of mine is a member, and she recommended you.' },
      { speaker: 'Receptionist', voice: 'ukF2', text: 'That’s great. Do you have any injuries our instructors should know about?' },
      { speaker: 'Thomas', voice: 'ukM2', text: 'I hurt my knee playing football last year. It’s much better now, but I’ve been told to avoid running.' },
      { speaker: 'Receptionist', voice: 'ukF2', text: 'I’ll make a note of that. Now, off-peak membership includes several classes. There’s Pilates on Monday at 6:30 pm. Off-peak members can attend that one because it’s our quietest evening session.', say: 'I’ll make a note of that. Now, off-peak membership includes several classes. There’s Pilates on Monday at six thirty in the evening. Off-peak members can attend that one because it’s our quietest evening session.' },
      { speaker: 'Thomas', voice: 'ukM2', text: 'Great. What about swimming?' },
      { speaker: 'Receptionist', voice: 'ukF2', text: 'We have aqua fit in the main pool. That used to be on Tuesdays, but it’s now on Wednesday mornings at 10.', say: 'We have aqua fit in the main pool. That used to be on Tuesdays, but it’s now on Wednesday mornings at ten.' },
      { speaker: 'Receptionist', voice: 'ukF2', text: 'Then on Friday evenings at 7 there’s circuit training. It’s hard work, so please bring a towel. We provide drinking water, so you don’t need to bring that.', say: 'Then on Friday evenings at seven there’s circuit training. It’s hard work, so please bring a towel. We provide drinking water, so you don’t need to bring that.' },
      { speaker: 'Thomas', voice: 'ukM2', text: 'And is there anything at the weekend?' },
      { speaker: 'Receptionist', voice: 'ukF2', text: 'Yes, yoga on Saturday at 9 am. It’s suitable for beginners, so don’t worry if you’ve never tried it.', say: 'Yes, yoga on Saturday at nine a.m. It’s suitable for beginners, so don’t worry if you’ve never tried it.' },
      { speaker: 'Thomas', voice: 'ukM2', text: 'That sounds perfect. Thanks very much.' },
    ],
    groups: [
      {
        type: 'form', maxWords: 1, instructions: 'Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.',
        items: [
          { n: 1, text: 'Surname: ___', answer: ['hartley'], evidence: 'it’s Thomas Hartley' },
          { n: 2, text: 'Address: 42 ___ Lane, Westbury', answer: ['mill'], evidence: '42 Mill Lane, Westbury' },
          { n: 3, text: 'Mobile number: ___', answer: ['07700954318'], evidence: '07700 954318' },
          { n: 4, text: 'Type of membership: ___', answer: ['off-peak', 'off peak', 'offpeak'], evidence: 'I think off-peak would suit me best' },
          { n: 5, text: 'Off-peak: weekdays before ___ pm', answer: ['5', 'five'], evidence: 'weekdays before 5 pm' },
          { n: 6, text: 'Heard about the centre from a ___', answer: ['colleague'], evidence: 'A colleague of mine is a member' },
        ],
      },
      {
        type: 'table', maxWords: 1, instructions: 'Complete the table below. Write ONE WORD AND/OR A NUMBER for each answer.',
        table: { head: ['Class', 'Day', 'Time', 'Notes'], rows: [['Pilates', 'Monday', '{7} pm', 'quietest evening session'], ['Aqua fit', '{8}', '10 am', 'main pool'], ['Circuit training', 'Friday', '7 pm', 'bring a {9}'], ['Yoga', 'Saturday', '9 am', 'suitable for {10}']] },
        items: [
          { n: 7, text: 'Pilates time: ___ pm', answer: ['6:30', '6.30'], evidence: 'Pilates on Monday at 6:30 pm' },
          { n: 8, text: 'Aqua fit day: ___', answer: ['wednesday', 'wednesdays'], evidence: 'it’s now on Wednesday mornings at 10' },
          { n: 9, text: 'Circuit training: bring a ___', answer: ['towel'], evidence: 'please bring a towel' },
          { n: 10, text: 'Yoga: suitable for ___', answer: ['beginners'], evidence: 'It’s suitable for beginners' },
        ],
      },
    ],
  },
  {
    id: 'l2-museum', part: 2, title: 'A museum orientation talk', context: 'A volunteer guide welcomes visitors to a natural history museum.',
    lines: [
      { speaker: 'Guide', voice: 'usF', text: 'Good morning, everyone, and welcome to the Hallworth Museum of Natural History. My name’s Rachel, and I’m one of the volunteer guides. Before you start exploring, I’ll give you a quick overview of the ground floor, and then some practical information.' },
      { speaker: 'Guide', voice: 'usF', text: 'You’re standing in the entrance hall, and the reception desk is straight ahead of you. If you have coats or large bags, please leave them in the cloakroom, which is the small room immediately on your right as you come through the main entrance.' },
      { speaker: 'Guide', voice: 'usF', text: 'Most visitors want to see the dinosaurs first, and they’re in the large gallery in the back right-hand corner of the building. To get there, walk past reception and follow the corridor to the right.' },
      { speaker: 'Guide', voice: 'usF', text: 'If you have children with you, the children’s activity room is in the centre of the building, on the left-hand side of the courtyard. There are free craft sessions there every hour.' },
      { speaker: 'Guide', voice: 'usF', text: 'The café is right at the back of the building, directly opposite the main entrance, so you can’t miss it. It serves hot meals until 2 o’clock and snacks all afternoon.', say: 'The café is right at the back of the building, directly opposite the main entrance, so you can’t miss it. It serves hot meals until two o’clock and snacks all afternoon.' },
      { speaker: 'Guide', voice: 'usF', text: 'And finally, the gift shop. Many people expect it to be near the exit, but it’s actually in the front left-hand corner, so turn left as you come in and keep going until you reach the end of the corridor.' },
      { speaker: 'Guide', voice: 'usF', text: 'The building itself has an interesting history. It was built in 1870 as a railway hotel, then became a school in the 1920s, and it has only been a museum since 1965.', say: 'The building itself has an interesting history. It was built in eighteen seventy as a railway hotel, then became a school in the nineteen twenties, and it has only been a museum since nineteen sixty-five.' },
      { speaker: 'Guide', voice: 'usF', text: 'You’re welcome to take photographs anywhere in the museum, but please don’t use flash in the insect gallery, because bright light can damage the specimens.' },
      { speaker: 'Guide', voice: 'usF', text: 'Free guided tours leave from reception at 11 and at 3, and they last about forty-five minutes. If you’d prefer to explore on your own, audio guides are available for £3.', say: 'Free guided tours leave from reception at eleven and at three, and they last about forty-five minutes. If you’d prefer to explore on your own, audio guides are available for three pounds.' },
      { speaker: 'Guide', voice: 'usF', text: 'Right, I hope you enjoy your visit.' },
    ],
    groups: [
      {
        type: 'map', instructions: 'Label the plan below. Choose the correct letter, A–H.',
        map: { image: 'museum', labels: [{ key: 'A', x: 14, y: 56 }, { key: 'B', x: 14, y: 18 }, { key: 'C', x: 50, y: 12 }, { key: 'D', x: 86, y: 18 }, { key: 'E', x: 86, y: 56 }, { key: 'F', x: 34, y: 36 }, { key: 'G', x: 66, y: 36 }, { key: 'H', x: 62, y: 62 }] },
        items: [
          { n: 11, text: 'Cloakroom', answer: ['H'], evidence: 'the small room immediately on your right as you come through the main entrance' },
          { n: 12, text: 'Dinosaur gallery', answer: ['D'], evidence: 'in the large gallery in the back right-hand corner of the building' },
          { n: 13, text: 'Children’s activity room', answer: ['F'], evidence: 'in the centre of the building, on the left-hand side of the courtyard' },
          { n: 14, text: 'Café', answer: ['C'], evidence: 'directly opposite the main entrance' },
          { n: 15, text: 'Gift shop', answer: ['A'], evidence: 'it’s actually in the front left-hand corner' },
        ],
      },
      {
        type: 'mcq', instructions: 'Choose the correct letter, A, B or C.',
        items: [
          { n: 16, text: 'The museum building was originally', options: ['a school.', 'a hotel.', 'a railway station.'], answer: ['B'], evidence: 'It was built in 1870 as a railway hotel' },
          { n: 17, text: 'In the insect gallery, visitors must not', options: ['take photographs.', 'use flash.', 'touch the displays.'], answer: ['B'], evidence: 'please don’t use flash in the insect gallery' },
          { n: 18, text: 'Guided tours last about', options: ['30 minutes.', '45 minutes.', 'one hour.'], answer: ['B'], evidence: 'they last about forty-five minutes' },
        ],
      },
      {
        type: 'short', maxWords: 2, instructions: 'Answer the questions. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
        items: [
          { n: 19, text: 'Until what time does the café serve hot meals?', answer: ['2', '2 oclock', '2pm', '2 pm', 'two', 'two oclock', '14.00'], evidence: 'It serves hot meals until 2 o’clock' },
          { n: 20, text: 'How much does an audio guide cost?', answer: ['3', '£3', '3 pounds', 'three pounds'], evidence: 'audio guides are available for £3' },
        ],
      },
    ],
  },
  {
    id: 'l3-foodwaste', part: 3, title: 'Planning a presentation on food waste', context: 'Two students, Ana and Ben, discuss their presentation with their tutor.',
    lines: [
      { speaker: 'Tutor', voice: 'examinerM', text: 'So, Ana and Ben, how is your presentation on food waste coming along?' },
      { speaker: 'Ana', voice: 'usF', text: 'Quite well, I think. We’ve decided to focus on waste in the university canteens rather than in households.' },
      { speaker: 'Tutor', voice: 'examinerM', text: 'Why did you narrow it down?' },
      { speaker: 'Ben', voice: 'ukM2', text: 'Mainly because we can collect our own data. The canteen manager has agreed to let us weigh the food that’s thrown away for a week.' },
      { speaker: 'Tutor', voice: 'examinerM', text: 'Excellent. And what has surprised you most so far?' },
      { speaker: 'Ana', voice: 'usF', text: 'Honestly, how much bread gets wasted. We expected it to be vegetables, but bread was nearly a third of the total.' },
      { speaker: 'Tutor', voice: 'examinerM', text: 'Interesting. Let’s talk about your sources. You’ve got quite a list here.' },
      { speaker: 'Ben', voice: 'ukM2', text: 'Yes. The government report on household waste has lots of useful figures, so we’ll use it mainly for the statistics.' },
      { speaker: 'Ana', voice: 'usF', text: 'The newspaper article was good to read, but I’m not sure we should rely on it. It was written by someone who works for a company that sells food-waste machines, so it might be biased.' },
      { speaker: 'Tutor', voice: 'examinerM', text: 'Good point. What about your survey of students?' },
      { speaker: 'Ben', voice: 'ukM2', text: 'We got 120 responses, which is decent. We thought we’d present one student’s story in detail as a case study, to make it more personal.', say: 'We got a hundred and twenty responses, which is decent. We thought we’d present one student’s story in detail as a case study, to make it more personal.' },
      { speaker: 'Ana', voice: 'usF', text: 'Then there’s the supermarket website. To be honest, it’s too general. It just says waste is bad, without any detail about canteens.' },
      { speaker: 'Tutor', voice: 'examinerM', text: 'And the documentary?' },
      { speaker: 'Ben', voice: 'ukM2', text: 'It’s a great film, but it came out in 2009, and things have changed a lot since then, so it’s probably too out of date.', say: 'It’s a great film, but it came out in two thousand and nine, and things have changed a lot since then, so it’s probably too out of date.' },
      { speaker: 'Ana', voice: 'usF', text: 'Finally, the journal article. It’s very relevant, but it’s full of technical terms. I found it really hard to understand, so we’ll need to ask you about some parts.' },
      { speaker: 'Tutor', voice: 'examinerM', text: 'Happy to help. Now, how are you going to divide the presentation?' },
      { speaker: 'Ben', voice: 'ukM2', text: 'I’ll do the introduction and the results, and Ana will do the recommendations.' },
      { speaker: 'Tutor', voice: 'examinerM', text: 'And how long are you planning to speak?' },
      { speaker: 'Ana', voice: 'usF', text: 'The limit is fifteen minutes, but we’re aiming for twelve, to leave time for questions.' },
      { speaker: 'Tutor', voice: 'examinerM', text: 'Sensible. Make sure you practise together at least once before the day.' },
    ],
    groups: [
      {
        type: 'mcq', instructions: 'Choose the correct letter, A, B or C.',
        items: [
          { n: 21, text: 'Why did the students decide to focus on university canteens?', options: ['Their tutor suggested it.', 'They can collect their own data.', 'Household waste has been studied too much.'], answer: ['B'], evidence: 'Mainly because we can collect our own data' },
          { n: 22, text: 'What surprised the students?', options: ['the amount of vegetables wasted', 'the amount of bread wasted', 'the amount of meat wasted'], answer: ['B'], evidence: 'how much bread gets wasted' },
          { n: 23, text: 'Who will present the recommendations?', options: ['Ana', 'Ben', 'both students'], answer: ['A'], evidence: 'Ana will do the recommendations' },
          { n: 24, text: 'How long do the students plan to speak for?', options: ['10 minutes', '12 minutes', '15 minutes'], answer: ['B'], evidence: 'we’re aiming for twelve' },
        ],
      },
      {
        type: 'matching-features', instructions: 'What do the students say about each source? Choose the correct letter, A–F.',
        options: [{ key: 'A', text: 'too out of date' }, { key: 'B', text: 'useful for statistics' }, { key: 'C', text: 'might be biased' }, { key: 'D', text: 'will be used as a case study' }, { key: 'E', text: 'too general' }, { key: 'F', text: 'difficult to understand' }],
        items: [
          { n: 25, text: 'government report', answer: ['B'], evidence: 'we’ll use it mainly for the statistics' },
          { n: 26, text: 'newspaper article', answer: ['C'], evidence: 'so it might be biased' },
          { n: 27, text: 'student survey', answer: ['D'], evidence: 'present one student’s story in detail as a case study' },
          { n: 28, text: 'supermarket website', answer: ['E'], evidence: 'it’s too general' },
          { n: 29, text: 'documentary film', answer: ['A'], evidence: 'it’s probably too out of date' },
          { n: 30, text: 'journal article', answer: ['F'], evidence: 'I found it really hard to understand' },
        ],
      },
    ],
  },
  {
    id: 'l4-heat', part: 4, title: 'Lecture: the urban heat island effect', context: 'A lecturer gives a talk about why cities are warmer than the countryside.',
    lines: [
      { speaker: 'Lecturer', voice: 'examinerM', text: 'Good afternoon. Today I’m going to talk about the urban heat island effect: the fact that cities are often significantly warmer than the countryside around them. On a calm summer night, the difference can be as much as 7 degrees Celsius.', say: 'Good afternoon. Today I’m going to talk about the urban heat island effect: the fact that cities are often significantly warmer than the countryside around them. On a calm summer night, the difference can be as much as seven degrees Celsius.' },
      { speaker: 'Lecturer', voice: 'examinerM', text: 'Let’s start with the causes. The first is the materials cities are built from. Concrete, brick and asphalt absorb heat from the sun during the day and release it slowly at night, so city streets stay warm long after sunset.' },
      { speaker: 'Lecturer', voice: 'examinerM', text: 'The second cause is the lack of vegetation. In the countryside, plants cool the air through a process called evapotranspiration, which is water evaporating from leaves, rather like sweat cooling our skin.' },
      { speaker: 'Lecturer', voice: 'examinerM', text: 'The third cause is waste heat from human activity: air conditioners, vehicles and factories all release heat directly into the air. And finally, the shape of the city matters. Tall buildings close together trap heat and reduce the wind that would otherwise carry it away.' },
      { speaker: 'Lecturer', voice: 'examinerM', text: 'Why does this matter? The most serious effect is on health. During heatwaves, death rates rise sharply in cities, and the elderly are particularly at risk. Higher temperatures also increase demand for electricity, because more people use air conditioning, and this produces even more waste heat.' },
      { speaker: 'Lecturer', voice: 'examinerM', text: 'So what can be done? Let me describe how one city, Medellín in Colombia, tackled the problem. First, the city identified the hottest streets using satellite data. Next, it planted trees along these streets and beside waterways, creating what it called green corridors.' },
      { speaker: 'Lecturer', voice: 'examinerM', text: 'Then, local residents were trained as gardeners to look after the plants. Finally, the city measured the results: in the green corridors, temperatures fell by around 2 degrees.', say: 'Then, local residents were trained as gardeners to look after the plants. Finally, the city measured the results: in the green corridors, temperatures fell by around two degrees.' },
      { speaker: 'Lecturer', voice: 'examinerM', text: 'Other measures include cool roofs, which are painted white or a light colour so that they reflect sunlight rather than absorbing it. Some cities are also experimenting with permeable pavements, which allow rainwater to soak through and then evaporate, cooling the surface.' },
      { speaker: 'Lecturer', voice: 'examinerM', text: 'To conclude, the urban heat island effect is largely a result of how we design cities, which means that, with careful planning, it can be reduced.' },
    ],
    groups: [
      {
        type: 'notes', maxWords: 1, instructions: 'Complete the notes below. Write ONE WORD ONLY for each answer.',
        items: [
          { n: 31, text: 'Building materials absorb heat by day and release it at ___', answer: ['night'], evidence: 'release it slowly at night' },
          { n: 32, text: 'Plants cool the air through ___', answer: ['evapotranspiration'], evidence: 'a process called evapotranspiration' },
          { n: 33, text: 'Waste heat comes from air conditioners, vehicles and ___', answer: ['factories'], evidence: 'air conditioners, vehicles and factories' },
          { n: 34, text: 'Tall buildings close together reduce the ___', answer: ['wind'], evidence: 'reduce the wind that would otherwise carry it away' },
        ],
      },
      {
        type: 'flow', maxWords: 1, instructions: 'Complete the flow chart. Write ONE WORD ONLY for each answer.',
        items: [
          { n: 35, text: 'Hottest streets identified using ___ data', answer: ['satellite'], evidence: 'identified the hottest streets using satellite data' },
          { n: 36, text: 'Trees planted along streets and waterways to create green ___', answer: ['corridors'], evidence: 'creating what it called green corridors' },
          { n: 37, text: 'Local residents trained as ___', answer: ['gardeners'], evidence: 'local residents were trained as gardeners' },
        ],
      },
      {
        type: 'sentence', maxWords: 2, instructions: 'Complete the sentences. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
        items: [
          { n: 38, text: 'On a calm summer night, cities can be up to ___ degrees warmer than the countryside.', answer: ['7', 'seven'], evidence: 'as much as 7 degrees Celsius' },
          { n: 39, text: 'During heatwaves, the ___ are particularly at risk.', answer: ['elderly'], evidence: 'the elderly are particularly at risk' },
          { n: 40, text: 'Cool roofs are light in colour so that they ___ sunlight.', answer: ['reflect'], evidence: 'so that they reflect sunlight' },
        ],
      },
    ],
  },
];

export const transcriptOf = (p: ListeningPart) => p.lines.map((l) => l.text).join(' ');
