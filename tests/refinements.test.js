import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,addEntry,dayFor,summary,localDate,removeEntry,restoreEntry,recentDeletions,validateBackup,cleanEntryDrafts,batchRemaining} from '../src/core.js';
import {loadState,writeState,STORAGE_KEY} from '../src/storage.js';

test('optional sodium goal stays unset through backup and historical summaries',()=>{
 const s=freshState();s.primary='protein';s.goals={sodium:null,protein:80,carbs:null};addEntry(s,localDate(),{name:'Egg',meal:'Breakfast',mg:62,protein:6,carbs:1});
 const restored=validateBackup(s);assert.equal(restored.goals.sodium,null);assert.equal(summary(dayFor(restored,localDate()),'sodium').goal,null);assert.equal(summary(dayFor(restored,localDate()),'protein').goal,80);
});
test('deletion recovery preserves original day, nutrient values and other entries',()=>{
 const s=freshState(),date=localDate();addEntry(s,date,{name:'Soup',meal:'Lunch',mg:null,protein:10,carbs:15});const original=structuredClone(s.days[date].entries[0]);removeEntry(s,date,original.id);
 addEntry(s,date,{name:'Apple',meal:'Snacks',mg:0,protein:0,carbs:25});const key=s.deletedEntries[0].id;
 const next=validateBackup(s);restoreEntry(next,key);assert.equal(next.days[date].entries.length,2);assert.deepEqual(next.days[date].entries[1],original);assert.equal(next.deletedEntries.length,0);assert.throws(()=>restoreEntry(next,key));
});
test('recovery expires after seven days and does not over-allocate cooking batches',()=>{
 const s=freshState(),date=localDate(),now=Date.now();const batch={id:'b',name:'Soup',date,yield:2,ingredients:[{name:'Broth',sodium:100,amount:1,mode:'servings'}]};s.batches=[batch];
 addEntry(s,date,{name:'Soup',meal:'Lunch',mg:50,batchId:'b',portions:1});removeEntry(s,date,s.days[date].entries[0].id,now);const key=s.deletedEntries[0].id;
 assert.equal(recentDeletions(s,now+7*86400000).length,0);assert.throws(()=>restoreEntry(s,key,now+7*86400000));
 addEntry(s,date,{name:'Soup',meal:'Dinner',mg:100,batchId:'b',portions:2});assert.equal(batchRemaining(s,batch),0);assert.throws(()=>restoreEntry(s,key,now),/Not enough/);assert.equal(s.deletedEntries.length,1);
});
test('separate category drafts survive storage reload, including missing nutrition and checkbox clearing',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};let s=freshState();s.entryDrafts={out:{name:'Café bowl',sodium:'',protein:'24',amount:'0.5',meal:'Lunch',template:'custom',published:false,favorite:false},label:{name:'Crackers',sodium:'100',amount:'1',mode:'servings'},home:{name:'Pasta',protein:'12'}};
 s=writeState(s,'',storage);const next=loadState(storage);assert.deepEqual(next.entryDrafts,cleanEntryDrafts(s.entryDrafts));assert.equal(next.entryDrafts.out.sodium,'');assert.equal(next.entryDrafts.home.name,'Pasta');assert.equal(next.entryDrafts.out.published,false);assert(data.has(STORAGE_KEY));
});
