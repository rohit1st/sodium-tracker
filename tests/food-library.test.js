import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,validateBackup,exportFoodList,importFoodList,mergeFoods,foodFromEntry,nutrientAmounts,sortedRegulars,addEntry,localDate} from '../src/core.js';

test('starter foods have named portions, scale all nutrients and seed old accounts once',()=>{
 const state=freshState();assert.equal(state.foods.length,12);
 const egg=state.foods.find(f=>f.id==='starter-egg');assert.deepEqual(nutrientAmounts(egg,2),{mg:124,protein:12,carbs:2});
 const old=freshState();delete old.foods;old.favorites=[{id:'old',name:'My soup',meal:'Lunch',mg:150,quantityLabel:'1 bowl'}];
 const migrated=validateBackup(old);assert.equal(migrated.foods.length,13);assert.equal(migrated.foods.at(-1).portion,'1 bowl');
 migrated.foods=[];assert.equal(validateBackup(migrated).foods.length,0);
 state.foods[0].mg=999;assert.equal(freshState().foods[0].mg,62);
});
test('food-list export allowlists reusable details and strips personal tracking fields',()=>{
 const state=freshState();addEntry(state,localDate(),{name:'Private lunch',meal:'Lunch',mg:123});
 const food={...state.foods[0],date:'2026-01-01',createdAt:'private',notes:'private note',batchId:'private',days:state.days,goals:state.goals};
 const file=exportFoodList([food]);assert.deepEqual(Object.keys(file),['type','version','units','foods']);
 assert.deepEqual(Object.keys(file.foods[0]).sort(),['name','portion','meal','mg','protein','carbs','estimate','source','sourceUrl'].sort());
 assert(!JSON.stringify(file).includes('private'));assert.equal(file.foods[0].id,undefined);
});
test('food import merges idempotently, preserves variants and leaves logs and goals alone',()=>{
 const s=freshState();addEntry(s,localDate(),{name:'Lunch',meal:'Lunch',mg:70});const before=JSON.stringify({days:s.days,goals:s.goals,batches:s.batches});
 const file=exportFoodList(s.foods);file.foods.push({...file.foods[0],portion:'2 large eggs',mg:124,protein:12,carbs:2});
 let result=mergeFoods(s.foods,importFoodList(file));assert.equal(result.added,1);assert.equal(result.skipped,12);s.foods=result.foods;
 result=mergeFoods(s.foods,importFoodList(file));assert.equal(result.added,0);assert.equal(result.skipped,13);
 assert.equal(JSON.stringify({days:s.days,goals:s.goals,batches:s.batches}),before);
 assert.equal(sortedRegulars(s,'Breakfast').filter(f=>f.name==='Hard-boiled egg').length,2);
});
test('invalid food imports reject atomically and unknown nutrients survive roundtrip',()=>{
 const s=freshState(),food=foodFromEntry({name:'Custom',meal:'Dinner',mg:null,protein:0,carbs:null,quantityLabel:'1 bowl'});
 const file=exportFoodList([food]);assert.deepEqual(nutrientAmounts(importFoodList(file)[0]),{mg:null,protein:0,carbs:null});
 assert.throws(()=>importFoodList(s));assert.throws(()=>importFoodList({...file,days:{}}));
 assert.throws(()=>importFoodList({...file,units:{sodium:'g',protein:'g',carbs:'g'}}));
 for(const bad of [{mg:-1},{sourceUrl:'javascript:alert(1)'},{portion:''},{meal:'Unknown'}])assert.throws(()=>importFoodList({...file,foods:[file.foods[0],{...file.foods[0],...bad}]}));
 assert.equal(s.foods.length,12);
});
