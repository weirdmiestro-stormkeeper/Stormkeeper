const $=id=>document.getElementById(id),KEY="stormkeeper.v6",state=JSON.parse(localStorage.getItem(KEY)||'{"characters":[],"settings":{"inlineRules":false}}');const D={species:["Orc", "Human", "Elf", "Dwarf", "Halfling", "Gnome", "Half-Elf", "Half-Orc", "Tiefling"],background:["Soldier", "Acolyte", "Criminal", "Folk Hero", "Sage", "Hermit", "Noble", "Outlander", "Sailor", "Guild Artisan", "Entertainer", "Urchin"],classes:{"Cleric": ["Life Domain", "Light Domain", "Tempest Domain", "Trickery Domain"], "Druid": ["Circle of the Land", "Circle of the Moon", "Circle of the Shepherd"], "Fighter": ["Champion", "Battle Master", "Eldritch Knight"], "Ranger": ["Hunter", "Beast Master"], "Rogue": ["Thief", "Assassin", "Arcane Trickster"], "Wizard": ["School of Evocation", "School of Abjuration", "School of Divination", "School of Illusion"], "Sorcerer": ["Draconic Bloodline", "Wild Magic"], "Warlock": ["The Fiend", "The Archfey", "The Great Old One"], "Barbarian": ["Berserker", "Totem Warrior"], "Bard": ["College of Lore", "College of Valor"], "Monk": ["Way of the Open Hand", "Way of Shadow", "Way of the Four Elements"], "Paladin": ["Oath of Devotion", "Oath of the Ancients", "Oath of Vengeance"]},alignment:["Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "True Neutral", "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil"],deity:["Perun", "Pelor", "Bahamut", "Corellon", "Moradin", "Selûne", "Tyr", "Tempus", "The Raven Queen", "None / Custom"],armor:["None", "Leather Armor", "Studded Leather", "Hide", "Chain Shirt", "Scale Mail", "Breastplate", "Half Plate", "Ring Mail", "Chain Mail", "Splint", "Plate", "Shield"],weapon:["Club", "Dagger", "Quarterstaff", "Spear", "Light Crossbow", "Mace", "Sickle", "Scimitar", "Shortsword", "Javelin", "Handaxe", "Light Hammer", "Battleaxe", "Longsword", "Warhammer", "Maul", "Greatsword", "Greataxe", "Rapier", "Shortbow", "Longbow"]};function save(){localStorage.setItem(KEY,JSON.stringify(state))}function fill(id,a,blank="Choose…"){const e=$(id);e.innerHTML=`<option value="">${blank}</option>`+a.map(x=>`<option>${x}</option>`).join("")}function show(id){document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");scrollTo(0,0)}function subs(){fill("subclass1",D.classes[$("class1").value]||[],"No subclass");fill("subclass2",D.classes[$("class2").value]||[],"No subclass")}function init(){fill("species",D.species);fill("background",D.background);fill("class1",Object.keys(D.classes));fill("class2",["None",...Object.keys(D.classes)]);fill("alignment",D.alignment);fill("deity",D.deity);fill("armor",D.armor);fill("weapon",D.weapon);fill("level",Array.from({length:20},(_,i)=>i+1));fill("stats",["Leave blank — roll at the table","Standard Array","Point Buy"]);subs();render()}function render(){const l=$("list");l.innerHTML=state.characters.length?state.characters.map(c=>`<article class="character" data-id="${c.id}"><b>${c.name||"Unnamed Character"}</b><div class="muted">${c.species||"—"} • ${c.class1||"—"}${c.class2?` / ${c.class2}`:""} • Level ${c.level||1}</div></article>`).join(""):`<div class="card"><h3>No characters yet</h3><p class="muted">Create your first character.</p></div>`;l.querySelectorAll(".character").forEach(x=>x.onclick=()=>openSheet(x.dataset.id))}function openSheet(id){const c=state.characters.find(x=>x.id===id);if(!c)return;$("sheetName").textContent=c.name||"Unnamed Character";$("sheetMeta").textContent=[c.species,c.background,c.class1,c.subclass1,c.class2,c.subclass2].filter(Boolean).join(" • ");$("sheetBody").innerHTML=`<h3>Character Overview</h3><p><b>Level:</b> ${c.level}</p><p><b>Alignment:</b> ${c.alignment||"—"}</p><p><b>Deity:</b> ${c.deity||"—"}</p><p><b>Armor:</b> ${c.armor||"—"}</p><p><b>Weapon:</b> ${c.weapon||"—"}</p><p><b>Ability Scores:</b> ${c.stats||"—"}</p>`;show("sheet")}$("createBtn").onclick=()=>{init();show("creator")};$("cancelBtn").onclick=()=>show("home");$("backBtn").onclick=()=>show("home");$("class1").onchange=subs;$("class2").onchange=subs;$("form").onsubmit=e=>{e.preventDefault();const c={id:Date.now(),name:$("name").value,species:$("species").value,background:$("background").value,class1:$("class1").value,subclass1:$("subclass1").value,class2:$("class2").value==="None"?"":$("class2").value,subclass2:$("subclass2").value,level:+$("level").value,alignment:$("alignment").value,deity:$("deity").value,armor:$("armor").value,weapon:$("weapon").value,stats:$("stats").value,age:$("age").value};state.characters.push(c);save();render();openSheet(c.id)};$("rulesBtn").onclick=()=>show("rules");$("settingsBtn").onclick=()=>{ $("inline").checked=!!state.settings.inlineRules;show("settings")};$("settingsBack").onclick=()=>show("home");$("inline").onchange=e=>{state.settings.inlineRules=e.target.checked;save()};init();

/* ===== STORMKEEPER V8 RULE ENGINE ===== */
let RULES={classes:{},species:{},backgrounds:{},spells:{},conditions:[]};
async function loadRules(){
  const files=["classes.json","species_rules.json","background_rules.json","spells.json","conditions.json"];
  const vals=await Promise.all(files.map(f=>fetch("data/"+f).then(r=>r.json())));
  RULES={classes:vals[0],species:vals[1],backgrounds:vals[2],spells:vals[3],conditions:vals[4]};
}
function abilityMod(score){return Math.floor((Number(score||10)-10)/2)}
function proficiencyBonus(level){return 2+Math.floor((Math.max(1,Number(level||1))-1)/4)}
function classFeatures(character){
  const out=[];
  for(const [cls,level] of [[character.class1,1],[character.class2,character.class2?2:0]]){
    if(!cls||!RULES.classes[cls])continue;
    const def=RULES.classes[cls];
    Object.entries(def.features||{}).forEach(([min,fs])=>{if(level>=Number(min))fs.forEach(f=>out.push(`${cls}: ${f}`))});
    const sub=cls===character.class1?character.subclass1:character.subclass2;
    const sd=def.subclasses?.[sub];
    if(sd)Object.entries(sd.features||{}).forEach(([min,fs])=>{if(level>=Number(min))fs.forEach(f=>out.push(`${sub}: ${f}`))});
  }
  return [...new Set(out)];
}
function characterRules(character){
  const species=RULES.species[character.species]||{};
  const bg=RULES.backgrounds[character.background]||{};
  return {
    proficiency:proficiencyBonus(character.level),
    speciesFeatures:species.features||[],
    backgroundSkills:bg.skills||[],
    backgroundFeature:bg.feature||"",
    classFeatures:classFeatures(character)
  };
}
function spellCard(name){
  const s=RULES.spells[name]; if(!s)return "";
  return `<article class="rule-card"><div class="rule-card-head"><h3>${esc(name)}</h3><span>Level ${s.level}</span></div>
  <p class="muted">${esc(s.school)} • ${esc(s.castingTime)} • ${esc(s.range)}</p>
  <p>${esc(s.description)}</p>
  <button class="btn" onclick="openSpell('${esc(name).replace(/'/g,"\\'")}')">Open full entry</button></article>`;
}
function openSpell(name){
  const s=RULES.spells[name]; if(!s)return;
  const modal=document.createElement("div");modal.className="rule-modal";
  modal.innerHTML=`<div class="rule-modal-card"><button class="btn close-rule">Close</button><div class="eyebrow">SPELL</div><h1>${esc(name)}</h1>
  <p><b>Level:</b> ${s.level} • <b>School:</b> ${esc(s.school)}</p>
  <p><b>Casting Time:</b> ${esc(s.castingTime)}<br><b>Range:</b> ${esc(s.range)}<br><b>Duration:</b> ${esc(s.duration)}</p>
  <p>${esc(s.description)}</p></div>`;
  document.body.appendChild(modal);modal.querySelector(".close-rule").onclick=()=>modal.remove();
}
async function upgradeSheetWithRules(c){
  if(!Object.keys(RULES.classes).length) await loadRules();
  const r=characterRules(c);
  const box=$("sheetContent");
  const old=box.innerHTML;
  box.innerHTML=old+`<div class="engine-grid">
    <div class="character-card"><h3>Automatic Rules</h3><p><b>Proficiency Bonus:</b> +${r.proficiency}</p>
    <p><b>Species:</b> ${r.speciesFeatures.map(esc).join(", ")||"—"}</p>
    <p><b>Background Skills:</b> ${r.backgroundSkills.map(esc).join(", ")||"—"}</p>
    <p><b>Background Feature:</b> ${esc(r.backgroundFeature||"—")}</p></div>
    <div class="character-card"><h3>Class Features</h3>${r.classFeatures.map(x=>`<p>• ${esc(x)}</p>`).join("")||"<p>—</p>"}</div>
  </div>
  <div class="character-card"><h3>Spell Reference</h3><div class="rule-list">${Object.keys(RULES.spells).map(spellCard).join("")}</div></div>`;
}
const oldRenderSheet=renderSheet;
renderSheet=function(c){oldRenderSheet(c);upgradeSheetWithRules(c)};
const oldOpenRules=showRules;
showRules=async function(){await loadRules();oldOpenRules();$("rulesContent").innerHTML=`<h2>Table of Contents</h2><div class="toc">
<button onclick="showRuleChapter('Character Creation')">Character Creation <b>›</b></button>
<button onclick="showRuleChapter('Classes')">Classes <b>›</b></button>
<button onclick="showRuleChapter('Spells')">Spellcasting <b>›</b></button>
<button onclick="showRuleChapter('Conditions')">Conditions <b>›</b></button></div>`};
function showRuleChapter(chapter){
 if(chapter==="Spells"){
  $("rulesContent").innerHTML=`<button class="btn" onclick="showRules()">← Contents</button><h2>Spellcasting</h2>${Object.keys(RULES.spells).map(spellCard).join("")}`;
 }else if(chapter==="Classes"){
  $("rulesContent").innerHTML=`<button class="btn" onclick="showRules()">← Contents</button><h2>Classes</h2>`+
  Object.entries(RULES.classes).map(([n,c])=>`<article class="rule-card"><h3>${esc(n)}</h3><p><b>Hit Die:</b> d${c.hitDie}</p><p><b>Primary Ability:</b> ${esc(c.primaryAbility)}</p><p><b>Saving Throws:</b> ${c.savingThrows.map(esc).join(", ")}</p><p><b>Armor:</b> ${c.armor.map(esc).join(", ")}</p></article>`).join("");
 }else if(chapter==="Conditions"){
  $("rulesContent").innerHTML=`<button class="btn" onclick="showRules()">← Contents</button><h2>Conditions</h2><div class="rule-list">${RULES.conditions.map(x=>`<article class="rule-card"><h3>${esc(x)}</h3><p>Condition entry ready for expansion in the rules database.</p></article>`).join("")}</div>`;
 }else{
  $("rulesContent").innerHTML=`<button class="btn" onclick="showRules()">← Contents</button><h2>Character Creation</h2><p>Stormkeeper uses the character creator to collect species, background, classes, subclasses, equipment, and ability-score method.</p>`;
 }
}
loadRules();


/* ===== STORMKEEPER V9 CHARACTER MECHANICS ===== */
let MECH={};
async function loadMechanics(){MECH=await fetch("data/mechanics.json").then(r=>r.json())}
function fmtMod(n){return n>=0?`+${n}`:`${n}`}
function statValue(c,k){return Number((c.stats||{})[k] ?? 10)}
function calculateCharacter(c){
 const lvl=Math.max(1,Number(c.level||1)),pb=2+Math.floor((lvl-1)/4),mods={};
 MECH.abilityNames.forEach(n=>mods[n]=abilityMod(statValue(c,n)));
 const armor=MECH.armor[c.armor]||MECH.armor.None,dex=mods.Dexterity;
 const ac=armor.base+(armor.dex?Math.min(dex,armor.cap??99):0);
 const hp=Number(c.hp||((c.class1==="Druid"||c.class1==="Cleric")?8:8)+mods.Constitution*(lvl-1));
 const saves={};MECH.abilityNames.forEach(n=>saves[n]=mods[n]);
 for(const cls of [c.class1,c.class2])for(const s of (RULES.classes?.[cls]?.savingThrows||[]))saves[s]+=pb;
 const skills={};for(const [skill,ability] of Object.entries(MECH.skills))skills[skill]=mods[ability];
 const profSkills=new Set(RULES.backgrounds?.[c.background]?.skills||[]);for(const s of profSkills)skills[s]+=pb;
 const wis=mods.Wisdom,spellDC=8+pb+wis,spellAttack=pb+wis;
 const weapon=MECH.weapons[c.weapon]||MECH.weapons.Club,wa=weapon.finesse?Math.max(mods.Strength,mods.Dexterity):mods[weapon.ability];
 return {pb,mods,ac,hp,initiative:mods.Dexterity,spellDC,spellAttack,saves,skills,weaponBonus:wa+pb,weaponDamage:`${weapon.damage}${fmtMod(wa)}`};
}
function renderMechanics(c){
 const r=calculateCharacter(c);
 const stats=MECH.abilityNames.map(n=>`<div class="stat-tile"><b>${n.slice(0,3).toUpperCase()}</b><strong>${statValue(c,n)}</strong><span>${fmtMod(r.mods[n])}</span></div>`).join("");
 const saves=MECH.abilityNames.map(n=>`<div class="metric-row"><span>${n}</span><b>${fmtMod(r.saves[n])}</b></div>`).join("");
 const skills=Object.entries(r.skills).map(([n,v])=>`<div class="metric-row"><span>${n}</span><b>${fmtMod(v)}</b></div>`).join("");
 const d=document.createElement("div");d.className="mechanics-panel";d.innerHTML=`
 <div class="character-card"><h3>Combat Statistics</h3><div class="metric-grid">
 <div><span>Armor Class</span><strong>${r.ac}</strong></div><div><span>Hit Points</span><strong>${r.hp}</strong></div>
 <div><span>Initiative</span><strong>${fmtMod(r.initiative)}</strong></div><div><span>Proficiency</span><strong>+${r.pb}</strong></div>
 <div><span>Spell Save DC</span><strong>${r.spellDC}</strong></div><div><span>Spell Attack</span><strong>${fmtMod(r.spellAttack)}</strong></div></div></div>
 <div class="character-card"><h3>Ability Scores</h3><div class="stat-grid">${stats}</div></div>
 <div class="engine-grid"><div class="character-card"><h3>Saving Throws</h3>${saves}</div><div class="character-card"><h3>Skills</h3>${skills}</div></div>
 <div class="character-card"><h3>Attacks</h3><div class="attack-card"><b>${esc(c.weapon||"Club")}</b><span>Attack ${fmtMod(r.weaponBonus)}</span><span>Damage ${esc(r.weaponDamage)}</span></div></div>`;
 return d;
}
function addStatsEditor(c){
 const d=document.createElement("div");d.className="character-card";
 d.innerHTML=`<h3>Ability Score Editor</h3><p class="muted">Enter your rolled scores. Derived values update when you save.</p><div class="stat-editor">${MECH.abilityNames.map(n=>`<label>${n}<input id="stat_${n}" type="number" min="1" max="30" value="${statValue(c,n)}"></label>`).join("")}</div><button class="primary" id="saveStatsBtn">Save Scores & Recalculate</button>`;
 d.querySelector("#saveStatsBtn").onclick=()=>{c.stats=c.stats||{};MECH.abilityNames.forEach(n=>c.stats[n]=Number($("stat_"+n).value||10));save();renderSheet(c)};
 return d;
}
const _renderSheetV9=renderSheet;
renderSheet=function(c){_renderSheetV9(c);$("sheetContent").appendChild(renderMechanics(c));$("sheetContent").appendChild(addStatsEditor(c))};
loadMechanics();


/* ===== STORMKEEPER V10 LEVEL-UP ENGINE ===== */
let PROGRESSION={};
async function loadProgression(){PROGRESSION=await fetch("data/progression.json").then(r=>r.json())}
function classLevel(c,cls){
 if(!cls)return 0;
 if(cls===c.class1)return 1;
 if(cls===c.class2)return Math.max(1,Number(c.class2Level||0));
 return 0;
}
function plannedClassLevels(c){
 const total=Math.max(1,Number(c.level||1));
 let first=Math.min(1,total),second=Math.max(0,total-first);
 // Existing builder starts with class1 at level 1 and second class as the optional multiclass.
 return {first,second};
}
function progressionFeatures(c){
 const out=[];
 const first=classLevel(c,c.class1);
 const second=classLevel(c,c.class2);
 for(const [cls,lvl] of [[c.class1,first],[c.class2,second]]){
  if(!cls||!lvl||!PROGRESSION[cls])continue;
  for(let n=1;n<=lvl;n++) for(const f of (PROGRESSION[cls].levels[String(n)]||[])) out.push(`${cls} ${n}: ${f}`);
 }
 return [...new Set(out)];
}
function renderLevelPanel(c){
 const total=Math.max(1,Number(c.level||1));
 const next=Math.min(20,total+1);
 const feats=progressionFeatures(c);
 const d=document.createElement("div");d.className="character-card level-panel";
 d.innerHTML=`<div class="level-head"><div><div class="eyebrow">LEVEL PROGRESSION</div><h3>Level ${total}</h3></div>
 <div class="level-buttons">${total>1?'<button class="btn" id="levelDown">− Level</button>':""}<button class="primary" id="levelUp">${total<20?"Level Up →":"Max Level"}</button></div></div>
 <p class="muted">${c.class1||"Class"} ${c.class1?1:0}${c.class2?` / ${c.class2} ${Math.max(0,total-1)}`:""} • Next level: ${next}</p>
 <h4>Features currently recorded</h4><div class="feature-list">${feats.length?feats.map(f=>`<div>• ${esc(f)}</div>`).join(""):"<div>Choose a class to begin progression.</div>"}</div>`;
 d.querySelector("#levelUp")?.addEventListener("click",()=>changeCharacterLevel(c,1));
 d.querySelector("#levelDown")?.addEventListener("click",()=>changeCharacterLevel(c,-1));
 return d;
}
function changeCharacterLevel(c,delta){
 const old=Math.max(1,Number(c.level||1)),next=Math.max(1,Math.min(20,old+delta));
 if(old===next)return;
 c.level=String(next);
 // Keep the existing V9 derived calculations and character data in sync.
 save();renderSheet(c);toast(`Character is now level ${next}`);
}
const _renderSheetV10=renderSheet;
renderSheet=function(c){_renderSheetV10(c);$("sheetContent").appendChild(renderLevelPanel(c))}
loadProgression();


/* ===== STORMKEEPER V11 INTEGRATED CATALOG ===== */
let CATALOG={};
async function loadCatalog(){CATALOG=await fetch("data/catalog.json").then(r=>r.json())}
function renderCatalogSection(title,items,kind){
 return `<section class="catalog-section"><h3>${esc(title)}</h3>${Object.entries(items).map(([n,v])=>`<article class="catalog-card"><div><h4>${esc(n)}</h4><span class="source-tag">${esc(v.source||"Custom")}</span></div><p>${kind==="spells"?`Level ${v.level} • ${esc(v.school)} • ${v.classes?.join(", ")||""}`:kind==="weapons"?`${esc(v.damage)} ${esc(v.type)} • ${(v.properties||[]).join(", ")||"No listed properties"}`:kind==="armor"?`Base AC ${v.baseAC} • Dex cap ${v.dexCap??"None"} • ${v.stealthDisadvantage?"Stealth disadvantage":"No listed stealth disadvantage"}`:v.note||v.feature||((v.features||[]).join(", ")||"Rules entry")}</p></article>`).join("")}</section>`
}
async function openCatalog(){
 await loadCatalog();
 const d=document.createElement("div");d.className="rule-modal";
 d.innerHTML=`<div class="rule-modal-card catalog-modal"><button class="btn catalog-close">Close</button><div class="eyebrow">STORMKEEPER RULES DATABASE</div><h1>Reference Library</h1>
 <p class="muted">Integrated catalog. SRD entries are marked SRD; campaign additions are marked Custom.</p>
 ${renderCatalogSection("Races / Species",CATALOG.races,"races")}
 ${renderCatalogSection("Backgrounds",CATALOG.backgrounds,"backgrounds")}
 ${renderCatalogSection("Classes",CATALOG.classes,"classes")}
 ${renderCatalogSection("Custom Subclasses",CATALOG.customSubclasses,"customSubclasses")}
 ${renderCatalogSection("Armor",CATALOG.armor,"armor")}
 ${renderCatalogSection("Weapons",CATALOG.weapons,"weapons")}
 ${renderCatalogSection("Spells",CATALOG.spells,"spells")}
 <hr><p class="legal-note">${esc(CATALOG.meta.attribution)}</p></div>`;
 document.body.appendChild(d);d.querySelector(".catalog-close").onclick=()=>d.remove();
}
function attachCatalogButton(){
 const btn=document.createElement("button");btn.className="btn";btn.textContent="Rules Library";btn.onclick=openCatalog;
 const host=document.querySelector(".top-actions")||document.querySelector("header")||document.body;host.appendChild(btn);
}
loadCatalog().then(attachCatalogButton);


/* ===== STORMKEEPER V12 CLASS/SUBCLASS GATING ===== */
const SUBCLASS_UNLOCKS={Cleric:1,Druid:2};
function getClassLevel(c,cls){
 if(!cls)return 0;
 if(cls===c.class1)return Number(c.class1Level||c.level1||((c.class2)?1:c.level)||0);
 if(cls===c.class2)return Number(c.class2Level||c.level2||0);
 return 0;
}
function getTotalClassLevels(c){return getClassLevel(c,c.class1)+getClassLevel(c,c.class2)}
function subclassOptions(cls){return Object.keys(RULES.classes?.[cls]?.subclasses||{}).length?Object.keys(RULES.classes[cls].subclasses):Object.keys(D.classes[cls]||{}).filter(Boolean)}
function subclassUnlockLevel(cls){
 const def=RULES.classes?.[cls];
 if(!def)return SUBCLASS_UNLOCKS[cls]||99;
 const levels=Object.entries(def.features||{}).filter(([lvl,fs])=>fs.some(f=>/domain|circle|subclass|archetype|tradition|college|oath|patron|school|path|way/i.test(f)) ).map(([lvl])=>Number(lvl));
 return levels.length?Math.min(...levels):(SUBCLASS_UNLOCKS[cls]||99);
}
function saveCharacterPatch(c){
 const idx=state.characters.findIndex(x=>x.id===c.id);
 if(idx>=0)state.characters[idx]={...state.characters[idx],...c};
 save();
}
function renderSubclassChoices(c){
 const wrap=document.createElement('div');wrap.className='character-card subclass-choice-panel';
 const entries=[['Primary',c.class1,getClassLevel(c,c.class1),'subclass1'],['Second',c.class2,getClassLevel(c,c.class2),'subclass2']].filter(x=>x[1]);
 wrap.innerHTML=`<div class="eyebrow">CLASS SPECIALIZATION</div><h3>Subclass Choices</h3><p class="muted">A subclass only appears after this character reaches that class's subclass level. The list is filtered to the selected class.</p>`;
 for(const [label,cls,lvl,key] of entries){
   const unlock=subclassUnlockLevel(cls), opts=subclassOptions(cls), current=c[key]||'';
   const row=document.createElement('div');row.className='subclass-row';
   if(lvl<unlock){row.innerHTML=`<div><b>${esc(label)} Class: ${esc(cls)}</b><small>Class level ${lvl}. Subclass unlocks at class level ${unlock}.</small></div><span class="locked-badge">LOCKED</span>`;}
   else{
     row.innerHTML=`<label><b>${esc(label)} Class: ${esc(cls)} (Level ${lvl})</b><small>Choose from subclasses available to ${esc(cls)}.</small><select class="subclass-live"><option value="">Choose subclass…</option>${opts.map(o=>`<option value="${esc(o)}" ${o===current?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`;
     row.querySelector('select').onchange=e=>{c[key]=e.target.value;saveCharacterPatch(c);renderSheet(c)};
   }
   wrap.appendChild(row);
 }
 return wrap;
}
function normalizeCharacterLevels(c){
 let total=Math.max(1,Number(c.level||1));
 let a=Number(c.class1Level||c.level1||0),b=Number(c.class2Level||c.level2||0);
 if(!a){a=c.class2?1:total} if(c.class2&&!b){b=Math.max(1,total-a)} if(!c.class2)b=0;
 if(a+b!==total){if(c.class2){b=Math.max(0,total-a);if(a+b!==total){a=Math.max(1,total-b);}}else{a=total;b=0}}
 c.class1Level=a;c.class2Level=b;c.level=a+b;return c;
}
function refreshCreationLevels(){
 const total=Number($('level').value||1), second=$('class2').value&&$('class2').value!=='None';
 const a=$('class1Level'),b=$('class2Level');
 if(!a||!b)return;
 const maxPrimary=second?Math.max(1,total-1):total;
 fill('class1Level',Array.from({length:maxPrimary},(_,i)=>i+1));
 fill('class2Level',second?Array.from({length:Math.max(0,total-1)},(_,i)=>i+1):[],'No second-class levels');
 if(second){a.value=String(Math.min(Number(a.dataset.value||1),maxPrimary));b.value=String(Math.min(Number(b.dataset.value||Math.max(1,total-Number(a.value||1))),Math.max(1,total-1)));}
 else{a.value=String(total);b.value='';}
}
function refreshCreationChoices(){
 const selected=$('class1').value,total=Number($('level').value||1),c2=$('class2');
 fill('class2',['None',...Object.keys(D.classes).filter(c=>c!==selected)],selected?'No second class':'Choose second class');
 if(total<2){c2.value='None';c2.disabled=true}else c2.disabled=false;
 refreshCreationLevels();
}
function v12Init(){
 const total=$('level'),c1=$('class1'),c2=$('class2');
 c1.onchange=()=>{refreshCreationChoices();refreshCreationLevels()};
 c2.onchange=()=>refreshCreationLevels();
 total.onchange=()=>refreshCreationChoices();
 refreshCreationChoices();
}
// Replace the old creator submit so subclasses cannot be selected during creation.
const oldForm=$('form');
if(oldForm){
 oldForm.onsubmit=e=>{
   e.preventDefault();
   const c={id:Date.now(),name:$('name').value,species:$('species').value,background:$('background').value,class1:$('class1').value,class2:$('class2').value==='None'?'':$('class2').value,level:Number($('level').value),class1Level:Number($('class1Level').value||$('level').value),class2Level:Number($('class2Level').value||0),subclass1:'',subclass2:'',alignment:$('alignment').value,deity:$('deity').value,armor:$('armor').value,weapon:$('weapon').value,stats:$('stats').value,age:$('age').value};
   normalizeCharacterLevels(c);state.characters.push(c);save();render();openSheet(c.id);
 };
}
const _renderSheetV12=renderSheet;
renderSheet=function(c){normalizeCharacterLevels(c);_renderSheetV12(c);$('sheetContent').appendChild(renderSubclassChoices(c));};
const _changeCharacterLevelV12=changeCharacterLevel;
changeCharacterLevel=function(c,delta){
 normalizeCharacterLevels(c);const total=Number(c.level||1),classes=[c.class1,c.class2].filter(Boolean);
 if(delta<0){const target=classes.find(cls=>getClassLevel(c,cls)>1)||classes[classes.length-1];if(!target)return;if(target===c.class1)c.class1Level--;else c.class2Level--;}
 else{
   if(total>=20)return;
   const target=classes.length===1?classes[0]:prompt(`Level up in which class?\\n1. ${classes[0]} (current ${getClassLevel(c,classes[0])})\\n2. ${classes[1]} (current ${getClassLevel(c,classes[1])})`,'1');
   const cls=target==='2'?classes[1]:target==='1'?classes[0]:target;
   if(!classes.includes(cls))return;
   if(cls===c.class1)c.class1Level++;else c.class2Level++;
 }
 normalizeCharacterLevels(c);saveCharacterPatch(c);renderSheet(c);
};
v12Init();
