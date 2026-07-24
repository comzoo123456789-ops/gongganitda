// ============================================================
// 공간잇다 — 견적 요청 작성 + 매칭 파트너 알림
// ============================================================
const $ = (s) => document.querySelector(s);
const auth = window.AUTH.get();
const pad = (n) => String(n).padStart(2, "0");
const today = new Date(); today.setHours(0, 0, 0, 0);
const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

const fmtD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// 선정·결제 마감 = 이용일 3일 전 (당일·임박 요청이면 당일까지)
const calcDeadline = (dateStr) => fmtD(new Date(Math.max(today.getTime(), new Date(dateStr).getTime() - 3 * 86400000)));

$("#rqRegion").innerHTML = REGIONS.map((r) => `<option value="${r}">${r}</option>`).join("");
// 부대 서비스 — 체크만 (요청사항은 아래 #rqNotes 에서 항목별로)
// 빔프로젝터·스크린은 촬영장비·카메라 항목에 통합 → 서비스 선택에서 제외
$("#rqSvc").innerHTML = SERVICES.filter((s) => s.id !== "projector").map((s) => `<label class="hf-chk"><input type="checkbox" value="${s.id}" /><span>${iconSVG(s.icon, 16)} ${s.label}</span></label>`).join("");

// ── 카테고리별 요청사항 + 첨부 ──
const EG = {
  space: "예: 30인 규모 파티룸, 음향·주차 필요, 18시부터 3시간 이용",
  camera: "예: 스냅 촬영용 카메라 2대 + 조명 1세트, 3시간 대여 (사진작가 포함 여부)",
  photo: "예: 2시간 행사 스냅 촬영, 보정본 50장, 당일 하이라이트 제공 (드론 촬영 가능 여부)",
  catering: "예: 성인 30인분 뷔페, 디저트 포함, 12시까지 현장 세팅",
  office: "예: 접이식 테이블 5개 · 의자 30개 1일 대여",
  cleaning: "예: 행사 후 청소 80㎡, 폐기물 수거 포함",
  repair: "예: 조명 2개 교체, 콘센트 점검",
  interior: "예: 포토존 데코 2m 벽면, 파스텔 톤 시공",
  banner: "예: 현수막 3x1m 2장 + 엑스배너 2개, 로고 파일 반영",
  projector: "예: 5000안시 빔프로젝터 1대 + 100인치 스크린 + 음향",
  goods: "예: 기념 텀블러 50개, 로고 각인, 행사 종료 후 증정용",
};
// 항목별 자주 요청되는 품목 체크리스트 (빔프로젝터·스크린은 카메라에 통합)
const CATOPT = {
  camera: ["카메라 바디", "렌즈(광각/망원)", "삼각대", "LED 조명", "짐벌·스태빌라이저", "무선 마이크", "녹음 장비", "배경지·호리존", "반사판", "촬영 모니터", "사진작가·스태프", "빔프로젝터", "100인치 스크린", "음향·스피커"],
  photo: ["행사 스냅 촬영", "영상 촬영", "드론 항공 촬영", "현장 즉석 인화", "보정본 제공", "당일 하이라이트 영상", "MC·사회자", "포토부스"],
  catering: ["케이크", "다과·디저트", "뷔페", "핑거푸드", "도시락", "샌드위치", "과일 플래터", "커피·음료 바", "주류", "비건·알러지 대응"],
  office: ["접이식 테이블", "의자", "화이트보드", "복합기·프린터", "파티션", "행거", "스탠드 조명", "연장선·멀티탭", "정수기", "이젤·거치대"],
  cleaning: ["행사 전 청소", "행사 후 청소", "폐기물 수거", "바닥 청소", "화장실 청소", "쓰레기통·비품 세팅"],
  repair: ["전기·조명 보수", "도배·페인트", "누수·설비 수리", "문·창호 수리", "간단 목공", "콘센트 증설"],
  interior: ["포토존 데코", "풍선 데코", "배경 벽면 시공", "부스 설치", "가구 배치", "무드 조명 연출", "현판·사인물"],
  banner: ["실사 현수막", "엑스배너", "포멕스 사인", "무대 배경 현수막", "안내 사인물", "명패·명찰"],
  goods: ["에코백", "텀블러", "볼펜·노트 세트", "뱃지·스티커", "키링", "부채", "파우치", "손소독제·마스크", "맞춤 굿즈 패키지"],
  space: [],
};
const catState = {}; // cat -> { items:{}, note, files:[{name,url}], folded }
function downscale(file, cb) {
  if (!/^image\//.test(file.type)) { cb(null); return; }
  const rd = new FileReader(); rd.onload = () => { const img = new Image(); img.onload = () => { let w = img.width, h = img.height, m = 640; if (w > m || h > m) { if (w > h) { h = Math.round(h * m / w); w = m; } else { w = Math.round(w * m / h); h = m; } } const cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").drawImage(img, 0, 0, w, h); try { cb(cv.toDataURL("image/jpeg", 0.6)); } catch (e) { cb(null); } }; img.onerror = () => cb(null); img.src = rd.result; }; rd.readAsDataURL(file);
}
function selectedCats() { const a = []; if ($("#rqSpace").checked) a.push("space"); document.querySelectorAll("#rqSvc input:checked").forEach((i) => a.push(i.value)); return a; }
function fileChip(c, f, i) { return (f.url && /^data:image/.test(f.url)) ? `<span class="rqn-file"><img src="${f.url}" alt="" /><button type="button" data-delfile="${c}|${i}">✕</button></span>` : `<span class="rqn-file rqn-file--doc">${iconSVG("doc", 14)} <span>${f.name}</span><button type="button" data-delfile="${c}|${i}">✕</button></span>`; }
function buildNotes() {
  const cats = selectedCats(), box = $("#rqNotes");
  if (!cats.length) { box.innerHTML = `<p class="rqn-empty">${iconSVG("doc", 18)}<span>위에서 <b>공간·서비스</b>를 선택하면 항목별 요청사항을 적을 수 있어요.<br />선택한 항목만 해당 파트너에게 전달됩니다.</span></p>`; return; }
  box.innerHTML = `<div class="rqn-title">${iconSVG("list", 15)} 항목별 요청사항 <span>선택한 항목에만 · 해당 파트너에게만 전달</span></div>` + cats.map((c) => {
    const st = catState[c] || (catState[c] = { items: {}, note: "", files: [], folded: false });
    if (!st.items) st.items = {};
    const meta = c === "space" ? iconSVG("pin", 15) : iconSVG(reqCatById(c).icon, 15);
    const opts = CATOPT[c] || [];
    const chkN = opts.filter((it) => st.items[it]).length;
    const optsHtml = opts.length ? `<div class="rqn__optlabel">필요한 항목을 선택하세요 ${chkN ? `<b>${chkN}개 선택</b>` : ""}</div><div class="rqn__opts">${opts.map((it) => `<label class="rqn__opt${st.items[it] ? " is-on" : ""}"><input type="checkbox" data-optcat="${c}" value="${it.replace(/"/g, "&quot;")}" ${st.items[it] ? "checked" : ""} /><span>${it}</span></label>`).join("")}</div>` : "";
    return `<div class="rqn" data-cat="${c}">
      <button type="button" class="rqn__head" data-nfold="${c}"><span class="rqn__ttl">${meta} ${reqCatById(c).label}</span><span class="rqn__chev">${st.folded ? "▸" : "▾"}</span></button>
      <div class="rqn__body"${st.folded ? " hidden" : ""}>
        ${optsHtml}
        <textarea class="rqn__note" data-note="${c}" rows="2" placeholder="${opts.length ? "그 외 상세 요청사항 (예: 수량·시간·브랜드 등)" : (EG[c] || "요청 내용을 적어주세요")}">${(st.note || "").replace(/</g, "&lt;")}</textarea>
        <div class="rqn__files">${st.files.map((f, i) => fileChip(c, f, i)).join("")}</div>
        <label class="rqn__add">${iconSVG("clip", 14)} 파일·사진 첨부<input type="file" data-file="${c}" multiple hidden /></label>
      </div>
    </div>`;
  }).join("");
}
$("#rqSvc").addEventListener("change", buildNotes);
// #rqNotes 내부 이벤트 (입력·첨부·삭제·접기)
$("#rqNotes").addEventListener("input", (e) => { const t = e.target.closest("[data-note]"); if (t) { (catState[t.dataset.note] = catState[t.dataset.note] || { note: "", files: [] }).note = t.value; } });
$("#rqNotes").addEventListener("change", (e) => {
  const opt = e.target.closest("[data-optcat]");
  if (opt) {
    const c = opt.dataset.optcat, st = catState[c] || (catState[c] = { items: {}, note: "", files: [] });
    st.items = st.items || {}; st.items[opt.value] = opt.checked;
    const lbl = opt.closest(".rqn__opt"); if (lbl) lbl.classList.toggle("is-on", opt.checked);
    const cnt = Object.keys(st.items).filter((k) => st.items[k]).length;
    const wrap = document.querySelector(`.rqn[data-cat="${c}"] .rqn__optlabel`); if (wrap) wrap.innerHTML = `필요한 항목을 선택하세요 ${cnt ? `<b>${cnt}개 선택</b>` : ""}`;
    return;
  }
  const fi = e.target.closest("[data-file]"); if (!fi) return;
  const c = fi.dataset.file, st = catState[c] || (catState[c] = { note: "", files: [] });
  [...fi.files].slice(0, 5).forEach((f) => downscale(f, (url) => { st.files.push({ name: f.name, url }); const wrap = document.querySelector(`.rqn[data-cat="${c}"] .rqn__files`); if (wrap) wrap.innerHTML = st.files.map((x, i) => fileChip(c, x, i)).join(""); }));
});
$("#rqNotes").addEventListener("click", (e) => {
  const fold = e.target.closest("[data-nfold]");
  if (fold) { const c = fold.dataset.nfold; catState[c].folded = !catState[c].folded; buildNotes(); return; }
  const del = e.target.closest("[data-delfile]"); if (del) { const [c, i] = del.dataset.delfile.split("|"); catState[c].files.splice(+i, 1); const wrap = document.querySelector(`.rqn[data-cat="${c}"] .rqn__files`); if (wrap) wrap.innerHTML = catState[c].files.map((x, k) => fileChip(c, x, k)).join(""); return; }
});
$("#rqDate").min = todayStr; $("#rqDate").value = todayStr; // 당일 요청도 가능

// 공간 대관 — 이용 시간대 · 유형 · 토글
const hourOpts = (a, b) => { let o = ""; for (let i = a; i <= b; i++) o += `<option value="${i}">${pad(i)}:00</option>`; return o; };
$("#rqStart").innerHTML = hourOpts(6, 22); $("#rqEnd").innerHTML = hourOpts(7, 23);
$("#rqStart").value = 9; $("#rqEnd").value = 15;
$("#rqSpaceType").innerHTML = `<option value="">유형 상관없음</option>` + CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join("");
const timeHint = () => { const s = +$("#rqStart").value, en = +$("#rqEnd").value, h = en - s; $("#rqTimeHint").textContent = h > 0 ? `${pad(s)}:00~${pad(en)}:00 · 총 ${h}시간 — 호스트가 이 시간 기준으로 견적을 냅니다.` : "종료 시간을 시작 이후로 선택해 주세요."; };
["rqStart", "rqEnd"].forEach((id) => $("#" + id).addEventListener("change", timeHint)); timeHint();
const spaceToggle = () => { $("#rqSpaceOpts").hidden = !$("#rqSpace").checked; };
$("#rqSpace").addEventListener("change", () => { spaceToggle(); buildNotes(); }); spaceToggle();

const won = (n) => (+n || 0).toLocaleString("ko-KR");
const budgetHint = () => {
  if ($("#rqBudgetFlex").checked) { $("#rqBudgetHint").textContent = "협의 가능 — 예산은 파트너와 협의합니다."; return; }
  const v = +$("#rqBudget").value; $("#rqBudgetHint").textContent = v ? `${won(v)}원 — 파트너 견적 합계를 이 예산과 비교해 드려요.` : "범위를 고르거나 직접 입력하세요. 비워두면 제한 없이 견적을 받아요.";
};
$("#rqBudget").addEventListener("input", () => { if ($("#rqBudgetRange")) $("#rqBudgetRange").value = "custom"; budgetHint(); });
$("#rqBudgetRange").addEventListener("change", (e) => { const v = e.target.value; if (v === "custom") { $("#rqBudget").value = ""; $("#rqBudget").focus(); } else if (v) { $("#rqBudget").value = v; } else { $("#rqBudget").value = ""; } budgetHint(); });
$("#rqBudgetFlex").addEventListener("change", (e) => { const on = e.target.checked; $("#rqBudget").disabled = on; $("#rqBudgetRange").disabled = on; if (on) { $("#rqBudget").value = ""; $("#rqBudgetRange").value = ""; } budgetHint(); });
budgetHint();

// ── 휴대폰 자동 하이픈 포맷 (숫자만) ──
$("#rqPhone").addEventListener("input", (e) => {
  let d = e.target.value.replace(/\D/g, "").slice(0, 11);
  e.target.value = d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
});

// ── 참고 자료 업로드 (드래그&드롭 · 최대 5개) ──
const refFiles = [];
const rqDrop = $("#rqDrop"), rqRef = $("#rqRefFiles");
function renderRef() { rqRef.innerHTML = refFiles.map((f, i) => fileChip("ref", f, i)).join(""); }
function addRefFiles(files) {
  [...files].forEach((f) => {
    if (refFiles.length >= 5) return;
    if (/^image\//.test(f.type)) downscale(f, (url) => { if (url && refFiles.length < 5) { refFiles.push({ name: f.name, url }); renderRef(); } });
    else if (/pdf$/i.test(f.name) || f.type === "application/pdf") { refFiles.push({ name: f.name, url: null }); renderRef(); }
    else { refFiles.push({ name: f.name, url: null }); renderRef(); }
  });
}
if (rqDrop) {
  $("#rqFiles").addEventListener("change", (e) => { addRefFiles(e.target.files); e.target.value = ""; });
  ["dragover", "dragenter"].forEach((ev) => rqDrop.addEventListener(ev, (e) => { e.preventDefault(); rqDrop.classList.add("is-over"); }));
  ["dragleave", "dragend"].forEach((ev) => rqDrop.addEventListener(ev, () => rqDrop.classList.remove("is-over")));
  rqDrop.addEventListener("drop", (e) => { e.preventDefault(); rqDrop.classList.remove("is-over"); addRefFiles(e.dataTransfer.files); });
  rqRef.addEventListener("click", (e) => { const d = e.target.closest("[data-delfile]"); if (d) { e.preventDefault(); refFiles.splice(+d.dataset.delfile.split("|")[1], 1); renderRef(); } });
}

// ── 단계별 위저드 ──
let step = 1;
function goStep(n) {
  step = Math.max(1, Math.min(3, n));
  document.querySelectorAll(".wz-step").forEach((s) => (s.hidden = +s.dataset.step !== step));
  document.querySelectorAll("#wzBar .wz-i").forEach((i) => { const si = +i.dataset.si; i.classList.toggle("is-active", si === step); i.classList.toggle("is-done", si < step); });
  if (step === 3) buildReview();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function validStep(n) {
  if (n === 1) { if (!$("#rqDate").value || !$("#rqRegion").value || !(+$("#rqCap").value)) { toast("날짜·지역·인원을 입력해 주세요"); return false; } }
  if (n === 2) { if (!venue && !selectedCats().length) { toast("공간 대관 또는 서비스를 하나 이상 선택해 주세요"); return false; } if ($("#rqSpace").checked && (+$("#rqEnd").value) <= (+$("#rqStart").value)) { toast("이용 종료 시간을 시작 이후로 선택해 주세요"); return false; } }
  return true;
}
document.querySelectorAll("[data-next]").forEach((b) => b.addEventListener("click", () => { if (validStep(step)) goStep(step + 1); }));
document.querySelectorAll("[data-prev]").forEach((b) => b.addEventListener("click", () => goStep(step - 1)));
// 1단계 필수 입력 전까지 '다음 단계' 비활성화
const step1Next = document.querySelector('.wz-step[data-step="1"] [data-next]');
function checkStep1() { const ok = !!($("#rqDate").value && $("#rqRegion").value && (+$("#rqCap").value) > 0); if (step1Next) step1Next.disabled = !ok; }
["rqDate", "rqRegion", "rqCap"].forEach((id) => { const el = $("#" + id); if (el) { el.addEventListener("input", checkStep1); el.addEventListener("change", checkStep1); } });
checkStep1();
function buildReview() {
  const cats = selectedCats().map((c) => reqCatById(c).label).join(", ") || "-";
  const b = $("#rqBudgetFlex").checked ? "협의 가능" : (+$("#rqBudget").value ? won(+$("#rqBudget").value) + "원" : "제한 없음");
  $("#rqReview").innerHTML = `<div class="rq-review__t"><span class="rq-review__ic">${iconSVG("list", 16)}</span>요청 요약</div><ul class="rq-review__list"><li>${iconSVG("calendar", 16)}<span>${$("#rqDate").value} · ${$("#rqRegion").value} · ${$("#rqCap").value}인</span></li><li>${iconSVG("grid", 16)}<span>${cats}</span></li><li>${iconSVG("won", 16)}<span>${b}</span></li>${(venue && venueCoupon) ? `<li>${iconSVG("ticket", 16)}<span>${venueCoupon.code} · ${venueCoupon.label} (−${won(venueCoupon.off)}원)</span></li>` : ""}${refFiles.length ? `<li>${iconSVG("clip", 16)}<span>참고자료 ${refFiles.length}개</span></li>` : ""}</ul>`;
}

// 수정 모드 (?id=) — 내 요청 불러오기
const editId = new URLSearchParams(location.search).get("id");
let editReq = editId ? window.REQUESTS.find(editId) : null;
if (editReq && editReq.memberId !== auth.userId) editReq = null;
if (editReq) {
  $("#rqTitle").textContent = "견적 요청 수정";
  $("#rqSubmit").textContent = "수정 저장";
  if (editReq.date < todayStr) $("#rqDate").min = editReq.date; // 과거 날짜 유지 허용
  $("#rqDate").value = editReq.date;
  $("#rqRegion").value = editReq.region;
  $("#rqCap").value = editReq.capacity;
  $("#rqPark").value = editReq.parking || "";
  $("#rqBudget").value = typeof editReq.budget === "number" ? editReq.budget : (parseInt(editReq.budget, 10) || "");
  $("#rqPhone").value = editReq.memberPhone || "";
  $("#rqDetail").value = editReq.detail || "";
  document.querySelectorAll("#rqSvc input").forEach((cb) => { cb.checked = (editReq.cats || []).includes(cb.value); });
  if ((editReq.cats || []).includes("space")) $("#rqSpace").checked = true;
  if (editReq.start != null) $("#rqStart").value = editReq.start;
  if (editReq.end != null) $("#rqEnd").value = editReq.end;
  if (editReq.spaceType) $("#rqSpaceType").value = editReq.spaceType;
  (editReq.cats || []).forEach((c) => {
    const items = {}; ((editReq.catItems || {})[c] || []).forEach((it) => (items[it] = true));
    const note = (editReq.catFree || {})[c] || (editReq.catNotes || {})[c] || "";
    catState[c] = { items, note, files: (editReq.catFiles || {})[c] || [], folded: false };
  });
  if (editReq.budgetFlex) { $("#rqBudgetFlex").checked = true; $("#rqBudget").disabled = true; $("#rqBudgetRange").disabled = true; }
  (editReq.refFiles || []).forEach((f) => refFiles.push(f)); renderRef();
  spaceToggle(); timeHint(); budgetHint(); buildNotes();
} else {
  // 홈 서비스 카드에서 넘어온 경우 해당 서비스 미리 선택
  const _qp = new URLSearchParams(location.search);
  const preSvc = _qp.get("svc") || _qp.get("category");
  if (preSvc) { const box = document.querySelector(`#rqSvc input[value="${preSvc}"]`); if (box) box.checked = true; }
  buildNotes();
}

// 공간 예약 진행 모드 (space.html → 예약 진행) — 특정 공간을 예약하며 부대서비스 함께 요청
const qp = new URLSearchParams(location.search);
let venue = null;
if (!editReq && qp.get("space")) {
  venue = getAllSpaces().find((s) => String(s.id) === String(qp.get("space")));
  if (venue) {
    const vDate = qp.get("date") || todayStr;
    const vStart = +qp.get("start") || 9, vHours = +qp.get("hours") || 2, vGuests = +qp.get("guests") || Math.min(2, venue.capacity);
    $("#rqTitle").textContent = "예약 진행 · 부대서비스 견적";
    $("#rqSubmit").textContent = "예약 진행하기";
    const reg = REGIONS.find((r) => (venue.region || "").includes(r));
    if (reg) $("#rqRegion").value = reg;
    $("#rqDate").value = vDate < todayStr ? ($("#rqDate").min = vDate, vDate) : vDate;
    $("#rqCap").value = vGuests;
    $("#rqStart").value = Math.min(22, vStart); $("#rqEnd").value = Math.min(23, vStart + vHours); timeHint();
    // 공간은 이미 선택됨 → 공간 대관 경매 토글 완전 숨김 (CSS display:flex가 hidden보다 우선하므로 style로)
    $("#rqSpaceWrap").style.display = "none"; $("#rqSpaceOpts").hidden = true; $("#rqSpace").checked = false;
    $("#rqNeedLabel").innerHTML = "부대서비스가 필요하면 선택하세요 <span style='color:var(--faint);font-weight:500'>(선택 — 공간만 예약해도 됩니다)</span>";
    $("#rqSvcLabel").textContent = "부대 서비스 — 파트너가 견적";
    venue._slot = { date: vDate, start: Math.min(22, vStart), hours: vHours, guests: vGuests };
    const c = catById(venue.cat); const img = spaceImg(venue, 200, 150);
    $("#rqVenue").hidden = false;
    $("#rqVenue").innerHTML = `<div class="rq-venue__thumb" style="background:linear-gradient(135deg,${(venue.g || [c.ink, "#ccc"])[0]},${(venue.g || [c.ink, "#ccc"])[1]})">${img ? `<img src="${img}" alt="" onerror="this.remove()" />` : ""}</div>
      <div class="rq-venue__body"><span class="rq-venue__tag">예약 진행 공간</span><b>${venue.name}</b><div class="rq-venue__meta">${venue.region} · 최대 ${venue.capacity}인 · ${won(venue.price)}원/시간</div><div class="rq-venue__slot">${iconSVG("calendar", 14)} ${vDate} · ${pad(Math.min(22, vStart))}:00~${pad(Math.min(23, vStart + vHours))}:00 · ${vGuests}인</div></div>`;
    renderVenueCoupon();
  }
}

// ── 게스트 쿠폰 적용 (예약 진행) ──
let venueCoupon = null;
function venueCtx() { const st = +$("#rqStart").value, en = +$("#rqEnd").value, hrs = Math.max(1, en - st); const unit = window.priceOf ? window.priceOf(venue).price : venue.price; return { hours: hrs, amount: unit * hrs, unit: unit }; }
function renderVenueCoupon() {
  const box = $("#rqCouponBox"); if (!box || !venue || !window.COUPON) return;
  const list = window.COUPON.listFor(venue.id);
  box.hidden = false;
  box.innerHTML = `<div class="rqcp__h">${iconSVG("ticket", 15)} 쿠폰 적용 <span>이 공간에 사용 가능한 쿠폰만 표시돼요</span></div>
    <label class="rqcp__f"><span>보유 쿠폰</span><select id="rqCpSel"><option value="">선택 안 함</option>${list.map((x) => `<option value="${x.source}:${x.code}">${x.code} · ${x.label}</option>`).join("")}</select></label>
    <div class="rqcp__code"><input type="text" id="rqCpCode" placeholder="플랫폼 프로모션 코드 직접 입력" /><button type="button" class="btn btn--soft btn--sm" id="rqCpApply">적용</button></div>
    <p class="rqcp__msg" id="rqCpMsg"></p>`;
  $("#rqCpSel").addEventListener("change", () => { const v = $("#rqCpSel").value; applyVenueCoupon(v ? v.split(":")[1] : "", "select"); });
  $("#rqCpApply").addEventListener("click", () => applyVenueCoupon($("#rqCpCode").value, "code"));
}
function applyVenueCoupon(code, src) {
  const msg = $("#rqCpMsg"); if (!msg) return;
  if (!code) { venueCoupon = null; msg.textContent = ""; msg.className = "rqcp__msg"; buildReview(); return; }
  const r = window.COUPON.validate(venue.id, code, venueCtx());
  if (r.ok) { venueCoupon = { code: code.trim(), off: r.off, label: r.label, source: r.source }; msg.textContent = `✓ ${r.label} 적용 · ${won(r.off)}원 할인`; msg.className = "rqcp__msg ok"; }
  else { venueCoupon = null; msg.textContent = r.msg; msg.className = "rqcp__msg no"; if (src === "select" && $("#rqCpSel")) $("#rqCpSel").value = ""; }
  buildReview();
}

let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2400); }

$("#reqForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("#rqErr");
  const date = $("#rqDate").value, region = $("#rqRegion").value;
  const capacity = +$("#rqCap").value, parking = +$("#rqPark").value || 0;
  const wantSpace = $("#rqSpace").checked;
  const phone = $("#rqPhone").value.trim();
  const start = +$("#rqStart").value, end = +$("#rqEnd").value;
  const svcCats = [...document.querySelectorAll("#rqSvc input:checked")].map((i) => i.value);
  const cats = (wantSpace ? ["space"] : []).concat(svcCats);
  const budgetFlex = $("#rqBudgetFlex").checked;
  const budgetVal = budgetFlex ? 0 : (+$("#rqBudget").value || 0);
  // 카테고리별 체크 품목 + 요청사항·첨부 수집 (선택한 항목만)
  const catNotes = {}, catFiles = {}, catItems = {}, catFree = {};
  cats.forEach((c) => {
    const st = catState[c]; if (!st) return;
    const items = st.items ? Object.keys(st.items).filter((k) => st.items[k]) : [];
    const note = (st.note || "").trim();
    if (items.length) catItems[c] = items;
    if (note) catFree[c] = note;
    const combined = [items.length ? "✔ 필요 품목: " + items.join(", ") : "", note].filter(Boolean).join("\n");
    if (combined) catNotes[c] = combined;
    if (st.files && st.files.length) catFiles[c] = st.files;
  });

  if (auth && auth.role !== "guest") { err.textContent = "견적 요청·예약은 일반 회원만 가능해요. 회원 계정으로 이용해 주세요."; err.hidden = false; return; }
  if (!date || !region || !capacity) { err.textContent = "날짜·지역·인원을 입력해 주세요."; err.hidden = false; return; }
  if (!phone) { err.textContent = "연락받을 휴대폰 번호를 입력해 주세요."; err.hidden = false; return; }
  const rqc = $("#rqConsent");
  if (rqc && !rqc.checked) { $("#rqConsentWrap").classList.add("co-consent--err"); err.textContent = "개인정보 제3자 제공 동의가 필요해요."; err.hidden = false; return; }
  if (window.CONSENT && auth) window.CONSENT.record(auth.userId, "3rdparty:request", venue ? ("공간 " + venue.name) : cats.join(","));
  if (!venue && !cats.length) { err.textContent = "공간 대관 또는 부대 서비스를 하나 이상 선택해 주세요."; err.hidden = false; return; }
  if (wantSpace && end <= start) { err.textContent = "이용 종료 시간을 시작 이후로 선택해 주세요."; err.hidden = false; return; }
  err.hidden = true;

  // ── 공간 예약 진행 모드: 공간 예약 생성 + (선택 시)부대서비스 견적요청 ──
  if (venue) {
    const slot = venue._slot;
    const bkStart = +$("#rqStart").value, bkEnd = +$("#rqEnd").value;
    const bkHours = Math.max(1, bkEnd - bkStart);
    const fp = window.priceOf ? window.priceOf(venue) : { price: venue.price };
    const unit = fp.price, subtotal = unit * bkHours;
    // 쿠폰 재검증 후 할인 적용 (공간 매핑·최소조건·기간)
    let cpOff = 0, cpLabel = "", cpBearer = "";
    if (venueCoupon && window.COUPON) { const cr = window.COUPON.validate(venue.id, venueCoupon.code, { hours: bkHours, amount: subtotal }); if (cr.ok) { cpOff = cr.off; cpLabel = venueCoupon.code + " · " + cr.label; cpBearer = (cr.source === "platform" && cr.coupon) ? (cr.coupon.bearer || "platform") : "provider"; if (cr.source === "platform" && cr.coupon && window.PCOUPONS) window.PCOUPONS.redeem(cr.coupon.id); } }
    const total = Math.round((subtotal - cpOff) * (1 + (window.CUSTOMER_FEE || 0))); // 반짝할인가 - 쿠폰 (회원 서비스료 0%)
    const hostId = venue.ownerId || "host";
    const set = window.SETTINGS ? window.SETTINGS.get(venue.id) : {};
    const auto = !!set.autoAccept;
    const bid = window.uid("b");
    window.BOOKINGS.add({ id: bid, spaceId: venue.id, spaceName: venue.name, hostId, guestId: auth.userId, guestName: window.AUTH.displayName(auth), guestPhone: phone, detail: $("#rqDetail").value.trim(), price: unit, date: slot.date, start: bkStart, hours: bkHours, guests: capacity, total, coupon: cpLabel, couponOff: cpOff, couponBearer: cpBearer, couponScope: "space", status: auto ? "confirmed" : "requested", paid: false, ts: Date.now() });
    window.NOTIF.add({ forUser: hostId, title: venue.name, sub: (auto ? "새 예약(자동수락)" : "새 예약 요청") + ` · ${slot.date}`, link: "mypage.html?tab=reqs" });
    // 자동 수락 시: 호스트가 미리 적어둔 이용 안내를 채팅(메신저)+알림으로 게스트에게 전달
    if (auto && set.autoMsg) {
      const hostNick = (window.AUTH.users().find((u) => u.userId === hostId) || {}).nick || "호스트";
      if (window.CHAT) window.CHAT.send(bid, { from: hostId, name: hostNick, text: set.autoMsg });
      window.NOTIF.add({ forUser: auth.userId, title: `${venue.name} · 이용 안내`, sub: set.autoMsg, link: "mypage.html?chat=" + bid });
    }
    if (venue.deposit && venue.deposit.amount) window.NOTIF.add({ forUser: auth.userId, title: "청소 보증금 입금 안내", sub: `${won(venue.deposit.amount)}원 · ${venue.deposit.bank || ""} ${venue.deposit.account || ""} (호스트 계좌)`, link: "mypage.html" });
    if (svcCats.length) {
      const deadline = calcDeadline(date);
      window.REQUESTS.add(Object.assign({ memberId: auth.userId, memberName: window.AUTH.displayName(auth), memberPhone: phone }, { date, region, capacity, parking, cats: svcCats, deadline, budget: budgetVal, budgetFlex, refFiles: refFiles.slice(), detail: $("#rqDetail").value.trim(), catNotes, catFiles, catItems, catFree, venueSpaceId: venue.id, venueName: venue.name, start: +$("#rqStart").value, end: +$("#rqEnd").value }));
      const vendors = window.AUTH.users().filter((u) => u.role === "vendor" && (u.serviceCats || []).some((c) => svcCats.includes(c)));
      const catLabels = svcCats.map((c) => reqCatById(c).label).join("·");
      vendors.forEach((v) => window.NOTIF.add({ forUser: v.userId, title: "새 견적 요청", sub: `${region} · ${date} · ${catLabels}`, link: "mypage.html?tab=vreq" }));
      toast((auto ? "예약 확정! " : "예약 요청 완료! ") + `부대서비스 ${svcCats.length}종 견적도 요청했어요`);
    } else { toast(auto ? "예약이 바로 확정되었어요!" : "예약을 요청했어요! 호스트 확인을 기다려 주세요"); }
    setTimeout(() => (location.href = "mypage.html"), 1200);
    return;
  }

  const deadline = calcDeadline(date); // 선정·결제 마감 = 이용일 3일 전(임박 시 당일)
  const fields = { date, region, capacity, parking, cats, deadline, budget: budgetVal, budgetFlex, refFiles: refFiles.slice(), detail: $("#rqDetail").value.trim(), catNotes, catFiles, catItems, catFree, memberPhone: phone };
  if (wantSpace) { fields.start = start; fields.end = end; fields.spaceType = $("#rqSpaceType").value; }
  const catLabels = cats.map((c) => reqCatById(c).label).join("·");

  // 대상: 부대서비스 → 해당 파트너 / 공간 → 모든 호스트
  const vendors = window.AUTH.users().filter((u) => u.role === "vendor" && (u.serviceCats || []).some((c) => svcCats.includes(c)));
  const hosts = wantSpace ? window.AUTH.users().filter((u) => u.role === "host") : [];
  const notify = (title) => {
    vendors.forEach((v) => window.NOTIF.add({ forUser: v.userId, title, sub: `${region} · ${date} · ${catLabels}`, link: "mypage.html?tab=vreq" }));
    hosts.forEach((h) => window.NOTIF.add({ forUser: h.userId, title, sub: `${region} · ${date} · 공간 대관`, link: "mypage.html?tab=hreq" }));
  };

  if (editReq) {
    window.REQUESTS.update(editReq.id, fields);
    notify("견적 요청이 수정됐어요");
    toast("견적 요청을 수정했어요");
  } else {
    window.REQUESTS.add(Object.assign({ memberId: auth.userId, memberName: window.AUTH.displayName(auth) }, fields));
    notify("새 견적 요청");
    toast(`견적 요청 완료! ${vendors.length + hosts.length}곳(호스트·파트너)에 전달됐어요`);
  }
  setTimeout(() => (location.href = "mypage.html?tab=rfp"), 1100);
});

if (typeof checkStep1 === "function") checkStep1(); // 편집·예약모드 프리필 반영

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
