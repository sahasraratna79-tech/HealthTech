export type Marks='Auto'|'2'|'5'|'10'|'15';
export type StudyAnswer={question:string;answer:string;marks:Marks;subject:string;createdAt:number;diagram?:string};
export const marksOptions:Marks[]=['Auto','2','5','10','15'];
export function buildStudyPrompt(question:string,marks:Marks,subject:string,preferences:string[]=[]){
  const formats:Record<Marks,string>={Auto:'Choose a suitable concise exam-ready structure for this question.', '2':'Give a direct definition or answer, 1–2 essential points, and a tiny example if useful.', '5':'Use a definition, brief explanation, key points or procedure, and a relevant example or small diagram if useful.', '10':'Use an introduction, detailed explanation with headings, steps or method, a worked example, a useful diagram, and relevant complexity/applications where appropriate.', '15':'Give an introduction and definition, detailed headed explanation, procedure, a suitable diagram, worked example, relevant complexity/applications/limitations, and a short conclusion.'};
  return `You are StudyMate AI, a careful undergraduate exam tutor. Answer in simple English. Adapt the structure to the subject; do not force irrelevant sections. Be honest about uncertainty, do not invent facts or claim code was executed.\nSubject: ${subject||'Not specified'}\nAnswer length: ${formats[marks]}\nPreferences: ${preferences.join(', ')||'Exam-oriented, clear explanation'}\nUse markdown headings and lists where helpful. If the user asks a follow-up, use the conversation context.\n\nQuestion: ${question}`;
}
export function parseQuestions(text:string){
  return text.split(/\n+/).map(s=>s.trim()).filter(Boolean).filter(s=>/^(?:Q(?:uestion)?\s*)?\d{1,2}\s*[.)]|^(?:[a-hA-H])\s*[.)]|^\([ivxIVX]+\)/.test(s)||/\[\s*\d+\s*marks?\s*\]/i.test(s)).map((line,i)=>({id:`q${i}`,text:line.replace(/^\s*/,''),marks:line.match(/\[\s*(\d+)\s*marks?\s*\]/i)?.[1]||line.match(/\((\d+)\s*\)/)?.[1]||''}));
}
export function titleFromQuestion(s:string){return s.trim().replace(/^\W+/,'').slice(0,42)||'New study session';}
