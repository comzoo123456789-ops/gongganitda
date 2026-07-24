// ============================================================
// 공간잇다 — 검색 결과 (필터 · 정렬)
// ============================================================
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const won = (n) => n.toLocaleString("ko-KR");
const params = new URLSearchParams(location.search);
let tagFilter = params.get("tag") || "";
let view = "list";
let kw = (params.get("q") || "").trim();

const AMENITIES = ["주차", "와이파이", "빔프로젝터", "취사", "음향", "방음", "화이트보드", "조명"];
const cmpSel = new Set(); // 비교 담은 공간 id
const CMP_MAX = 4;
const pad = (n) => String(n).padStart(2, "0");
let _toastT; function toast(m) { const t = document.getElementById("toast"); if (!t) return; t.textContent = m; t.hidden = false; clearTimeout(_toastT); _toastT = setTimeout(() => (t.hidden = true), 2400); }

// ---------- 필터 UI 채우기 ----------
$("#fRegion").innerHTML = `<option value="">전국</option>` + REGIONS.map((r) => `<option value="${r}">${r}</option>`).join("");
$("#fType").innerHTML =
  `<label class="filt__chk"><input type="radio" name="type" value="" checked />전체</label>` +
  CATEGORIES.map((c) => `<label class="filt__chk"><input type="radio" name="type" value="${c.id}" />${c.label}</label>`).join("");
$("#fAmen").innerHTML = AMENITIES.map((a) => `<label class="filt__chk"><input type="checkbox" name="amen" value="${a}" />${a}</label>`).join("");

// 홈에서 넘어온 조건 prefill
if (params.get("region")) $("#fRegion").value = params.get("region");
if (params.get("type")) { const r = $(`input[name="type"][value="${params.get("type")}"]`); if (r) r.checked = true; }
if (params.get("cap")) {
  const c = +params.get("cap");
  const opt = [...$("#fCap").options].reverse().find((o) => c >= +o.value && +o.value > 0);
  if (opt) $("#fCap").value = opt.value;
}

// ---------- 카드 ----------
function tagRow(s) {
  const chips = [];
  const hasPkg = s.timePkg && s.timePkg.length;
  if (hasPkg) chips.push(`<span class="optag optag--pkg">⏱ 패키지요금</span>`);
  (s.optTags || []).slice(0, hasPkg ? 2 : 3).forEach((t) => chips.push(`<span class="optag">#${t}</span>`));
  if (!chips.length) chips.push(`<span class="optag optag--ghost">${iconSVG("spark", 12)} 신규 공간 · 첫 후기를 남겨보세요</span>`);
  return `<div class="sp-tags sp-tags--row">${chips.join("")}</div>`;
}
// #1b: 이 공간이 포함된 올인원 패키지 중 절약률이 가장 큰 것
function pkgDealFor(s) {
  if (typeof PACKAGES === "undefined") return null;
  const cands = PACKAGES.filter((p) => (p.spaceOptions || []).map(String).includes(String(s.id)) && p.list && p.price && p.price < p.list);
  if (!cands.length) return null;
  return cands.map((p) => ({ p: p, off: Math.round((p.list - p.price) / p.list * 100) })).sort((a, b) => b.off - a.off)[0];
}
function cardHTML(s) {
  const c = catById(s.cat);
  const g = s.g || [c.ink, "#cfc7b8"];
  const img = spaceImg(s, 640, 480);
  const pr = window.priceOf(s);
  const deal = pkgDealFor(s);
  const nowBadge = s.now ? `<span class="sp-card__badge sp-card__badge--now"><i></i>바로예약</span>` : "";
  return `<article class="sp-card" data-id="${s.id}">
    <div class="sp-card__thumb" style="background:linear-gradient(135deg,${g[0]},${g[1]})">
      <span class="sp-ph"><span class="sp-ph__mark"><i class="sp-ph__dot"></i>공간잇다</span></span>
      ${img ? `<img src="${img}" alt="${s.name}" loading="lazy" onerror="this.remove()" />` : ""}
      ${nowBadge}
      ${pr.pct ? `<span class="sp-card__flash">${iconSVG("bolt", 12)}${pr.pct}%</span>` : ""}
      <button class="sp-card__heart ${window.FAV.has(s.id) ? "is-on" : ""}" data-heart="${s.id}" aria-label="찜">${iconSVG("heart", 18)}</button>
      <button type="button" class="sp-cmp${cmpSel.has(s.id) ? " is-on" : ""}" data-cmp="${s.id}">${cmpSel.has(s.id) ? "✓ 비교중" : "＋ 비교"}</button>
    </div>
    <div class="sp-card__body">
      <span class="sp-card__cat">${c.label}</span>
      <h3 class="sp-card__name">${s.name}</h3>
      <div class="sp-card__meta">
        <span class="sp-card__loc">${iconSVG("pin", 14)}<span class="sp-card__loctxt">${regionShort(s.region)}</span></span>
        <span class="sp-card__cap">${iconSVG("users", 14)}~${s.capacity}인</span>
      </div>
      ${tagRow(s)}
      ${deal ? `<a class="sp-card__pkg" href="packages.html#${deal.p.id}" onclick="event.stopPropagation()"><span class="sp-card__pkg__l">📦 올인원 패키지</span><span class="sp-card__pkg__p"><s>${won(deal.p.list)}</s> ${won(deal.p.price)}원 <em>${deal.off}%↓</em></span></a>` : ""}
      <div class="sp-card__foot">
        <span class="sp-card__price">${pr.pct ? `<span class="sp-old">${won(pr.orig)}</span> ` : ""}${won(pr.price)}<span>원 / 시간</span></span>
        <span class="sp-card__rating">${iconSVG("star", 14)}${s.rating || "신규"}${s.reviews ? `<em>(${s.reviews})</em>` : ""}</span>
      </div>
    </div>
  </article>`;
}

// ---------- 필터 적용 ----------
function apply() {
  const region = $("#fRegion").value.trim();
  const type = ($('input[name="type"]:checked') || {}).value || "";
  const cap = +$("#fCap").value;
  const now = $("#fNow").checked;
  const pkgOnly = $("#fPkg") && $("#fPkg").checked;
  const priceRanges = [...$$('input[name="price"]:checked')].map((i) => i.value.split("-").map(Number));
  const amens = [...$$('input[name="amen"]:checked')].map((i) => i.value);

  const kwL = kw.toLowerCase();
  const matchKw = (s) => {
    if (!kwL) return true;
    const hay = [s.name, regionShort(s.region), s.region, (catById(s.cat) || {}).label, (s.optTags || []).join(" "), (s.tags || []).join(" "), (s.timePkg || []).map((t) => t.label).join(" ")].join(" ").toLowerCase();
    return kwL.split(/\s+/).every((w) => hay.includes(w));
  };
  let list = getAllSpaces().filter((s) => {
    if (s.blinded || s.rejected || s.hidden) return false;
    if (!matchKw(s)) return false;
    if (pkgOnly && !(s.timePkg && s.timePkg.length)) return false;
    if (tagFilter && !((s.optTags || []).some((t) => t === tagFilter || t.includes(tagFilter)) || (s.tags || []).some((t) => t.includes(tagFilter)))) return false;
    if (region && !s.region.includes(region)) return false;
    if (type && s.cat !== type) return false;
    if (cap && s.capacity < cap) return false;
    if (now && !s.now) return false;
    if (priceRanges.length && !priceRanges.some(([lo, hi]) => s.price >= lo && s.price <= hi)) return false;
    if (amens.length && !amens.every((a) => (s.tags || []).some((t) => t.includes(a)))) return false;
    if (purposeF.length) { const hay = purposeHay(s); if (!purposeF.some((re) => new RegExp(re).test(hay))) return false; }
    if (svcF.length) { const hay = spaceSvcHay(s); if (!svcF.every((re) => new RegExp(re).test(hay))) return false; }
    return true;
  });

  const sort = $("#sort").value;
  list.sort((a, b) => {
    if (sort === "priceLow") return a.price - b.price;
    if (sort === "priceHigh") return b.price - a.price;
    if (sort === "rating") return (b.rating || 0) - (a.rating || 0);
    if (sort === "reviews") return (b.reviews || 0) - (a.reviews || 0);
    return (b.now - a.now) || (b.rating || 0) - (a.rating || 0); // 추천
  });

  lastList = list;
  $("#srchCount").innerHTML = `${tagFilter ? `<a class="srch-tag" data-tagclear>#${tagFilter} <span>✕</span></a> ` : ""}<b>${list.length}</b>개 공간`;
  $("#results").innerHTML = list.map(cardHTML).join("");
  $("#srchEmpty").hidden = list.length > 0 || view === "map";
  $("#results").style.display = (list.length && view === "list") ? "" : "none";
  // 컨트롤 상태 동기화
  const nowT = $("#fNowTop"); if (nowT) { nowT.classList.toggle("is-on", now); nowT.setAttribute("aria-pressed", now ? "true" : "false"); }
  renderTagChips();
  renderSmartBar();
  if (view === "map") renderMap(list);
}
// #1a: 스마트 필터 바 렌더 + 이벤트
function renderSmartBar() {
  const box = $("#smartbar"); if (!box) return;
  const grp = (title, arr, sel, key) => `<div class="smartbar__g"><span class="smartbar__t">${title}</span><div class="smartbar__chips">${arr.map(([label, re]) => `<button type="button" class="smartchip${sel.includes(re) ? " is-on" : ""}" data-sf="${key}" data-re="${re.replace(/"/g, "&quot;")}">${label}</button>`).join("")}</div></div>`;
  const active = purposeF.length + svcF.length;
  box.innerHTML = grp("🎯 행사 목적", PURPOSES, purposeF, "p") + grp("🧩 필요 서비스", SVCS, svcF, "s") + (active ? `<button type="button" class="smartbar__reset" data-sfreset>초기화 (${active})</button>` : "");
}
$("#smartbar") && $("#smartbar").addEventListener("click", (e) => {
  if (e.target.closest("[data-sfreset]")) { purposeF = []; svcF = []; apply(); return; }
  const b = e.target.closest("[data-sf]"); if (!b) return;
  const re = b.dataset.re, arr = b.dataset.sf === "p" ? purposeF : svcF;
  const i = arr.indexOf(re); if (i >= 0) arr.splice(i, 1); else arr.push(re);
  apply();
});
let lastList = [];

// ---------- 키워드 검색 ----------
const kwInput = $("#fKeyword"), kwClear = $("#kwClear");
if (kwInput) {
  if (kw) kwInput.value = kw;
  const syncKw = () => { kw = kwInput.value.trim(); if (kwClear) kwClear.hidden = !kw; apply(); };
  kwInput.addEventListener("input", syncKw);
  const kwForm = $("#kwForm"); if (kwForm) kwForm.addEventListener("submit", (e) => { e.preventDefault(); syncKw(); if (kw) { RKW.add(kw); renderTagChips(); } });
  if (kwClear) { kwClear.hidden = !kw; kwClear.addEventListener("click", () => { kwInput.value = ""; kw = ""; kwClear.hidden = true; apply(); kwInput.focus(); }); }
}

// ---------- 즉시예약 상단 토글 ----------
const fNowTop = $("#fNowTop");
if (fNowTop) fNowTop.addEventListener("click", () => { $("#fNow").checked = !$("#fNow").checked; apply(); });

// ---------- 최근 검색어 ----------
const RKW = {
  KEY: "gi_recentkw",
  list() { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  add(q) { q = (q || "").trim(); if (!q) return; let l = this.list().filter((x) => x !== q); l.unshift(q); localStorage.setItem(this.KEY, JSON.stringify(l.slice(0, 8))); },
  remove(q) { localStorage.setItem(this.KEY, JSON.stringify(this.list().filter((x) => x !== q))); },
  clear() { localStorage.removeItem(this.KEY); },
};
const _eq = (s) => String(s).replace(/"/g, "&quot;");

// ---------- 태그 칩 (최근 검색어 + 원클릭 필터) ----------
const QUICK_TAGS = ["루프탑", "올나잇", "심야", "취사가능", "포토존", "주차", "방음", "반려동물", "노래방", "24시간"];
// #1a: 통합 스마트 필터 — 행사 목적 + 필요 부대서비스
const PURPOSES = [["브라이덜샤워", "브라이덜|샤워|웨딩|파티룸"], ["기업행사", "기업|세미나|회의|컨퍼런스|워크샵|오피스"], ["파티·모임", "파티|생일|모임|라운지"], ["촬영·스튜디오", "촬영|스튜디오|호리즌|스냅"], ["전시·팝업", "전시|갤러리|팝업"], ["소규모 강의", "강의|클래스|공방"]];
const SVCS = [["케이터링", "케이터링|다과|디저트|음료|뷔페|도시락"], ["장비 렌탈", "장비|렌탈|음향|빔프로젝터|프로젝터|마이크|조명|카메라"], ["데코·연출", "데코|연출|풍선|포토존|사인물|플라워"], ["촬영", "촬영|스냅|영상|사진"]];
let purposeF = [], svcF = [];
// 공간이 포함된 패키지의 구성(부대서비스) 텍스트
function spaceSvcHay(s) {
  if (typeof PACKAGES === "undefined") return "";
  let out = [];
  PACKAGES.forEach((p) => { if ((p.spaceOptions || []).map(String).includes(String(s.id))) (p.items || []).forEach((it) => out.push(it.label)); });
  return out.join(" ") + " " + (s.optTags || []).join(" ") + " " + (s.tags || []).join(" ");
}
function purposeHay(s) { return [s.name, (catById(s.cat) || {}).label, (s.optTags || []).join(" "), (s.tags || []).join(" ")].join(" "); }
function renderTagChips() {
  const box = $("#qtags"); if (!box) return;
  const rec = RKW.list();
  const parts = [];
  if (rec.length) {
    parts.push(`<span class="qtag-lbl">${iconSVG("clock", 12)} 최근 검색</span>`);
    rec.forEach((q) => parts.push(`<button type="button" class="qtag qtag--recent" data-rkw="${_eq(q)}">${q}<i class="qtag__x" data-rkwdel="${_eq(q)}" aria-label="삭제">✕</i></button>`));
    parts.push(`<button type="button" class="qtag qtag--clear" data-rkwclear>지우기</button>`);
    parts.push(`<span class="qtag-sep" aria-hidden="true"></span>`);
  }
  QUICK_TAGS.forEach((t) => parts.push(`<button type="button" class="qtag${tagFilter === t ? " is-on" : ""}" data-qtag="${t}">#${t}</button>`));
  box.innerHTML = parts.join("");
}
$("#qtags") && $("#qtags").addEventListener("click", (e) => {
  const del = e.target.closest("[data-rkwdel]");
  if (del) { e.stopPropagation(); RKW.remove(del.dataset.rkwdel); renderTagChips(); return; }
  if (e.target.closest("[data-rkwclear]")) { RKW.clear(); renderTagChips(); return; }
  const rk = e.target.closest("[data-rkw]");
  if (rk) { const q = rk.dataset.rkw; if (kwInput) kwInput.value = q; kw = q; if (kwClear) kwClear.hidden = false; RKW.add(q); renderTagChips(); apply(); return; }
  const b = e.target.closest("[data-qtag]"); if (!b) return;
  tagFilter = (tagFilter === b.dataset.qtag) ? "" : b.dataset.qtag;
  if (tagFilter && window.STATLOG) window.STATLOG.tag(tagFilter);
  apply();
});
if (tagFilter && window.STATLOG) window.STATLOG.tag(tagFilter); // 상세→태그 링크 유입 집계

// ---------- 이벤트 ----------
document.addEventListener("change", (e) => { if (e.target.closest(".filters, #fType, #sort")) apply(); });
$("#fRegion").addEventListener("input", apply);

function reset() {
  $("#fRegion").value = "";
  $('input[name="type"][value=""]').checked = true;
  $("#fCap").value = "0";
  $("#fNow").checked = false;
  if ($("#fPkg")) $("#fPkg").checked = false;
  tagFilter = ""; kw = ""; if ($("#fKeyword")) $("#fKeyword").value = ""; if ($("#kwClear")) $("#kwClear").hidden = true;
  $$('input[name="price"], input[name="amen"]').forEach((i) => (i.checked = false));
  apply();
}
$("#fReset").addEventListener("click", reset);
$("#fReset2") && $("#fReset2").addEventListener("click", reset);
document.addEventListener("click", (e) => { if (e.target.closest("[data-tagclear]")) { e.preventDefault(); tagFilter = ""; apply(); } });

document.addEventListener("click", (e) => {
  const heart = e.target.closest("[data-heart]");
  if (heart) { e.stopPropagation(); heart.classList.toggle("is-on", window.FAV.toggle(heart.dataset.heart)); return; }
  const cmp = e.target.closest("[data-cmp]");
  if (cmp) { e.stopPropagation(); toggleCmp(+cmp.dataset.cmp, cmp); return; }
  const card = e.target.closest(".sp-card");
  if (card && card.dataset.id) location.href = "space.html?id=" + card.dataset.id;
});

// ---------- 비교견적 ----------
function toggleCmp(id, btn) {
  if (cmpSel.has(id)) cmpSel.delete(id);
  else { if (cmpSel.size >= CMP_MAX) { toast(`비교는 최대 ${CMP_MAX}곳까지 가능해요`); return; } cmpSel.add(id); }
  if (btn) { const on = cmpSel.has(id); btn.classList.toggle("is-on", on); btn.textContent = on ? "✓ 비교중" : "＋ 비교"; }
  renderCmpBar();
}
function renderCmpBar() {
  let bar = document.getElementById("cmpBar");
  if (!cmpSel.size) { if (bar) bar.remove(); return; }
  if (!bar) {
    bar = document.createElement("div"); bar.id = "cmpBar"; bar.className = "cmpbar";
    document.body.appendChild(bar);
    bar.addEventListener("click", (e) => {
      if (e.target.closest("[data-cmpgo]")) openCmpModal();
      else if (e.target.closest("[data-cmpclear]")) { cmpSel.clear(); renderCmpBar(); apply(); }
    });
  }
  bar.innerHTML = `<span class="cmpbar__n">${cmpSel.size}곳 선택</span><div class="cmpbar__b"><button type="button" class="btn btn--soft btn--sm" data-cmpclear>초기화</button><button type="button" class="btn btn--accent btn--sm" data-cmpgo>비교견적 보기 →</button></div>`;
}
function cmpModalEl() {
  let m = document.getElementById("cmpModal");
  if (!m) {
    m = document.createElement("div"); m.id = "cmpModal"; m.className = "modal"; m.hidden = true;
    m.innerHTML = `<div class="modal__backdrop" data-cmpx></div><div class="modal__card modal__card--wide" id="cmpCard"></div>`;
    document.body.appendChild(m);
    m.addEventListener("click", (e) => { if (e.target.closest("[data-cmpx]")) m.hidden = true; });
  }
  return m;
}
let cmpDate = "", cmpStart = 18, cmpHours = 3;
function openCmpModal() {
  const m = cmpModalEl(); m.hidden = false;
  if (!cmpDate) cmpDate = ($("#fDate") && $("#fDate").value) || new Date().toISOString().slice(0, 10);
  drawCmp();
}
function drawCmp() {
  const all = getPublicSpaces();
  const rows = [...cmpSel].map((id) => all.find((s) => s.id === id)).filter(Boolean);
  const calc = rows.map((s) => { const pr = window.priceOf(s); const total = Math.round(pr.price * cmpHours * (1 + (window.CUSTOMER_FEE || 0))); return { s, pr, total }; });
  const totals = calc.map((x) => x.total);
  const min = totals.length ? Math.min(...totals) : 0;
  const max = totals.length ? Math.max(...totals) : 0;
  const cheapest = calc.find((x) => x.total === min);
  const caps = rows.map((s) => +s.capacity || 0).filter(Boolean);
  const spTags = (s) => { const tg = ((s.optTags && s.optTags.length ? s.optTags : (s.tags || [])) || []).slice(0, 4); return tg.length ? `<span class="cmp-tags">${tg.map((t) => `<em>#${t}</em>`).join("")}</span>` : ""; };
  const summary = calc.length > 1
    ? `<div class="cmp-summary"><span class="cmp-summary__ic">${iconSVG("light", 16)}</span><p><b>${cheapest.s.name}</b>이(가) 가장 저렴해요${max > min ? ` — 최고가 대비 <b>${won(max - min)}원</b> 절약` : ""}.<span class="cmp-summary__sub">${cmpHours}시간 기준 총액 ${won(min)}~${won(max)}원${caps.length ? ` · 수용 ${Math.min(...caps)}~${Math.max(...caps)}인` : ""} · ${rows.length}곳 비교</span></p></div>`
    : "";
  const opts = [];
  for (let h = 8; h <= 23; h++) opts.push(`<option value="${h}"${h === cmpStart ? " selected" : ""}>${pad(h)}:00</option>`);
  const hopts = [1, 2, 3, 4, 5, 6, 8, 10, 12].map((h) => `<option value="${h}"${h === cmpHours ? " selected" : ""}>${h}시간</option>`).join("");
  const card = document.getElementById("cmpCard");
  card.innerHTML = `
    <div class="modal__head"><b>${iconSVG("chart", 16)} 비교견적 · ${rows.length}곳</b><button class="modal__x" data-cmpx>✕</button></div>
    <p class="modal__sub">같은 날짜·시간 기준으로 총 결제금액(서비스 이용료 5% 포함)을 비교해요.</p>
    <div class="cmp-controls">
      <label class="cmp-ctl"><span>날짜</span><input type="date" id="cmpDate" value="${cmpDate}" min="${new Date().toISOString().slice(0, 10)}" /></label>
      <label class="cmp-ctl"><span>시작</span><select id="cmpStart">${opts.join("")}</select></label>
      <label class="cmp-ctl"><span>이용</span><select id="cmpHours">${hopts}</select></label>
    </div>
    ${summary}
    <div class="cmp-table">
      <div class="cmp-row cmp-row--h"><span>공간 · 준비 물품</span><span>시간당</span><span>${cmpHours}시간 총액</span><span></span></div>
      ${calc.sort((a, b) => a.total - b.total).map((x) => {
        const blocked = window.BLOCKS && window.BLOCKS.has(x.s.id, cmpDate);
        return `<div class="cmp-row${x.total === min ? " is-min" : ""}">
          <span class="cmp-nm">${x.total === min ? `<em class="cmp-best">최저가</em>` : ""}${x.s.name}<small>${(catById(x.s.cat) || {}).label} · ${regionShort(x.s.region)} · ~${x.s.capacity}인</small>${spTags(x.s)}</span>
          <span class="cmp-unit">${x.pr.pct ? `<i>${iconSVG("bolt", 11)}${x.pr.pct}%</i>` : ""}${won(x.pr.price)}원</span>
          <span class="cmp-tot"><b>${won(x.total)}원</b></span>
          <span class="cmp-act">${blocked ? `<em class="cmp-x">예약불가</em>` : `<a class="btn btn--accent btn--sm" href="request.html?space=${x.s.id}&date=${cmpDate}&start=${cmpStart}&hours=${cmpHours}">예약 →</a>`}</span>
        </div>`;
      }).join("")}
    </div>
    <p class="cmp-note">· 총액 = 시간당 요금 × 이용시간 + 서비스 이용료 5%. 실제 결제는 각 공간 상세에서 진행됩니다.${calc.some((x) => window.BLOCKS && window.BLOCKS.has(x.s.id, cmpDate)) ? "<br />· ‘예약불가’는 해당 날짜가 마감된 공간이에요." : ""}</p>`;
  card.querySelector("#cmpDate").addEventListener("change", (e) => { cmpDate = e.target.value; drawCmp(); });
  card.querySelector("#cmpStart").addEventListener("change", (e) => { cmpStart = +e.target.value; drawCmp(); });
  card.querySelector("#cmpHours").addEventListener("change", (e) => { cmpHours = +e.target.value; drawCmp(); });
}

// ---------- 목록 / 지도 뷰 토글 ----------
const vt = $("#viewToggle");
if (vt) vt.addEventListener("click", (e) => {
  const b = e.target.closest("[data-view]"); if (!b) return;
  view = b.dataset.view;
  vt.querySelectorAll(".viewtoggle__b").forEach((x) => x.classList.toggle("is-active", x === b));
  $("#srchMap").hidden = view !== "map";
  $("#results").style.display = (view === "list" && lastList.length) ? "" : "none";
  apply();
});

// 지도 렌더 (네이버 동적지도 + 폴백)
let smap = null, smapReady = false, smapLoading = false, smarkers = [];
function renderMap(list) {
  const key = window.NAVER_MAP_KEY;
  if (!key) { mapFallback(list); return; }
  if (!smapReady) {
    if (!smapLoading) {
      smapLoading = true;
      loadSmap(list);
    }
    return;
  }
  drawMarkers(list);
}
const SMAP_PARAMS = ["ncpKeyId", "ncpClientId"]; let smapAttempt = 0, smapSettled = false;
function loadSmap(list) {
  if (smapSettled) return;
  document.querySelectorAll("script[data-navmap]").forEach((s) => s.remove()); try { delete window.naver; } catch (e) { window.naver = undefined; }
  if (smapAttempt >= SMAP_PARAMS.length) { smapSettled = true; mapFallback(list); return; }
  const param = SMAP_PARAMS[smapAttempt++];
  const sc = document.createElement("script");
  sc.dataset.navmap = "1";
  sc.src = `https://oapi.map.naver.com/openapi/v3/maps.js?${param}=${encodeURIComponent(window.NAVER_MAP_KEY)}`;
  sc.onload = () => setTimeout(() => { if (smapSettled) return; if (window.naver && naver.maps) { smapSettled = true; smapReady = true; initSmap(list); } }, 400);
  sc.onerror = () => loadSmap(list);
  document.head.appendChild(sc);
}
window.navermap_authFailure = function () { if (!smapSettled) loadSmap(lastList); };
function initSmap(list) {
  $("#srchMapFb").hidden = true; $("#srchMapCanvas").style.display = "";
  smap = new naver.maps.Map("srchMapCanvas", { center: new naver.maps.LatLng(37.53, 126.99), zoom: 11 });
  drawMarkers(list);
}
function drawMarkers(list) {
  if (!smap) return;
  smarkers.forEach((m) => m.setMap(null)); smarkers = [];
  const bounds = new naver.maps.LatLngBounds(); let any = false;
  list.filter((s) => s.lat && s.lng).forEach((s) => {
    const pr = window.priceOf(s);
    const mk = new naver.maps.Marker({ position: new naver.maps.LatLng(s.lat, s.lng), map: smap, icon: { content: `<a href="space.html?id=${s.id}" class="smap-pin${s.now ? " smap-pin--now" : ""}">${won(pr.price)}</a>`, anchor: new naver.maps.Point(30, 14) } });
    smarkers.push(mk); bounds.extend(new naver.maps.LatLng(s.lat, s.lng)); any = true;
  });
  if (any) smap.fitBounds(bounds);
}
function mapFallback(list) {
  $("#srchMapCanvas").style.display = "none";
  const fb = $("#srchMapFb"); fb.hidden = false;
  fb.innerHTML = `<p class="srch-map__note">${iconSVG("map", 14)} 지도 키가 설정되지 않아 목록으로 표시해요. 핀을 누르면 네이버 지도가 열립니다.</p>` +
    (list.length ? list.map((s) => { const pr = window.priceOf(s); return `<div class="mapf-item"><div class="mapf-item__main" onclick="location.href='space.html?id=${s.id}'"><b>${s.name}</b><span>${regionShort(s.region)} · ${won(pr.price)}원/시간${s.now ? ` · ${iconSVG("bolt", 11)}즉시예약` : ""}</span></div><a class="mapf-item__pin" href="${naverMapUrl(s.addr || s.region)}" target="_blank" rel="noopener">${iconSVG("pin", 16)}</a></div>`; }).join("") : `<p class="mp-empty">조건에 맞는 공간이 없어요.</p>`);
}

// 상세 필터 토글
$("#fMobile").addEventListener("click", () => { const open = $("#filtersBody").classList.toggle("is-open"); $("#fMobile").classList.toggle("is-open", open); });
// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });

if (kw) RKW.add(kw); // URL(?q=)로 진입한 검색어도 최근 검색에 기록
apply();
