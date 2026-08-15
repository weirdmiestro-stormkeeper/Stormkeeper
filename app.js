const PROFILE_KEY='stormkeeper_profiles';const ACTIVE_KEY='stormkeeper_active';const defaults={name:"",str:"",dex:"",con:"",int:"",wis:"",cha:"",ac:"",initiative:"",speed:"30",maxHp:"",currentHp:"",tempHp:"",deity:"Perun",background:"Soldier",alignment:"Neutral Good",race:"Orc",equipment:"Club, shield, leather armor, druidic focus, holy symbol of Perun, explorer's pack, wolf-head battle pelt, soldier's gear and insignia.",traits:"A weathered veteran who listens more than he speaks. Disciplined and watchful, but gentler with animals and the innocent than his appearance suggests.",ideals:"Strength means knowing when to fight and when to listen. I serve Perun by protecting life, not merely winning battles.",bonds:"I seek redemption through secret acts of service, helping others without seeking praise or recognition.",flaws:"I still carry the weight of my betrayal and sometimes mistake silence for judgment.",backstory:"",notes:""};let profiles=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');if(!profiles){profiles=[{id:'gruk',...defaults,name:'',class1:'Cleric',level1:1,class2:'Druid',level2:2}];localStorage.setItem(PROFILE_KEY,JSON.stringify(profiles));}let activeId=localStorage.getItem(ACTIVE_KEY);if(!activeId)activeId=profiles[0].id;let profile=profiles.find(x=>x.id===activeId)||profiles[0];let d={...defaults,...profile};function syncProfile(){profiles=profiles.map(x=>x.id===activeId?{...x,...d}:x);localStorage.setItem(PROFILE_KEY,JSON.stringify(profiles));localStorage.setItem(ACTIVE_KEY,activeId)}localStorage.setItem('stormkeeper',JSON.stringify(d));
function save(){localStorage.setItem('stormkeeper',JSON.stringify(d));syncProfile();calc()}function mod(v){v=Number(v);return Number.isNaN(v)?'—':(Math.floor((v-10)/2)>=0?'+':'')+Math.floor((v-10)/2)}
const dashboard=document.getElementById('dashboard'),sheetApp=document.getElementById('sheetApp'),creator=document.getElementById('creator');function renderCharacters(){const box=document.getElementById('characters');box.innerHTML=profiles.map(p=>`<article class="char-card"><div><h3>${p.name||'Unnamed Adventurer'}</h3><p>${p.race||'—'} · ${p.class1||'—'} ${p.level1||1}${p.class2?' / '+p.class2+' '+p.level2:''}</p><p>${p.background||''}${p.deity?' · '+p.deity:''}</p></div><div class="char-actions"><button class="primary" onclick="openProfile('${p.id}')">Open</button><button class="secondary" onclick="duplicateProfile('${p.id}')">Copy</button></div></article>`).join('')||'<div class="empty">No characters yet.</div>'}function showDashboard(){dashboard.classList.remove('hidden');dashboard.classList.add('active');sheetApp.classList.add('hidden');creator.classList.add('hidden');renderCharacters()}function openProfile(id){const p=profiles.find(x=>x.id===id);if(!p)return;activeId=id;localStorage.setItem(ACTIVE_KEY,id);d={...defaults,...p};localStorage.setItem('stormkeeper',JSON.stringify(d));location.reload()}function duplicateProfile(id){const p=profiles.find(x=>x.id===id);if(!p)return;const copy={...p,id:'char-'+Date.now(),name:(p.name||'Unnamed')+' Copy'};profiles.push(copy);localStorage.setItem(PROFILE_KEY,JSON.stringify(profiles));renderCharacters()}document.getElementById('newChar').onclick=()=>{creator.classList.remove('hidden');dashboard.classList.add('hidden')};document.getElementById('cancelCreate').onclick=showDashboard;document.getElementById('backDash').onclick=showDashboard;document.getElementById('finishCreate').onclick=()=>{const p={...defaults,id:'char-'+Date.now(),name:document.getElementById('cName').value,race:document.getElementById('cRace').value,background:document.getElementById('cBackground').value,deity:document.getElementById('cDeity').value,class1:document.getElementById('cClass1').value,level1:Number(document.getElementById('cLevel1').value),class2:document.getElementById('cClass2').value,level2:Number(document.getElementById('cLevel2').value)};profiles.push(p);localStorage.setItem(PROFILE_KEY,JSON.stringify(profiles));activeId=p.id;localStorage.setItem(ACTIVE_KEY,activeId);d={...defaults,...p};localStorage.setItem('stormkeeper',JSON.stringify(d));location.reload()};renderCharacters();dashboard.classList.remove('hidden');sheetApp.classList.add('hidden');
const stats=document.getElementById('stats');['str','dex','con','int','wis','cha'].forEach(k=>{let x=document.createElement('div');x.className='ability';x.innerHTML=`<b>${k.toUpperCase()}</b><input type="number"><span class="mod">—</span>`;x.querySelector('input').value=d[k];x.querySelector('input').oninput=e=>{d[k]=e.target.value;save()};x.querySelector('.mod').dataset.k=k;stats.appendChild(x)});
const skills=[['Acrobatics','dex'],['Animal Handling','wis'],['Arcana','int'],['Athletics','str'],['Deception','cha'],['History','int'],['Insight','wis'],['Intimidation','cha'],['Investigation','int'],['Medicine','wis'],['Nature','int'],['Perception','wis'],['Performance','cha'],['Persuasion','cha'],['Religion','int'],['Sleight of Hand','dex'],['Stealth','dex'],['Survival','wis']];document.getElementById('skills').innerHTML=skills.map(s=>`<div class="skill">${s[0]}<span data-skill="${s[1]}">—</span></div>`).join('');
document.querySelectorAll('[data-k]').forEach(e=>{let k=e.dataset.k;if(d[k]!==undefined)e.value=d[k];e.oninput=()=>{d[k]=e.value;save()}});function calc(){document.querySelectorAll('.mod').forEach(e=>e.textContent=mod(d[e.dataset.k]));document.querySelectorAll('[data-skill]').forEach(e=>e.textContent=mod(d[e.dataset.skill]));document.querySelector('#spellstats').innerHTML=`<p>Save DC: ${d.wis===''?'—':8+2+Math.floor((Number(d.wis)-10)/2)} · Spell Attack: ${d.wis===''?'—':(Math.floor((Number(d.wis)-10)/2)+2>=0?'+':'')+(Math.floor((Number(d.wis)-10)/2)+2)}</p>`}calc();
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button,section').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById(b.dataset.tab).classList.add('active')});document.querySelector('nav button').classList.add('active');function roll(n){document.getElementById('roll').textContent=Math.floor(Math.random()*n)+1}
document.getElementById('export').onclick=()=>{let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));a.download=(d.name||'character')+'.json';a.click()};document.getElementById('import').onchange=e=>{let r=new FileReader();r.onload=()=>{d={...defaults,...JSON.parse(r.result)};save();location.reload()};r.readAsText(e.target.files[0])};document.getElementById('reset').onclick=()=>{if(confirm('Reset entered data?')){d={...defaults};save();location.reload()}};
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');

const bookSections=[
 {id:"contents",title:"Table of Contents",intro:"Browse the reference like a digital rulebook.",items:[
  ["character","Character Basics"],["combat","Combat & Adventuring"],["classes","Classes"],["species","Species"],["backgrounds","Backgrounds"],["equipment","Equipment"],["spells","Spellcasting"],["conditions","Conditions"]]},
 {id:"character",title:"Character Basics",intro:"Core concepts used throughout character creation and play.",items:[
  ["ability","Ability Scores & Modifiers"],["proficiency","Proficiency Bonus"],["skills","Skills"],["saves","Saving Throws"],["inspiration","Inspiration"]]},
 {id:"combat",title:"Combat & Adventuring",intro:"Common rules used during encounters and exploration.",items:[
  ["turn","The Order of Combat"],["action","Actions in Combat"],["movement","Movement"],["rest","Resting"],["death","Death & Dying"],["concentration","Concentration"]]},
 {id:"classes",title:"Classes",intro:"Class reference entries available in the SRD.",items:[
  ["cleric","Cleric"],["druid","Druid"]]},
 {id:"species",title:"Species",intro:"Species and ancestry rules available in the reference.",items:[
  ["orc","Orc"]]},
 {id:"backgrounds",title:"Backgrounds",intro:"Backgrounds provide proficiencies, equipment, and story hooks.",items:[
  ["soldier","Soldier"]]},
 {id:"equipment",title:"Equipment",intro:"Weapons, armor, and adventuring gear.",items:[
  ["weapons","Weapons"],["armor","Armor"],["gear","Adventuring Gear"]]},
 {id:"spells",title:"Spellcasting",intro:"Spellcasting rules and a searchable spell index.",items:[
  ["spellindex","Spell Index"]]},
 {id:"conditions",title:"Conditions",intro:"Conditions that can affect creatures.",items:[
  ["conditionslist","Condition Index"]]}
];

const bookPages={
ability:["Ability Scores & Modifiers","Ability scores measure the physical and mental characteristics of a creature. Each score has a modifier used for relevant rolls and checks."],
proficiency:["Proficiency Bonus","A character's proficiency bonus represents experience and training. It is added when a rule says a creature is proficient with a roll, save, skill, tool, or other feature."],
skills:["Skills","Skills represent focused applications of ability checks. The six abilities are Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma."],
saves:["Saving Throws","A saving throw represents an attempt to resist a spell, trap, poison, disease, or similar threat. The relevant ability determines the save unless a rule says otherwise."],
inspiration:["Inspiration","Inspiration can be awarded for roleplaying, usually when a character acts in a way encouraged by a background, personality trait, ideal, bond, or flaw."],
turn:["The Order of Combat","Combat is organized into rounds and turns. Each participant acts in initiative order, taking a turn during each round."],
action:["Actions in Combat","On a turn, a creature can normally take one action. Common actions include Attack, Cast a Spell, Dash, Disengage, Dodge, Help, Hide, and Ready."],
movement:["Movement","A creature can move up to its speed on its turn. Movement can be divided before and after actions and can interact with difficult terrain and other rules."],
rest:["Resting","A short rest is a period of downtime of at least 1 hour. A long rest is an extended period of downtime used to recover hit points and other resources according to the rules."],
death:["Death & Dying","When a creature is reduced to 0 hit points, the rules for falling unconscious, death saving throws, and stabilization determine what happens next."],
concentration:["Concentration","Some spells require concentration. Taking damage can force a Constitution saving throw to maintain the spell, and certain conditions or actions can end concentration."],
cleric:["Cleric","A cleric is a divine spellcaster whose class features include spellcasting and a Divine Domain. The SRD includes the Life Domain as a domain reference."],
druid:["Druid","A druid is a Wisdom-based spellcaster connected to nature. Class features include spellcasting and Wild Shape, with a druid circle providing additional features."],
orc:["Orc","An orc is a playable species entry in the SRD 5.1. Its traits provide the mechanical benefits described by the species entry."],
soldier:["Soldier","Soldier is a background focused on martial experience, with proficiencies and equipment associated with military service."],
weapons:["Weapons","Weapons are categorized by properties such as simple or martial, melee or ranged, and one-handed or two-handed use. Weapon entries specify damage and properties."],
armor:["Armor","Armor affects Armor Class and may have requirements or limitations. Armor is divided into light, medium, and heavy categories, with shields handled separately."],
gear:["Adventuring Gear","Adventuring gear covers common equipment used for travel, exploration, survival, and dungeon adventuring."],
conditionslist:["Condition Index","Conditions describe common states that impose specific effects. Examples include blinded, grappled, prone, restrained, and unconscious."]
};

function openRules(){document.getElementById("rulesModal").classList.add("open");showBook("contents")}
function closeRules(){document.getElementById("rulesModal").classList.remove("open")}
function showBook(id){
 const sec=bookSections.find(x=>x.id===id);
 if(!sec)return;
 let body=`<div class="book-breadcrumb"><button onclick="showBook('contents')">Contents</button> › ${esc(sec.title)}</div><h1>${esc(sec.title)}</h1><p class="book-intro">${esc(sec.intro)}</p>`;
 if(sec.items.length){
   body+=`<div class="toc-grid">`+sec.items.map(([key,label])=>`<button class="toc-entry" onclick="showBookPage('${key}')"><span>${esc(label)}</span><b>›</b></button>`).join("")+`</div>`;
 }
 document.getElementById("bookContent").innerHTML=body;
}
function showBookPage(key){
 if(key==="contents"){showBook("contents");return}
 if(key==="spellindex"){showSpellIndex();return}
 const data=bookPages[key];
 if(!data){showBook("contents");return}
 document.getElementById("bookContent").innerHTML=`<div class="book-breadcrumb"><button onclick="showBook('contents')">Contents</button> › Reference</div><h1>${esc(data[0])}</h1><p class="book-text">${esc(data[1])}</p><button class="book-back" onclick="showBook('contents')">← Back to Contents</button>`;
}
function showSpellIndex(){
 const names=Object.keys(rulesDB).sort();
 document.getElementById("bookContent").innerHTML=`<div class="book-breadcrumb"><button onclick="showBook('contents')">Contents</button> › Spellcasting</div><h1>Spell Index</h1><p class="book-intro">Select a spell to open its full reference card.</p><div class="spell-index">${names.map(n=>`<button class="toc-entry" onclick="openRule('spell',${JSON.stringify(n)})"><span>${esc(n)}</span><b>›</b></button>`).join("")}</div>`;
}

const rulesDB={
"Goodberry":{level:"1st-level transmutation",casting:"1 action",range:"Touch",components:"V, S, M (a sprig of mistletoe)",duration:"Instantaneous",description:"You create up to ten magical berries that are infused with magic for the duration. A creature can use its action to eat one berry. Eating a berry restores 1 hit point, and the berry provides enough nourishment to sustain a creature for one day. The berries lose their potency if they have not been consumed within 24 hours of this spell being cast."},
"Healing Word":{level:"1st-level evocation",casting:"1 bonus action",range:"60 feet",components:"V",duration:"Instantaneous",description:"A creature of your choice that you can see within range regains hit points."},
"Entangle":{level:"1st-level conjuration",casting:"1 action",range:"90 feet",components:"V, S",duration:"Concentration, up to 1 minute",description:"Grasping weeds and vines sprout from the ground in a 20-foot square starting from a point within range. For the duration, these plants turn the ground in the area into difficult terrain. A creature in the area when you cast the spell must succeed on a Strength saving throw or be restrained by the entangling plants until the spell ends."},
"Faerie Fire":{level:"1st-level evocation",casting:"1 action",range:"60 feet",components:"V",duration:"Concentration, up to 1 minute",description:"Each object in a 20-foot cube within range is outlined in light. Any creature in the area when the spell is cast is also outlined in light if it fails a Dexterity saving throw. Attack rolls against affected creatures have advantage if the attacker can see them."},
"Bless":{level:"1st-level enchantment",casting:"1 action",range:"30 feet",components:"V, S, M (a sprinkling of holy water)",duration:"Concentration, up to 1 minute",description:"You bless up to three creatures of your choice within range. Whenever a target makes an attack roll or a saving throw before the spell ends, the target can roll a d4 and add the number rolled to the attack roll or saving throw."},
"Guiding Bolt":{level:"1st-level evocation",casting:"1 action",range:"120 feet",components:"V, S",duration:"1 round",description:"Make a ranged spell attack against the target. On a hit, the target takes radiant damage, and the next attack roll made against this target before the end of your next turn has advantage."},
"Sanctuary":{level:"1st-level abjuration",casting:"1 bonus action",range:"30 feet",components:"V, S, M (a small silver mirror)",duration:"1 minute",description:"You ward a creature within range against attack. A creature that targets the warded creature with an attack or a harmful spell must first make a Wisdom saving throw. On a failed save, it must choose a new target or lose the attack or spell."},
"Fog Cloud":{level:"1st-level conjuration",casting:"1 action",range:"120 feet",components:"V, S",duration:"Concentration, up to 1 hour",description:"You create a 20-foot-radius sphere of fog centered on a point within range. The sphere spreads around corners, and its area is heavily obscured."},
"Thunderwave":{level:"1st-level evocation",casting:"1 action",range:"Self (15-foot cube)",components:"V, S",duration:"Instantaneous",description:"A wave of thunderous force sweeps out from you. Each creature in a 15-foot cube originating from you must make a Constitution saving throw. On a failed save, a creature takes thunder damage and is pushed 10 feet away from you. On a successful save, it takes half as much damage and isn't pushed."},
"Shillelagh":{level:"Transmutation cantrip",casting:"1 bonus action",range:"Touch",components:"V, S, M",duration:"1 minute",description:"The wood of a club or quarterstaff you are holding is imbued with nature's power. You can use your spellcasting ability instead of Strength for attacks with the weapon, its damage die becomes a d8, and it becomes magical."},
"Guidance":{level:"Divination cantrip",casting:"1 action",range:"Touch",components:"V, S",duration:"Concentration, up to 1 minute",description:"You touch one willing creature. Once before the spell ends, the target can roll a d4 and add the number rolled to one ability check of its choice."},
"Thorn Whip":{level:"Transmutation cantrip",casting:"1 action",range:"30 feet",components:"V, S, M",duration:"Instantaneous",description:"Make a melee spell attack against a creature within range. On a hit, the target takes piercing damage, and if it is Large or smaller, you can pull it up to 10 feet closer."},
"Sacred Flame":{level:"Evocation cantrip",casting:"1 action",range:"60 feet",components:"V, S",duration:"Instantaneous",description:"The target must succeed on a Dexterity saving throw or take radiant damage. The target gains no benefit from cover for this saving throw."},
"Thaumaturgy":{level:"Transmutation cantrip",casting:"1 action",range:"30 feet",components:"V",duration:"Up to 1 minute",description:"You manifest a minor wonder, such as harmless tremors, a booming voice, flames changing appearance, an opened or closed door, or a change in the appearance of your eyes."},
"Toll the Dead":{level:"Necromancy cantrip",casting:"1 action",range:"60 feet",components:"V, S",duration:"Instantaneous",description:"The target must succeed on a Wisdom saving throw or take necrotic damage. If the target is missing any of its hit points, the spell deals a larger die of damage."}
};
function openRule(type,name){
 const r=rulesDB[name];
 const body=document.getElementById("ruleModalBody");
 if(!r){body.innerHTML=`<div class="rule-kicker">${esc(type)}</div><h2>${esc(name)}</h2><p class="hint">No reference entry is loaded for this item yet.</p>`}
 else body.innerHTML=`<div class="rule-kicker">SPELL</div><h2>${esc(name)}</h2><p class="rule-level">${esc(r.level)}</p><div class="rule-stats"><div><b>Casting Time</b><span>${esc(r.casting)}</span></div><div><b>Range</b><span>${esc(r.range)}</span></div><div><b>Components</b><span>${esc(r.components)}</span></div><div><b>Duration</b><span>${esc(r.duration)}</span></div></div><h3>Definition</h3><p class="rule-description">${esc(r.description)}</p>`;
 document.getElementById("ruleModal").classList.add("open");
}
function closeRule(){document.getElementById("ruleModal").classList.remove("open")}
function toggleSettings(){document.getElementById("settingsModal").classList.add("open");document.getElementById("inlineRulesToggle").checked=!!state.settings.inlineRules}
function saveSettings(){state.settings.inlineRules=document.getElementById("inlineRulesToggle").checked;save();document.getElementById("settingsModal").classList.remove("open")}


