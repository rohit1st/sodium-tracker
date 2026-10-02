// Reference portions from Health Canada's Nutrient Value of Some Common Foods (2008).
// Generic estimates, not brand-specific label values. Preparation and additions matter.
export const FOOD_REFERENCE='https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/nutrient-data/nutrient-value-some-common-foods-2008.html';
const rows=[
  ['egg','Hard-boiled egg','1 large (50 g)','Breakfast',62,6,1],
  ['oats','Cooked oatmeal','175 mL (173 g)','Breakfast',1,4,17],
  ['banana','Banana','1 medium (118 g)','Breakfast',1,1,27],
  ['yogurt','Plain yogurt, 1–2% fat','175 mL (181 g)','Breakfast',127,10,13],
  ['chicken','Roasted chicken breast, skinless','75 g cooked','Lunch',56,25,0],
  ['rice','Cooked brown rice','125 mL (103 g)','Dinner',5,3,24],
  ['lentils','Boiled pink lentils','175 mL (179 g)','Dinner',4,14,32],
  ['potato','Baked potato with skin','1 potato (173 g)','Dinner',17,4,37],
  ['hummus','Hummus','60 mL (57 g)','Snacks',215,4,8],
  ['peanut-butter','Natural peanut butter','30 mL (31 g)','Snacks',2,7,7],
  ['rice-cake','Plain rice cake','1 cake (9 g)','Snacks',29,1,7],
  ['tortilla','Corn tortilla','1 tortilla (19 g)','Lunch',9,1,8]
];
export const STARTER_FOODS=rows.map(([key,name,portion,meal,mg,protein,carbs])=>({id:'starter-'+key,name,portion,meal,mg,protein,carbs,estimate:true,source:'Health Canada · 2008 reference',sourceUrl:FOOD_REFERENCE}));
