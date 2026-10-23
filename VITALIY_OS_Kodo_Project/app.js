(function(){
  const $=id=>document.getElementById(id);
  const ids=['width','target','knownWidth','knownWeight','knownLength','knownTarget','desiredLength'];
  const num=id=>Number($(id).value);
  const fmt=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('uk-UA',{maximumFractionDigits:d,minimumFractionDigits:0}):'—';
  let last=null, history=[];
  try { history=JSON.parse(window.localStorage.getItem('vitaliy_rollcalc_history')||'[]'); if(!Array.isArray(history))history=[]; } catch(e){history=[];}
  function calculate(){
    const w=num('width'), target=num('target'), kw=num('knownWidth'), kg=num('knownWeight'), kl=num('knownLength'), mode=$('knownTarget').value, dl=num('desiredLength');
    if(!(w>0&&target>0&&kw>0&&kg>0)){ $('status').textContent='Перевір: ширина та ваги мають бути більшими за нуль.'; return null; }
    let baseLength=kl;
    if(!(baseLength>0)){ $('status').textContent='Введи довжину відомого ролу, щоб розрахунок був точним.'; return null; }
    const kgPerM=(kg*(w/kw))/baseLength;
    let length, weight;
    if(mode==='length'){ length=target/kgPerM; weight=target; $('mainLabel').textContent='ПОТРІБНА ДОВЖИНА'; $('mainValue').textContent=fmt(length)+' м'; $('weightValue').textContent=fmt(weight)+' кг';}
    else { if(!(dl>0)){ $('status').textContent='Введи задану довжину, більшу за нуль.'; return null;} length=dl; weight=kgPerM*length; $('mainLabel').textContent='ЗАДАНА ДОВЖИНА'; $('mainValue').textContent=fmt(length)+' м'; $('weightValue').textContent=fmt(weight)+' кг';}
    $('perMeter').textContent=fmt(kgPerM,5)+' кг/м';
    $('perKg').textContent=fmt(1/kgPerM,2)+' м/кг';
    $('status').textContent='Розрахунок готовий.';
    last={date:new Date().toLocaleString('uk-UA'),width:w,target,knownWidth:kw,knownWeight:kg,knownLength:baseLength,mode,length,weight,kgPerM};
    return last;
  }
  function renderHistory(){
    const el=$('history');
    if(!history.length){el.innerHTML='<div class="note">Збережених розрахунків поки немає.</div>';return;}
    el.innerHTML='';
    history.slice().reverse().forEach((h,revIndex)=>{
      const realIndex=history.length-1-revIndex;
      const div=document.createElement('div'); div.className='history-item';
      const left=document.createElement('div');
      const strong=document.createElement('strong'); strong.textContent=fmt(h.width)+' см · '+fmt(h.weight)+' кг · '+fmt(h.length)+' м';
      const small=document.createElement('small'); small.textContent=h.date+' · '+fmt(h.kgPerM,5)+' кг/м';
      left.append(strong,small);
      const btn=document.createElement('button'); btn.textContent='Завантажити';
      btn.addEventListener('click',()=>{ $('width').value=h.width;$('target').value=h.target;$('knownWidth').value=h.knownWidth;$('knownWeight').value=h.knownWeight;$('knownLength').value=h.knownLength;$('knownTarget').value='length';calculate();window.scrollTo({top:0,behavior:'smooth'});});
      div.append(left,btn);el.append(div);
    });
  }
  $('knownTarget').addEventListener('change',()=>{$('desiredLengthWrap').style.display=$('knownTarget').value==='weight'?'block':'none';calculate();});
  ids.forEach(id=>$(id).addEventListener('input',()=>{if(num('knownLength')>0)calculate();}));
  $('calculate').addEventListener('click',calculate);
  $('save').addEventListener('click',()=>{
    const r=calculate();if(!r)return;
    history.push(r);history=history.slice(-100);
    try{window.localStorage.setItem('vitaliy_rollcalc_history',JSON.stringify(history));$('status').textContent='Збережено в історію на цьому пристрої.';}catch(e){$('status').textContent='Результат є, але браузер не дозволив зберегти історію. Експортуй CSV.';}
    renderHistory();
  });
  $('clear').addEventListener('click',()=>{if(confirm('Видалити всю локальну історію?')){history=[];try{window.localStorage.removeItem('vitaliy_rollcalc_history')}catch(e){}renderHistory();$('status').textContent='Історію очищено.';}});
  $('export').addEventListener('click',()=>{
    const rows=[['date','width_cm','target_kg','known_width_cm','known_weight_kg','known_length_m','result_length_m','result_weight_kg','kg_per_m']];
    history.forEach(h=>rows.push([h.date,h.width,h.target,h.knownWidth,h.knownWeight,h.knownLength,h.length,h.weight,h.kgPerM]));
    const csv=rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='vitaliy_rollcalc_history.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  renderHistory();
  // Demo output is deliberately not calculated until known length is supplied.
  if(num('knownLength')>0)calculate();
})();
