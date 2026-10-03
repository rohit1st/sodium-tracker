import { freshState, validateBackup, validateIngredients, cleanEntryDrafts, id } from './core.js';
const appPath=typeof location==='undefined'?'/':new URL('../',import.meta.url).pathname;
export const STORAGE_KEY='a-little-less:v1'+(appPath==='/'?'':':'+appPath);
export function loadState(storage=localStorage) {
  const raw=storage.getItem(STORAGE_KEY);
  if(!raw)return freshState();
  const parsed=JSON.parse(raw),state=validateBackup(parsed);
  state.revision=typeof parsed.revision==='string'?parsed.revision:'';
  // A cooking draft is private to this device and not part of imported backups.
  if(parsed.draft)state.draft={...parsed.draft,name:String(parsed.draft.name||''),ingredients:validateIngredients(parsed.draft.ingredients)};
  state.entryDrafts=cleanEntryDrafts(parsed.entryDrafts);
  return state;
}
export function writeState(next, previousRevision, storage=localStorage) {
  const existing=storage.getItem(STORAGE_KEY);
  if(existing){const rev=JSON.parse(existing).revision||'';if(rev!==previousRevision)throw new Error('Your log changed in another tab. Refresh data in Settings before continuing.');}
  const revision=id();
  storage.setItem(STORAGE_KEY,JSON.stringify({...next,revision}));
  return {...next,revision};
}
