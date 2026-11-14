import type { Passage } from './types';

/** Original passages written for IELTS Studio. Answer keys are checked by content.test.ts. */
export const PASSAGES: Passage[] = [
  {
    id: 'ac-bees', test: 'academic', section: 1, minutes: 20, title: 'Bees in the City',
    paragraphs: [
      { label: 'A', text: 'Over the past two decades, beehives have appeared on the rooftops of offices, hotels and apartment blocks in cities such as London, Paris and New York. In London alone, the number of registered hives more than doubled between 2008 and 2013. For many of the new beekeepers, keeping bees is a hobby that connects them with nature; for companies, a rooftop hive has become a visible symbol of environmental responsibility.' },
      { label: 'B', text: 'The movement grew partly out of concern about the decline of bees in the countryside. Intensive farming has removed many of the wild flowers and hedgerows on which bees depend, and certain pesticides have been shown to affect their ability to navigate. Cities, by contrast, can offer a surprising variety of food. Parks, private gardens, railway embankments and street trees flower at different times of year, so urban bees may find nectar from early spring until late autumn.' },
      { label: 'C', text: 'However, ecologists have begun to question whether more hives are always good news. The honeybee is only one of more than 250 bee species found in Britain, and most of the others are solitary bees that do not live in colonies or produce honey. A study published in 2019 by researchers at the Royal Botanic Gardens, Kew, found that in parts of central London the number of hives had grown so large that there might not be enough flowers to support them. When food is scarce, honeybees, which forage in large numbers, may outcompete wild species for the same nectar and pollen.' },
      { label: 'D', text: 'Disease is a further concern. Honeybee colonies kept close together can pass on parasites such as the varroa mite, and there is some evidence that viruses carried by honeybees can spread to bumblebees visiting the same flowers. Experienced beekeepers inspect their hives regularly, but critics point out that some corporate hives are installed for publicity and then managed by contractors who visit only a few times a year.' },
      { label: 'E', text: 'For these reasons, several conservation groups now argue that people who want to help bees should plant flowers rather than keep hives. A single window box of lavender or thyme, they say, can feed many different insects, and a garden that is left partly untidy provides nesting places for solitary bees, many of which lay their eggs in bare soil or hollow stems. Some cities have begun to create "bee corridors": chains of flower-rich spaces that allow insects to move safely across built-up areas.' },
      { label: 'F', text: 'None of this means that urban beekeeping should stop. Supporters note that hives can be a powerful educational tool, and that many beekeepers become passionate campaigners for wildlife. What the research suggests is that the number of hives needs to be matched to the amount of available forage. As one ecologist put it, "The question is not whether cities should have bees, but which bees, and how many."' },
    ],
    groups: [
      {
        type: 'tfng', instructions: 'Do the following statements agree with the information given in the passage? Choose TRUE, FALSE or NOT GIVEN.',
        items: [
          { n: 1, text: 'The number of registered hives in London increased by more than 100% between 2008 and 2013.', answer: ['TRUE'], evidence: 'the number of registered hives more than doubled between 2008 and 2013' },
          { n: 2, text: 'Some pesticides can affect bees’ sense of direction.', answer: ['TRUE'], evidence: 'certain pesticides have been shown to affect their ability to navigate' },
          { n: 3, text: 'Most bee species in Britain live in colonies.', answer: ['FALSE'], evidence: 'most of the others are solitary bees that do not live in colonies' },
          { n: 4, text: 'The Kew researchers recommended a legal limit on the number of hives in London.', answer: ['NOT GIVEN'], evidence: 'there might not be enough flowers to support them' },
          { n: 5, text: 'All corporate hives are looked after by the companies’ own employees.', answer: ['FALSE'], evidence: 'managed by contractors who visit only a few times a year' },
        ],
      },
      {
        type: 'summary', maxWords: 1, instructions: 'Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.',
        items: [
          { n: 6, text: 'Conservation groups suggest that, instead of keeping hives, people should plant ___.', answer: ['flowers'], evidence: 'should plant flowers rather than keep hives' },
          { n: 7, text: 'Even a window box of lavender or ___ can feed many different insects.', answer: ['thyme'], evidence: 'A single window box of lavender or thyme' },
          { n: 8, text: 'A garden that is left partly ___ provides nesting places for solitary bees.', answer: ['untidy'], evidence: 'a garden that is left partly untidy provides nesting places' },
          { n: 9, text: 'Many solitary bees lay their eggs in bare soil or hollow ___.', answer: ['stems'], evidence: 'lay their eggs in bare soil or hollow stems' },
        ],
      },
      {
        type: 'mcq', instructions: 'Choose the correct letter, A, B, C or D.',
        items: [
          { n: 10, text: 'According to paragraph A, why do companies keep rooftop hives?', options: ['to produce honey to sell', 'to show they care about the environment', 'to educate their staff', 'to reduce their costs'], answer: ['B'], evidence: 'a rooftop hive has become a visible symbol of environmental responsibility' },
          { n: 11, text: 'Why can cities provide bees with food over a long season?', options: ['Many flowers are imported.', 'Different plants flower at different times.', 'Temperatures in cities are higher.', 'Pesticides are banned in cities.'], answer: ['B'], evidence: 'flower at different times of year' },
          { n: 12, text: 'What may happen when food for bees is scarce?', options: ['Honeybees leave the city.', 'Honeybees produce less honey.', 'Honeybees compete with wild bees for food.', 'Wild bees attack honeybee hives.'], answer: ['C'], evidence: 'may outcompete wild species for the same nectar and pollen' },
          { n: 13, text: 'What is the main conclusion of the passage?', options: ['Urban beekeeping should be banned.', 'The number of hives should match the food available.', 'Only solitary bees should be encouraged.', 'Corporate hives are the main problem.'], answer: ['B'], evidence: 'the number of hives needs to be matched to the amount of available forage' },
        ],
      },
    ],
  },
  {
    id: 'ac-sleep', test: 'academic', section: 2, minutes: 20, title: 'Sleep and Memory',
    paragraphs: [
      { label: 'A', text: 'For most of history, sleep was regarded as a passive state in which the brain simply switched off. Only in the twentieth century, with the invention of the electroencephalogram (EEG), did scientists discover that the sleeping brain follows a regular cycle of distinct stages, including a phase of rapid eye movement (REM) in which brain activity closely resembles that of waking.' },
      { label: 'B', text: 'The idea that sleep might help memory was first tested in 1924, when the American psychologists John Jenkins and Karl Dallenbach asked two students to learn lists of nonsense syllables. The students remembered more after a period of sleep than after the same period awake. Jenkins and Dallenbach concluded that sleep protected memories from interference, because nothing new was being learned, but they did not suggest that sleep played an active role.' },
      { label: 'C', text: 'That more active view emerged in the 1990s. Working with rats, the neuroscientist Matthew Wilson recorded the activity of cells in the hippocampus, a brain region essential for forming memories of places. He found that the patterns of activity produced while a rat ran through a maze were repeated, at high speed, while the animal slept afterwards. This "replay" suggested that the brain was rehearsing the day’s experiences.' },
      { label: 'D', text: 'Further studies suggested that different stages of sleep may support different kinds of memory. Research led by the German scientist Jan Born indicated that deep, slow-wave sleep is particularly important for facts and events, while REM sleep appears to benefit skills and emotional memories. In one well-known experiment, Born’s team released the smell of roses while volunteers learned the positions of card pairs, and again while they were in slow-wave sleep. Those exposed to the smell during sleep remembered significantly more the next morning.' },
      { label: 'E', text: 'Not all researchers accept that sleep strengthens memory directly. The psychologist Jerome Siegel has argued that many of the reported effects are small and that the main function of sleep may be to save energy and keep animals safe during the hours when they cannot find food efficiently. Others point out that people taking certain antidepressants, which greatly reduce REM sleep, do not appear to suffer obvious memory problems.' },
      { label: 'F', text: 'Whatever the precise mechanism, the practical advice for students is consistent. Studies of learners who stay up all night before an examination show that they recall less than those who sleep normally, and short daytime naps of twenty to ninety minutes have been found to improve performance on a range of tasks. Revising material in the evening and then sleeping on it may therefore be one of the simplest ways to make learning last.' },
    ],
    groups: [
      {
        type: 'headings', instructions: 'Choose the correct heading for each paragraph from the list of headings below.',
        options: [
          { key: 'i', text: 'A challenge to the main theory' }, { key: 'ii', text: 'Evidence that the brain rehearses experiences' },
          { key: 'iii', text: 'Advice for learners' }, { key: 'iv', text: 'A technology that changed our understanding' },
          { key: 'v', text: 'An early experiment with a limited explanation' }, { key: 'vi', text: 'Matching sleep stages to types of memory' },
          { key: 'vii', text: 'The cost of sleep research' }, { key: 'viii', text: 'Why animals dream' }, { key: 'ix', text: 'Differences between children and adults' },
        ],
        items: [
          { n: 14, text: 'Paragraph A', answer: ['iv'], evidence: 'with the invention of the electroencephalogram (EEG), did scientists discover' },
          { n: 15, text: 'Paragraph B', answer: ['v'], evidence: 'but they did not suggest that sleep played an active role' },
          { n: 16, text: 'Paragraph C', answer: ['ii'], evidence: 'suggested that the brain was rehearsing the day’s experiences' },
          { n: 17, text: 'Paragraph D', answer: ['vi'], evidence: 'different stages of sleep may support different kinds of memory' },
          { n: 18, text: 'Paragraph E', answer: ['i'], evidence: 'Not all researchers accept that sleep strengthens memory directly' },
          { n: 19, text: 'Paragraph F', answer: ['iii'], evidence: 'the practical advice for students is consistent' },
        ],
      },
      {
        type: 'matching-features', instructions: 'Match each statement with the correct researcher(s), A–D. You may use any letter more than once.',
        options: [{ key: 'A', text: 'Jenkins and Dallenbach' }, { key: 'B', text: 'Matthew Wilson' }, { key: 'C', text: 'Jan Born' }, { key: 'D', text: 'Jerome Siegel' }],
        items: [
          { n: 20, text: 'used a smell to influence memory during sleep', answer: ['C'], evidence: 'released the smell of roses' },
          { n: 21, text: 'suggested that sleep may mainly serve to conserve energy', answer: ['D'], evidence: 'the main function of sleep may be to save energy' },
          { n: 22, text: 'believed sleep protected memories because no new learning took place', answer: ['A'], evidence: 'sleep protected memories from interference, because nothing new was being learned' },
          { n: 23, text: 'observed patterns of brain activity being repeated after an experience', answer: ['B'], evidence: 'were repeated, at high speed, while the animal slept afterwards' },
        ],
      },
      {
        type: 'sentence', maxWords: 2, instructions: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
        items: [
          { n: 24, text: 'During REM sleep, brain activity is similar to that of ___.', answer: ['waking'], evidence: 'closely resembles that of waking' },
          { n: 25, text: 'The hippocampus is essential for forming memories of ___.', answer: ['places'], evidence: 'essential for forming memories of places' },
          { n: 26, text: 'Daytime naps lasting from twenty to ___ minutes can improve performance.', answer: ['ninety', '90'], evidence: 'twenty to ninety minutes' },
        ],
      },
    ],
  },
  {
    id: 'ac-handwriting', test: 'academic', section: 3, minutes: 20, title: 'Should Schools Still Teach Handwriting?',
    paragraphs: [
      { label: 'A', text: 'In an age of keyboards and touchscreens, the question of whether schools should still spend time teaching handwriting has become surprisingly controversial. Several education systems have reduced the hours devoted to it, and in some places joined-up, or cursive, writing is no longer compulsory. I believe this trend is a mistake, although not for the reasons most often given.' },
      { label: 'B', text: 'Defenders of handwriting frequently appeal to tradition, arguing that a beautiful hand is a sign of a cultured person. This argument does not persuade me. Many great writers had appalling handwriting, and there is nothing inherently virtuous about neat letters. If handwriting is worth teaching, it must be because it does something useful for the learner.' },
      { label: 'C', text: 'There is growing evidence that it does. Studies using brain imaging have found that when young children practise forming letters by hand, areas of the brain associated with reading become more active than when they type or trace the same letters. The physical effort of shaping each letter seems to help children recognise it. This suggests that handwriting is not simply an alternative way of producing text but part of how literacy develops.' },
      { label: 'D', text: 'For older students, the most cited research concerns note-taking. In a widely reported 2014 study, students who took notes by hand performed better on conceptual questions than those who typed, apparently because the slower pace forced them to summarise rather than copy every word. Later attempts to repeat the study have produced mixed results, however, and I would not place too much weight on any single experiment. What seems clearer is that the habit of selecting and rephrasing information is valuable, whatever tool is used.' },
      { label: 'E', text: 'None of this means that typing should be neglected. Most adults now write far more on screens than on paper, and a student who cannot type quickly is at a disadvantage in many examinations and workplaces. Schools should teach both skills. Where I disagree with the reformers is in the assumption that time spent on handwriting is time wasted. In the early years, at least, it appears to support the very skills of reading and composition that schools most want to develop.' },
      { label: 'F', text: 'Cursive writing is a different matter. Its supposed advantages, speed and fluency, can be achieved with a clear, partly joined style, and the hours spent perfecting elaborate loops might be better used elsewhere. On this point I side with the reformers. What children need is legible, comfortable handwriting, not a particular style.' },
      { label: 'G', text: 'Finally, we should remember that handwriting is not only a school subject. A handwritten note can carry a personal warmth that an email rarely achieves, and for many people writing by hand is a way of thinking slowly and carefully. Those are not arguments for compulsion, but they are reminders that a skill can have value beyond its usefulness in examinations.' },
    ],
    groups: [
      {
        type: 'ynng', instructions: 'Do the following statements agree with the views of the writer? Choose YES, NO or NOT GIVEN.',
        items: [
          { n: 27, text: 'Schools are right to spend less time teaching handwriting.', answer: ['NO'], evidence: 'I believe this trend is a mistake' },
          { n: 28, text: 'Neat handwriting shows that a person is well educated.', answer: ['NO'], evidence: 'This argument does not persuade me' },
          { n: 29, text: 'Children who type letters learn to read more slowly than those who write them by hand.', answer: ['NOT GIVEN'], evidence: 'areas of the brain associated with reading become more active' },
          { n: 30, text: 'The results of the 2014 note-taking study should be treated with some caution.', answer: ['YES'], evidence: 'I would not place too much weight on any single experiment' },
          { n: 31, text: 'Students should be taught to type as well as to write by hand.', answer: ['YES'], evidence: 'Schools should teach both skills' },
        ],
      },
      {
        type: 'endings', instructions: 'Complete each sentence with the correct ending, A–F.',
        options: [
          { key: 'A', text: 'were forced to summarise rather than copy.' }, { key: 'B', text: 'might be better used for other things.' },
          { key: 'C', text: 'helps children to recognise each letter.' }, { key: 'D', text: 'always produce neater work.' },
          { key: 'E', text: 'are disadvantaged in many examinations.' }, { key: 'F', text: 'remember spelling rules more easily.' },
        ],
        items: [
          { n: 32, text: 'The physical effort of forming letters by hand', answer: ['C'], evidence: 'The physical effort of shaping each letter seems to help children recognise it' },
          { n: 33, text: 'In the 2014 study, students who took notes by hand', answer: ['A'], evidence: 'the slower pace forced them to summarise rather than copy every word' },
          { n: 34, text: 'Students who cannot type quickly', answer: ['E'], evidence: 'a student who cannot type quickly is at a disadvantage in many examinations' },
          { n: 35, text: 'The hours spent perfecting cursive loops', answer: ['B'], evidence: 'the hours spent perfecting elaborate loops might be better used elsewhere' },
        ],
      },
      {
        type: 'mcq', instructions: 'Choose the correct letter, A, B, C or D.',
        items: [
          { n: 36, text: 'What is the writer’s view of cursive writing?', options: ['It is essential for writing quickly.', 'It is not necessary.', 'It harms children’s reading.', 'It is important for tradition.'], answer: ['B'], evidence: 'What children need is legible, comfortable handwriting, not a particular style' },
          { n: 37, text: 'In paragraph D, what does the writer consider most valuable in note-taking?', options: ['the speed of writing', 'the tool that is used', 'selecting and rephrasing information', 'recording as many words as possible'], answer: ['C'], evidence: 'the habit of selecting and rephrasing information is valuable' },
          { n: 38, text: 'In the final paragraph, the writer says that handwriting', options: ['should be compulsory for adults.', 'can express personal warmth.', 'is mainly useful in examinations.', 'will disappear in the future.'], answer: ['B'], evidence: 'A handwritten note can carry a personal warmth' },
        ],
      },
      {
        type: 'short', maxWords: 2, instructions: 'Answer the questions below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
        items: [
          { n: 39, text: 'What research method showed that reading-related brain areas became more active?', answer: ['brain imaging'], evidence: 'Studies using brain imaging have found' },
          { n: 40, text: 'On what type of questions did handwriting note-takers perform better?', answer: ['conceptual', 'conceptual questions'], evidence: 'performed better on conceptual questions' },
        ],
      },
    ],
  },
  // ---------------- General Training ----------------
  {
    id: 'gt-classes', test: 'general', section: 1, minutes: 10, title: 'Northfield Community Centre: Evening Classes',
    paragraphs: [
      { label: 'A', text: 'Digital Photography. Learn to get the best from your camera or smartphone. The course covers composition, lighting and simple editing. Tuesdays 7–9 pm, 8 weeks, £96. Bring your own camera or phone. Suitable for complete beginners.' },
      { label: 'B', text: 'Conversational Spanish. For people with some basic knowledge who want to build confidence in speaking. Classes are taught entirely in Spanish by a native speaker. Wednesdays 6.30–8 pm, 10 weeks, £120 including course book.' },
      { label: 'C', text: 'Furniture Restoration. Bring an old chair or small table and learn to repair and refinish it. All tools are provided, but participants must buy their own materials (approximately £30). Thursdays 7–9.30 pm, 6 weeks, £110. Maximum 8 students.' },
      { label: 'D', text: 'Yoga for Beginners. Gentle exercises to improve flexibility and reduce stress. Wear loose clothing and bring a mat if you have one; a limited number are available to borrow. Mondays 6–7 pm, 10 weeks, £70. Not suitable for pregnant women; please ask about our separate antenatal class.' },
      { label: 'E', text: 'Creative Writing. Develop your short-story writing through weekly exercises and friendly feedback. At the end of the course, students’ work will be published in a free booklet. Wednesdays 7–9 pm, 8 weeks, £85. Concessions available for students and over-65s.' },
    ],
    groups: [
      {
        type: 'matching-info', instructions: 'Look at the five class descriptions, A–E. For which class are the following statements true? You may use any letter more than once.',
        options: [{ key: 'A', text: 'Digital Photography' }, { key: 'B', text: 'Conversational Spanish' }, { key: 'C', text: 'Furniture Restoration' }, { key: 'D', text: 'Yoga for Beginners' }, { key: 'E', text: 'Creative Writing' }],
        items: [
          { n: 1, text: 'Some previous knowledge of the subject is required.', answer: ['B'], evidence: 'For people with some basic knowledge' },
          { n: 2, text: 'Students have to pay extra for materials.', answer: ['C'], evidence: 'participants must buy their own materials' },
          { n: 3, text: 'Some groups of people can pay a reduced price.', answer: ['E'], evidence: 'Concessions available for students and over-65s' },
          { n: 4, text: 'The number of students is limited.', answer: ['C'], evidence: 'Maximum 8 students' },
          { n: 5, text: 'The price includes a book.', answer: ['B'], evidence: '£120 including course book' },
          { n: 6, text: 'Some equipment can be borrowed.', answer: ['D'], evidence: 'a limited number are available to borrow' },
          { n: 7, text: 'Participants’ work will be published.', answer: ['E'], evidence: 'students’ work will be published in a free booklet' },
        ],
      },
    ],
  },
  {
    id: 'gt-library', test: 'general', section: 1, minutes: 10, title: 'Riverside Library: Membership Information',
    paragraphs: [
      { text: 'Membership of Riverside Library is free for anyone who lives, works or studies in the borough. To join, bring one document showing your name and current address, such as a utility bill or bank statement dated within the last three months. Children under 16 can join with the signature of a parent or guardian.' },
      { text: 'Adult members may borrow up to 12 items at a time. Books can be kept for three weeks and DVDs for one week. Items may be renewed up to three times online, by phone or in person, unless another member has reserved them.' },
      { text: 'We no longer charge fines for late returns of children’s books. Adult items returned late are charged at 20p per day, up to a maximum of £5 per item. If an item is lost or damaged, you will be asked to pay the cost of a replacement.' },
      { text: 'Members can use the library computers free of charge for up to two hours a day. Printing costs 10p per black-and-white page and 50p per colour page. Wi-Fi is available throughout the building and does not require a password.' },
      { text: 'The study room on the first floor is reserved for silent study. Group study rooms can be booked up to two weeks in advance through the library website.' },
    ],
    groups: [
      {
        type: 'tfng', instructions: 'Do the following statements agree with the information in the text? Choose TRUE, FALSE or NOT GIVEN.',
        items: [
          { n: 8, text: 'People who work in the borough but live elsewhere can join for free.', answer: ['TRUE'], evidence: 'free for anyone who lives, works or studies in the borough' },
          { n: 9, text: 'A bank statement from six months ago is acceptable proof of address.', answer: ['FALSE'], evidence: 'dated within the last three months' },
          { n: 10, text: 'DVDs can be borrowed for longer than books.', answer: ['FALSE'], evidence: 'Books can be kept for three weeks and DVDs for one week' },
          { n: 11, text: 'Items that another member has reserved cannot be renewed.', answer: ['TRUE'], evidence: 'unless another member has reserved them' },
          { n: 12, text: 'There is no fine for returning children’s books late.', answer: ['TRUE'], evidence: 'We no longer charge fines for late returns of children’s books' },
          { n: 13, text: 'The library sells printer paper to members.', answer: ['NOT GIVEN'], evidence: 'Printing costs 10p per black-and-white page' },
          { n: 14, text: 'Group study rooms can be used free of charge.', answer: ['NOT GIVEN'], evidence: 'Group study rooms can be booked up to two weeks in advance' },
        ],
      },
    ],
  },
  {
    id: 'gt-safety', test: 'general', section: 2, minutes: 20, title: 'New Staff Guide: Health and Safety at Harlow Distribution Centre',
    paragraphs: [
      { text: 'Welcome to Harlow Distribution Centre. Before you begin work in the warehouse, you must complete a half-day induction with a member of the safety team. You will not be permitted to operate any equipment until this has been signed off by your supervisor.' },
      { text: 'Protective clothing. High-visibility vests must be worn at all times on the warehouse floor. Safety boots with steel toe caps are also compulsory; the company will reimburse up to £60 towards the cost of one pair per year, on presentation of a receipt. Gloves are provided free of charge and can be collected from the stores counter.' },
      { text: 'Lifting and handling. Most injuries in warehouses are caused not by machinery but by poor lifting technique. Before lifting any load, check its weight label. Loads over 25 kg must never be lifted by one person; use a trolley or ask a colleague for help. Keep the load close to your body and bend your knees, not your back.' },
      { text: 'Forklift trucks. Only staff who hold a valid company licence may drive forklift trucks. Training courses run every month and last five days. Pedestrians must use the walkways marked in green and must never walk behind a reversing vehicle.' },
      { text: 'Reporting incidents. All accidents, however minor, must be recorded in the accident book, which is kept in the first-aid room. Near misses (events which could have caused an injury but did not) should be reported to your supervisor on the same day, as they help us prevent future accidents.' },
      { text: 'Fire safety. The fire alarm is tested every Friday at 10 am; if it sounds at any other time, leave the building immediately by the nearest exit and go to the assembly point in the main car park. Do not stop to collect personal belongings. Fire marshals wear yellow helmets and will check that everyone is accounted for.' },
      { text: 'Breaks. Staff working an eight-hour shift are entitled to two fifteen-minute breaks and one thirty-minute lunch break. Food and drink may only be consumed in the staff canteen.' },
    ],
    groups: [
      {
        type: 'notes', maxWords: 1, instructions: 'Complete the notes below. Choose ONE WORD AND/OR A NUMBER from the text for each answer.',
        items: [
          { n: 15, text: 'New staff complete an induction with the ___ team.', answer: ['safety'], evidence: 'a half-day induction with a member of the safety team' },
          { n: 16, text: 'Company pays up to £___ a year towards safety boots.', answer: ['60'], evidence: 'reimburse up to £60 towards the cost of one pair per year' },
          { n: 17, text: 'Free gloves: collect from the ___ counter.', answer: ['stores'], evidence: 'can be collected from the stores counter' },
          { n: 18, text: 'Loads over ___ kg must not be lifted by one person.', answer: ['25'], evidence: 'Loads over 25 kg must never be lifted by one person' },
          { n: 19, text: 'Forklift training courses last ___ days.', answer: ['five', '5'], evidence: 'Training courses run every month and last five days' },
          { n: 20, text: 'Pedestrians use walkways marked in ___.', answer: ['green'], evidence: 'use the walkways marked in green' },
          { n: 21, text: 'The accident book is kept in the ___ room.', answer: ['first-aid', 'first aid'], evidence: 'which is kept in the first-aid room' },
        ],
      },
      {
        type: 'short', maxWords: 3, instructions: 'Answer the questions below. Choose NO MORE THAN THREE WORDS from the text for each answer.',
        items: [
          { n: 22, text: 'What causes most injuries in warehouses?', answer: ['poor lifting technique'], evidence: 'caused not by machinery but by poor lifting technique' },
          { n: 23, text: 'When should near misses be reported?', answer: ['the same day', 'same day', 'on the same day'], evidence: 'should be reported to your supervisor on the same day' },
          { n: 24, text: 'On which day of the week is the fire alarm tested?', answer: ['friday', 'every friday'], evidence: 'The fire alarm is tested every Friday at 10 am' },
          { n: 25, text: 'Where is the fire assembly point?', answer: ['main car park', 'the main car park', 'car park'], evidence: 'go to the assembly point in the main car park' },
          { n: 26, text: 'What colour are the fire marshals’ helmets?', answer: ['yellow'], evidence: 'Fire marshals wear yellow helmets' },
          { n: 27, text: 'Where may staff eat and drink?', answer: ['staff canteen', 'the staff canteen', 'canteen'], evidence: 'may only be consumed in the staff canteen' },
        ],
      },
    ],
  },
  {
    id: 'gt-bicycle', test: 'general', section: 3, minutes: 20, title: 'A Short History of the Bicycle',
    paragraphs: [
      { text: 'The first machine recognisable as a bicycle was built in 1817 by Karl von Drais, a civil servant in the German city of Mannheim. His "running machine" had two wheels in line and a steerable front wheel, but no pedals: riders pushed themselves along with their feet. Drais hoped it might replace the horse, which had become expensive to feed after a series of failed harvests, but the machine was banned from pavements in several cities and its popularity soon faded.' },
      { text: 'Pedals arrived in the 1860s, when French makers attached them directly to the front wheel. These machines, nicknamed "boneshakers" because of their iron tyres and wooden frames, were uncomfortable on rough roads. Since each turn of the pedals turned the front wheel only once, the only way to go faster was to make that wheel larger.' },
      { text: 'This led to the high-wheeler, or "penny-farthing", of the 1870s, whose front wheel could be up to 1.5 metres across. It was fast and, thanks to solid rubber tyres, smoother than the boneshaker, but it was also dangerous. Riders sat high above the front wheel, and a sudden stop could throw them over the handlebars. As a result, the high-wheeler was mainly ridden by athletic young men.' },
      { text: 'The breakthrough came in 1885, when the Englishman John Kemp Starley produced the "safety bicycle". It had two wheels of similar size and a chain that connected the pedals to the rear wheel, allowing gearing without a giant front wheel. Three years later, John Boyd Dunlop developed a practical air-filled tyre, initially to make his son’s tricycle more comfortable. The combination of the chain drive and pneumatic tyres produced a machine that is essentially the same as the bicycle we ride today.' },
      { text: 'The safety bicycle triggered a cycling boom in the 1890s. For the first time, ordinary people could travel independently over distances of many miles, and the bicycle was particularly significant for women. Cycling encouraged the adoption of more practical clothing, and the American campaigner Susan B. Anthony famously remarked that the bicycle had done more to emancipate women than anything else in the world.' },
      { text: 'In the twentieth century, the motor car replaced the bicycle as the main form of private transport in wealthy countries, although bicycles remained essential in much of Asia and Africa. Recently, however, concerns about pollution, congestion and health have revived interest in cycling. Cities such as Copenhagen and Amsterdam, where more than a third of journeys to work or school are made by bike, are often presented as models, and the electric bicycle has made cycling attractive to older riders and to people living in hilly areas.' },
    ],
    groups: [
      {
        type: 'table', maxWords: 1, instructions: 'Complete the table below. Choose ONE WORD AND/OR A NUMBER from the passage for each answer.',
        table: { head: ['Machine', 'Date', 'Key feature', 'Problem'], rows: [['Running machine', '1817', 'no {28}', 'banned from {29} in several cities'], ['Boneshaker', '1860s', 'iron tyres and wooden {30}', 'uncomfortable on rough roads'], ['Penny-farthing', '1870s', 'front wheel up to {31} metres across', '{32} for riders']] },
        items: [
          { n: 28, text: 'Running machine: no ___', answer: ['pedals'], evidence: 'but no pedals' },
          { n: 29, text: 'banned from ___ in several cities', answer: ['pavements'], evidence: 'banned from pavements in several cities' },
          { n: 30, text: 'iron tyres and wooden ___', answer: ['frames'], evidence: 'iron tyres and wooden frames' },
          { n: 31, text: 'front wheel up to ___ metres', answer: ['1.5'], evidence: 'up to 1.5 metres across' },
          { n: 32, text: '___ for riders', answer: ['dangerous'], evidence: 'but it was also dangerous' },
        ],
      },
      {
        type: 'mcq', instructions: 'Choose the correct letter, A, B, C or D.',
        items: [
          { n: 33, text: 'Why did Drais hope his machine would succeed?', options: ['It was faster than walking.', 'Horses had become costly to keep.', 'It was cheap to build.', 'The government supported it.'], answer: ['B'], evidence: 'the horse, which had become expensive to feed' },
          { n: 34, text: 'Why were the front wheels of boneshakers made larger?', options: ['to increase speed', 'to improve comfort', 'to make them safer', 'to reduce cost'], answer: ['A'], evidence: 'the only way to go faster was to make that wheel larger' },
          { n: 35, text: 'Dunlop first developed the air-filled tyre for', options: ['racing cyclists.', 'his own bicycle.', 'his son’s tricycle.', 'the safety bicycle.'], answer: ['C'], evidence: 'to make his son’s tricycle more comfortable' },
          { n: 36, text: 'According to the passage, electric bicycles have', options: ['replaced cars in Copenhagen.', 'attracted older riders.', 'reduced congestion.', 'become cheaper.'], answer: ['B'], evidence: 'attractive to older riders' },
        ],
      },
      {
        type: 'sentence', maxWords: 2, instructions: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
        items: [
          { n: 37, text: 'On a penny-farthing, a sudden stop could throw the rider over the ___.', answer: ['handlebars'], evidence: 'throw them over the handlebars' },
          { n: 38, text: 'The safety bicycle used a ___ to connect the pedals to the rear wheel.', answer: ['chain'], evidence: 'a chain that connected the pedals to the rear wheel' },
          { n: 39, text: 'The cycling boom encouraged women to adopt more ___.', answer: ['practical clothing'], evidence: 'the adoption of more practical clothing' },
          { n: 40, text: 'In Copenhagen and Amsterdam, more than a ___ of journeys to work or school are by bike.', answer: ['third'], evidence: 'more than a third of journeys to work or school' },
        ],
      },
    ],
  },
];

PASSAGES.push({
  id: 'ac-ai-marking', test: 'academic', section: 2, minutes: 12, practiceOnly: true, title: 'Can a Machine Mark Your Essay?',
  paragraphs: [
    { label: 'A', text: 'Automated essay scoring is not new. The first system, Project Essay Grade, was developed by Ellis Page in the 1960s, when computers filled entire rooms. It scored essays by counting features such as length and the number of commas, and its results were surprisingly close to those of human markers. Critics pointed out, however, that it could be fooled by long essays full of meaningless sentences.' },
    { label: 'B', text: 'Modern systems are far more sophisticated. Instead of counting surface features, many use machine-learning models trained on thousands of essays that humans have already marked. Large language models, the technology behind popular chatbots, can also comment on organisation and argument, something earlier programs could not do.' },
    { label: 'C', text: 'Yet researchers remain cautious. Studies have found that while automated scores often agree with human scores overall, they are less reliable when judging individual qualities such as the strength of an argument. Some systems also reward length and rare vocabulary too generously, which means a student can raise a score without improving the essay.' },
    { label: 'D', text: 'Fairness is a further concern. If the essays used for training were written mainly by one group of students, the system may mark others less accurately. For this reason, most experts recommend that automated scores should support teachers rather than replace them.' },
    { label: 'E', text: 'The most promising use of the technology may therefore be in practice rather than in high-stakes exams. Instant feedback allows learners to revise a draft several times in one evening, and many teachers believe that students who revise more often improve faster. In the end, the machine is most useful when it encourages people to keep writing.' },
  ],
  groups: [
    {
      type: 'tfng', instructions: 'Do the following statements agree with the information given in the passage? Choose TRUE, FALSE or NOT GIVEN.',
      items: [
        { n: 1, text: 'The first automated essay-scoring system was created in the 1960s.', answer: ['TRUE'], evidence: 'developed by Ellis Page in the 1960s' },
        { n: 2, text: 'Project Essay Grade could not be tricked by long essays.', answer: ['FALSE'], evidence: 'it could be fooled by long essays full of meaningless sentences' },
        { n: 3, text: 'Modern scoring systems are cheaper to build than early ones.', answer: ['NOT GIVEN'], evidence: 'Modern systems are far more sophisticated' },
        { n: 4, text: 'Automated scores are less dependable when judging how strong an argument is.', answer: ['TRUE'], evidence: 'they are less reliable when judging individual qualities such as the strength of an argument' },
      ],
    },
    {
      type: 'sentence', maxWords: 2, instructions: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
      items: [
        { n: 5, text: 'Early systems counted features such as length and the number of ___.', answer: ['commas'], evidence: 'such as length and the number of commas' },
        { n: 6, text: 'Modern models are trained on essays that ___ have already marked.', answer: ['humans'], evidence: 'thousands of essays that humans have already marked' },
      ],
    },
    {
      type: 'mcq', instructions: 'Choose the correct letter, A, B, C or D.',
      items: [
        { n: 7, text: 'Why might a scoring system mark some students less accurately?', options: ['They write longer essays.', 'The training essays came mainly from one group.', 'Teachers disagree about marks.', 'They use chatbots to write.'], answer: ['B'], evidence: 'If the essays used for training were written mainly by one group of students' },
        { n: 8, text: 'According to the writer, the technology is most useful for', options: ['high-stakes exams.', 'replacing teachers.', 'practice and revision.', 'counting vocabulary.'], answer: ['C'], evidence: 'The most promising use of the technology may therefore be in practice' },
      ],
    },
  ],
});

export const readingTest = (test: 'academic' | 'general') => PASSAGES.filter((p) => p.test === test && !p.practiceOnly);
