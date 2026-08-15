
const $ = id => document.getElementById(id);
const KEY = "stormkeeper.v13";
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmtMod = n => Number(n) >= 0 ? `+${Number(n)}` : `${Number(n)}`;

const D = {
  species:["Orc","Human","Elf","Dwarf","Halfling","Gnome","Half-Elf","Half-Orc","Tiefling"],
  background:["Soldier","Acolyte","Criminal","Folk Hero","Sage","Hermit","Noble","Outlander","Sailor","Guild Artisan","Entertainer","Urchin"],
  classes:{
    "Cleric":["Life Domain","Light Domain","Tempest Domain","Trickery Domain"],
    "Druid":["Circle of the Land","Circle of the Moon","Circle of the Shepherd"],
    "Fighter":["Champion","Battle Master","Eldritch Knight"],
    "Ranger":["Hunter","Beast Master"],
    "Rogue":["Thief","Assassin"],
    "Wizard":["School of Evocation","School of Abjuration"],
    "Sorcerer":["Draconic Bloodline"],
    "Warlock":["The Fiend"],
    "Bard":["College of Lore"],
    "Paladin":["Oath of Devotion"],
    "Barbarian":["Path of the Berserker"],
    "Monk":["Way of the Open Hand"]
  },
  alignment:["Lawful Good","Neutral Good","Chaotic Good","Lawful Neutral","True Neutral","Chaotic Neutral","Lawful Evil","Neutral Evil","Chaotic Evil"],
  deity:["Perun","Pelor","Bahamut","Corellon","Moradin","Selûne","Tyr","Tempus","The Raven Queen","None / Custom"],
  armor:["None","Leather Armor","Studded Leather","Hide","Chain Shirt","Scale Mail","Breastplate","Half Plate","Ring Mail","Chain Mail","Splint","Plate","Shield"],
  weapon:["Club","Dagger","Quarterstaff","Spear","Light Crossbow","Mace","Sickle","Scimitar","Shortsword","Javelin","Handaxe","Light Hammer","Battleaxe","Longsword","Warhammer","Maul","Greatsword","Greataxe","Rapier","Shortbow","Longbow"]
};

let RULES = {classes:{},species:{},backgrounds:{},spells:{},conditions:[]};
let MECH = {abilityNames:["Strength","Dexterity","Constitution","Intelligence","Wisdom","Charisma"],skills:{}};
let PROGRESSION = {};
let CATALOG = {};
let state = JSON.parse(localStorage.getItem(KEY) || '{"characters":[],"settings":{"inlineRules":false}}');

async function loadJSON(file, fallback){
  try { const r=await fetch(`data/${file}`); if(!r.ok) throw new Error(file); return await r.json(); }
  catch { return fallback; }
}
async function loadData(){
  const [classes,species,backgrounds,spells,conditions,mechanics,progression,catalog] = await Promise.all([
    loadJSON("classes.json",{}), loadJSON("species_rules.json",{}),
    loadJSON("background_rules.json",{}), loadJSON("spells.json",{}),
    loadJSON("conditions.json",[]), loadJSON("mechanics.json",MECH),
    loadJSON("progression.json",{}), loadJSON("catalog.json",{})
  ]);
  RULES={classes,species,backgrounds,spells,conditions};
  MECH=mechanics; PROGRESSION=progression; CATALOG=catalog;
}

function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function fill(id, values, blank="Choose…"){
  const e=$(id); if(!e)return;
  e.innerHTML=`<option value="">${esc(blank)}</option>`+values.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");
}
function show(id){document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));$(id)?.classList.add("active");scrollTo(0,0);}

function classLevel(c, cls){
  if(!cls)return 0;
  if(cls===c.class1)return Number(c.class1Level||c.level1||0);
  if(cls===c.class2)return Number(c.class2Level||c.level2||0);
  return 0;
}
function totalClassLevels(c){return classLevel(c,c.class1)+classLevel(c,c.class2);}
function normalizeLevels(c){
  let total=Math.max(1,Math.min(20,Number(c.level||1)));
  let a=Number(c.class1Level||0), b=Number(c.class2Level||0);
  if(!c.class2){a=total;b=0;}
  else{
    if(a<1)a=1;
    if(b<1)b=1;
    if(a+b!==total){b=Math.max(1,total-a); if(a+b!==total){a=Math.max(1,total-b);}}
  }
  c.class1Level=a;c.class2Level=b;c.level=a+b;
  return c;
}

/* Subclass unlock is determined by the class's actual progression data.
   Explicit fallbacks cover the core classes in the current catalog. */
const SUBCLASS_UNLOCKS={Cleric:1,Druid:2,Fighter:3,Ranger:3,Rogue:3,Wizard:2,Sorcerer:1,Warlock:1,Bard:3,Paladin:3,Barbarian:3,Monk:3};
function subclassOptions(cls){
  const def=RULES.classes?.[cls];
  if(def?.subclasses) return Object.keys(def.subclasses);
  return D.classes[cls]||[];
}
function subclassUnlockLevel(cls){
  const def=RULES.classes?.[cls];
  if(def?.features){
    const hits=Object.entries(def.features)
      .filter(([lvl,fs])=>fs.some(f=>/domain|circle|subclass|archetype|tradition|college|oath|patron|school|path|way/i.test(f)))
      .map(([lvl])=>Number(lvl));
    if(hits.length)return Math.min(...hits);
  }
  return SUBCLASS_UNLOCKS[cls]||99;
}
function saveCharacter(c){
  const i=state.characters.findIndex(x=>x.id===c.id);
  if(i>=0)state.characters[i]={...c};
  save();
}

function armorAllowed(c,name){
  if(!name)return false;
  if(name==="None")return true;
  const hasCleric=c.class1==="Cleric"||c.class2==="Cleric";
  const hasDruid=c.class1==="Druid"||c.class2==="Druid";
  const heavy=["Ring Mail","Chain Mail","Splint","Plate"].includes(name);
  const medium=["Hide","Chain Shirt","Scale Mail","Breastplate","Half Plate"].includes(name);
  const shield=name==="Shield";
  // Druid's nonmetal restriction is respected. Tempest heavy-armor access
  // is unlocked only after the subclass is actually selected.
  if(hasDruid && ["Scale Mail","Chain Shirt","Breastplate","Half Plate","Ring Mail","Chain Mail","Splint","Plate"].includes(name)) return false;
  if(shield) return hasCleric||hasDruid;
  if(heavy) return !!c.subclass1 && c.subclass1==="Tempest Domain" || !!c.subclass2 && c.subclass2==="Tempest Domain";
  if(medium) return hasCleric||hasDruid;
  return ["Leather Armor","Studded Leather"].includes(name);
}
function weaponAllowed(c,name){
  if(!name)return false;
  const simple=["Club","Dagger","Quarterstaff","Spear","Light Crossbow","Mace","Sickle","Javelin","Light Hammer"];
  const druid=["Club","Dagger","Dart","Javelin","Mace","Quarterstaff","Scimitar","Sickle","Sling","Spear"];
  const hasCleric=c.class1==="Cleric"||c.class2==="Cleric";
  const hasDruid=c.class1==="Druid"||c.class2==="Druid";
  const martial=["Scimitar","Shortsword","Handaxe","Battleaxe","Longsword","Warhammer","Maul","Greatsword","Greataxe","Rapier","Longbow","Shortbow"];
  if(hasCleric||hasDruid) {
    if(simple.includes(name)||druid.includes(name)) return true;
    const tempest=(c.subclass1==="Tempest Domain"||c.subclass2==="Tempest Domain");
    return tempest && martial.includes(name);
  }
  return true;
}
function refreshEquipmentChoices(c, preserve=true){
  const armor=$("armor"), weapon=$("weapon");
  if(armor){
    const a=D.armor.filter(x=>armorAllowed(c,x));
    const old=c.armor||armor.value;
    fill("armor",a,"Choose armor…"); if(preserve&&a.includes(old))armor.value=old;
  }
  if(weapon){
    const w=D.weapon.filter(x=>weaponAllowed(c,x));
    const old=c.weapon||weapon.value;
    fill("weapon",w,"Choose weapon…"); if(preserve&&w.includes(old))weapon.value=old;
  }
}

function refreshCreationLevels(){
  const total=Number($("level")?.value||1), c2=$("class2")?.value;
  const a=$("class1Level"), b=$("class2Level"); if(!a||!b)return;
  if(!c2 || c2==="None"){
    fill("class1Level",Array.from({length:total},(_,i)=>i+1));
    a.value=String(total); b.innerHTML='<option value="">No second-class levels</option>'; b.disabled=true;
  }else{
    const maxA=Math.max(1,total-1);
    fill("class1Level",Array.from({length:maxA},(_,i)=>i+1));
    fill("class2Level",Array.from({length:Math.max(1,total-1)},(_,i)=>i+1));
    a.value=a.value&&Number(a.value)<=maxA?a.value:"1";
    const maxB=Math.max(1,total-Number(a.value||1));
    b.value=b.value&&Number(b.value)<=maxB?b.value:String(maxB);
  }
}
function refreshCreationChoices(){
  const selected=$("class1")?.value,total=Number($("level")?.value||1),c2=$("class2");
  fill("class2",["None",...Object.keys(D.classes).filter(c=>c!==selected)],selected?"Choose second class…":"Choose second class…");
  if(total<2){c2.value="None";c2.disabled=true;}else c2.disabled=false;
  refreshCreationLevels();
  refreshEquipmentChoices({class1:selected,class2:c2.value==="None"?"":c2.value,subclass1:"",subclass2:""},false);
}

function initCreator(){
  fill("species",D.species);fill("background",D.background);
  fill("class1",Object.keys(D.classes));fill("class2",["None",...Object.keys(D.classes)]);
  fill("level",Array.from({length:20},(_,i)=>i+1));fill("alignment",D.alignment);
  fill("deity",D.deity);fill("stats",["Leave blank — roll at the table","Standard Array","Point Buy"]);
  $("class1").onchange=refreshCreationChoices;
  $("class2").onchange=()=>{refreshCreationLevels();refreshEquipmentChoices({class1:$("class1").value,class2:$("class2").value==="None"?"":$("class2").value,subclass1:"",subclass2:""},false);};
  $("level").onchange=refreshCreationChoices;
  refreshCreationChoices();
}

function render(){
  const l=$("list");
  l.innerHTML=state.characters.length?state.characters.map(c=>{
    normalizeLevels(c);
    return `<article class="character" data-id="${c.id}"><b>${esc(c.name||"Unnamed Character")}</b><div class="muted">${esc(c.species||"—")} • ${esc(c.class1||"—")} ${classLevel(c,c.class1)||1}${c.class2?` / ${esc(c.class2)} ${classLevel(c,c.class2)}`:""} • Level ${c.level||1}</div></article>`;
  }).join(""):`<div class="card"><h3>No characters yet</h3><p class="muted">Create your first character.</p></div>`;
  l.querySelectorAll(".character").forEach(x=>x.onclick=()=>openSheet(x.dataset.id));
  save();
}

function calculate(c){
  const lvl=Math.max(1,Number(c.level||1)),pb=2+Math.floor((lvl-1)/4),mods={};
  for(const n of MECH.abilityNames||[])mods[n]=Math.floor((Number((c.stats||{})[n]??10)-10)/2);
  const armor=MECH.armor?.[c.armor]||MECH.armor?.["None"]||{base:10,dex:true}, dex=mods.Dexterity||0;
  const ac=Number(armor.base??armor.baseAC??10)+(armor.dex?Math.min(dex,armor.cap??99):0)+(c.armor==="Shield"?2:0);
  const weapon=MECH.weapons?.[c.weapon]||MECH.weapons?.Club||{ability:"Strength",damage:"1d4",finesse:false};
  const wa=weapon.finesse?Math.max(mods.Strength,mods.Dexterity):mods[weapon.ability]||0;
  const spell=mods.Wisdom+pb;
  return {pb,mods,ac,initiative:mods.Dexterity||0,spellDC:8+spell,spellAttack:spell,weaponBonus:wa+pb,weaponDamage:`${weapon.damage}${fmtMod(wa)}`};
}
function mechanicsPanel(c){
  const r=calculate(c);
  const d=document.createElement("div");d.className="mechanics-panel";
  d.innerHTML=`<div class="character-card"><h3>Combat Statistics</h3><div class="metric-grid">
  <div><span>Armor Class</span><strong>${r.ac}</strong></div><div><span>Proficiency</span><strong>+${r.pb}</strong></div>
  <div><span>Initiative</span><strong>${fmtMod(r.initiative)}</strong></div><div><span>Spell Save DC</span><strong>${r.spellDC}</strong></div>
  <div><span>Spell Attack</span><strong>${fmtMod(r.spellAttack)}</strong></div></div></div>
  <div class="character-card"><h3>Ability Scores</h3><div class="stat-grid">${(MECH.abilityNames||[]).map(n=>`<div class="stat-tile"><b>${esc(n.slice(0,3).toUpperCase())}</b><strong>${esc((c.stats||{})[n]??"—")}</strong><span>${fmtMod(r.mods[n])}</span></div>`).join("")}</div></div>`;
  return d;
}
function progressionPanel(c){
  const d=document.createElement("div");d.className="character-card level-panel";
  const total=Number(c.level||1);
  const features=[];
  for(const [cls,lvl] of [[c.class1,classLevel(c,c.class1)],[c.class2,classLevel(c,c.class2)]]){
    if(!cls)continue;
    for(let n=1;n<=lvl;n++)for(const f of (PROGRESSION[cls]?.levels?.[String(n)]||[]))features.push(`${cls} ${n}: ${f}`);
  }
  d.innerHTML=`<div class="level-head"><div><div class="eyebrow">LEVEL PROGRESSION</div><h3>Level ${total}</h3></div><div class="level-buttons"><button class="btn" id="levelDown"${total<=1?" disabled":""}>− Level</button><button class="primary" id="levelUp"${total>=20?" disabled":""}>Level Up →</button></div></div>
  <p class="muted">${esc(c.class1||"Class")} ${classLevel(c,c.class1)}${c.class2?` / ${esc(c.class2)} ${classLevel(c,c.class2)}`:""}</p>
  <h4>Features currently recorded</h4><div class="feature-list">${features.map(f=>`<div>• ${esc(f)}</div>`).join("")||"<div>—</div>"}</div>`;
  d.querySelector("#levelUp").onclick=()=>levelUp(c,1);
  d.querySelector("#levelDown").onclick=()=>levelUp(c,-1);
  return d;
}
function subclassPanel(c){
  const wrap=document.createElement("div");wrap.className="character-card subclass-choice-panel";
  wrap.innerHTML=`<div class="eyebrow">CLASS SPECIALIZATION</div><h3>Subclass Choices</h3><p class="muted">Subclasses are hidden during creation and appear here only after the character reaches the required level in that specific class.</p>`;
  for(const [label,cls,key] of [["Primary",c.class1,"subclass1"],["Second",c.class2,"subclass2"]]){
    if(!cls)continue;
    const lvl=classLevel(c,cls), unlock=subclassUnlockLevel(cls), opts=subclassOptions(cls), current=c[key]||"";
    const row=document.createElement("div");row.className="subclass-row";
    if(lvl<unlock){
      row.innerHTML=`<div><b>${esc(label)} Class: ${esc(cls)}</b><small>Class level ${lvl}. Unlocks at class level ${unlock}.</small></div><span class="locked-badge">LOCKED</span>`;
    }else{
      row.innerHTML=`<label><b>${esc(label)} Class: ${esc(cls)} — Level ${lvl}</b><small>Only subclasses belonging to ${esc(cls)} are shown.</small><select><option value="">Choose subclass…</option>${opts.map(o=>`<option value="${esc(o)}"${o===current?" selected":""}>${esc(o)}</option>`).join("")}</select></label>`;
      row.querySelector("select").onchange=e=>{
        c[key]=e.target.value; saveCharacter(c); renderSheet(c);
      };
    }
    wrap.appendChild(row);
  }
  return wrap;
}
function levelUp(c,delta){
  normalizeLevels(c);
  const classes=[c.class1,c.class2].filter(Boolean);
  if(delta<0){
    if(c.class2 && c.class2Level>1)c.class2Level--;
    else if(c.class1Level>1)c.class1Level--;
    else return;
  }else{
    if(Number(c.level)>=20)return;
    let cls=classes[0];
    if(classes.length===2){
      const choice=prompt(`Level up in which class?\n1. ${classes[0]} (class level ${classLevel(c,classes[0])})\n2. ${classes[1]} (class level ${classLevel(c,classes[1])})`,"1");
      cls=choice==="2"?classes[1]:classes[0];
    }
    if(cls===c.class1)c.class1Level++;else c.class2Level++;
  }
  normalizeLevels(c);
  // If a subclass was somehow selected and the class level is reduced below
  // its unlock level, clear it so an illegal state cannot persist.
  for(const [cls,key] of [[c.class1,"subclass1"],[c.class2,"subclass2"]]){
    if(cls && c[key] && classLevel(c,cls)<subclassUnlockLevel(cls))c[key]="";
  }
  saveCharacter(c);render();renderSheet(c);
}

function renderSheet(c){
  normalizeLevels(c);
  $("sheetName").textContent=c.name||"Unnamed Character";
  $("sheetMeta").textContent=[c.species,c.background,`${c.class1||"—"} ${classLevel(c,c.class1)||""}`,c.class2?`${c.class2} ${classLevel(c,c.class2)}`:"",c.subclass1,c.subclass2].filter(Boolean).join(" • ");
  const body=$("sheetBody"); body.innerHTML="";
  const overview=document.createElement("div");overview.innerHTML=`<h3>Character Overview</h3>
    <p><b>Total Level:</b> ${c.level}</p><p><b>Alignment:</b> ${esc(c.alignment||"—")}</p><p><b>Deity:</b> ${esc(c.deity||"—")}</p>
    <p><b>Armor:</b> ${esc(c.armor||"—")}</p><p><b>Weapon:</b> ${esc(c.weapon||"—")}</p>`;
  body.appendChild(overview);
  body.appendChild(progressionPanel(c));
  body.appendChild(subclassPanel(c));
  body.appendChild(mechanicsPanel(c));

  const eq=document.createElement("div");eq.className="character-card";
  eq.innerHTML="<h3>Equipment Choices</h3><div class='grid'><label>Armor<select id='sheetArmor'></select></label><label>Weapon<select id='sheetWeapon'></select></label></div>";
  body.appendChild(eq);
  refreshEquipmentChoices(c,false);
  const sa=eq.querySelector("#sheetArmor"),sw=eq.querySelector("#sheetWeapon");
  fillElement(sa,D.armor.filter(x=>armorAllowed(c,x)),"Choose armor…",c.armor);
  fillElement(sw,D.weapon.filter(x=>weaponAllowed(c,x)),"Choose weapon…",c.weapon);
  sa.onchange=e=>{c.armor=e.target.value;saveCharacter(c);renderSheet(c)};
  sw.onchange=e=>{c.weapon=e.target.value;saveCharacter(c);renderSheet(c)};
}
function fillElement(e,values,blank,current){
  e.innerHTML=`<option value="">${esc(blank)}</option>`+values.map(x=>`<option value="${esc(x)}"${x===current?" selected":""}>${esc(x)}</option>`).join("");
}

function openSheet(id){const c=state.characters.find(x=>x.id===id);if(!c)return;normalizeLevels(c);saveCharacter(c);renderSheet(c);show("sheet");}

$("createBtn").onclick=()=>{initCreator();show("creator")};
$("cancelBtn").onclick=()=>show("home");
$("backBtn").onclick=()=>show("home");
$("form").onsubmit=e=>{
  e.preventDefault();
  const c={id:Date.now(),name:$("name").value.trim(),species:$("species").value,background:$("background").value,
    class1:$("class1").value,class2:$("class2").value==="None"?"":$("class2").value,
    level:Number($("level").value||1),class1Level:Number($("class1Level").value||1),class2Level:Number($("class2Level").value||0),
    subclass1:"",subclass2:"",alignment:$("alignment").value,deity:$("deity").value,
    armor:$("armor").value,weapon:$("weapon").value,stats:$("stats").value,age:$("age").value};
  normalizeLevels(c);
  // Creation is intentionally subclass-free.
  state.characters.push(c);save();render();openSheet(c.id);
};
$("rulesBtn").onclick=async()=>{await openCatalog();show("rules")};
$("settingsBtn").onclick=()=>{$("inline").checked=!!state.settings.inlineRules;show("settings")};
$("settingsBack").onclick=()=>show("home");
$("inline").onchange=e=>{state.settings.inlineRules=e.target.checked;save();};

async function openCatalog(){
  const books = CATALOG && Object.keys(CATALOG).length ? CATALOG : {};
  const rules = document.querySelector("#rules .book");
  if(!rules)return;
  rules.innerHTML=`<div class="cover"><small>SRD FOUNDATION</small><h1>STORMKEEPER</h1><p>RULES REFERENCE</p></div>
  <h2>Table of Contents</h2><div class="toc">
  ${["Character Creation","Classes","Species","Backgrounds","Equipment","Spellcasting","Adventuring","Combat","Conditions"].map(x=>`<button data-chapter="${esc(x)}">${esc(x)}<b>›</b></button>`).join("")}</div>
  <div id="rulesContent" class="book-text"></div>`;
  rules.querySelectorAll("[data-chapter]").forEach(b=>b.onclick=()=>showRuleChapter(b.dataset.chapter));
}
function showRuleChapter(chapter){
  const box=$("rulesContent"); if(!box)return;
  if(chapter==="Classes"){
    const entries=Object.entries(RULES.classes||{}).map(([n,v])=>`<article class="rule-card"><h3>${esc(n)}</h3><p>Hit Die: d${v.hitDie||8} • Primary ability: ${esc(v.primaryAbility||"—")}</p><p>${esc((v.features?.["1"]||[]).join(", "))}</p></article>`).join("");
    box.innerHTML=`<button class="btn" onclick="openCatalog()">← Contents</button><h2>Classes</h2>${entries}`;
  }else if(chapter==="Conditions"){
    box.innerHTML=`<button class="btn" onclick="openCatalog()">← Contents</button><h2>Conditions</h2><div class="rule-list">${(RULES.conditions||[]).map(x=>`<article class="rule-card"><h3>${esc(x)}</h3></article>`).join("")}</div>`;
  }else if(chapter==="Spellcasting"){
    const entries=Object.entries(RULES.spells||{}).map(([n,v])=>`<article class="rule-card"><h3>${esc(n)}</h3><p>${esc(v.level||"")}</p><button class="rule-link" onclick='alert("Open spell reference: ${esc(n)}")'>Reference</button></article>`).join("");
    box.innerHTML=`<button class="btn" onclick="openCatalog()">← Contents</button><h2>Spellcasting</h2>${entries}`;
  }else{
    box.innerHTML=`<button class="btn" onclick="openCatalog()">← Contents</button><h2>${esc(chapter)}</h2><p>This chapter is a navigation point for the integrated Stormkeeper rules database.</p>`;
  }
}

(async function boot(){
  await loadData();
  Object.values(state.characters).forEach(c=>normalizeLevels(c));
  initCreator();
  render();
})();
