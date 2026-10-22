import { describe,it,expect } from 'vitest';
import { buildStudyPrompt,parseQuestions,titleFromQuestion } from '../src/lib';
describe('StudyMate prompt and paper helpers',()=>{
 it('includes the selected marks format and topic in the prompt',()=>{const p=buildStudyPrompt('Explain indexing','10','DBMS');expect(p).toContain('10-mark');expect(p).toContain('DBMS');expect(p).toContain('Explain indexing');});
 it('extracts numbered questions and marks',()=>{expect(parseQuestions('1. Explain trees (10 marks)\n2) Define a key [2 marks]')).toEqual([{id:'q0',text:'1. Explain trees (10 marks)',marks:'10'},{id:'q1',text:'2) Define a key [2 marks]',marks:'2'}]);});
 it('creates a readable conversation title',()=>expect(titleFromQuestion('  Explain binary search please')).toBe('Explain binary search please'));
});
