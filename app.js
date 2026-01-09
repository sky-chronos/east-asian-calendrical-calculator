/* ======================================================
   사주도사 app.js – 최종본
   - 사주 4주
   - 대운 / 세운 / 월운
   - 결과 복사 / GPT 복사
   - 입력값 localStorage 기억
====================================================== */

const STORAGE_KEY = "saju_dosa_input_v1";

function $(id){ return document.getElementById(id); }
function pad2(n){ return String(n).padStart(2,"0"); }
function mod(n,m){ return ((n%m)+m)%m; }

/* ================= UI ================= */
function getCalendarType(){
  return document.querySelector('input[name="calendarType"]:checked').value;
}
function updateUI(){
  const isLunar = getCalendarType()==="lunar";
  $("engineRow").classList.toggle("hidden", !isLunar);
  $("leapRow").classList.toggle("hidden", !isLunar);
  $("engineBadge").textContent =
    $("lunarEngine").value==="kasi" ? "엔진: KASI" : "엔진: 범용";
}

/* ================= localStorage ================= */
function saveInputs(){
  const data = {
    calendarType: getCalendarType(),
    lunarEngine: $("lunarEngine").value,
    isLeapMonth: $("isLeapMonth").value,
    year: $("year").value,
    month: $("month").value,
    day: $("day").value,
    hour: $("hour").value,
    minute: $("minute").value
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadInputs(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return;
  try{
    const d = JSON.parse(raw);
    if(d.calendarType){
      document.querySelector(
        `input[name="calendarType"][value="${d.calendarType}"]`
      ).checked = true;
    }
    if(d.lunarEngine) $("lunarEngine").value = d.lunarEngine;
    if(d.isLeapMonth) $("isLeapMonth").value = d.isLeapMonth;
    if(d.year) $("year").value = d.year;
    if(d.month) $("month").value = d.month;
    if(d.day) $("day").value = d.day;
    if(d.hour) $("hour").value = d.hour;
    if(d.minute) $("minute").value = d.minute;
    updateUI();
  }catch(e){
    console.warn("입력값 복원 실패", e);
  }
}

/* ================= KASI ================= */
function lunarToSolar_KASI(y,m,d,isLeap){
  if(typeof KoreanLunarCalendar==="undefined")
    throw new Error("KASI 엔진 로드 실패");
  const cal = new KoreanLunarCalendar();
  if(!cal.setLunarDate(y,m,d,isLeap))
    throw new Error("유효하지 않은 음력");
  const s = cal.getSolarCalendar();
  return { year:s.year, month:s.month, day:s.day };
}
function lunarToSolar_UniversalBlocked(){
  throw new Error("범용 음력 엔진은 비활성화됨. KASI 사용");
}

/* ================= 상수 ================= */
const STEMS = ["갑","을","병","정","무","기","경","신","임","계"];
const BRANCHES = ["자","축","인","묘","진","사","오","미","신","유","술","해"];

/* ================= 사주 계산 ================= */
function yearPillar(y,m,d){
  const useYear = (m<2 || (m===2 && d<4)) ? y-1 : y;
  return {
    stem: STEMS[mod(useYear-4,10)],
    branch: BRANCHES[mod(useYear-4,12)]
  };
}
function monthPillar(y,m){
  return {
    stem: STEMS[mod(y*12+m,10)],
    branch: BRANCHES[mod(m+1,12)]
  };
}
function dayPillar(y,m,d){
  const base = new Date(1900,0,1);
  const cur  = new Date(y,m-1,d);
  const diff = Math.floor((cur-base)/86400000);
  return {
    stem: STEMS[mod(diff,10)],
    branch: BRANCHES[mod(diff,12)]
  };
}
function hourPillar(dayStem,h){
  const br = Math.floor((h+1)/2)%12;
  const st = mod(STEMS.indexOf(dayStem)*2+br,10);
  return { stem:STEMS[st], branch:BRANCHES[br] };
}

/* ================= 대운·세운·월운 ================= */
function buildLuck(pillars, year){
  let txt = "\n[대운]\n";
  const ms = STEMS.indexOf(pillars.month.stem);
  const mb = BRANCHES.indexOf(pillars.month.branch);

  for(let i=1;i<=6;i++){
    txt += `- ${i*10}세: ${STEMS[mod(ms+i,10)]}${BRANCHES[mod(mb+i,12)]}\n`;
  }

  txt += "\n[세운(연운)]\n";
  for(let y=year-3;y<=year+3;y++){
    txt += `- ${y}: ${STEMS[mod(y-4,10)]}${BRANCHES[mod(y-4,12)]}\n`;
  }

  txt += "\n[월운]\n";
  for(let m=1;m<=12;m++){
    txt += `- ${m}월: ${STEMS[mod(year*12+m,10)]}${BRANCHES[mod(m+1,12)]}\n`;
  }
  return txt;
}

/* ================= 실행 ================= */
function onCalc(){
  $("err").textContent="";
  $("msg").textContent="";
  $("debug").textContent="";

  try{
    const calType = getCalendarType();
    const engine  = $("lunarEngine").value;
    const isLeap  = $("isLeapMonth").value==="true";

    const y  = +$("year").value;
    const m  = +$("month").value;
    const d  = +$("day").value;
    const hh = +$("hour").value;
    const mm = +$("minute").value;

    let solar = {year:y, month:m, day:d};
    if(calType==="lunar"){
      solar = engine==="kasi"
        ? lunarToSolar_KASI(y,m,d,isLeap)
        : lunarToSolar_UniversalBlocked();
    }

    const dayP = dayPillar(solar.year,solar.month,solar.day);
    const pillars = {
      year: yearPillar(solar.year,solar.month,solar.day),
      month: monthPillar(solar.year,solar.month),
      day: dayP,
      hour: hourPillar(dayP.stem, hh)
    };

    const luck = buildLuck(pillars, solar.year);

    const out =
`[사주도사 웹계산 결과 – STEP 4-4]

[출생 정보]
- 양력: ${solar.year}-${pad2(solar.month)}-${pad2(solar.day)} ${pad2(hh)}:${pad2(mm)} (KST)

[사주 팔자]
- 년주: ${pillars.year.stem}${pillars.year.branch}
- 월주: ${pillars.month.stem}${pillars.month.branch}
- 일주: ${pillars.day.stem}${pillars.day.branch}
- 시주: ${pillars.hour.stem}${pillars.hour.branch}
${luck}

※ 계산은 확정값이며, 해석은 GPT(사주도사)에게 맡기세요.
`;

    $("msg").textContent = "계산 완료";
    $("debug").textContent = out;

    saveInputs(); // ⭐ 입력값 저장

  }catch(e){
    $("err").textContent = e.message;
  }
}

/* ================= 복사 기능 ================= */
$("btnCopy").onclick = ()=>{
  const t = $("debug").textContent;
  if(!t) return alert("복사할 결과가 없습니다.");
  navigator.clipboard.writeText(t).then(()=>alert("결과 복사 완료"));
};

$("btnCopyGPT").onclick = ()=>{
  const t = $("debug").textContent;
  if(!t) return alert("복사할 결과가 없습니다.");
  const h =
`아래 내용은 웹 계산기로 이미 확정된 사주 데이터입니다.
계산을 변경하지 말고 해석만 해주세요.

`;
  navigator.clipboard.writeText(h+t).then(()=>alert("GPT용 복사 완료"));
};

/* ================= init ================= */
function init(){
  document.querySelectorAll('input[name="calendarType"]').forEach(el=>{
    el.addEventListener("change",updateUI);
  });
  $("lunarEngine").addEventListener("change",updateUI);
  $("btnCalc").addEventListener("click",onCalc);
  updateUI();
  loadInputs(); // ⭐ 입력값 복원
}
init();
