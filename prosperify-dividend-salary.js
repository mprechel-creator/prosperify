/* ============================================================================
   PROSPERIFY — DIVIDEND vs SALARY CALCULATOR
   Tax engine ported verbatim from the React v6 build. 2025 CA rates.
   ============================================================================ */

// ─── 2025 CANADA TAX CONSTANTS ──────────────────────────────────────────────
const CA_FED_BRACKETS = [
  { min:0,       max:57375,    rate:0.15  },
  { min:57375,   max:114750,   rate:0.205 },
  { min:114750,  max:158519,   rate:0.26  },
  { min:158519,  max:220000,   rate:0.29  },
  { min:220000,  max:Infinity, rate:0.33  },
];
const CA_BPA = 16129;
const CPP_EXEMPT = 3500, CPP_MAX = 71300, CPP_RATE = 0.0595;
const RRSP_LIMIT = 31560;

const PROVINCES = {
  BC:{ label:"British Columbia", bpa:11981, corpProvSBR:0.02, ineligDTC_fed:0.090301, ineligDTC_prov:0.020, grossUp:1.15, brackets:[{min:0,max:45654,rate:0.0506},{min:45654,max:91310,rate:0.077},{min:91310,max:104835,rate:0.105},{min:104835,max:127299,rate:0.1229},{min:127299,max:172602,rate:0.147},{min:172602,max:240716,rate:0.168},{min:240716,max:Infinity,rate:0.205}]},
  AB:{ label:"Alberta",          bpa:21003, corpProvSBR:0.02, ineligDTC_fed:0.090301, ineligDTC_prov:0.020, grossUp:1.15, brackets:[{min:0,max:148269,rate:0.10},{min:148269,max:177922,rate:0.12},{min:177922,max:237230,rate:0.13},{min:237230,max:355845,rate:0.14},{min:355845,max:Infinity,rate:0.15}]},
  ON:{ label:"Ontario",          bpa:11865, corpProvSBR:0.032,ineligDTC_fed:0.090301, ineligDTC_prov:0.029, grossUp:1.15, brackets:[{min:0,max:51446,rate:0.0505},{min:51446,max:102894,rate:0.0915},{min:102894,max:150000,rate:0.1116},{min:150000,max:220000,rate:0.1216},{min:220000,max:Infinity,rate:0.1316}]},
  QC:{ label:"Quebec",           bpa:17183, corpProvSBR:0.037,ineligDTC_fed:0.090301, ineligDTC_prov:0.0491,grossUp:1.15, brackets:[{min:0,max:53255,rate:0.14},{min:53255,max:106495,rate:0.19},{min:106495,max:129590,rate:0.24},{min:129590,max:Infinity,rate:0.2575}]},
  SK:{ label:"Saskatchewan",     bpa:17661, corpProvSBR:0.02, ineligDTC_fed:0.090301, ineligDTC_prov:0.030, grossUp:1.15, brackets:[{min:0,max:49720,rate:0.105},{min:49720,max:142058,rate:0.125},{min:142058,max:Infinity,rate:0.145}]},
  MB:{ label:"Manitoba",         bpa:15780, corpProvSBR:0.00, ineligDTC_fed:0.090301, ineligDTC_prov:0.010, grossUp:1.15, brackets:[{min:0,max:47000,rate:0.108},{min:47000,max:100000,rate:0.1275},{min:100000,max:Infinity,rate:0.174}]},
  NS:{ label:"Nova Scotia",      bpa:8481,  corpProvSBR:0.025,ineligDTC_fed:0.090301, ineligDTC_prov:0.0167,grossUp:1.15, brackets:[{min:0,max:29590,rate:0.0879},{min:29590,max:59180,rate:0.1495},{min:59180,max:93000,rate:0.1667},{min:93000,max:150000,rate:0.175},{min:150000,max:Infinity,rate:0.21}]},
  NB:{ label:"New Brunswick",    bpa:12458, corpProvSBR:0.025,ineligDTC_fed:0.090301, ineligDTC_prov:0.020, grossUp:1.15, brackets:[{min:0,max:47715,rate:0.094},{min:47715,max:95431,rate:0.14},{min:95431,max:176756,rate:0.16},{min:176756,max:Infinity,rate:0.195}]},
  PE:{ label:"PEI",              bpa:12000, corpProvSBR:0.01, ineligDTC_fed:0.090301, ineligDTC_prov:0.0065,grossUp:1.15, brackets:[{min:0,max:32656,rate:0.096},{min:32656,max:64313,rate:0.1337},{min:64313,max:105000,rate:0.1657},{min:105000,max:140000,rate:0.18},{min:140000,max:Infinity,rate:0.187}]},
  NL:{ label:"Newfoundland",     bpa:10818, corpProvSBR:0.03, ineligDTC_fed:0.090301, ineligDTC_prov:0.030, grossUp:1.15, brackets:[{min:0,max:43198,rate:0.087},{min:43198,max:86395,rate:0.145},{min:86395,max:154244,rate:0.158},{min:154244,max:215943,rate:0.178},{min:215943,max:275870,rate:0.198},{min:275870,max:551739,rate:0.208},{min:551739,max:Infinity,rate:0.218}]},
};

// ─── TAX ENGINE ─────────────────────────────────────────────────────────────
function bTax(inc, brackets){
  let t=0;
  for(const b of brackets){ if(inc<=b.min) break; t+=(Math.min(inc,b.max)-b.min)*b.rate; }
  return Math.max(0,t);
}
function cpp(s){ return s<=CPP_EXEMPT?0:Math.min(s-CPP_EXEMPT,CPP_MAX-CPP_EXEMPT)*CPP_RATE; }
function solve(fn,target){
  let lo=target*0.3,hi=target*6,x=target*1.3;
  for(let i=0;i<150;i++){ x=(lo+hi)/2; const r=fn(x); if(Math.abs(r-target)<0.25)break; r<target?(lo=x):(hi=x); }
  return x;
}
function personalTaxCA(income,prov){
  const p=PROVINCES[prov];
  const fed=Math.max(0,bTax(income,CA_FED_BRACKETS)-CA_BPA*0.15);
  const prv=Math.max(0,bTax(income,p.brackets)-p.bpa*p.brackets[0].rate);
  return{fed,prv};
}
function calcSalary(target,prov){
  const gross=solve(g=>{ const ee=cpp(g); const{fed,prv}=personalTaxCA(g,prov); return g-ee-fed-prv; },target);
  const ee=cpp(gross),er=cpp(gross),{fed,prv}=personalTaxCA(gross,prov);
  return{gross,cppEE:ee,cppER:er,fedTax:fed,provTax:prv,corpTax:0,
    afterTax:gross-ee-fed-prv,totalTax:ee+er+fed+prv,totalCost:gross+er,
    rrspRoom:Math.min(gross*0.18,RRSP_LIMIT)};
}
function calcDividend(target,prov,corpInc){
  const p=PROVINCES[prov];
  const corpRate=0.09+p.corpProvSBR;
  const corpTax=Math.min(corpInc,500000)*corpRate;
  const div=solve(d=>{
    const gu=d*p.grossUp;
    const fed=Math.max(0,bTax(gu,CA_FED_BRACKETS)-CA_BPA*0.15-gu*p.ineligDTC_fed);
    const prv=Math.max(0,bTax(gu,p.brackets)-p.bpa*p.brackets[0].rate-gu*p.ineligDTC_prov);
    return d-fed-prv;
  },target);
  const gu=div*p.grossUp;
  const fed=Math.max(0,bTax(gu,CA_FED_BRACKETS)-CA_BPA*0.15-gu*p.ineligDTC_fed);
  const prv=Math.max(0,bTax(gu,p.brackets)-p.bpa*p.brackets[0].rate-gu*p.ineligDTC_prov);
  return{gross:div,cppEE:0,cppER:0,fedTax:fed,provTax:prv,corpTax,
    afterTax:div-fed-prv,totalTax:fed+prv+corpTax,totalCost:div+corpTax,rrspRoom:0};
}
function calcMix(target,prov,corpInc,salaryGross){
  const p=PROVINCES[prov];
  const corpRate=0.09+p.corpProvSBR;
  const corpTax=Math.min(corpInc,500000)*corpRate;
  const cppEE=cpp(salaryGross),cppER=cpp(salaryGross);
  const{fed:salFed,prv:salPrv}=personalTaxCA(salaryGross,prov);
  const salAfterTax=salaryGross-cppEE-salFed-salPrv;
  const remainingNeeded=Math.max(0,target-salAfterTax);
  let divFed=0,divPrv=0,div=0;
  if(remainingNeeded>0){
    div=solve(d=>{
      const gu=salaryGross+d*p.grossUp;
      const totalFed=Math.max(0,bTax(gu,CA_FED_BRACKETS)-CA_BPA*0.15-d*p.grossUp*p.ineligDTC_fed);
      const totalPrv=Math.max(0,bTax(gu,p.brackets)-p.bpa*p.brackets[0].rate-d*p.grossUp*p.ineligDTC_prov);
      return d-Math.max(0,totalFed-salFed)-Math.max(0,totalPrv-salPrv);
    },remainingNeeded);
    const gu=salaryGross+div*p.grossUp;
    const tFed=Math.max(0,bTax(gu,CA_FED_BRACKETS)-CA_BPA*0.15-div*p.grossUp*p.ineligDTC_fed);
    const tPrv=Math.max(0,bTax(gu,p.brackets)-p.bpa*p.brackets[0].rate-div*p.grossUp*p.ineligDTC_prov);
    divFed=Math.max(0,tFed-salFed); divPrv=Math.max(0,tPrv-salPrv);
  }
  const totalFedTax=salFed+divFed,totalProvTax=salPrv+divPrv;
  const totalTax=cppEE+cppER+totalFedTax+totalProvTax+corpTax;
  const afterTax=(salaryGross-cppEE-salFed-salPrv)+(div-divFed-divPrv);
  return{gross:salaryGross+div,salaryAmount:salaryGross,divAmount:div,
    cppEE,cppER,fedTax:totalFedTax,provTax:totalProvTax,corpTax,
    afterTax,totalTax,totalCost:salaryGross+cppER+div+corpTax,
    rrspRoom:Math.min(salaryGross*0.18,RRSP_LIMIT),cppMaxed:salaryGross>=CPP_MAX};
}

// ─── FORMAT ─────────────────────────────────────────────────────────────────
const fCAD=v=>new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD",maximumFractionDigits:0}).format(v||0);
const pct=v=>`${(v*100).toFixed(1)}%`;
const parseNum=s=>parseFloat(String(s).replace(/[,$]/g,""))||0;
const C={corpTax:"#6B4FA0",cpp:"#C97230",fedTax:"#A83232",provTax:"#C87050"};

// ─── STATE ──────────────────────────────────────────────────────────────────
let state={province:"BC",cashRaw:"120,000",corpRaw:"300,000",mixSalaryRaw:String(CPP_MAX),aiResult:""};
let qual={hasRRSP:"",hasDeps:"",monthly:""};

function compute(){
  const afterTax=parseNum(state.cashRaw);
  const corpInc=parseNum(state.corpRaw);
  const mixSalary=Math.max(1,parseNum(state.mixSalaryRaw));
  const caS=calcSalary(afterTax,state.province);
  const caD=calcDividend(afterTax,state.province,corpInc);
  const caM=calcMix(afterTax,state.province,corpInc,mixSalary);
  return {afterTax,corpInc,mixSalary,caS,caD,caM};
}

// ─── STACKED BAR ──────────────────────────────────────────────────────────────
function barHTML(segs,maxVal){
  const total=segs.reduce((s,g)=>s+g.v,0);
  const takeHome=maxVal-total;
  const segHTML=segs.map((s,i)=>`<div class="bar-seg" style="width:${(s.v/maxVal)*100}%;background:${s.color};transition-delay:${i*60}ms">${s.v/maxVal>0.09?`<span>${fCAD(s.v)}</span>`:""}</div>`).join("");
  const legend=segs.map(s=>`<div class="legend-item"><div class="legend-dot" style="background:${s.color}"></div><span>${s.label}: <strong>${fCAD(s.v)}</strong></span></div>`).join("");
  return `<div class="bar-wrap">
    <div class="bar">${segHTML}<div class="bar-takehome">${takeHome/maxVal>0.05?`<span>${fCAD(takeHome)}</span>`:""}</div></div>
    <div class="legend">${legend}<div class="legend-item"><div class="legend-dot" style="background:rgba(30,107,60,.4)"></div><span>Take-Home: <strong style="color:var(--green)">${fCAD(takeHome)}</strong></span></div></div>
  </div>`;
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
function cardHTML({title,tag,badge,sub,segs,maxVal,rows,isWinner,isMix}){
  const total=segs.reduce((s,g)=>s+g.v,0);
  const cls=`dvs-card${isWinner?" winner":""}${isMix?" mix":""}`;
  let flag="";
  if(isWinner) flag=`<div class="card-flag win">✦ Most Tax Efficient</div>`;
  else if(isMix) flag=`<div class="card-flag rec">★ Recommended</div>`;
  const effCls=isWinner?"winner":(isMix?"mix":"");
  const rowsHTML=rows.map(r=>`<div class="dvs-row"><span class="lbl">${r.label}</span><span class="val${r.green?" green":""}${r.red?" red":""}">${r.val}</span></div>`).join("");
  return `<div class="${cls}">
    ${flag}
    <div>
      <div><span class="dvs-title">${title}</span>${tag?`<span class="dvs-tag mix">${tag}</span>`:""}</div>
      ${badge?`<div class="dvs-badge">${badge}</div>`:""}
      <div class="dvs-sub">${sub}</div>
    </div>
    ${barHTML(segs,maxVal)}
    <div class="dvs-rows">${rowsHTML}</div>
    <div class="eff-rate ${effCls}"><span class="er-lbl">Effective Tax Rate</span><span class="er-val">${pct(total/maxVal)}</span></div>
  </div>`;
}

// ─── RENDER ─────────────────────────────────────────────────────────────────
function render(){
  const {afterTax,corpInc,mixSalary,caS,caD,caM}=compute();
  const p=PROVINCES[state.province];
  const sbr=pct(0.09+(p.corpProvSBR||0.02));
  const minTax=Math.min(caS.totalTax,caD.totalTax,caM.totalTax);
  const maxBar=Math.max(caS.totalCost,caD.totalCost,caM.totalCost)*1.06;

  const salSegs=[{label:"CPP",v:caS.cppEE+caS.cppER,color:C.cpp},{label:"Federal",v:caS.fedTax,color:C.fedTax},{label:"Prov.",v:caS.provTax,color:C.provTax}].filter(s=>s.v>0);
  const divSegs=[{label:"Corp Tax",v:caD.corpTax,color:C.corpTax},{label:"Federal",v:caD.fedTax,color:C.fedTax},{label:"Prov.",v:caD.provTax,color:C.provTax}].filter(s=>s.v>0);
  const mixSegs=[{label:"CPP",v:caM.cppEE+caM.cppER,color:C.cpp},{label:"Corp Tax",v:caM.corpTax,color:C.corpTax},{label:"Federal",v:caM.fedTax,color:C.fedTax},{label:"Prov.",v:caM.provTax,color:C.provTax}].filter(s=>s.v>0);

  const saved=Math.max(caS.totalTax,caD.totalTax)-caM.totalTax;

  document.getElementById("app").innerHTML = `
    <!-- INPUTS -->
    <div class="inputs-bar">
      <div class="inp-field">
        <div class="inp-label">After-Tax Cash Needed</div>
        <input id="cashInput" value="${state.cashRaw}">
      </div>
      <div class="inp-field">
        <div class="inp-label">Corporate Net Income</div>
        <input id="corpInput" value="${state.corpRaw}">
      </div>
      <div class="inp-field">
        <div class="inp-label">Province</div>
        <select id="provInput">
          ${Object.entries(PROVINCES).map(([k,v])=>`<option value="${k}"${state.province===k?" selected":""}>${k} — ${v.label}</option>`).join("")}
        </select>
      </div>
      <div class="inp-field mix-field">
        <div class="inp-label">Mix Salary: <span style="color:var(--green)">${fCAD(mixSalary)}</span>${mixSalary>=CPP_MAX?`<span class="cpp-max-pill">CPP MAX ✓</span>`:""}</div>
        <div class="mix-row">
          <span>$30k</span>
          <input type="range" id="mixInput" min="30000" max="200000" step="1000" value="${Math.min(mixSalary,200000)}">
          <span>$200k</span>
        </div>
        <div class="mix-note">RRSP room: ${fCAD(caM.rrspRoom)} · CPP max at ${fCAD(CPP_MAX)}</div>
      </div>
    </div>

    <!-- SUMMARY PILL -->
    <div class="summary-pill">🍁 Mix saves ${fCAD(saved)} vs. the worst option · ${caM.cppMaxed?`CPP maxed ✓ · RRSP room ${fCAD(caM.rrspRoom)}`:`Increase salary to ${fCAD(CPP_MAX)} to max CPP`}</div>

    <!-- CARDS -->
    <div class="cards-row">
      ${cardHTML({title:"Pure Salary",sub:"Fully deductible · CPP applies · RRSP room generated · Monthly CRA source deductions required",
        segs:salSegs,maxVal:maxBar,isWinner:caS.totalTax===minTax&&caS.totalTax<caM.totalTax,
        rows:[{label:"Gross Salary Required",val:fCAD(caS.gross)},{label:"CPP – Employee",val:`−${fCAD(caS.cppEE)}`,red:1},{label:"CPP – Employer (Corp cost)",val:`−${fCAD(caS.cppER)}`,red:1},{label:"Federal Income Tax",val:`−${fCAD(caS.fedTax)}`,red:1},{label:"Provincial Income Tax",val:`−${fCAD(caS.provTax)}`,red:1},{label:"Corporate Tax",val:"Nil — fully deductible"},{label:"RRSP Room Generated",val:fCAD(caS.rrspRoom),green:1},{label:"After-Tax Cash",val:fCAD(caS.afterTax),green:1},{label:"Total Tax Burden",val:fCAD(caS.totalTax),red:1}]})}

      ${cardHTML({title:"Pure Dividends",sub:`Corp pays SBR (${sbr}) first · DTC applies · No CPP · No monthly remittances`,
        segs:divSegs,maxVal:maxBar,isWinner:caD.totalTax===minTax&&caD.totalTax<caM.totalTax,
        rows:[{label:"Dividend Declared",val:fCAD(caD.gross)},{label:`Corp. Tax (SBR ${sbr})`,val:`−${fCAD(caD.corpTax)}`,red:1},{label:"CPP",val:"Nil"},{label:"Federal Tax (net DTC)",val:`−${fCAD(caD.fedTax)}`,red:1},{label:"Prov. Tax (net DTC)",val:`−${fCAD(caD.provTax)}`,red:1},{label:"RRSP Room",val:"Nil — no earned income"},{label:"After-Tax Cash",val:fCAD(caD.afterTax),green:1},{label:"Total Tax Burden",val:fCAD(caD.totalTax),red:1}]})}

      ${cardHTML({title:"Salary + Dividends",isMix:true,tag:caM.cppMaxed?"CPP Maxed ✓":"CPP not maxed",
        badge:`Salary: ${fCAD(caM.salaryAmount)} · Dividends: ${fCAD(caM.divAmount)}`,
        sub:"Salary covers base needs + CPP · Dividends for additional cash · Monthly remittances on salary only",
        segs:mixSegs,maxVal:maxBar,isWinner:caM.totalTax===minTax,
        rows:[{label:"Salary (Gross)",val:fCAD(caM.salaryAmount)},{label:"Dividend Declared",val:fCAD(caM.divAmount)},{label:"CPP – Employee",val:`−${fCAD(caM.cppEE)}`,red:1},{label:"CPP – Employer (Corp)",val:`−${fCAD(caM.cppER)}`,red:1},{label:`Corp. Tax (SBR ${sbr})`,val:`−${fCAD(caM.corpTax)}`,red:1},{label:"Federal Income Tax",val:`−${fCAD(caM.fedTax)}`,red:1},{label:"Provincial Tax",val:`−${fCAD(caM.provTax)}`,red:1},{label:"RRSP Room Generated",val:fCAD(caM.rrspRoom),green:1},{label:"After-Tax Cash",val:fCAD(caM.afterTax),green:1},{label:"Total Tax Burden",val:fCAD(caM.totalTax),red:1}]})}
    </div>

    <!-- AI PANEL -->
    <div class="panel">
      <div class="panel-head"><span class="ph-ico">✦</span><div><div class="ph-title">What's Best for Me?</div><div class="ph-sub">AI-powered recommendation · Powered by Claude · Based on your actual numbers</div></div></div>
      <div class="panel-body" id="aiBody">${aiPanelInner()}</div>
    </div>

    <!-- PROS/CONS -->
    ${proConHTML(sbr)}

    <!-- EXPORT -->
    <div class="export-row"><button class="export-btn" id="exportBtn">↓ Export PDF Report</button></div>

    <!-- DISCLAIMER -->
    <div class="disclaimer"><strong>Disclaimer —</strong> Estimates only, using 2025 federal and provincial rates. Does not account for provincial surtaxes, Ontario Health Premium, Quebec abatement, RRSP room carried forward, AMT, or other personal circumstances. The AI recommendation is informational only. <strong>Consult a qualified CPA or tax advisor before making compensation decisions.</strong></div>
  `;

  wireInputs();
}

// ─── AI PANEL INNER (re-rendered separately so we don't lose form state) ──────
let aiLoading=false, aiError="";
function aiPanelInner(){
  if(state.aiResult){
    return `<div class="ai-result">${renderAI(state.aiResult)}</div>
      <button class="qual-btn" style="margin-top:10px;max-width:140px;border-color:var(--border);color:var(--ink-soft)" id="aiRegen">↺ Regenerate</button>`;
  }
  if(aiLoading){
    return `<div style="padding:4px 0">${[100,80,93,65,85].map((w,i)=>`<div class="skeleton" style="width:${w}%;animation-delay:${i*0.12}s"></div>`).join("")}</div>`;
  }
  const ready=qual.hasRRSP&&qual.hasDeps&&qual.monthly;
  return `
    <div class="qual-grid">
      <div><div class="qual-q">Do you contribute to an RRSP?</div><div class="qual-btns">
        <button class="qual-btn${qual.hasRRSP==="yes"?" on":""}" data-q="hasRRSP" data-v="yes">Yes</button>
        <button class="qual-btn${qual.hasRRSP==="no"?" on":""}" data-q="hasRRSP" data-v="no">No</button>
      </div></div>
      <div><div class="qual-q">Do you have dependants?</div><div class="qual-btns">
        <button class="qual-btn${qual.hasDeps==="yes"?" on":""}" data-q="hasDeps" data-v="yes">Yes</button>
        <button class="qual-btn${qual.hasDeps==="no"?" on":""}" data-q="hasDeps" data-v="no">No</button>
      </div></div>
      <div><div class="qual-q">Monthly base living expenses</div>
        <input class="qual-input" id="qualMonthly" value="${qual.monthly}" placeholder="e.g. 8,000"></div>
    </div>
    <button class="gen-btn" id="genBtn" ${ready?"":"disabled"}>✦ Generate My Recommendation</button>
    ${aiError?`<div style="margin-top:14px;padding:12px 16px;background:rgba(220,50,31,.07);border:1px solid var(--red-mid);border-radius:8px;font-size:12.5px;color:var(--red)">${aiError}</div>`:""}
  `;
}
function refreshAI(){ document.getElementById("aiBody").innerHTML=aiPanelInner(); wireAI(); }

function renderAI(text){
  return text.split("\n").map(line=>{
    const t=line.trim();
    if(/^\*\*.*\*\*$/.test(t)) return `<div class="ai-h">${t.replace(/\*\*/g,"")}</div>`;
    if(t.startsWith("- ")||t.startsWith("• ")) return `<div class="ai-li"><span class="b">▸</span><span>${t.replace(/^[-•] /,"")}</span></div>`;
    if(t==="") return `<div style="height:3px"></div>`;
    return `<p class="ai-p">${line}</p>`;
  }).join("");
}

// ─── PROS / CONS ──────────────────────────────────────────────────────────────
function proConHTML(sbr){
  const cols=[
    {title:"Pure Salary",
      pros:["Builds RRSP contribution room (18% of salary, up to $31,560)","Generates CPP retirement entitlement","Enables employment income deductions (e.g. childcare, moving costs)","Fully deductible — reduces corporate taxable income","No corporate tax exposure on salary paid out","Simple, predictable cash flow"],
      cons:["Source deductions must be remitted to CRA monthly — no exceptions","CPP premiums: ~12% combined on the first $71,300 of earnings","Higher gross salary required to net the same after-tax amount","All income taxed at ordinary personal rates — no DTC benefit"]},
    {title:"Pure Dividends",
      pros:["No CPP premiums — saves up to ~$8,100/yr (employee + employer combined)","Dividend tax credit reduces net personal tax","No monthly CRA remittance — declare dividends when convenient","Flexible timing — declare in lower-income years","Income-splitting potential with family shareholders"],
      cons:["Corporate tax paid first (small business rate ~9–13% combined)","No RRSP room generated from dividend income","No CPP contributions = reduced CPP retirement benefits","Ineligible dividends carry a lower DTC than eligible dividends","Requires formal dividend resolution and accurate records"]},
    {title:"Salary + Dividend Mix",
      pros:["Best of both — RRSP room from salary AND dividend flexibility","Maxing CPP at $71,300 salary builds entitlement without overpaying","Monthly CRA remittances apply only to the salary portion","Dividend top-ups timed to your personal tax position each year","The structure most Canadian accountants recommend for CCPC owners","Childcare and employment deductions remain available"],
      cons:["More moving parts — payroll plus dividend declarations","Must keep accurate corporate records and minute book","CRA may scrutinize salary reasonableness if artificially low","Both provincial and federal planning needed to find the blend"]},
  ];
  return `<div class="panel">
    <div class="panel-head" style="display:block"><div class="ph-title">Benefits & Considerations</div><div class="ph-sub">Salary source deductions remitted to CRA monthly · All 10 provinces · 2025 rates</div></div>
    <div class="procon-grid">
      ${cols.map(col=>`<div class="procon-col">
        <h4>${col.title}</h4>
        <div class="pc-sub pro">Advantages</div>
        ${col.pros.map(x=>`<div class="pc-item"><span class="ic" style="color:var(--green)">✓</span><span>${x}</span></div>`).join("")}
        <div class="pc-sub con">Trade-offs</div>
        ${col.cons.map(x=>`<div class="pc-item"><span class="ic" style="color:#962B2B">✕</span><span>${x}</span></div>`).join("")}
      </div>`).join("")}
    </div>
  </div>`;
}

// ─── WIRE EVENTS ──────────────────────────────────────────────────────────────
function wireInputs(){
  const ci=document.getElementById("cashInput");
  const co=document.getElementById("corpInput");
  const pi=document.getElementById("provInput");
  const mi=document.getElementById("mixInput");
  ci.addEventListener("input",e=>{state.cashRaw=e.target.value;rerenderKeepFocus("cashInput");});
  co.addEventListener("input",e=>{state.corpRaw=e.target.value;rerenderKeepFocus("corpInput");});
  pi.addEventListener("change",e=>{state.province=e.target.value;render();});
  mi.addEventListener("input",e=>{state.mixSalaryRaw=e.target.value;rerenderKeepFocus("mixInput");});
  document.getElementById("exportBtn").addEventListener("click",exportPDF);
  wireAI();
}
// re-render but restore focus + caret to the field being typed in
function rerenderKeepFocus(id){
  const active=document.getElementById(id);
  const pos=active&&active.selectionStart;
  render();
  const restored=document.getElementById(id);
  if(restored){ restored.focus(); if(pos!=null&&restored.setSelectionRange){ try{restored.setSelectionRange(pos,pos);}catch(e){} } }
}
function wireAI(){
  document.querySelectorAll("[data-q]").forEach(b=>b.addEventListener("click",()=>{ qual[b.dataset.q]=b.dataset.v; refreshAI(); }));
  const qm=document.getElementById("qualMonthly");
  if(qm) qm.addEventListener("input",e=>{ qual.monthly=e.target.value; const g=document.getElementById("genBtn"); if(g) g.disabled=!(qual.hasRRSP&&qual.hasDeps&&qual.monthly); });
  const gen=document.getElementById("genBtn");
  if(gen) gen.addEventListener("click",generateAI);
  const regen=document.getElementById("aiRegen");
  if(regen) regen.addEventListener("click",()=>{ state.aiResult=""; refreshAI(); });
}

// ─── AI CALL ──────────────────────────────────────────────────────────────────
async function generateAI(){
  aiLoading=true; aiError=""; refreshAI();
  const {afterTax,corpInc,caS,caD,caM}=compute();
  const p=PROVINCES[state.province];
  const sbr=pct(0.09+(p.corpProvSBR||0.02));
  const mon=parseNum(qual.monthly),annual=mon*12,remaining=Math.max(0,afterTax-annual);
  const prompt=`You are a senior Canadian CPA specializing in owner-operated CCPCs. A business owner needs compensation advice.

THEIR NUMBERS (2025 tax rates — ${p.label}):
- Corporate net income: ${fCAD(corpInc)}
- After-tax cash needed: ${fCAD(afterTax)}
- Monthly base living expenses: ${fCAD(mon)}/month (${fCAD(annual)}/year)
- Remaining cash above monthly base: ${fCAD(remaining)}/year
- Small business rate: ${sbr} combined (federal + provincial)

TAX RESULTS:
- Pure Salary: Gross ${fCAD(caS.gross)}, CPP total ${fCAD(caS.cppEE+caS.cppER)}, total tax ${fCAD(caS.totalTax)}, effective rate ${pct(caS.totalTax/caS.totalCost)}, RRSP room ${fCAD(caS.rrspRoom)}
- Pure Dividends: Declared ${fCAD(caD.gross)}, corp tax (SBR ${sbr}) ${fCAD(caD.corpTax)}, total tax ${fCAD(caD.totalTax)}, effective rate ${pct(caD.totalTax/caD.totalCost)}, RRSP room nil
- Salary + Dividend Mix: Salary ${fCAD(caM.salaryAmount)}, dividend ${fCAD(caM.divAmount)}, total tax ${fCAD(caM.totalTax)}, effective rate ${pct(caM.totalTax/caM.totalCost)}, RRSP room ${fCAD(caM.rrspRoom)}, CPP maxed: ${caM.cppMaxed?"yes — full entitlement":"no"}
- Tax saved (mix vs. worst option): ${fCAD(Math.max(caS.totalTax,caD.totalTax)-caM.totalTax)}

OWNER PROFILE:
- RRSP contributor: ${qual.hasRRSP==="yes"?"Yes":"No"}
- Has dependants: ${qual.hasDeps==="yes"?"Yes":"No"}
- Monthly base expenses: ${fCAD(mon)}

KEY CANADIAN TAX FACTS TO WEAVE IN:
- CPP max earnings threshold is $71,300 — salary at this level maximizes CPP contributions without paying excess premiums on higher salary
- Salary source deductions MUST be remitted to CRA monthly — a legal compliance requirement
- Salary generates RRSP room at 18% of earned income (up to $31,560 in 2025)
- Childcare and moving expenses require earned income to claim — relevant if they have dependants
- Dividends require no monthly remittances and can be declared any time
- The professional recommendation: salary to cover monthly base needs AND max CPP ($71,300), dividends for any additional cash above that

Respond with exactly this structure:

**Our Recommendation**
Specific recommendation using their actual numbers. Lead with the salary+dividend mix approach. State the exact salary and dividend amounts. Mention monthly CRA source deduction remittance for the salary portion.

**Why This Works**
Explain the tax logic with their actual numbers. Include RRSP room, CPP entitlement, and if they have dependants mention the childcare/employment deduction angle. Compare total tax of mix vs. pure options with the actual savings figure.

**What to Watch**
- [compliance or timing point]
- [RRSP or CPP planning point]
- [one risk or optimization specific to their numbers]

**One Thing Most Owners Miss**
One insight a good accountant would flag — something specific to their situation that most calculators don't surface.

Be direct, use their numbers, write like a trusted advisor. No generic disclaimers.`;
  try{
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
    const data=await res.json();
    const text=(data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n")||"";
    if(!text)throw new Error("empty");
    state.aiResult=text;
  }catch(e){ aiError="Something went wrong generating your recommendation. Please try again."; }
  finally{ aiLoading=false; refreshAI(); }
}

// ─── PDF EXPORT ─────────────────────────────────────────────────────────────
function exportPDF(){
  const {afterTax,corpInc,caS,caD,caM}=compute();
  const p=PROVINCES[state.province];
  const sbr=pct(0.09+(p.corpProvSBR||0.02));
  const dt=new Date().toLocaleDateString("en-CA",{year:"numeric",month:"long",day:"numeric"});
  const rec=state.aiResult;
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dividend vs Salary — Prosperify</title>
  <style>
    body{font-family:Georgia,serif;color:#1A1A1A;padding:40px;max-width:760px;margin:0 auto}
    h1{font-size:26px;margin-bottom:4px}.sub{font-family:sans-serif;font-size:12px;color:#888;margin-bottom:22px}
    .meta{display:flex;gap:18px;flex-wrap:wrap;margin-bottom:24px}
    .meta-item{font-family:sans-serif;font-size:12px;color:#666}.meta-item strong{display:block;font-size:17px;color:#1A1A1A;margin-bottom:2px}
    h2{font-size:16px;margin:22px 0 10px;border-bottom:2px solid #DC321F;padding-bottom:5px}
    table{width:100%;border-collapse:collapse;font-family:sans-serif;font-size:12px;margin-bottom:8px}
    th,td{text-align:left;padding:7px 9px;border-bottom:1px solid #E0DDD6}th{background:#F5F0E8;font-size:10.5px;text-transform:uppercase;letter-spacing:.04em}
    .red{color:#962B2B}.green{color:#1A6035}.bold{font-weight:700}.winner{background:#EEF7F1}
    .rec{font-family:sans-serif;font-size:12.5px;line-height:1.7;background:#F7F9F7;border:1px solid #C0D4C0;border-radius:8px;padding:16px 18px}
    .rec h3{font-size:13px;margin-bottom:6px}
    .footer{margin-top:32px;padding-top:14px;border-top:1px solid #E0DDD6;font-family:sans-serif;font-size:10.5px;color:#999;line-height:1.6}
    @media print{body{padding:24px}}
  </style></head><body>
  <h1>Dividend vs. Salary Analysis</h1>
  <div class="sub">Generated ${dt} · Canada · 2025 Tax Rates · For informational purposes only · Prosperify</div>
  <div class="meta">
    <div class="meta-item"><strong>${fCAD(afterTax)}</strong>After-Tax Cash Needed</div>
    <div class="meta-item"><strong>${fCAD(corpInc)}</strong>Corporate Net Income</div>
    <div class="meta-item"><strong>${p.label}</strong>Province</div>
    <div class="meta-item"><strong>${sbr} combined</strong>Small Business Rate</div>
  </div>
  <h2>Comparison Summary</h2>
  <table><thead><tr><th>Method</th><th>Total Cost to Corp</th><th>Total Tax</th><th>Effective Rate</th><th>After-Tax Cash</th><th>RRSP Room</th></tr></thead><tbody>
  <tr><td>Pure Salary</td><td>${fCAD(caS.totalCost)}</td><td class="red">${fCAD(caS.totalTax)}</td><td>${pct(caS.totalTax/caS.totalCost)}</td><td class="green">${fCAD(caS.afterTax)}</td><td>${fCAD(caS.rrspRoom)}</td></tr>
  <tr><td>Pure Dividends</td><td>${fCAD(caD.totalCost)}</td><td class="red">${fCAD(caD.totalTax)}</td><td>${pct(caD.totalTax/caD.totalCost)}</td><td class="green">${fCAD(caD.afterTax)}</td><td>Nil</td></tr>
  <tr class="winner"><td><strong>Salary + Dividend Mix</strong> (Salary ${fCAD(caM.salaryAmount)})</td><td>${fCAD(caM.totalCost)}</td><td class="red">${fCAD(caM.totalTax)}</td><td>${pct(caM.totalTax/caM.totalCost)}</td><td class="green">${fCAD(caM.afterTax)}</td><td>${fCAD(caM.rrspRoom)}</td></tr>
  </tbody></table>
  <h2>Mix Breakdown — ${fCAD(caM.salaryAmount)} Salary + ${fCAD(caM.divAmount)} Dividends</h2>
  <table><tbody>
  <tr><td>Salary (Gross)</td><td>${fCAD(caM.salaryAmount)}</td></tr>
  <tr><td>Dividend Declared</td><td>${fCAD(caM.divAmount)}</td></tr>
  <tr><td>CPP – Employee</td><td class="red">−${fCAD(caM.cppEE)}</td></tr>
  <tr><td>CPP – Employer (Corp cost)</td><td class="red">−${fCAD(caM.cppER)}</td></tr>
  <tr><td>Corporate Tax (SBR ${sbr})</td><td class="red">−${fCAD(caM.corpTax)}</td></tr>
  <tr><td>Federal Income Tax</td><td class="red">−${fCAD(caM.fedTax)}</td></tr>
  <tr><td>Provincial Income Tax</td><td class="red">−${fCAD(caM.provTax)}</td></tr>
  <tr><td class="bold">After-Tax Cash</td><td class="green bold">${fCAD(caM.afterTax)}</td></tr>
  <tr><td class="bold">Total Tax Burden</td><td class="red bold">${fCAD(caM.totalTax)}</td></tr>
  <tr><td>RRSP Room Generated</td><td class="green">${fCAD(caM.rrspRoom)}</td></tr>
  <tr><td>CPP Max Reached</td><td>${caM.cppMaxed?"✓ Yes — full entitlement":"✕ No — increase salary to "+fCAD(CPP_MAX)}</td></tr>
  <tr><td>Monthly CRA Source Deductions</td><td>Yes — on salary portion only</td></tr>
  </tbody></table>
  ${rec?`<h2>AI Recommendation</h2><div class="rec"><h3>Personalized Analysis</h3>${rec.replace(/\n/g,"<br>").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")}</div>`:""}
  <div class="footer"><strong>Disclaimer —</strong> Estimated 2025 federal and provincial rates. Does not account for provincial surtaxes, Ontario Health Premium, Quebec abatement, RRSP room carried forward, AMT, or other personal circumstances. <strong>Consult a qualified CPA or tax advisor before making compensation decisions.</strong></div>
  </body></html>`;
  const w=window.open("","_blank");
  w.document.write(html); w.document.close(); w.focus();
  setTimeout(()=>w.print(),400);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
render();
