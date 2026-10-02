import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,labelAmount,batchTotal,batchAmount,batchRemaining,parseDescription,fraction,localDate,validDate,shiftDate,dayFor,summary,addEntry,finishDay,validateBackup} from '../src/core.js';
import {loadState,writeState,STORAGE_KEY} from '../src/storage.js';
test('label portions, whole cartons, fractions, and zero sodium',()=>{
  assert.equal(labelAmount(180,'1 1/2'),270);assert.equal(labelAmount(140,1,'containers',4),560);assert.equal(labelAmount(140,'1/2','containers',4),280);assert.equal(labelAmount(0,2),0);assert.equal(fraction('1½'),1.5);
  for(const bad of ['','  ',null,undefined,-1,Infinity,'unknown'])assert.throws(()=>labelAmount(bad,1));assert.throws(()=>labelAmount(10,'1/0'));assert.throws(()=>labelAmount(140,1,'containers',''));
});
const ingredients=[{name:'Broth',sodium:140,amount:1,mode:'containers',container:4},{name:'Beans',sodium:300,amount:1,mode:'servings',container:1},{name:'Other ingredients',sodium:60,amount:1,mode:'servings',container:1}];
test('cooking batch math, leftovers across dates and historical snapshots',()=>{
  const batch={id:'batch',name:'Soup',yield:4,ingredients};assert.equal(batchTotal(ingredients),920);assert.equal(batchAmount(batch,1.5),345);assert.throws(()=>batchAmount(batch,5));
  const state=freshState(),today=localDate(),yesterday=shiftDate(today,-1);state.batches.push(batch);
  addEntry(state,yesterday,{name:'Soup',meal:'Dinner',mg:345,batchId:'batch',portions:1.5});addEntry(state,today,{name:'Soup',meal:'Lunch',mg:230,batchId:'batch',portions:1});assert.equal(batchRemaining(state,batch),1.5);
  batch.ingredients[0]={...batch.ingredients[0],sodium:200};assert.equal(state.days[yesterday].entries[0].mg,345);
});
test('no log is not a success; completed days reopen on edits; goals are snapshotted',()=>{
  const state=freshState(),date=localDate();assert.equal(summary(dayFor(state,date)).status,'empty');assert.throws(()=>finishDay(state,date));
  addEntry(state,date,{name:'Water',meal:'Snacks',mg:0});assert.equal(summary(state.days[date]).status,'progress');assert.equal(finishDay(state,date),'within');
  addEntry(state,date,{name:'Soup',meal:'Dinner',mg:2100,estimate:true});assert.equal(summary(state.days[date]).status,'progress');assert.equal(finishDay(state,date),'over');assert.equal(summary(state.days[date]).estimated,true);state.goal=1500;assert.equal(state.days[date].goal,2000);
});
test('dictation handles number words, fractions and cartons without silently filling missing data',()=>{
  const r=parseDescription('Crackers, one hundred and eighty milligrams per serving. I ate one and a half servings.');assert.equal(r.sodium,180);assert.equal(r.amount,1.5);assert.equal(r.name,'Crackers');
  const c=parseDescription('Soup, 140 mg per serving, four servings in the carton. I ate the whole carton.');assert.equal(c.mode,'containers');assert.equal(c.container,4);assert.equal(c.amount,1);
  assert.equal(parseDescription('Stone ground crackers have 180 mg per serving. I ate 1/2 servings.').name,'Stone ground crackers');
  assert.equal(parseDescription('Crackers, 180 mg per serving. I had 1½ servings.').amount,1.5);
  assert(parseDescription('Rice').error);assert.equal(parseDescription('Soup, 180 mg per serving').amount,'');assert(parseDescription('Soup, 180 mg per serving, the whole carton').warnings.length);assert(parseDescription('Soup, 180 mg. I ate 1 serving.').warnings.length);
});
test('local calendar dates handle month boundaries and leap years',()=>{assert.equal(shiftDate('2024-03-01',-1),'2024-02-29');assert.equal(shiftDate('2026-01-01',-1),'2025-12-31');assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2024-02-29'),true);assert.equal(validDate('2026-13-01'),false);});
test('backup round trip, incompatible and malformed backups',()=>{
  const state=freshState();addEntry(state,localDate(),{name:'Eggs',mg:140,meal:'Breakfast'});const restored=validateBackup(JSON.parse(JSON.stringify(state)));assert.equal(summary(restored.days[localDate()]).total,140);
  assert.throws(()=>validateBackup({...state,schema:3}));assert.throws(()=>validateBackup({...state,goal:-1}));assert.throws(()=>validateBackup({...state,days:{bad:{entries:[],goal:2000}}}));
  const bad=structuredClone(state);bad.days[localDate()].entries[0].mg=-1;assert.throws(()=>validateBackup(bad));
});
test('atomic storage detects another tab and storage errors leave old data intact',()=>{
  const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};let a=loadState(storage),b=loadState(storage);a=writeState(a,a.revision,storage);assert.throws(()=>writeState(b,b.revision,storage),/another tab/);b=loadState(storage);assert.equal(a.revision,b.revision);
  const old=storage.getItem(STORAGE_KEY);assert.throws(()=>writeState(b,b.revision,{...storage,setItem(){throw new Error('QuotaExceededError');}}));assert.equal(storage.getItem(STORAGE_KEY),old);
});

test('numeric input is stored as numbers for totals and leftover math',()=>{const s=freshState(),d=localDate();addEntry(s,d,{name:'Soup',mg:'140',meal:'Dinner',batchId:'batch',portions:'1.5'});addEntry(s,d,{name:'Bread',mg:120,meal:'Dinner'});assert.equal(summary(s.days[d]).total,260);assert.equal(batchRemaining(s,{id:'batch',yield:4}),2.5);});
