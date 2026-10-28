(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const areas = window.BRAIN_MAP_CONFIG.areas;
 const solved = new Set();
 const situationSolved = new Set();
 let selected = null;
 let currentSituation = 3;
 $('brain').src = window.BRAIN_MAP_CONFIG.assets.brain;
 $('leader').hidden = true;

 function say(message, kind = 'neutral') {
  $('feedback').className = `feedback ${kind}`;
  $('feedback-symbol').textContent = kind === 'success' ? '✓' : kind === 'error' ? '↻' : 'i';
  $('feedback-text').replaceChildren();
  if(kind === 'success') { const strong=document.createElement('strong'); strong.textContent='Correct! '; $('feedback-text').append(strong, message); }
  else $('feedback-text').textContent=message;
 }
 function select(id) {
  if(solved.has(id)) return;
  selected=id; update();
  say(`${areas.find(area=>area.id===id).name} selected. Click the matching point.`);
 }
 function update() {
  $('labels').querySelectorAll('button').forEach(button=>{
   const done=solved.has(button.dataset.area);
   button.classList.toggle('solved',done);button.classList.toggle('selected',button.dataset.area===selected&&!done);
   button.disabled=done;button.draggable=!done;button.setAttribute('aria-pressed',String(button.dataset.area===selected&&!done));
  });
  $('points').querySelectorAll('button').forEach(button=>{
   const done=solved.has(button.dataset.area);button.classList.toggle('solved',done);button.disabled=done;button.textContent=done?'✓':button.dataset.number;
   const area=areas.find(area=>area.id===button.dataset.area);button.title=done?area.name:`Point ${button.dataset.number}`;
  });
  $('progress-text').textContent=`Progress: ${solved.size}/6`; $('progress').value=solved.size;
 }
 function showCallout(area) {
  const left=Math.max(1,Math.min(58,area.x-31)), top=Math.max(1,area.y-16);
  $('callout').textContent=area.name;$('callout').style.left=`${left}%`;$('callout').style.top=`${top}%`;$('callout').hidden=false;
  $('leader-line').setAttribute('x1',String(left+19));$('leader-line').setAttribute('y1',String((top+4)*2/3));
  $('leader-line').setAttribute('x2',String(area.x));$('leader-line').setAttribute('y2',String(area.y*2/3));$('leader').hidden=false;
 }
 function answer(id) {
  if(solved.has(id))return;
  if(!selected){say('Choose a label first. Then click a point.');return;}
  if(selected!==id){say('Not quite. Think about the function and try again.','error');return;}
  const area=areas.find(area=>area.id===id);solved.add(id);selected=null;update();showCallout(area);
  const sentence=area.function.charAt(0).toLowerCase()+area.function.slice(1);
  say(`${area.name} ${sentence}`,'success');
  if(solved.size===6)say('All six brain areas matched. Try the next challenge!','success');
 }
 areas.forEach((area,index)=>{
  const label=document.createElement('button');label.type='button';label.className='label';label.dataset.area=area.id;label.textContent=area.name;label.setAttribute('aria-label',area.name);label.setAttribute('aria-pressed','false');
  label.onclick=()=>select(area.id);label.draggable=true;label.addEventListener('dragstart',event=>{select(area.id);event.dataTransfer.setData('text/plain',area.id);event.dataTransfer.effectAllowed='move';});$('labels').append(label);
  const point=document.createElement('button');point.type='button';point.className=`point${area.deep?' deep':''}`;point.dataset.area=area.id;point.dataset.number=String(index+1);point.style.left=`${area.x}%`;point.style.top=`${area.y}%`;point.setAttribute('aria-label',`Point ${index+1}${area.deep?' — deeper region shown schematically':''}`);point.textContent=String(index+1);point.onclick=()=>answer(area.id);
  point.addEventListener('dragover',event=>{if(!solved.has(area.id)){event.preventDefault();point.classList.add('dragover');}});point.addEventListener('dragleave',()=>point.classList.remove('dragover'));point.addEventListener('drop',event=>{event.preventDefault();point.classList.remove('dragover');const id=event.dataTransfer.getData('text/plain');if(areas.some(area=>area.id===id)&&!solved.has(id)){selected=id;answer(area.id);}});$('points').append(point);
  const option=document.createElement('button');option.type='button';option.dataset.area=area.id;option.textContent=area.name;option.onclick=()=>answerSituation(area.id);$('situation-answers').append(option);
 });
 const dialog=$('situation-dialog');
 function syncScenarioCard(){
  const area=areas[currentSituation];$('challenge-sentence').textContent=situationSolved.size===6?'All six situations completed!':area.sentence;
  $('sense-icon').textContent=({motor:'✋',touch:'✧',visual:'◉',auditory:'♫',olfactory:'❀',gustatory:'♧'})[area.id];
  $('situation-progress').hidden=situationSolved.size===0;$('situation-progress').textContent=`Situations: ${situationSolved.size}/6`;
 }
 function showSituation(){
  const area=areas[currentSituation],done=situationSolved.has(area.id);
  $('situation-image').src=area.situation;$('situation-image').alt=`Situation ${currentSituation+1}. ${area.sentence} Which brain area is involved?`;
  $('counter').textContent=`Situation ${currentSituation+1} / 6`;
  $('situation-answers').querySelectorAll('button').forEach(button=>{button.disabled=done;button.classList.toggle('correct',done&&button.dataset.area===area.id);});
  $('situation-feedback').className='';$('situation-feedback').textContent=done?`Correct! ${area.name} — ${area.function}`:'Choose one answer.';syncScenarioCard();
 }
 function answerSituation(id){
  const area=areas[currentSituation];if(situationSolved.has(area.id))return;
  if(id!==area.id){$('situation-feedback').textContent='Not quite. Try another area.';$('situation-feedback').className='error';return;}
  situationSolved.add(id);showSituation();if(situationSolved.size===6)$('situation-feedback').textContent='Correct! All six situations completed. Well done!';
 }
 $('open-challenge').onclick=()=>{showSituation();dialog.showModal();};$('close-dialog').onclick=()=>dialog.close();
 $('previous').onclick=()=>{currentSituation=(currentSituation+5)%6;showSituation();};$('next').onclick=()=>{currentSituation=(currentSituation+1)%6;showSituation();};
 $('try-again').onclick=()=>{selected=null;update();say('Choose a label and try again. Correct answers are kept.');$('labels').querySelector('button:not(:disabled)')?.focus();};
 $('reset').onclick=()=>{solved.clear();situationSolved.clear();selected=null;currentSituation=3;$('callout').hidden=true;$('leader').hidden=true;update();syncScenarioCard();say('Choose a label to begin.');};
 update();
})();
