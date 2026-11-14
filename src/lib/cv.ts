/** Browser-side CV parsing. Files are read locally; nothing is uploaded. */
export type CvSections = Record<'education' | 'experience' | 'projects' | 'skills' | 'achievements' | 'hobbies' | 'goals', string[]>;

const HEADINGS: [keyof CvSections, RegExp][] = [
  ['education', /^(education|academic|qualifications?|studies)\b/i],
  ['experience', /^(work |professional |employment )?(experience|employment|work history|career history|positions?)\b/i],
  ['projects', /^(projects?|portfolio|research)\b/i],
  ['skills', /^(skills?|technical skills|competenc|languages?|tools)\b/i],
  ['achievements', /^(achievements?|awards?|honou?rs|certifications?|accomplishments?|publications?)\b/i],
  ['hobbies', /^(hobbies|interests|activities|volunteer|extra-?curricular)\b/i],
  ['goals', /^(career )?(objective|goals?|summary|profile|about me|personal statement)\b/i],
];

export function extractSections(text: string): CvSections {
  const out: CvSections = { education: [], experience: [], projects: [], skills: [], achievements: [], hobbies: [], goals: [] };
  let cur: keyof CvSections | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (!line) continue;
    const head = line.length < 40 ? HEADINGS.find(([, re]) => re.test(line.replace(/[:•\-–]/g, '').trim())) : undefined;
    if (head) { cur = head[0]; const rest = line.replace(/^[^:]*:\s*/, ''); if (rest !== line && rest) out[cur].push(rest); continue; }
    if (cur && line.length > 2) out[cur].push(line.replace(/^[•\-–*]\s*/, ''));
  }
  for (const k of Object.keys(out) as (keyof CvSections)[]) out[k] = out[k].filter((l) => !/@|\+?\d[\d\s-]{7,}|linkedin|github\.com/i.test(l)).slice(0, 12);
  return out;
}

export async function readCvFile(file: File): Promise<string> {
  if (file.size > 10e6) throw new Error('File is larger than 10 MB.');
  const buf = await file.arrayBuffer();
  if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= Math.min(doc.numPages, 8); i++) {
      const c = await (await doc.getPage(i)).getTextContent();
      let line = '', lastY: number | null = null;
      const lines: string[] = [];
      for (const it of c.items as { str: string; transform: number[] }[]) {
        const y = it.transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 3) { lines.push(line); line = ''; }
        line += (line && !line.endsWith(' ') ? ' ' : '') + it.str;
        lastY = y;
      }
      lines.push(line);
      pages.push(lines.join('\n'));
    }
    return pages.join('\n');
  }
  if (/\.docx$/i.test(file.name)) {
    const mammoth = await import('mammoth/mammoth.browser');
    return (await mammoth.extractRawText({ arrayBuffer: buf })).value;
  }
  if (/\.txt$/i.test(file.name)) return new TextDecoder().decode(buf);
  throw new Error('Please upload a PDF, DOCX or TXT file.');
}

const first = (a: string[]) => a[0]?.replace(/[|,;].*$/, '').slice(0, 80);

/** Template questions from CV content (used when no local LLM is loaded). */
export function templateQuestions(s: CvSections): string[] {
  const q: string[] = ['Could you start by telling me a little about yourself and your background?'];
  if (s.education.length) q.push(`I see you studied ${first(s.education)}. What made you choose that, and what did you enjoy most?`);
  if (s.experience.length) q.push(`Tell me about your role: ${first(s.experience)}. What were your main responsibilities?`, 'Can you describe a difficult situation at work and how you handled it?');
  if (s.projects.length) q.push(`You mention ${first(s.projects)}. What was your contribution, and what did you learn?`);
  if (s.skills.length) q.push(`Which of your skills, such as ${s.skills.slice(0, 2).map((x) => first([x])).join(' or ')}, are you most proud of, and how did you develop it?`);
  if (s.achievements.length) q.push(`Tell me about ${first(s.achievements)}. Why was it important to you?`);
  if (s.hobbies.length) q.push(`Outside work, you enjoy ${first(s.hobbies)}. How did you get into that?`);
  q.push(s.goals.length ? 'Your profile mentions your goals. Where do you see yourself in five years?' : 'What are your career goals for the next few years?', 'Why do you think good English communication matters in your field?');
  return q;
}
