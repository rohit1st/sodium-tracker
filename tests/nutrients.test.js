import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,localDate,shiftDate,addEntry,finishDay,summary,nutrientAmounts,batchNutrients,validateBackup,sortedRegulars,currentMeal} from '../src/core.js';

test('optional nutrients scale together; blank stays unknown, zero stays zero',()=>{
  assert.deepEqual(nutrientAmounts({sodium:140,protein:8,carbs:12},.5,'containers',4),{mg:280,protein:16,carbs:24});
  assert.deepEqual(nutrientAmounts({sodium:'',protein:0,carbs:null},1.5),{mg:null,protein:0,carbs:null});
  assert.throws(()=>nutrientAmounts({protein:-1},1));
});
test('protein reaches upward; sodium/carbs stay within limits; unknown values do not win stickers',()=>{
  const state=freshState(),date=localDate();state.goals.protein=80;state.goals.carbs=200;
  addEntry(state,date,{name:'Meal',meal:'Lunch',mg:200,protein:85,carbs:210});finishDay(state,date);
  assert.equal(summary(state.days[date],'protein').status,'within');assert.equal(summary(state.days[date],'sodium').status,'within');assert.equal(summary(state.days[date],'carbs').status,'over');
  addEntry(state,date,{name:'Missing values',meal:'Dinner',mg:null,protein:null,carbs:null});finishDay(state,date);
  for(const key of ['sodium','protein','carbs']){assert.equal(summary(state.days[date],key).status,'incomplete');assert.equal(summary(state.days[date],key).missing,1);}
});
test('protein below target is distinct from over-limit; goals are independent historical snapshots',()=>{
  const state=freshState(),date=shiftDate(localDate(),-1);state.goals.protein=90;
  addEntry(state,date,{name:'Meal',meal:'Dinner',mg:100,protein:30});finishDay(state,date);state.goals.protein=30;
  assert.equal(summary(state.days[date],'protein').goal,90);assert.equal(summary(state.days[date],'protein').status,'below');
});
test('old sodium backups migrate with macros unknown and no invented historical goals',()=>{
  const old={schema:1,goal:2000,onboarded:true,days:{[localDate()]:{goal:1800,entries:[{id:'old',name:'Soup',mg:300,meal:'Lunch'}],complete:true}},batches:[],favorites:[]};
  const next=validateBackup(old);assert.equal(next.schema,2);assert.equal(next.primary,'sodium');assert.equal(next.needsGoalSetup,true);assert.equal(next.days[localDate()].entries[0].protein,null);assert.equal(next.days[localDate()].goals.protein,null);assert.equal(summary(next.days[localDate()]).total,300);
});
test('recipe portions never silently use partial ingredient nutrition as a complete total',()=>{
  const batch={yield:4,ingredients:[{name:'Beans',sodium:200,protein:20,carbs:40,amount:2,mode:'servings'},{name:'Sauce',sodium:50,protein:null,carbs:10,amount:1,mode:'servings'}]};
  assert.deepEqual(batchNutrients(batch,2),{mg:225,protein:null,carbs:45});
});
test('regulars prefer selected mealtime and preserve all nutrient values',()=>{
  const s=freshState(),date=localDate();addEntry(s,date,{name:'Soup',mg:300,protein:15,meal:'Dinner'});addEntry(s,date,{name:'Oats',mg:0,protein:12,carbs:30,meal:'Breakfast'});
  assert.equal(sortedRegulars(s,'Breakfast')[0].name,'Oats');assert.equal(sortedRegulars(s,'Dinner')[0].name,'Soup');assert.equal(currentMeal(8),'Breakfast');assert.equal(currentMeal(13),'Lunch');assert.equal(currentMeal(19),'Dinner');
});
