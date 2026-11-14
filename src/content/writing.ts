import type { WritingPromptMeta } from '../lib/writingAnalysis';

export type ChartSpec =
  | { type: 'line' | 'bar'; title: string; unit: string; categories: string[]; series: { name: string; values: number[] }[] }
  | { type: 'pie'; title: string; charts: { name: string; slices: { label: string; value: number }[] }[] }
  | { type: 'table'; title: string; head: string[]; rows: (string | number)[][] }
  | { type: 'process'; title: string; steps: string[] }
  | { type: 'map'; title: string; panels: { name: string; features: { label: string; x: number; y: number; w: number; h: number; kind: 'building' | 'green' | 'water' | 'road' | 'parking' }[] }[] }
  | { type: 'mixed'; title: string; parts: ChartSpec[] };

export interface WritingPrompt extends WritingPromptMeta {
  id: string;
  title: string;
  test: 'academic' | 'general' | 'both';
  task: 1 | 2;
  chart?: ChartSpec;
  model: string;
  minutes: number;
}

const T1 = 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.';

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: 'a1-line', title: 'Line graph: commuting methods', test: 'academic', task: 1, kind: 'academic-task1', minutes: 20,
    prompt: `The graph below shows the percentage of workers in one city who commuted by car, bus, bicycle and on foot between 2000 and 2020. ${T1}`,
    keywords: ['car', 'bus', 'bicycle', 'foot', '2000', '2020', 'percentage'],
    chart: { type: 'line', title: 'Commuting method, % of workers', unit: '%', categories: ['2000', '2005', '2010', '2015', '2020'], series: [{ name: 'Car', values: [58, 55, 49, 42, 35] }, { name: 'Bus', values: [22, 24, 25, 24, 22] }, { name: 'Bicycle', values: [5, 7, 11, 17, 25] }, { name: 'On foot', values: [15, 14, 15, 17, 18] }] },
    model: `The line graph compares how workers in one city travelled to work over a twenty-year period from 2000 to 2020.

Overall, driving remained the most common way to commute, but it declined steadily, while cycling grew rapidly to become almost as popular. The proportions travelling by bus and on foot changed relatively little.

In 2000, 58% of workers drove to work, far more than any other group. This figure fell in every subsequent period, reaching 35% by 2020. Cycling followed the opposite pattern: just 5% of workers cycled at the start of the period, but this share rose sharply after 2010 and ended at 25%, a fivefold increase.

The bus was the second most popular choice in 2000, at 22%. It rose slightly to a peak of 25% in 2010 before returning to its original level. Walking was similarly stable, dipping to 14% in 2005 and then climbing gradually to 18% in 2020.`,
  },
  {
    id: 'a1-bar', title: 'Bar chart: household spending', test: 'academic', task: 1, kind: 'academic-task1', minutes: 20,
    prompt: `The bar chart below shows the average weekly spending of households in three age groups on four categories in 2023. ${T1}`,
    keywords: ['housing', 'food', 'transport', 'leisure', 'age', 'spending', 'week'],
    chart: { type: 'bar', title: 'Average weekly household spending (£), 2023', unit: '£', categories: ['Housing', 'Food', 'Transport', 'Leisure'], series: [{ name: 'Under 30', values: [210, 70, 55, 60] }, { name: '30–59', values: [180, 105, 85, 50] }, { name: '60+', values: [110, 90, 40, 75] }] },
    model: `The bar chart illustrates how much households in three age groups spent each week on housing, food, transport and leisure in 2023.

Overall, housing was the largest expense for every group, especially for the youngest households, while households aged 60 and over spent noticeably more on leisure than the other groups.

Households headed by people under 30 spent £210 a week on housing, compared with £180 for those aged 30 to 59 and only £110 for the oldest group. The youngest group also spent the least on food (£70), whereas the middle group spent the most, at £105, followed by the over-60s at £90.

Transport costs were highest among 30 to 59-year-olds, at £85, which was more than double the £40 spent by those over 60. In contrast, leisure spending showed the reverse pattern: the over-60s spent £75 a week, ahead of the under-30s at £60 and the middle group at £50.`,
  },
  {
    id: 'a1-pie', title: 'Pie charts: energy sources', test: 'academic', task: 1, kind: 'academic-task1', minutes: 20,
    prompt: `The pie charts below show the sources of electricity generated in one country in 2005 and 2025. ${T1}`,
    keywords: ['coal', 'gas', 'nuclear', 'wind', 'solar', '2005', '2025'],
    chart: { type: 'pie', title: 'Electricity generation by source (%)', charts: [{ name: '2005', slices: [{ label: 'Coal', value: 45 }, { label: 'Gas', value: 30 }, { label: 'Nuclear', value: 18 }, { label: 'Wind', value: 4 }, { label: 'Solar', value: 3 }] }, { name: '2025', slices: [{ label: 'Coal', value: 8 }, { label: 'Gas', value: 34 }, { label: 'Nuclear', value: 15 }, { label: 'Wind', value: 28 }, { label: 'Solar', value: 15 }] }] },
    model: `The two pie charts compare the sources used to generate electricity in one country in 2005 and 2025.

Overall, the country moved away from coal towards renewable energy, so that by 2025 wind and solar together produced more electricity than any single source except gas.

In 2005, coal was the main source, providing 45% of electricity, followed by gas at 30% and nuclear power at 18%. Renewable sources played only a minor role, with wind and solar contributing just 4% and 3% respectively.

Twenty years later, the picture had changed dramatically. Coal had fallen to only 8%, while wind power had risen sevenfold to 28% and solar to 15%. Gas became the largest single source, its share rising slightly to 34%. Nuclear power declined a little, from 18% to 15%, matching the figure for solar energy.`,
  },
  {
    id: 'a1-table', title: 'Table: museum visitors', test: 'academic', task: 1, kind: 'academic-task1', minutes: 20,
    prompt: `The table below shows the number of visitors (in thousands) to four museums in one city in 2010, 2015 and 2020. ${T1}`,
    keywords: ['science', 'history', 'art', 'children', 'visitors', '2010', '2020'],
    chart: { type: 'table', title: 'Museum visitors (thousands)', head: ['Museum', '2010', '2015', '2020'], rows: [['Science Museum', 420, 510, 260], ['History Museum', 380, 360, 190], ['Art Gallery', 250, 300, 140], ["Children's Museum", 90, 160, 120]] },
    model: `The table shows how many people, in thousands, visited four museums in a city in 2010, 2015 and 2020.

Overall, visitor numbers rose at most museums between 2010 and 2015 but fell sharply at all four in 2020. The Science Museum was the most visited throughout the period.

The Science Museum attracted 420,000 visitors in 2010, rising to 510,000 five years later, before dropping by roughly half to 260,000 in 2020. The Art Gallery followed a similar pattern, growing from 250,000 to 300,000 and then falling to 140,000.

The History Museum was the only one to lose visitors between 2010 and 2015, declining slightly from 380,000 to 360,000, and its figure halved to 190,000 in 2020. The Children's Museum was the least visited but grew the fastest, from 90,000 to 160,000, and its fall in 2020 was the smallest, to 120,000, which was still higher than its 2010 level of 90,000.`,
  },
  {
    id: 'a1-process', title: 'Process: making recycled paper', test: 'academic', task: 1, kind: 'academic-task1', minutes: 20,
    prompt: `The diagram below shows how waste paper is recycled to make new paper products. ${T1}`,
    keywords: ['collected', 'sorted', 'pulp', 'water', 'ink', 'dried', 'rolled', 'stages'],
    chart: { type: 'process', title: 'Recycling waste paper', steps: ['Waste paper collected from homes and offices', 'Paper sorted by type and grade', 'Shredded and mixed with water to form pulp', 'Pulp screened to remove plastic and staples', 'Ink removed by washing (de-inking)', 'Pulp pressed through rollers to remove water', 'Sheets heated and dried', 'Rolled into large reels and cut into products'] },
    model: `The diagram illustrates the stages involved in turning waste paper into new paper products.

Overall, the process consists of eight steps, beginning with the collection of used paper and ending with the production of finished rolls, and it can be divided into preparation, cleaning and manufacturing stages.

First, waste paper is collected from homes and offices and taken to a facility, where it is sorted according to its type and grade. It is then shredded and mixed with water to produce pulp. At the next stage, this pulp is screened so that unwanted materials such as plastic and staples are removed, after which the ink is washed out in a de-inking process.

Once the pulp is clean, it is pressed through rollers to squeeze out the water, and the resulting sheets are heated until they are dry. Finally, the paper is wound onto large reels and cut to make new products.`,
  },
  {
    id: 'a1-map', title: 'Maps: a village redevelopment', test: 'academic', task: 1, kind: 'academic-task1', minutes: 20,
    prompt: `The maps below show the village of Ashford in 2000 and today. ${T1}`,
    keywords: ['farmland', 'houses', 'school', 'park', 'car park', 'shop', 'road', 'river'],
    chart: { type: 'map', title: 'Ashford village', panels: [
      { name: '2000', features: [{ label: 'River', x: 0, y: 0, w: 100, h: 12, kind: 'water' }, { label: 'Main road', x: 45, y: 12, w: 10, h: 88, kind: 'road' }, { label: 'Farmland', x: 0, y: 14, w: 43, h: 50, kind: 'green' }, { label: 'Shop', x: 60, y: 20, w: 18, h: 14, kind: 'building' }, { label: 'Houses', x: 60, y: 45, w: 35, h: 25, kind: 'building' }, { label: 'Woodland', x: 0, y: 68, w: 43, h: 32, kind: 'green' }, { label: 'Field', x: 58, y: 76, w: 40, h: 22, kind: 'green' }] },
      { name: 'Today', features: [{ label: 'River', x: 0, y: 0, w: 100, h: 12, kind: 'water' }, { label: 'Main road', x: 45, y: 12, w: 10, h: 88, kind: 'road' }, { label: 'New houses', x: 0, y: 14, w: 43, h: 30, kind: 'building' }, { label: 'School', x: 0, y: 47, w: 43, h: 17, kind: 'building' }, { label: 'Supermarket', x: 58, y: 18, w: 26, h: 18, kind: 'building' }, { label: 'Car park', x: 86, y: 18, w: 14, h: 18, kind: 'parking' }, { label: 'Houses', x: 60, y: 45, w: 35, h: 25, kind: 'building' }, { label: 'Woodland', x: 0, y: 68, w: 43, h: 32, kind: 'green' }, { label: 'Park', x: 58, y: 76, w: 40, h: 22, kind: 'green' }] },
    ] },
    model: `The maps show how the village of Ashford has changed since 2000.

Overall, the village has become more residential and has gained new facilities, mainly on land that was previously farmland, while the river, the main road and the woodland have not changed.

In 2000, the area west of the main road was mostly farmland, with woodland to the south. Today, the northern part of this farmland has been replaced by new houses, and a school has been built just south of them. The woodland in the south-west remains.

On the eastern side of the road, the small shop has been demolished and replaced by a much larger supermarket, with a car park next to it. The existing houses in the centre are unchanged. Finally, the field in the south-east has been converted into a park, giving residents a public green space.`,
  },
  {
    id: 'a1-mixed', title: 'Mixed: table and bar chart on internet use', test: 'academic', task: 1, kind: 'academic-task1', minutes: 20,
    prompt: `The bar chart shows the percentage of adults in one country who used the internet daily in 2015 and 2025, by age group. The table shows the main online activity in 2025. ${T1}`,
    keywords: ['age', 'daily', '2015', '2025', 'activity', 'percentage', 'older'],
    chart: { type: 'mixed', title: 'Internet use', parts: [
      { type: 'bar', title: 'Daily internet users (%)', unit: '%', categories: ['16–24', '25–44', '45–64', '65+'], series: [{ name: '2015', values: [88, 80, 58, 21] }, { name: '2025', values: [98, 96, 85, 62] }] },
      { type: 'table', title: 'Main online activity, 2025', head: ['Age group', 'Main activity'], rows: [['16–24', 'Social media'], ['25–44', 'Work and email'], ['45–64', 'News'], ['65+', 'Video calls with family']] },
    ] },
    model: `The bar chart compares the proportion of adults in four age groups who went online every day in 2015 and 2025, and the table shows what each group mainly used the internet for in 2025.

Overall, daily internet use increased in every age group, with the most dramatic growth among older people, and the main purpose of going online differed clearly by age.

In 2015, daily use ranged from 88% of 16 to 24-year-olds down to just 21% of those aged 65 and over. By 2025, nearly all adults under 45 were online daily (98% and 96%), while the figure for 45 to 64-year-olds had risen to 85%. The over-65s saw the biggest change, as their share almost tripled to 62%.

According to the table, the youngest adults mainly used social media, whereas those aged 25 to 44 went online chiefly for work and email. People aged 45 to 64 mostly read the news, and the oldest group's main activity was making video calls to family.`,
  },
  {
    id: 'g1-formal', title: 'Formal letter: a complaint about a delivery', test: 'general', task: 1, kind: 'general-task1', tone: 'formal', minutes: 20,
    prompt: 'You recently ordered a piece of furniture online, but there was a problem with the delivery. Write a letter to the company. In your letter: explain what you ordered, describe the problem with the delivery, and say what you would like the company to do. Write at least 150 words. You do NOT need to write any addresses. Begin your letter as follows: Dear Sir or Madam,',
    keywords: ['ordered', 'delivery', 'damaged', 'refund', 'replace'],
    bullets: [['ordered', 'purchased', 'bought'], ['delivered', 'delivery', 'arrived', 'damaged', 'late'], ['would like', 'request', 'refund', 'replace', 'replacement']],
    model: `Dear Sir or Madam,

I am writing to complain about an order I placed on your website on 3 March (order number 48213).

I ordered a solid oak bookcase costing £340, which was due to be delivered on 10 March between 9 a.m. and 1 p.m. I arranged to take the morning off work in order to be at home to receive it.

Unfortunately, the delivery did not arrive until 5 p.m., and no one contacted me to explain the delay. Furthermore, when I unpacked the bookcase, I discovered that two of the shelves were cracked and one side panel was badly scratched. I have kept the packaging and taken photographs, which I have attached to this letter.

I would therefore like you to collect the damaged bookcase and deliver a replacement at a time that suits me. Alternatively, I would accept a full refund. I would also appreciate some compensation for the half-day of leave I lost.

I look forward to your prompt reply.

Yours faithfully,
Daniel Brooks`,
  },
  {
    id: 'g1-semi', title: 'Semi-formal letter: to your manager', test: 'general', task: 1, kind: 'general-task1', tone: 'semi-formal', minutes: 20,
    prompt: 'You would like to attend a training course that is related to your job. Write a letter to your manager. In your letter: describe the course, explain how it would help you in your work, and say how you would arrange your work while you are away. Write at least 150 words. You do NOT need to write any addresses. Begin your letter as follows: Dear …,',
    keywords: ['course', 'training', 'work', 'help', 'colleague', 'days'],
    bullets: [['course', 'training'], ['help', 'improve', 'benefit', 'useful'], ['arrange', 'cover', 'colleague', 'while i am away', 'deadline']],
    model: `Dear Ms Collins,

I am writing to ask whether I could attend a three-day course in project management, which is being run by the City Business School from 14 to 16 May.

The course covers planning, budgeting and how to manage risks, and it finishes with a recognised certificate. It costs £450, and I would be happy to contribute towards this if necessary.

As you know, I have recently started coordinating the new client accounts, and I often find it difficult to plan timelines realistically. I believe the course would help me organise projects more efficiently and communicate more clearly with clients about deadlines, which would benefit the whole team.

While I am away, my colleague James has kindly agreed to answer any urgent queries from my clients, and I will make sure that the monthly report is finished before I leave. I will also check my email at the end of each day.

I would be grateful if you could let me know your decision by the end of the month.

Kind regards,
Priya Shah`,
  },
  {
    id: 'g1-informal', title: 'Informal letter: invitation to a friend', test: 'general', task: 1, kind: 'general-task1', tone: 'informal', minutes: 20,
    prompt: 'You have recently moved to a new home. Write a letter to an English-speaking friend. In your letter: describe your new home, explain why you moved, and invite your friend to come and stay. Write at least 150 words. You do NOT need to write any addresses. Begin your letter as follows: Dear …,',
    keywords: ['moved', 'home', 'flat', 'house', 'stay', 'visit', 'invite'],
    bullets: [['flat', 'house', 'room', 'kitchen', 'garden', 'balcony'], ['moved because', 'because', 'reason', 'closer to', 'wanted'], ['come and stay', 'visit', 'invite', 'come over', 'stay with']],
    model: `Dear Sam,

I hope you're well! I've got some exciting news: I've finally moved into my own flat.

It's on the third floor of an old building near the river, and although it isn't very big, it's really bright. There's a cosy living room with a balcony where I've put lots of plants, a small but modern kitchen, and a spare bedroom, which is perfect for guests.

I decided to move mainly because my old place was over an hour from work, and I was spending far too much time on crowded buses. Now I can cycle to the office in fifteen minutes, and I've got much more free time in the evenings.

Why don't you come and stay for a weekend next month? We could explore the market on Saturday morning and go for a walk along the river. Let me know which dates suit you and I'll make sure the spare room is ready.

Write back soon!

Best wishes,
Leila`,
  },
  {
    id: 't2-ai-education', title: 'Opinion: AI tools in schools', test: 'both', task: 2, kind: 'task2', essayType: 'opinion', minutes: 40,
    prompt: 'Some people think that students should be allowed to use artificial intelligence tools, such as chatbots, for their schoolwork. Others believe this prevents them from learning properly. To what extent do you agree that AI tools should be allowed in schools? Write at least 250 words.',
    keywords: ['artificial intelligence', 'students', 'school', 'learn', 'tools', 'teachers'],
    model: `Artificial intelligence tools that can write essays and solve problems in seconds are now freely available, and schools are divided over whether students should be allowed to use them. In my view, these tools should be permitted, but only within clear rules that keep students doing the thinking themselves.

The main reason for allowing AI in schools is that students will need to use it in their future careers. Just as calculators became a normal part of mathematics lessons, AI assistants are quickly becoming standard tools in offices, hospitals and laboratories. If schools ban them completely, young people will leave education without knowing how to use these tools responsibly, for example how to check an answer that sounds convincing but is wrong.

Furthermore, AI can make learning more personal. A chatbot can explain a difficult concept in several different ways, at any time of day, which is particularly valuable for students who are too shy to ask questions in class or whose families cannot afford private tutors.

Admittedly, there is a real risk that some students will simply copy answers instead of developing their own skills. However, this problem can be reduced through careful design of assessments. Teachers can ask students to write in class, to explain their reasoning orally, or to show how they used and corrected an AI tool, which turns the technology into part of the learning process rather than a shortcut.

In conclusion, although AI tools can be misused, I believe that banning them would leave students unprepared for the modern world. Schools should instead teach students to use them critically and honestly.`,
  },
  {
    id: 't2-ai-jobs', title: 'Discussion: AI and the future of work', test: 'both', task: 2, kind: 'task2', essayType: 'discussion', minutes: 40,
    prompt: 'Some people believe that artificial intelligence will create more jobs than it destroys. Others think it will lead to widespread unemployment. Discuss both views and give your own opinion. Write at least 250 words.',
    keywords: ['artificial intelligence', 'jobs', 'unemployment', 'workers', 'create', 'skills'],
    model: `The rapid development of artificial intelligence has led to a heated debate about its effect on employment. While some people are confident that it will generate new jobs, others fear that millions of workers will be replaced. In my view, AI will create new work overall, but only if governments help people to retrain.

Those who are pessimistic point out that AI can already perform many tasks that once required human workers. Customer-service chatbots, automated translation and software that analyses legal documents are examples of technologies that reduce the need for staff. Because these changes are happening faster than previous technological revolutions, many workers may not have enough time to find new careers, particularly older employees in routine office jobs.

On the other hand, optimists argue that history supports their view. When computers spread in the 1980s and 1990s, many clerical roles disappeared, yet entirely new industries emerged, such as web design and digital marketing. Similarly, AI is already creating demand for data specialists, people who train and test AI systems, and professionals who combine technical knowledge with human skills like negotiation and care.

Personally, I believe the optimists are largely right, but the transition will be painful for some groups. The new jobs often require different skills from the ones that are lost, so a factory worker cannot simply become a data analyst overnight. This means that governments and companies should invest heavily in affordable training and support workers while they change careers.

In conclusion, although AI will certainly eliminate some jobs, I believe it is likely to create more than it destroys, provided that societies prepare workers for the change.`,
  },
  {
    id: 't2-misinformation', title: 'Problem and solution: false information online', test: 'both', task: 2, kind: 'task2', essayType: 'problem-solution', minutes: 40,
    prompt: 'False information spreads quickly on social media and can have serious consequences. What are the main causes of this problem, and what can be done to reduce it? Write at least 250 words.',
    keywords: ['false information', 'social media', 'spread', 'users', 'platforms', 'reduce'],
    model: `False information now travels across social media faster than ever, and it can damage public health, influence elections and harm individuals. This essay will discuss why the problem has become so serious and suggest several ways to tackle it.

The first cause is the way social media platforms are designed. Their algorithms tend to promote posts that attract strong reactions, and shocking or emotional stories, which are often untrue, generate more clicks and shares than careful, accurate reporting. As a result, misleading content can reach millions of people within hours. A second cause is that many users do not check sources before sharing. When a story confirms what people already believe, they are more likely to accept it without question. Finally, new AI tools have made it easy to produce realistic fake images and videos, which makes false information even harder to recognise.

Several measures could reduce the problem. Platforms should be required to label content that has been checked and found to be false, and to stop recommending accounts that repeatedly spread misinformation. Governments could support independent fact-checking organisations, as several European countries have done. However, the most important long-term solution is education. If schools teach young people how to verify a source, recognise manipulated images and think before sharing, they will be far less likely to spread false stories themselves.

In conclusion, misinformation spreads mainly because of platform design, careless sharing and powerful new technology. A combination of regulation, fact-checking and media education offers the best chance of controlling it.`,
  },
  {
    id: 't2-opinion', title: 'Opinion: university education should be free', test: 'both', task: 2, kind: 'task2', essayType: 'opinion', minutes: 40,
    prompt: 'Some people believe that university education should be free for all students, paid for by the government. To what extent do you agree or disagree? Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.',
    keywords: ['university', 'free', 'government', 'students', 'tax', 'education'],
    model: `In many countries, the cost of university is rising, and some argue that governments should cover tuition fees for everyone. While I accept that free education has costs, I largely agree that higher education should be funded by the state.

The strongest argument for free tuition is that it gives equal opportunities to talented young people regardless of their family's income. When students must pay high fees or take on large loans, those from poorer backgrounds are often discouraged from applying, even if they are capable. Germany, for instance, abolished tuition fees in 2014, partly to ensure that access to university depends on ability rather than wealth.

Furthermore, society as a whole benefits from a well-educated population. Graduates generally earn more and therefore pay more tax over their lifetimes, and they fill essential roles such as doctors, engineers and teachers. In this sense, public spending on universities can be seen as an investment that pays for itself.

Admittedly, free tuition places a heavy burden on public finances, and it could mean that taxpayers who never attend university pay for those who do. There is also a risk that some students would enrol without a clear purpose. However, these problems could be reduced by linking funding to academic performance or by limiting free places in subjects with few job prospects.

In conclusion, although making university free is expensive, I believe the benefits for fairness and for the economy outweigh the costs, provided that the system is managed carefully.`,
  },
  {
    id: 't2-discussion', title: 'Discussion: working from home', test: 'both', task: 2, kind: 'task2', essayType: 'discussion', minutes: 40,
    prompt: 'Some people think that working from home is better for employees, while others believe that working in an office is more productive. Discuss both views and give your own opinion. Write at least 250 words.',
    keywords: ['home', 'office', 'employees', 'productive', 'colleagues', 'commute'],
    model: `Since the pandemic, many companies have allowed staff to work remotely, and there is now considerable debate about whether this is preferable to working in an office. Both arrangements have merits, but in my view a combination of the two is most effective.

Supporters of home working point out that it saves employees time and money. Without a daily commute, which can take two hours in a large city, workers have more energy and a better work-life balance. In addition, many people find that they can concentrate more easily at home, away from the noise and interruptions of an open-plan office.

On the other hand, others argue that offices encourage productivity and teamwork. Face-to-face contact makes it easier to solve problems quickly and to share ideas informally, which is difficult to replicate on video calls. Offices are also important for new employees, who learn a great deal simply by observing more experienced colleagues. Moreover, some people who work from home struggle to separate their job from their personal life, and they may end up working longer hours.

Personally, I believe the best solution is a hybrid model, in which employees spend part of the week in the office for meetings and collaboration, and the rest at home for focused individual tasks. This allows organisations to keep the advantages of both approaches.

In conclusion, while home working offers flexibility and office working supports teamwork, a balanced arrangement is likely to benefit both employers and employees.`,
  },
  {
    id: 't2-advantages', title: 'Advantages and disadvantages: tourism', test: 'both', task: 2, kind: 'task2', essayType: 'advantages', minutes: 40,
    prompt: 'International tourism has grown rapidly in recent decades. Do the advantages of this development outweigh the disadvantages? Write at least 250 words.',
    keywords: ['tourism', 'tourists', 'economy', 'jobs', 'environment', 'culture', 'local'],
    model: `Over the past few decades, cheaper flights and rising incomes have led to a huge increase in international travel. Although mass tourism causes certain problems, I believe its advantages are greater than its disadvantages.

The main advantage of tourism is economic. It creates jobs in hotels, restaurants and transport, and it brings foreign currency into a country. For developing nations such as Thailand or Kenya, tourism is one of the most important sources of income, and it often funds roads and airports that benefit local people too. Another benefit is cultural understanding: travellers who experience other ways of life tend to become more open-minded and tolerant.

However, tourism also has drawbacks. Large numbers of visitors can damage the environment, from the carbon emissions of aircraft to the pollution of beaches and coral reefs. In popular cities such as Venice, residents complain that rising rents and overcrowding have forced them out of the historic centre. In addition, local traditions may be turned into commercial performances for tourists, losing their original meaning.

Nevertheless, most of these disadvantages can be managed through careful planning. Governments can introduce tourist taxes to pay for conservation, limit visitor numbers at fragile sites, and encourage visitors to travel outside the peak season. The economic and cultural benefits, by contrast, are difficult to achieve in any other way.

In conclusion, although international tourism can harm the environment and local communities, I believe its contribution to economies and to understanding between cultures outweighs these problems, provided it is well regulated.`,
  },
  {
    id: 't2-problem', title: 'Problem and solution: city traffic', test: 'both', task: 2, kind: 'task2', essayType: 'problem-solution', minutes: 40,
    prompt: 'Traffic congestion is becoming a serious problem in many cities around the world. What are the causes of this problem, and what measures could be taken to solve it? Write at least 250 words.',
    keywords: ['traffic', 'congestion', 'cars', 'public transport', 'roads', 'city'],
    model: `Traffic jams are now a daily reality in cities from London to Lagos, wasting time and polluting the air. This essay will examine the main causes of congestion and suggest some practical solutions.

The first cause is the rapid growth in car ownership. As incomes rise, more families can afford a car, and many people regard driving as more comfortable and convenient than public transport. A second cause is poor urban planning. In many cities, homes, offices and shops are far apart, so residents have little choice but to travel long distances every day. Finally, public transport in some places is unreliable, expensive or overcrowded, which pushes even more people into their cars.

Several measures could tackle these problems. The most effective is to invest in fast, frequent and affordable public transport, such as metro systems and dedicated bus lanes. When Bogotá introduced its TransMilenio bus network, millions of journeys moved off the roads. Governments could also discourage unnecessary driving by introducing congestion charges, as Stockholm has done, and use the money raised to improve services. In the longer term, planners should design mixed-use neighbourhoods where people can live, work and shop within walking or cycling distance.

In conclusion, congestion is caused mainly by rising car ownership, poorly planned cities and weak public transport. A combination of better transport, pricing policies and smarter planning offers the best chance of reducing it.`,
  },
  {
    id: 't2-twopart', title: 'Two-part question: reading for pleasure', test: 'both', task: 2, kind: 'task2', essayType: 'two-part', parts: 2, minutes: 40,
    prompt: 'Fewer young people today read books for pleasure. Why is this happening? What can be done to encourage young people to read more? Write at least 250 words.',
    keywords: ['young people', 'read', 'books', 'pleasure', 'phones', 'encourage', 'schools'],
    model: `It is widely reported that teenagers spend far less time reading books for enjoyment than previous generations did. In my view, this is mainly the result of competition from digital entertainment, but parents and schools can take steps to reverse the trend.

The most obvious reason is the rise of smartphones and social media. Short videos and games offer instant entertainment that requires little effort, so a novel, which demands sustained concentration, can seem slow by comparison. Another reason is that reading is often presented at school as a test-related task rather than a pleasure. When students are asked to analyse set texts for exams, they may come to associate books with pressure rather than enjoyment. In addition, busy timetables full of homework and activities leave young people little free time.

There are, however, several ways to encourage reading. First, schools could give students more freedom to choose what they read, including graphic novels and books linked to their hobbies, because people read more when the content interests them. Second, regular quiet reading time during the school day would help pupils build the habit. Parents also have an important role: children who see adults reading at home are more likely to read themselves. Finally, libraries could use technology positively, for example by lending e-books and audiobooks through an app.

In conclusion, young people read less mainly because of digital distractions and the way reading is taught. Giving them choice, time and good role models could help make reading enjoyable again.`,
  },
];

export const promptsFor = (test: 'academic' | 'general', task: 1 | 2) => WRITING_PROMPTS.filter((p) => p.task === task && (p.test === test || p.test === 'both'));
