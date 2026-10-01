export const MEALS = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
export const SCHEMA = 1;
export const round = n => Math.round((n + Number.EPSILON) * 1000) / 1000;
export function numeric(value, label = 'Amount', { min = 0, max = 1e7 } = {}) {
  if ((typeof value === 'string' && !value.trim()) || value === null || value === undefined || typeof value === 'boolean') throw new Error(`${label} is required.`);
  const n = typeof value === 'string' ? fraction(value) : Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${label} must be between ${min} and ${max.toLocaleString()}.`);
  return n;
}
export function fraction(value) {
  let s = String(value).trim().replace(/½/g, ' 1/2').replace(/¼/g, ' 1/4').replace(/¾/g, ' 3/4').trim();
  const mix = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mix) return Number(mix[1]) + Number(mix[2]) / Number(mix[3]);
  const f = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (f) return Number(f[1]) / Number(f[2]);
  return Number(s);
}
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y,m,d] = s.split('-').map(Number), dt = new Date(y,m-1,d,12);
  return dt.getFullYear() === y && dt.getMonth() === m-1 && dt.getDate() === d;
}
export function dateObject(s) { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d,12); }
export function shiftDate(s,n) { const d = dateObject(s); d.setDate(d.getDate()+n); return localDate(d); }
export function id() { return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
export function freshState(goal = 2000) {
  return { schema:SCHEMA, revision:'', goal, onboarded:false, days:{}, batches:[], favorites:[], draft:null, preferences:{ theme:'system', vegetarian:false, reserve:0 } };
}
export function dayFor(state,date) { return state.days[date] || { goal:state.goal, entries:[], complete:false, plan:null }; }
export function totalFor(day) { return day.entries.reduce((sum,e)=>sum+e.mg,0); }
export function summary(day) {
  const total=totalFor(day);
  return { total, remaining:day.goal-total, estimated:day.entries.some(e=>e.estimate), count:day.entries.length, status:!day.entries.length?'empty':!day.complete?'progress':total<=day.goal?'within':'over' };
}
export function labelAmount(perServing, amount, mode='servings', servingsPerContainer=1) {
  const base=numeric(perServing,'Sodium per serving'),qty=numeric(amount,'Amount eaten',{min:0.001});
  const multiplier=mode==='containers'?numeric(servingsPerContainer,'Servings per container',{min:0.001}):1;
  return round(base*qty*multiplier);
}
export function batchTotal(ingredients) {
  if (!ingredients.length) throw new Error('Add at least one ingredient.');
  return round(ingredients.reduce((sum,i)=>sum+labelAmount(i.sodium,i.amount,i.mode,i.container),0));
}
export function validateIngredients(ingredients) {
  if(!Array.isArray(ingredients)||ingredients.length>200)throw new Error('Invalid recipe ingredients.');
  return ingredients.map(i=>{
    if(!i||typeof i.name!=='string'||!i.name.trim()||i.name.length>250||!['servings','containers'].includes(i.mode))throw new Error('Invalid recipe ingredient.');
    return {name:i.name,sodium:numeric(i.sodium),amount:numeric(i.amount,'Amount',{min:.001}),mode:i.mode,container:i.mode==='containers'?numeric(i.container,'Container servings',{min:.001}):1,estimate:Boolean(i.estimate)};
  });
}
export function batchAmount(batch,portions) {
  const qty=numeric(portions,'Your portions',{min:0.001});
  const yieldCount=numeric(batch.yield,'Batch portions',{min:0.001});
  if(qty>yieldCount)throw new Error('Your portion cannot exceed the whole batch.');
  return round(batchTotal(batch.ingredients)/yieldCount*qty);
}
export function batchRemaining(state,batch) {
  const logged=Object.values(state.days).flatMap(d=>d.entries).filter(e=>e.batchId===batch.id).reduce((sum,e)=>sum+e.portions,0);
  return Math.max(0,round(batch.yield-logged));
}
export function validateEntry(entry) {
  if(typeof entry.name!=='string'||!entry.name.trim()||entry.name.length>250)throw new Error('Give your food a name (up to 250 characters).');
  if(!MEALS.includes(entry.meal))throw new Error('Choose a meal.');
  numeric(entry.mg,'Sodium');
  if(entry.batchId) numeric(entry.portions,'Batch portions',{min:0.001});
  return entry;
}
export function addEntry(state,date,entry) {
  if(!validDate(date)||date>localDate())throw new Error('Choose today or an earlier date.');
  validateEntry(entry);
  const day=state.days[date] ||= dayFor(state,date);
  day.entries.push({ ...entry, name:entry.name.trim(), mg:numeric(entry.mg,'Sodium'), ...(entry.batchId?{portions:numeric(entry.portions,'Batch portions',{min:.001})}:{}), id:entry.id||id(), createdAt:new Date().toISOString() });
  day.complete=false;
  return day;
}
export function finishDay(state,date) {
  const day=state.days[date];
  if(!day?.entries.length)throw new Error('Log at least one food before finishing your day.');
  day.complete=true;
  return summary(day).status;
}
export function normalizeNumbers(text) {
  const words={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};
  let s=text.toLowerCase().replace(/(\d)½/g,'$1.5').replace(/(\d)¼/g,'$1.25').replace(/(\d)¾/g,'$1.75').replace(/½/g,' 0.5 ').replace(/¼/g,' 0.25 ').replace(/¾/g,' 0.75 ').replace(/milligrams?/g,'mg').replace(/\b(\d),(?=\d{3}\b)/g,'$1');
  s=s.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+and\s+(?:a\s+|one\s+)?(half|quarter)\b/g,(_,n,f)=>String((words[n]??Number(n))+(f==='half'?.5:.25))).replace(/\bthree quarters\b/g,'0.75').replace(/\b(?:a |one )?half\b/g,'0.5').replace(/\b(?:a |one )?quarter\b/g,'0.25');
  s=s.replace(/\b((?:(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)(?:[ -]+(?:and[ -]+)?|\b))+)/g, match=>{
    let value=0,group=0;
    for(const token of match.trim().split(/[ -]+/)){if(token==='and')continue;if(token==='hundred')group=(group||1)*100;else if(token==='thousand'){value+=(group||1)*1000;group=0;}else if(token in words)group+=words[token];}
    return `${value+group} `;
  });
  return s.replace(/\b(\d+)\s+and\s+(?:a|1)?\s*half\b/g,(_,n)=>String(Number(n)+.5)).replace(/\b(?:a|1)\s+half\b/g,'0.5').replace(/\b(?:a|1)\s+quarter\b/g,'0.25').replace(/\b3\s+quarters\b/g,'0.75');
}
export function parseDescription(text) {
  const s=normalizeNumbers(text),mg=s.match(/(\d+(?:\.\d+)?)\s*mg\b/);
  if(!mg)return { error:'I couldn’t find a sodium amount. Include “180 mg per serving,” or use Package label.' };
  const firstNumber=text.toLowerCase().search(/\d|\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\b/i);
  const name=text.slice(0,firstNumber>=0?firstNumber:0).replace(/[,.:;\s]+$/,'').replace(/\b(?:has|have|with|at|contains|is)\s*$/i,'').trim();
  const after=s.match(/(?:i\s+)?(?:ate|had|having|eaten)\s+(\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)/);
  const quantity=after?.[1]||s.match(/(\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)\s+servings?\s*(?:eaten|consumed)/)?.[1];
  const container=s.match(/(\d+(?:\.\d+)?)\s+servings?\s+(?:per|in\s+(?:the|a))\s+(?:carton|container|package|bag|box)/);
  const whole=/\b(?:whole|entire)\s+(?:carton|container|package|bag|box)\b/.test(s);
  const perServing=/per\s+serving|each\s+serving|a\s+serving/.test(s);
  const total=/\btotal\b/.test(s)&&!perServing;
  const warnings=[];
  if(!perServing&&!total)warnings.push('Confirm whether that sodium amount is per serving or for everything you ate.');
  if(!quantity&&!whole&&!total)warnings.push('How many servings did you eat?');
  if(whole&&!container)warnings.push('How many label servings are in the container?');
  return {name:name||'',sodium:Number(mg[1]),amount:total?1:whole?1:quantity?fraction(quantity):'',mode:whole?'containers':'servings',container:container?Number(container[1]):'',warnings};
}
export function validateBackup(data) {
  if(!data||data.schema!==SCHEMA||!data.days||typeof data.days!=='object'||Array.isArray(data.days))throw new Error('This is not a compatible a little less backup.');
  numeric(data.goal,'Daily limit',{min:1,max:100000});
  if(Object.keys(data.days).length>40000)throw new Error('This backup is too large.');
  const clean=freshState(numeric(data.goal));clean.onboarded=Boolean(data.onboarded);
  for(const [date,day] of Object.entries(data.days)){
    if(!validDate(date)||!day||!Array.isArray(day.entries)||day.entries.length>5000)throw new Error('Invalid day in backup.');
    numeric(day.goal,'Saved daily limit',{min:1,max:100000});
    const entries=day.entries.map(e=>{validateEntry(e);if(typeof e.id!=='string')throw new Error('Invalid food entry.');return {...e, mg:numeric(e.mg),...(e.batchId?{portions:numeric(e.portions)}:{}),estimate:Boolean(e.estimate)};});
    if(new Set(entries.map(e=>e.id)).size!==entries.length)throw new Error('Duplicate food entries in backup.');
    let plan=null;if(day.plan){if(typeof day.plan.name!=='string')throw new Error('Invalid dinner plan.');numeric(day.plan.mg,'Plan sodium');plan={...day.plan};}
    clean.days[date]={goal:Number(day.goal),entries,complete:Boolean(day.complete)&&entries.length>0,plan};
  }
  if(!Array.isArray(data.batches)||!Array.isArray(data.favorites))throw new Error('Missing recipe data.');
  clean.batches=data.batches.map(b=>{if(!b||typeof b.id!=='string'||typeof b.name!=='string'||!b.name.trim()||!validDate(b.date))throw new Error('Invalid batch.');numeric(b.yield,'Batch portions',{min:.001});const ingredients=validateIngredients(b.ingredients);batchTotal(ingredients);return {...b,yield:numeric(b.yield),ingredients};});
  clean.favorites=data.favorites.map(e=>{validateEntry(e);return {...e};});
  clean.draft=null;clean.preferences={...clean.preferences,...data.preferences};
  if(!['system','light','dark'].includes(clean.preferences.theme))clean.preferences.theme='system';
  clean.preferences.reserve=numeric(clean.preferences.reserve,'Reserve',{max:100000});
  clean.preferences.vegetarian=Boolean(clean.preferences.vegetarian);
  return clean;
}
