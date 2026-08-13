(function(){
'use strict';
const VERSION='5.2';
const STORE='praxsys_review_notes_v52_build006';
const REVIEWER='praxsys_reviewer_v52_build006';
const MAX_IMAGES=3;
let currentKey='';
let currentLabel='';
let inputTimer=null;
let mutationTimer=null;
let isLoading=false;

function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function readStore(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch(e){return {}}}
function loadAll(){return readStore(STORE);}
function saveAll(x){localStorage.setItem(STORE,JSON.stringify(x));}
function reviewer(){return (localStorage.getItem(REVIEWER)||'').trim();}
function slug(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,220)||'workspace';}
function screenInfo(){
 const app=document.getElementById('app');
 if(!app)return {label:'Workspace',key:'workspace'};
 const explicitKey=(app.dataset.reviewScreenKey||'').trim();
 const explicitLabel=(app.dataset.reviewScreenLabel||'').trim();
 if(explicitKey)return {label:explicitLabel||explicitKey,key:slug(explicitKey)};
 const h=[...app.querySelectorAll('h1,h2')].map(x=>x.textContent.trim()).filter(Boolean).slice(0,3);
 const section=[...app.querySelectorAll('.section-label,.step-label,.eyebrow')].map(x=>x.textContent.trim()).filter(Boolean).slice(0,2);
 const patient=[...app.querySelectorAll('.patient-value,[data-patient-id]')].map(x=>x.textContent.trim()||x.getAttribute('data-patient-id')).filter(Boolean).slice(0,2);
 const active=[...app.querySelectorAll('[aria-current="page"],.active,.selected')].map(x=>x.textContent.trim()).filter(Boolean).slice(0,3);
 const label=[...section,...h,...patient,...active].filter(Boolean).join(' — ')||'Workspace';
 // Add a compact DOM signature so screens with the same heading still receive separate notes.
 const controls=[...app.querySelectorAll('button,input,select,textarea')].map(x=>x.getAttribute('name')||x.id||x.textContent.trim()||x.getAttribute('aria-label')||'').filter(Boolean).slice(0,12).join('|');
 return {label,key:slug(label+'|'+controls)};
}
function ensureReviewer(){
 let name=reviewer(); if(name)return name;
 name=prompt('Enter your name or reviewer ID. It will be attached to your notes:','');
 if(!name||!name.trim())return '';
 localStorage.setItem(REVIEWER,name.trim());updateReviewer();return name.trim();
}
function getRecord(name,key){return loadAll()[name]?.[key]||null;}
function ensureRecord(name,key,label){
 const all=loadAll();all[name]=all[name]||{};
 all[name][key]=all[name][key]||{reviewer:name,version:VERSION,screen:label,screenKey:key,note:'',attachments:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
 return {all,rec:all[name][key]};
}
function saveSnapshot(key,label,note){
 const name=reviewer();if(!name||!key)return;
 const r=ensureRecord(name,key,label);r.rec.note=note||'';r.rec.screen=label;r.rec.version=VERSION;r.rec.updatedAt=new Date().toISOString();saveAll(r.all);
}
function flushCurrent(){
 clearTimeout(inputTimer);inputTimer=null;
 const box=document.getElementById('rnText');
 if(box&&currentKey&&!isLoading&&reviewer())saveSnapshot(currentKey,currentLabel,box.value);
}
function status(t){const el=document.getElementById('rnStatus');if(el){el.textContent=t;setTimeout(()=>{if(el.textContent===t)el.textContent='';},1800)}}
function renderAttachments(rec){
 const host=document.getElementById('rnAttachments');if(!host)return;
 host.innerHTML=(rec?.attachments||[]).map((a,i)=>`<figure class="rn-shot"><img src="${a.data}" alt="Attached screenshot ${i+1}"><figcaption>${esc(a.name||'Screenshot')} <button type="button" data-rn-remove="${i}">Remove</button></figcaption></figure>`).join('');
 host.querySelectorAll('[data-rn-remove]').forEach(b=>b.onclick=()=>removeAttachment(Number(b.dataset.rnRemove)));
}
function clearVisibleNote(){
 isLoading=true;
 const box=document.getElementById('rnText');if(box)box.value='';
 renderAttachments(null);
 isLoading=false;
}
function loadScreen(force){
 const info=screenInfo();
 if(!force&&info.key===currentKey)return;
 flushCurrent();
 currentKey=info.key;currentLabel=info.label;
 clearVisibleNote();
 const title=document.getElementById('rnScreen');if(title)title.textContent=info.label;
 const box=document.getElementById('rnText');if(!box)return;
 const name=reviewer();const rec=name?getRecord(name,currentKey):null;
 isLoading=true;box.value=rec?.note||'';renderAttachments(rec);isLoading=false;
 refreshCount();updateReviewer();
}
function persist(){
 const box=document.getElementById('rnText');if(!box||!currentKey||!ensureReviewer())return;
 saveSnapshot(currentKey,currentLabel,box.value);status('Saved');refreshCount();
}
function removeAttachment(i){
 const name=reviewer();if(!name||!currentKey)return;
 const r=ensureRecord(name,currentKey,currentLabel);r.rec.attachments.splice(i,1);r.rec.updatedAt=new Date().toISOString();saveAll(r.all);renderAttachments(r.rec);status('Attachment removed');refreshCount();
}
function resizeImage(file){return new Promise((resolve,reject)=>{const fr=new FileReader();fr.onerror=reject;fr.onload=()=>{const img=new Image();img.onerror=reject;img.onload=()=>{const maxW=1400,maxH=900,scale=Math.min(1,maxW/img.width,maxH/img.height);const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.78));};img.src=fr.result;};fr.readAsDataURL(file);});}
async function addImage(file){
 if(!ensureReviewer())return;
 const targetKey=currentKey,targetLabel=currentLabel;
 const name=reviewer();const r=ensureRecord(name,targetKey,targetLabel);
 if(r.rec.attachments.length>=MAX_IMAGES){alert(`A note can contain up to ${MAX_IMAGES} screenshots.`);return;}
 try{
   const data=await resizeImage(file);
   // Keep the image with the screen where attachment began, even if navigation occurs while processing.
   const latest=ensureRecord(name,targetKey,targetLabel);
   latest.rec.attachments.push({name:file.name||`Screenshot ${latest.rec.attachments.length+1}`,type:'image/jpeg',data,addedAt:new Date().toISOString()});
   latest.rec.updatedAt=new Date().toISOString();saveAll(latest.all);
   if(currentKey===targetKey)renderAttachments(latest.rec);
   status('Screenshot attached');refreshCount();
 }catch(e){alert('The screenshot could not be attached. Please try another image.');}
}
function onPaste(e){const items=[...(e.clipboardData?.items||[])];const img=items.find(x=>x.type&&x.type.startsWith('image/'));if(img){e.preventDefault();addImage(img.getAsFile());}}
function exportNotes(){
 const name=ensureReviewer();if(!name)return;persist();
 const notes=Object.values(loadAll()[name]||{}).filter(n=>n.note||n.attachments?.length).sort((a,b)=>a.screen.localeCompare(b.screen));
 if(!notes.length){alert('There are no saved notes to export.');return;}
 const body=notes.map(n=>`<section><h2>${esc(n.screen)}</h2><p class="meta">Reviewer: ${esc(n.reviewer)} · Version ${esc(n.version)} · Updated ${esc(new Date(n.updatedAt).toLocaleString())}</p><p>${esc(n.note).replace(/\n/g,'<br>')||'<em>No text note</em>'}</p>${(n.attachments||[]).map(a=>`<img src="${a.data}" alt="Attached screenshot">`).join('')}</section>`).join('');
 const html=`<!doctype html><html><head><meta charset="utf-8"><title>PraxSys Reviewer Notes</title><style>body{font-family:Arial,sans-serif;max-width:900px;margin:35px auto;color:#172033}h1{color:#0b1437}section{border-top:2px solid #dbe3ef;padding:22px 0;break-inside:avoid}.meta{color:#64748b;font-size:12px}img{display:block;max-width:100%;margin:14px 0;border:1px solid #cbd5e1}footer{margin-top:30px;color:#64748b;font-size:11px}</style></head><body><h1>PraxSys Clinical Demo Reviewer Notes</h1><p>Reviewer: ${esc(name)}<br>Demo version: ${VERSION}<br>Exported: ${esc(new Date().toLocaleString())}</p>${body}<footer>CONFIDENTIAL · PATENT PENDING · Copyright © 2026 PraxSys</footer></body></html>`;
 const blob=new Blob([html],{type:'text/html'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`PraxSys_V${VERSION}_Reviewer_Notes_${name.replace(/[^a-z0-9]+/gi,'_')}_${new Date().toISOString().slice(0,10)}.html`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);status('Export created');
}
function refreshCount(){const name=reviewer(),all=name?Object.values(loadAll()[name]||{}):[];const count=all.filter(n=>n.note||n.attachments?.length).length;const el=document.getElementById('rnCount');if(el)el.textContent=count?`${count} saved screen${count===1?'':'s'}`:'No saved notes';}
function updateReviewer(){const el=document.getElementById('rnReviewer');if(el)el.textContent=reviewer()||'Identify reviewer';}
function toggle(open){const p=document.getElementById('reviewNotesPanel');if(!p)return;const show=open===undefined?!p.classList.contains('open'):open;if(show&&!ensureReviewer())return;p.classList.toggle('open',show);p.setAttribute('aria-hidden',String(!show));if(show)loadScreen(true);}
function build(){
 const button=document.createElement('button');button.id='reviewNotesButton';button.className='review-notes-button';button.innerHTML='<span>Reviewer Notes</span><small id="rnCount">No saved notes</small>';button.onclick=()=>toggle();
 const panel=document.createElement('aside');panel.id='reviewNotesPanel';panel.className='review-notes-panel';panel.setAttribute('aria-hidden','true');panel.innerHTML=`<div class="rn-head"><div><div class="rn-kicker">Clinical review · Version ${VERSION}</div><h2>Reviewer Notes</h2></div><button id="rnClose" aria-label="Close reviewer notes">×</button></div><div class="rn-reviewer"><button id="rnReviewer" type="button">Identify reviewer</button><span>Notes remain in this browser until exported or cleared.</span></div><div class="rn-screen"><strong>Current screen</strong><span id="rnScreen"></span></div><label class="rn-label" for="rnText">Note</label><textarea id="rnText" rows="8" placeholder="Enter a comment. To attach a screenshot, use Win + Shift + S and then paste here with Ctrl + V."></textarea><div class="rn-paste-help"><strong>Attach a screenshot:</strong> paste an image from the clipboard into the note box, or select an image file. Up to ${MAX_IMAGES} screenshots per screen.</div><input id="rnFile" type="file" accept="image/*" hidden><div class="rn-actions"><button id="rnAttach" type="button">Attach image</button><button id="rnSave" type="button" class="rn-primary">Save note</button></div><div id="rnAttachments" class="rn-attachments"></div><div class="rn-footer"><span id="rnStatus" aria-live="polite"></span><button id="rnExport" type="button">Export all notes</button></div>`;
 document.body.append(button,panel);
 document.getElementById('rnClose').onclick=()=>toggle(false);
 document.getElementById('rnReviewer').onclick=()=>{const old=reviewer();const n=prompt('Reviewer name or ID:',old);if(n&&n.trim()){flushCurrent();localStorage.setItem(REVIEWER,n.trim());loadScreen(true);}};
 const text=document.getElementById('rnText');text.addEventListener('paste',onPaste);text.addEventListener('input',()=>{if(isLoading)return;clearTimeout(inputTimer);const key=currentKey,label=currentLabel,value=text.value;inputTimer=setTimeout(()=>{saveSnapshot(key,label,value);status('Saved');refreshCount();},700);});
 document.getElementById('rnSave').onclick=persist;
 document.getElementById('rnAttach').onclick=()=>document.getElementById('rnFile').click();
 document.getElementById('rnFile').onchange=e=>{if(e.target.files[0])addImage(e.target.files[0]);e.target.value='';};
 document.getElementById('rnExport').onclick=exportNotes;
 refreshCount();updateReviewer();loadScreen(true);
 function switchScreen(detail){
   detail=detail||{};
   const nextKey=slug(detail.key||'workspace');
   const nextLabel=detail.label||detail.key||'Workspace';
   if(nextKey===currentKey){
     currentLabel=nextLabel;
     const title=document.getElementById('rnScreen');if(title)title.textContent=currentLabel;
     return;
   }
   // Build 006 uses an intentionally simple, reliable screen transition:
   // save the departing screen, erase the visible editor, and close the panel.
   // The destination screen's saved note is loaded only when Reviewer Notes is opened there.
   flushCurrent();
   clearVisibleNote();
   const panel=document.getElementById('reviewNotesPanel');
   if(panel){panel.classList.remove('open');panel.setAttribute('aria-hidden','true');}
   currentKey=nextKey;currentLabel=nextLabel;
   const title=document.getElementById('rnScreen');if(title)title.textContent=currentLabel;
   refreshCount();updateReviewer();
 }
 window.PraxSysReviewerNotes={switchScreen,flushCurrent};
 // Fallback for older application builds. The direct API call in app.js is authoritative.
 window.addEventListener('praxsys:screenchange',e=>switchScreen(e.detail||{}));
 window.addEventListener('beforeunload',flushCurrent);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
