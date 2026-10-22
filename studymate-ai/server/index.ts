import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { z } from 'zod';

const app=express();
const allowedOrigins=(process.env.CORS_ORIGINS||'http://localhost:5173').split(',').map(origin=>origin.trim()).filter(Boolean);
app.use(cors({origin:(origin,callback)=>{if(!origin||allowedOrigins.includes(origin))return callback(null,true);callback(new Error('This website origin is not allowed by the API server.'));}}));
app.use(express.json({limit:'1mb'}));
const maxMb=Number(process.env.MAX_PDF_MB||15);
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:maxMb*1024*1024},fileFilter:(_req,file,cb)=>file.mimetype==='application/pdf'?cb(null,true):cb(new Error('Please select a PDF file.'))});
const aiSchema=z.object({question:z.string().trim().min(1).max(12000),marks:z.enum(['Auto','2','5','10','15']).default('Auto'),subject:z.string().max(100).default(''),preferences:z.array(z.string()).max(12).default([]),history:z.array(z.object({role:z.enum(['user','assistant']),content:z.string().max(12000)})).max(16).default([])});
app.get('/api/health',(_req,res)=>res.json({ok:true,aiConfigured:Boolean(process.env.OPENAI_API_KEY),model:process.env.OPENAI_MODEL||'gpt-4o-mini'}));
app.post('/api/answer',async(req,res)=>{
 const parsed=aiSchema.safeParse(req.body); if(!parsed.success)return res.status(400).json({error:'Please enter a question and check the answer settings.'});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'AI is not configured yet. Add OPENAI_API_KEY to .env and restart the server.'});
 const {question,marks,subject,preferences,history}=parsed.data;
 const {buildStudyPrompt}=await import('../src/lib.ts');
 try{
  const response=await fetch(`${(process.env.OPENAI_BASE_URL||'https://api.openai.com/v1').replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',temperature:0.35,messages:[{role:'system',content:buildStudyPrompt(question,marks,subject,preferences)},...history.slice(-10),{role:'user',content:question}]})});
  const data=await response.json() as {choices?:{message?:{content?:string}}[];error?:{message?:string}};
  if(!response.ok) return res.status(response.status===429?429:502).json({error:data.error?.message||'The AI provider could not complete the request. Please retry.'});
  const answer=data.choices?.[0]?.message?.content; if(!answer)return res.status(502).json({error:'The AI returned an empty answer. Please retry.'});
  res.json({answer});
 }catch(error){console.error('AI request failed',error);res.status(502).json({error:'Could not reach the AI service. Check your connection and try again.'});}
});
app.post('/api/pdf/extract',upload.single('file'),async(req,res)=>{
 if(!req.file)return res.status(400).json({error:'Choose a PDF file to upload.'});
 try{const parsed=await pdfParse(req.file.buffer);const text=parsed.text.trim();if(!text)return res.status(422).json({error:'No selectable text was found. This may be a scanned PDF; OCR is not configured in this version.'});res.json({filename:req.file.originalname,size:req.file.size,pages:parsed.numpages,text:text.slice(0,100000)});}
 catch(error){console.error('PDF extraction failed',error);res.status(422).json({error:'This PDF could not be read. It may be encrypted, damaged, or unsupported.'});}
});
app.use((err:Error,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{if(err instanceof multer.MulterError&&err.code==='LIMIT_FILE_SIZE')return res.status(413).json({error:`PDF is too large. Maximum size is ${maxMb} MB.`});res.status(400).json({error:err.message||'Upload could not be processed.'});});
const port=Number(process.env.PORT||8787); app.listen(port,'0.0.0.0',()=>console.log(`StudyMate API listening on port ${port}`));
