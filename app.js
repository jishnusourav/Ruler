const $ = (id) => document.getElementById(id);
const QUESTS = [
  {id:"push",name:"Push-ups",target:100,unit:"reps",attr:"STR",icon:"✣",xp:25},
  {id:"sit",name:"Sit-ups / core",target:100,unit:"reps",attr:"VIT",icon:"♥",xp:25},
  {id:"squat",name:"Squats",target:100,unit:"reps",attr:"STR",icon:"⌁",xp:25},
  {id:"run",name:"Run / brisk walk",target:5,unit:"km",attr:"AGI",icon:"➤",xp:25}
];
const ATTRS = [{id:"STR",name:"STRENGTH",icon:"✣"},{id:"AGI",name:"AGILITY",icon:"➤"},{id:"VIT",name:"VITALITY",icon:"♥"},{id:"INT",name:"INTELLIGENCE",icon:"⌘"},{id:"PER",name:"PERCEPTION",icon:"◎"}];
const SAVE_KEY = "monarch-system-save-v1";
const REMINDER_KEY = "ruler-daily-reminder-v1";
let reminderSettings = {enabled:false,time:"20:00",lastSent:""};
try { reminderSettings = {...reminderSettings,...JSON.parse(localStorage.getItem(REMINDER_KEY)||"{}")} } catch {}
function saveReminderSettings(){localStorage.setItem(REMINDER_KEY,JSON.stringify(reminderSettings));}
function updateReminderUI(){const time=$("reminderTime"),status=$("notifyStatus"),note=$("reminderNote");if(time)time.value=reminderSettings.time||"20:00";if(status)status.textContent=reminderSettings.enabled?(('Notification' in window&&Notification.permission==="granted")?"ACTIVE":"TIME SAVED"):"NOT CONFIGURED";if(note)note.textContent=reminderSettings.enabled?`Daily reminder set for ${reminderSettings.time}. Keep Ruler open; browser background limits may affect delivery.`:"Reminder is off. Choose a time and enable browser notifications.";}
function sendRulerNotification(title,body){if(!( "Notification" in window)||Notification.permission!=="granted")return false;try{if("serviceWorker" in navigator&&navigator.serviceWorker.controller){navigator.serviceWorker.ready.then(reg=>reg.showNotification(title,{body,tag:"ruler-daily-quest"})).catch(()=>new Notification(title,{body}));}else new Notification(title,{body});return true;}catch{return false;}}
function checkReminder(){if(!reminderSettings.enabled||!("Notification" in window)||Notification.permission!=="granted")return;const now=new Date(),today=now.toLocaleDateString("en-CA"),current=String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0");if(current===reminderSettings.time&&reminderSettings.lastSent!==today){reminderSettings.lastSent=today;saveReminderSettings();sendRulerNotification("RULER // DAILY QUEST",state.claimed?"Daily quest complete. Recover well and return tomorrow.":"System alert: today's quest is still waiting. Complete what is safe and achievable for you.");updateReminderUI();}}
const todayKey = () => new Date().toLocaleDateString("en-CA");
function freshState(){return {date:todayKey(),level:1,xp:0,claimed:false,quests:{push:0,sit:0,squat:0,run:0},attributes:{STR:1,AGI:1,VIT:1,INT:1,PER:1},streak:0,lastCompletedDate:"",sound:false};}
let state;
try { state = {...freshState(),...JSON.parse(localStorage.getItem(SAVE_KEY)||"{}")}; } catch { state=freshState(); }
function save(){localStorage.setItem(SAVE_KEY,JSON.stringify(state));}
function rollover(){const today=todayKey();if(state.date!==today){state.date=today;state.quests={push:0,sit:0,squat:0,run:0};state.claimed=false;save();}}
function totalQuestProgress(){return QUESTS.reduce((sum,q)=>sum+Math.min(1,(Number(state.quests[q.id])||0)/q.target),0)/QUESTS.length;}
function allComplete(){return QUESTS.every(q=>(Number(state.quests[q.id])||0)>=q.target);}
function xpNeeded(){return 100 + Math.max(0,state.level-1)*20;}
function rank(){if(state.level>=100)return "S-RANK HUNTER";if(state.level>=75)return "A-RANK HUNTER";if(state.level>=50)return "SHADOW RULER";if(state.level>=30)return "B-RANK HUNTER";if(state.level>=15)return "C-RANK HUNTER";if(state.level>=5)return "D-RANK HUNTER";return "E-RANK HUNTER";}
function showToast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>el.classList.remove("show"),2600);}
function systemAlert(title,message){const overlay=$("systemOverlay");if(!overlay){showToast(title+" — "+message);return;} $("overlayTitle").textContent=title;$("overlayMessage").textContent=message;overlay.classList.add("show");}
function closeSystemAlert(){$("systemOverlay")?.classList.remove("show");}
$("overlayClose")?.addEventListener("click",closeSystemAlert);
$("systemOverlay")?.addEventListener("click",(event)=>{if(event.target.id==="systemOverlay")closeSystemAlert();});
function ping(){if(!state.sound)return;try{const ctx=new (window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);osc.frequency.value=660;gain.gain.value=.035;osc.start();osc.stop(ctx.currentTime+.12);}catch{}}
function awardXP(amount){state.xp+=amount;let levelUps=0;while(state.xp>=xpNeeded()&&state.level<100){state.xp-=xpNeeded();state.level++;levelUps++;}if(state.level>=100){state.level=100;state.xp=Math.min(state.xp,xpNeeded()-1);}if(levelUps){document.body.classList.add("level-up-flash");setTimeout(()=>document.body.classList.remove("level-up-flash"),850);setTimeout(()=>systemAlert("LEVEL UP",`You reached Level ${state.level}. Keep building your real-world consistency.`),120);}const reachedSovereign=state.level>=100;ping();save();render();if(reachedSovereign){setTimeout(()=>systemAlert("SOVEREIGN AWAKENING","Monarch Purple unlocked. Title acquired: A New Version of Yourself."),levelUps?500:100);}}
function renderQuests(){const root=$("questList");root.innerHTML="";QUESTS.forEach(q=>{const val=Math.max(0,Number(state.quests[q.id])||0);const done=val>=q.target;const row=document.createElement("div");row.className="quest-item"+(done?" done":"");row.innerHTML=`<input class="quest-check" type="checkbox" aria-label="Mark ${q.name} complete" ${done?"checked":""}><div class="quest-info"><strong>${q.name}</strong><small>${val}/${q.target} ${q.unit} • +${q.xp} XP</small></div><button class="secondary-button edit-quest" type="button" aria-label="Log ${q.name}" style="padding:8px 10px">LOG</button>`;const check=row.querySelector("input");check.addEventListener("change",()=>{state.quests[q.id]=check.checked?q.target:0;save();render();if(check.checked){const item=[...document.querySelectorAll(".quest-item")].find(el=>el.querySelector(".quest-info strong")?.textContent===q.name);item?.classList.add("just-completed");ping();}});row.querySelector("button").addEventListener("click",()=>{const raw=prompt(`Enter completed ${q.unit} for ${q.name} (target ${q.target}):`,String(val));if(raw===null)return;const n=Number(raw);if(!Number.isFinite(n)||n<0){showToast("Enter a valid non-negative number.");return;}state.quests[q.id]=Math.min(q.target,n);save();render();});root.appendChild(row);});const p=Math.round(totalQuestProgress()*100);$("questPercent").textContent=p+"%";$("questBar").style.width=p+"%";$("claimBtn").disabled=!allComplete()||state.claimed;$("questStatus").textContent=state.claimed?"REWARD CLAIMED. RECOVER, THEN RETURN TOMORROW.":allComplete()?"QUEST COMPLETE. CLAIM YOUR EXPERIENCE.":"SYSTEM MESSAGE: Every completed movement counts. Scale the target to your ability."; }
function renderAttributes(){const root=$("attributeList");root.innerHTML="";ATTRS.forEach(a=>{const val=state.attributes[a.id]||1;const row=document.createElement("div");row.className="attribute";row.innerHTML=`<span class="attribute-icon">${a.icon}</span><div><div class="attribute-label"><strong>${a.name}</strong><span>${val}</span></div><div class="bar"><span style="width:${Math.min(100,val/100*100)}%"></span></div></div><span style="font-size:9px;color:#5e8198">+${Math.max(0,val-1)}</span>`;root.appendChild(row);});}
function render(){rollover();$("level").textContent=state.level;$("levelHero").textContent=String(state.level).padStart(2,"0");$("rankHero").textContent=rank();$("rankChip").textContent=state.level>=50?"SOVEREIGN":rank().split(" ")[0]+"-RANK";$("className").textContent=state.level>=100?"THE SOVEREIGN":state.level>=50?"ELITE HUNTER":"UNAWAKENED";$("xpText").textContent=`${state.xp} / ${xpNeeded()} XP`;$("xpBar").style.width=Math.min(100,state.xp/xpNeeded()*100)+"%";$("xpNext").textContent=`${xpNeeded()-state.xp} XP to next level`;$("today").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}).toUpperCase();document.documentElement.classList.toggle("purple-mode",state.level>=100);renderQuests();renderAttributes();}
$("claimBtn").addEventListener("click",()=>{if(!allComplete()||state.claimed)return;state.claimed=true;const was=state.lastCompletedDate;const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);const yesterdayKey=yesterday.toLocaleDateString("en-CA");state.streak=was===yesterdayKey?(state.streak||0)+1:was===state.date?(state.streak||0):1;state.lastCompletedDate=state.date;QUESTS.forEach(q=>{state.attributes[q.attr]=(state.attributes[q.attr]||1)+1;});state.attributes.INT++;state.attributes.PER++;save();awardXP(100);systemAlert("DAILY QUEST CLEARED","+100 XP acquired. Your attributes have increased.");});
$("bonusBtn").addEventListener("click",()=>{awardXP(25);showToast("WORKOUT LOGGED • +25 XP");});
$("notifyBtn").addEventListener("click",async()=>{if(!( "Notification" in window)){showToast("This browser does not support notifications.");return;}try{const permission=await Notification.requestPermission();if(permission==="granted"){sendRulerNotification("RULER // SYSTEM","Notifications enabled. Set a daily reminder in Notification Protocol.");showToast("BROWSER NOTIFICATIONS ENABLED");$("notifyBtn").style.color="var(--green)";updateReminderUI();}else{showToast("Notifications were not enabled. Check browser settings.");}}catch{showToast("Notifications require a supported browser and secure context.");}});
$("saveReminderBtn")?.addEventListener("click",async()=>{if(!( "Notification" in window)){showToast("This browser does not support notifications.");return;}let permission=Notification.permission;if(permission!=="granted"){try{permission=await Notification.requestPermission();}catch{permission="denied";}}if(permission!=="granted"){showToast("Allow notifications in your browser, then try again.");updateReminderUI();return;}const selected=$("reminderTime").value;if(!selected){showToast("Choose a reminder time first.");return;}reminderSettings.time=selected;reminderSettings.enabled=true;reminderSettings.lastSent="";saveReminderSettings();updateReminderUI();sendRulerNotification("RULER // SYSTEM",`Daily reminder saved for ${selected}. Keep Ruler open for reminders.`);showToast("DAILY REMINDER SAVED");$("notifyBtn").style.color="var(--green)";});
$("soundBtn").addEventListener("click",()=>{state.sound=!state.sound;$("soundBtn").style.color=state.sound?"var(--green)":"var(--cyan)";save();showToast(state.sound?"SYSTEM AUDIO ENABLED":"SYSTEM AUDIO MUTED");});
$("exportBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="ruler-save-"+todayKey()+".json";a.click();URL.revokeObjectURL(a.href);showToast("SAVE FILE EXPORTED");});
$("resetBtn").addEventListener("click",()=>{if(confirm("Reset all Ruler progress on this browser? Export a backup first if you need one.")){state=freshState();save();render();showToast("SAVE RESET");}});
function tick(){const now=new Date();const midnight=new Date(now);midnight.setHours(24,0,0,0);let sec=Math.max(0,Math.floor((midnight-now)/1000));const h=String(Math.floor(sec/3600)).padStart(2,"0"),m=String(Math.floor(sec%3600/60)).padStart(2,"0"),s=String(sec%60).padStart(2,"0");$("countdown").textContent=`${h}:${m}:${s}`;}
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("/service-worker.js").catch(()=>{});
rollover();render();tick();updateReminderUI();setInterval(tick,1000);setInterval(checkReminder,15000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)checkReminder();});

/* =========================================
   RULER V4 — LOCAL DEVELOPER SHORTCUT
   Ctrl + Shift + L = Unlock Level 100
   Local development only
   ========================================= */

(() => {
  "use strict";

  // Enable only on local development addresses.
  const isLocalDevelopment =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

  if (!isLocalDevelopment) return;

  document.addEventListener("keydown", (event) => {
    if (
      event.ctrlKey &&
      event.shiftKey &&
      !event.altKey &&
      !event.metaKey &&
      event.key.toLowerCase() === "l"
    ) {
      // Do not trigger while typing in a field.
      const target = event.target;
      const tag = target?.tagName?.toLowerCase();

      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      event.preventDefault();

      const confirmed = window.confirm(
        "RULER DEVELOPER MODE\n\n" +
        "Unlock Level 100 for testing?\n\n" +
        "Your local Ruler level and XP will change."
      );

      if (!confirmed) return;

      // Update existing Ruler state.
      state.level = 100;
      state.xp = 0;

      // Save and refresh the existing interface.
      save();
      render();

      systemAlert(
        "SOVEREIGN AWAKENING",
        "Developer shortcut activated. Level 100 unlocked."
      );

      showToast("DEV MODE // LEVEL 100 UNLOCKED");
    }
  });

  console.info(
    "RULER DEV MODE: Press Ctrl + Shift + L to unlock Level 100."
  );
})();
