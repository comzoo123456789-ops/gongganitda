// ============================================================
// 공간잇다 — 마이페이지 (찜 · 예약내역 · 예약요청 · 내공간 + 취소/변경/채팅)
// ============================================================
const $ = (s) => document.querySelector(s);
const won = (n) => (+n || 0).toLocaleString("ko-KR");
const auth = window.AUTH.get();
if (!auth) { location.href = "login.html"; }
const me = auth ? auth.userId : null;
const myRoles = (auth && (auth.roles && auth.roles.length ? auth.roles : [auth.role])) || [];
const isHost = myRoles.includes("host");
const isVendor = myRoles.includes("vendor");
const collapsedReqs = new Set(); // 접힌 견적요청 카드 id
const expandedCats = new Set(); // 펼친 카테고리 블록 (reqId|cat) — 기본은 접힘(요약)
const collapsedGroups = new Set(); // 접힌 그룹 (reqId|g-space / reqId|g-svc)
// 날짜 유틸 — 아래 IIFE(포인트·쿠폰 박스 등)에서 참조하므로 최상단에서 먼저 선언(TDZ 방지)
const pad = (n) => String(n).padStart(2, "0");
const _t0 = new Date(); _t0.setHours(0, 0, 0, 0);
const todayStr = `${_t0.getFullYear()}-${pad(_t0.getMonth() + 1)}-${pad(_t0.getDate())}`;

$("#mpTitle").textContent = `${window.AUTH.displayName(auth)} 님`;
$("#mpSub").textContent = isVendor ? "파트너 회원 · 들어온 견적 요청에 입찰하세요." : isHost ? "호스트 회원 · 공간을 등록하고 예약을 관리하세요." : "일반 회원 · 예약·견적을 관리하세요.";
// 사업자 승인 상태 배너
(function bizBanner() {
  const u = window.AUTH.users().find((x) => x.userId === me);
  const st = u && u.biz && u.biz.status;
  if (st !== "pending" && st !== "rejected") return;
  const head = document.querySelector(".mp__head"); if (!head) return;
  const b = document.createElement("div");
  b.className = "mp-bizbanner mp-bizbanner--" + st;
  b.innerHTML = st === "pending"
    ? `⏳ <b>사업자 승인 대기 중</b> — 관리자 승인 후 공간 등록·입찰 등 모든 기능이 활성화됩니다.`
    : `⚠️ <b>사업자 가입이 반려되었어요</b> — 서류·정보를 확인 후 다시 신청하거나 관리자에게 문의해 주세요.`;
  head.insertAdjacentElement("afterend", b);
})();
// 회원 포인트·사용 가능한 와일리 쿠폰
(function pointsBox() {
  if (isHost || isVendor) return;
  const head = document.querySelector(".mp__head"); if (!head || !window.POINTS) return;
  const bal = window.POINTS.balance(me);
  const cps = (window.PCOUPONS ? window.PCOUPONS.list() : []).filter((c) => c.active && (!c.expires || c.expires >= todayStr) && (!c.maxUses || (c.used || 0) < c.maxUses));
  if (!bal && !cps.length) return;
  const box = document.createElement("div");
  box.className = "mp-points";
  box.innerHTML = `<span class="mp-points__bal">${iconSVG("won", 15)} 보유 포인트 <b>${won(bal)}P</b></span>${cps.length ? `<button type="button" class="mp-cpbtn" id="mpCpOpen">${iconSVG("ticket", 15)} 보유 쿠폰 <b>${cps.length}장</b> <span class="mp-cpbtn__chev">›</span></button>` : ""}`;
  head.insertAdjacentElement("afterend", box);
  const openBtn = box.querySelector("#mpCpOpen");
  if (openBtn) openBtn.addEventListener("click", () => openCouponModal(cps));
})();
function openCouponModal(cps) {
  const cpLabel = (c) => (c.discType === "amount" ? `${(+c.value).toLocaleString()}원 할인` : `${c.value}% 할인`);
  modal.hidden = false; modalCard.classList.add("modal__card--narrow");
  modalCard.innerHTML = `<div class="modal__head"><b>보유 쿠폰 ${cps.length}장</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="cpm__note">${iconSVG("light", 13)} 쿠폰은 <b>결제 화면</b>에서 선택해 자동 적용돼요. 코드를 따로 입력할 필요 없어요.</p>
    <div class="cpm__list">${cps.map((c) => `<div class="cpm__item"><div class="cpm__disc"><b>${cpLabel(c)}</b><span class="cpm__code">${c.code}</span></div><div class="cpm__cond">${c.minAmount ? `${won(c.minAmount)}원 이상` : "최소금액 없음"}<span>${c.expires ? `~${c.expires}까지` : "기한 없음"}</span></div></div>`).join("")}</div>`;
}
// 탭 클릭 — 어떤 렌더/초기화 오류보다 먼저 바인딩(항상 동작 보장)
document.addEventListener("click", (e) => {
  const b = e.target.closest("#mpTabs .mp-tab"); if (!b) return;
  const t = b.dataset.tab;
  document.querySelectorAll("#mpTabs .mp-tab").forEach((x) => x.classList.toggle("is-active", x === b));
  document.querySelectorAll(".mp-panel").forEach((p) => (p.hidden = p.dataset.panel !== t));
});
try { if (!isHost && !isVendor) { const ms = window.MANNER.scoreOf(me); const sub = $("#mpSub"); if (ms && sub) sub.textContent += ` · 내 매너 점수 ★${ms.toFixed(1)}`; } } catch (e) { }
if (isHost) { document.querySelectorAll(".js-host").forEach((e) => (e.hidden = false)); document.querySelectorAll(".js-mem").forEach((e) => (e.hidden = true)); }
if (isVendor) { document.querySelectorAll(".js-mem").forEach((e) => (e.hidden = true)); document.querySelectorAll(".js-vendor").forEach((e) => (e.hidden = false)); }

const STATUS = {
  requested: { t: "승인 대기", c: "amber" },
  confirmed: { t: "예약 확정", c: "green" },
  declined: { t: "거절됨", c: "gray" },
  cancelled: { t: "취소됨", c: "gray" },
};
const slot = (b) => `${b.date} ${pad(b.start)}:00~${pad(b.start + b.hours)}:00`;
const timeLabel = (b) => b.pkg ? `${b.date} · 패키지 · ${b.guests}` : `${b.date} · ${pad(b.start)}:00~${pad(b.start + b.hours)}:00 · ${b.guests}인`;
const unitOf = (b) => b.price || Math.round(b.total / (b.hours * (1 + (window.CUSTOMER_FEE || 0))));
function daysUntil(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return Math.round((x - _t0) / 86400000); }
function ddayLabel(d) { const n = daysUntil(d); if (n < 0) return ""; return n === 0 ? "오늘" : "D-" + n; }

// ---------- 공간 카드 (찜/내공간) ----------
function cardHTML(s) {
  const c = catById(s.cat);
  const g = s.g || [c.ink, "#cfc7b8"];
  const img = spaceImg(s, 640, 480);
  return `<article class="sp-card" onclick="location.href='space.html?id=${s.id}'">
    <div class="sp-card__thumb" style="background:linear-gradient(135deg,${g[0]},${g[1]})">${img ? `<img src="${img}" alt="${s.name}" loading="lazy" onerror="this.remove()" />` : ""}</div>
    <div class="sp-card__body">
      <span class="sp-card__cat">${c.label}</span><h3 class="sp-card__name">${s.name}</h3>
      <div class="sp-card__meta"><span class="sp-card__loc">${iconSVG("pin", 14)}<span class="sp-card__loctxt">${regionShort(s.region)}</span></span><span class="sp-card__cap">${iconSVG("users", 14)}~${s.capacity}인</span></div>
      <div class="sp-card__foot"><span class="sp-card__price">${won(s.price)}<span>원 / 시간</span></span><span class="sp-card__rating">${iconSVG("star", 14)}${s.rating || "신규"}</span></div>
    </div>
  </article>`;
}

// 찜
const all = getAllSpaces();
const favs = all.filter((s) => window.FAV.list().includes(+s.id));
$("#favGrid").innerHTML = favs.map(cardHTML).join("");
$("#favEmpty").hidden = favs.length > 0;

// 최근 본 공간
(function renderRecent() {
  const grid = $("#recentGrid"); if (!grid) return;
  let ids = []; try { ids = JSON.parse(localStorage.getItem("gi_recent") || "[]"); } catch (e) {}
  const list = ids.map((id) => all.find((s) => String(s.id) === String(id))).filter(Boolean);
  grid.innerHTML = list.map(cardHTML).join("");
  const emp = $("#recentEmpty"); if (emp) emp.hidden = list.length > 0;
})();

// ---------- 예약 카드 (액션 포함) ----------
function actionBtns(b, asHost) {
  const btns = [];
  if (asHost && b.status === "requested") {
    btns.push(`<button class="btn btn--accent btn--sm" data-accept="${b.id}">수락</button>`);
    btns.push(`<button class="btn btn--outline btn--sm" data-decline="${b.id}">거절</button>`);
  }
  if (b.status === "requested" || b.status === "confirmed") {
    const un = window.CHAT.unread(me, b.id);
    btns.push(`<button class="btn btn--soft btn--sm" data-chat="${b.id}">💬 채팅${un ? `<span class="chat-badge">${un}</span>` : ""}</button>`);
    btns.push(`<button class="btn btn--soft btn--sm" data-resched="${b.id}">일정 변경</button>`);
    btns.push(`<button class="btn btn--danger btn--sm" data-cancel="${b.id}">예약 취소</button>`);
  }
  // 게스트 전용: 이용권 / N빵 / 후기
  if (!asHost && b.status === "confirmed") {
    if (daysUntil(b.date) >= 0) {
      btns.push(`<button class="btn btn--soft btn--sm" data-ticket="${b.id}">🎫 이용권</button>`);
      const sp = window.SPLIT.get(b.id);
      btns.push(`<button class="btn btn--soft btn--sm" data-split="${b.id}">🤝 N빵${sp && sp.n ? ` ${sp.paid.filter(Boolean).length}/${sp.n}` : ""}</button>`);
    } else if (reviewedBk(b.id)) btns.push(`<span class="mp-reviewed">${iconSVG("star", 13)} 후기 완료</span>`);
    else btns.push(`<button class="btn btn--accent btn--sm" data-review="${b.id}">후기 쓰기</button>`);
  }
  // 호스트 전용: 이용 완료 후 게스트 매너 평가
  if (asHost && b.status === "confirmed" && daysUntil(b.date) < 0 && !window.MANNER.rated(b.id, me)) {
    btns.push(`<button class="btn btn--soft btn--sm" data-manner="${b.id}">게스트 평가</button>`);
  }
  // 게스트: 결제 완료 건 영수증 보기
  if (!asHost && b.status === "confirmed" && b.paid !== false) {
    btns.push(`<button class="btn btn--soft btn--sm" data-receipt="${b.id}">🧾 영수증</button>`);
  }
  // 게스트: 취소·거절·지난 예약은 내역 삭제
  if (!asHost && (b.status === "cancelled" || b.status === "declined" || (b.status === "confirmed" && daysUntil(b.date) < 0))) {
    btns.push(`<button class="btn btn--soft btn--sm" data-delbk="${b.id}">내역 삭제</button>`);
  }
  return btns.length ? `<div class="mp-bk__act">${btns.join("")}</div>` : "";
}
function mannerBadge(guestId) { const s = window.MANNER.scoreOf(guestId); return s ? ` · 매너 ★${s.toFixed(1)}` : " · 신규"; }
function reviewedBk(id) { return window.REVIEWS.all().some((r) => r.userId === me && String(r.bookingId) === String(id)); }
function bookingCard(b, asHost) {
  const s = STATUS[b.status] || STATUS.requested;
  const un = window.CHAT.unread(me, b.id);
  const changed = b.reschedFrom && b.status === "requested"
    ? `<div class="mp-bk__change">🔁 일정 변경 요청 <s>${slot(b.reschedFrom)}</s> → <b>${slot(b)}</b></div>` : "";
  const timeStr = b.start != null ? `${pad(b.start)}:00~${pad(b.start + b.hours)}:00` : "";
  // ── 호스트: 금액 강조 + 정보 그룹 + 요청사항 박스 ──
  if (asHost) {
    return `<div class="mp-bk bk-host ${un ? "has-unread" : ""}" data-bkid="${b.id}">
      <div class="bk-host__top">
        <div class="bk-host__ttl">
          <span class="bk-host__kicker">${b.pkg ? "패키지" : "공간"}</span>
          <div class="mp-book__name"${b.pkg ? ` onclick="location.href='packages.html'"` : ` onclick="location.href='space.html?id=${b.spaceId}'"`} style="cursor:pointer">${b.spaceName}</div>
          <div class="bk-host__guest">${iconSVG("user", 14)} 예약자 <b>${b.guestName ? window.PRIVACY.name(b.guestName) : "게스트"}</b><span class="bk-host__manner">${mannerBadge(b.guestId)}</span></div>
        </div>
        <div class="bk-host__amt">
          <span class="bk-host__amt-l">결제 금액</span>
          <b class="bk-host__amt-v">${won(b.total)}<em>원</em></b>
          <span class="bk-host__settle">예상 정산 ${won(window.settleOf(b))}원</span>
        </div>
      </div>
      <div class="bk-host__meta">
        <span class="bk-chip">${iconSVG("clock", 14)} ${b.date}</span>
        ${timeStr ? `<span class="bk-chip">🕑 ${timeStr}</span>` : ""}
        <span class="bk-chip">${iconSVG("users", 14)} ${b.guests}인</span>
        ${b.guestPhone ? `<a class="bk-chip bk-chip--tel" href="tel:${b.guestPhone}">📞 ${window.PRIVACY.phone(b.guestPhone)}</a>` : ""}
        <span class="mp-book__status st-${s.c} bk-host__st">${s.t}</span>
      </div>
      ${b.detail ? `<div class="bk-req"><span class="bk-req__t">📝 요청사항</span><p class="bk-req__x">${String(b.detail).replace(/</g, "&lt;")}</p></div>` : ""}
      ${changed}
      ${actionBtns(b, asHost)}
    </div>`;
  }
  // ── 게스트 ──
  const dd = (b.status === "confirmed" || b.status === "requested") ? ddayLabel(b.date) : "";
  const policy = b.status === "confirmed" ? `<div class="mp-bk__policy">취소·환불: 3일 전 100% · 1~2일 전 50% · 당일 불가</div>` : "";
  const dep = window.DEPOSITS ? window.DEPOSITS.byBooking(b.id) : null;
  const depLine = dep ? (function () { const st = window.DEPOSITS.statusOf(dep, todayStr); return `<div class="mp-bk__dep mp-bk__dep--${st.k}">${iconSVG("won", 13)} 청소 보증금 <b>${won(dep.amount)}원</b> · 별도 결제 · ${st.label}${st.k === "deducted" ? ` (환불 ${won(st.refund)}원)` : ""}</div>`; })() : "";
  return `<div class="mp-bk ${un ? "has-unread" : ""}" data-bkid="${b.id}">
    <div class="mp-bk__top">
      <div class="mp-bk__info"${b.pkg ? ` onclick="location.href='packages.html'" style="cursor:pointer"` : ` onclick="location.href='space.html?id=${b.spaceId}'"`}>
        <div class="mp-book__name">${b.pkg ? "📦 " : ""}${b.spaceName}</div>
        <div class="mp-book__meta">${timeLabel(b)} · ${won(b.total)}원</div>
      </div>
      <div class="mp-bk__right">${dd ? `<span class="mp-dday">${dd}</span>` : ""}<span class="mp-book__status st-${s.c}">${s.t}</span></div>
    </div>
    ${changed}
    ${policy}
    ${depLine}
    ${actionBtns(b, asHost)}
  </div>`;
}

function dateInRange(d, fromId, toId) {
  const fe = $("#" + fromId), te = $("#" + toId);
  const f = fe ? fe.value : "", t = te ? te.value : "";
  if (f && (!d || d < f)) return false;
  if (t && (!d || d > t)) return false;
  return true;
}
function renderBooks() {
  const list = window.BOOKINGS.list().filter((b) => b.guestId === me && dateInRange(b.date, "bkFrom", "bkTo"));
  $("#bookList").innerHTML = list.map((b) => bookingCard(b, false)).join("");
  $("#bookEmpty").hidden = list.length > 0;
}
// ---------- 정렬·기간 필터 (공용) ----------
let reqStatusF = "all", reqPeriod = "all", reqFrom = "", reqTo = "";
let hreqPeriod = "all", hreqFrom = "", hreqTo = "", hreqStatusF = "all";
let vreqPeriod = "all", vreqFrom = "", vreqTo = "", vreqStatusF = "all";
let setMonth = todayStr.slice(0, 7), setPeriod = "month", setFrom = "", setTo = "";
let setSort = "date", setDir = "desc"; // 정렬: date|amount|status · desc|asc
function shiftMonth(ym, d) { const p = ym.split("-").map(Number); const dt = new Date(p[0], p[1] - 1 + d, 1); return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`; }
function shiftDayStr(d) { const dt = new Date(); dt.setHours(0, 0, 0, 0); dt.setDate(dt.getDate() + d); return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`; }
function periodMatch(date, mode, from, to) {
  date = date || "";
  if (mode === "1w") return date >= shiftDayStr(-6);
  if (mode === "1m") return date >= shiftDayStr(-29);
  if (mode === "custom") return (!from || date >= from) && (!to || date <= to);
  return true; // all
}
// 전체 · 최근 1주 · 최근 1개월 + 날짜 지정(시작~종료)
function periodBar(mode, pfx, from, to) {
  const btn = (v, l) => `<button class="mp-seg__b${mode === v ? " is-on" : ""}" data-${pfx}p="${v}">${l}</button>`;
  return `<div class="mp-seg">${btn("all", "전체")}${btn("1w", "최근 1주")}${btn("1m", "최근 1개월")}</div>
    <div class="mp-daterange${mode === "custom" ? " is-on" : ""}"><input type="date" id="${pfx}From" value="${from || ""}"${to ? ` max="${to}"` : ""} aria-label="시작일" /><span class="mp-daterange__t">~</span><input type="date" id="${pfx}To" value="${to || ""}"${from ? ` min="${from}"` : ""} aria-label="종료일" /></div>`;
}
const REQ_STF = [["all", "전체"], ["requested", "승인대기"], ["confirmed", "확정"], ["completed", "이용완료"], ["cancelled", "취소·거절"]];
function reqNorm(b) { const d = (b.status === "confirmed" && b.date < todayStr) ? "completed" : b.status; return d === "declined" ? "cancelled" : d; }
function renderReqs() {
  if (!isHost) return;
  const all = window.BOOKINGS.list().filter((b) => b.hostId === me);
  const counts = {}; REQ_STF.forEach(([v]) => (counts[v] = v === "all" ? all.length : all.filter((b) => reqNorm(b) === v).length));
  // 탭 배지 = '승인대기'(요청) 건수 — 리스트 상태 분류(reqNorm)와 동일 기준
  const badge = $("#reqBadge"); if (badge) { badge.textContent = counts.requested; badge.hidden = counts.requested === 0; }
  let list = all.filter((b) => periodMatch(b.date, reqPeriod, reqFrom, reqTo));
  if (reqStatusF !== "all") list = list.filter((b) => reqNorm(b) === reqStatusF);
  list = list.slice().sort((a, b) => (a.date < b.date ? 1 : -1)); // 이용일 최신순
  const bar = `<div class="mp-toolbar">
    <div class="mp-seg">${REQ_STF.map(([v, l]) => `<button class="mp-seg__b${reqStatusF === v ? " is-on" : ""}" data-reqstatus="${v}">${l} <b>${counts[v] || 0}</b></button>`).join("")}</div>
    ${periodBar(reqPeriod, "req", reqFrom, reqTo)}</div>`;
  $("#reqList").innerHTML = bar + (list.length ? list.map((b) => bookingCard(b, true)).join("") : `<div class="mp-empty">해당 조건의 예약 요청이 없어요.</div>`);
  const emp = $("#reqEmpty"); if (emp) emp.hidden = true;
}
function renderMine() {
  let gi = []; try { gi = JSON.parse(localStorage.getItem("gi_spaces") || "[]"); } catch (e) {}
  const giIds = new Set(gi.map((s) => s.id));
  const mine = getAllSpaces().filter((s) => s.ownerId === me || (giIds.has(s.id) && !s.ownerId));
  $("#mineGrid").innerHTML = mine.map((s) => {
    const editable = s.ownerId === me || giIds.has(s.id);
    const actions = editable
      ? `<a href="host.html?id=${s.id}" class="btn btn--soft btn--sm">수정</a><button class="btn btn--danger btn--sm" data-delspace="${s.id}">삭제</button>`
      : `<span class="mp__sub" style="padding:7px 2px">등록 대관 · 견적요청 응찰에 사용</span>`;
    const toggle = editable
      ? `<button type="button" class="mine-toggle${s.hidden ? "" : " is-on"}" data-togglehide="${s.id}" role="switch" aria-checked="${s.hidden ? "false" : "true"}" title="${s.hidden ? "숨김 상태 — 클릭 시 노출" : "노출 중 — 클릭 시 숨김"}"><span class="mine-toggle__lbl">${s.hidden ? "숨김" : "노출 중"}</span><span class="switch"><i></i></span></button>`
      : "";
    return `<div class="mine-wrap${s.hidden ? " is-hidden" : ""}">${toggle}${s.hidden ? `<span class="mine-hidden-tag">${iconSVG("lock", 12)} 숨김 중 · 모든 페이지에서 비노출</span>` : ""}${cardHTML(s)}<div class="mine-act">${actions}</div></div>`;
  }).join("");
  $("#mineEmpty").hidden = mine.length > 0;
}
function _safe(fn) { try { fn(); } catch (e) { console.error("[mypage] render error:", e); } }
function renderAll() {
  _safe(renderDash);
  _safe(renderMyRev);
  if (isVendor) { _safe(renderVreq); _safe(renderVlink); _safe(renderVsettle); _safe(renderBizInfo); }
  if (isHost) { _safe(renderReqs); _safe(renderMine); _safe(renderHreq); }
  if (!isHost && !isVendor) { _safe(renderBooks); _safe(renderRfp); }
}

// ---------- 대시보드 + 예약현황 캘린더 ----------
let dashMonth = (function () { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; })();
let dashSel = null;
const WDS = ["일", "월", "화", "수", "목", "금", "토"];
function myEvents() {
  const evs = [];
  const allSp = getAllSpaces();
  const spOf = (id) => allSp.find((s) => String(s.id) === String(id));
  const timeOf = (st, hr) => (st != null ? `${pad(st)}:00~${pad(st + (hr || 1))}:00` : "");
  if (isHost) {
    window.BOOKINGS.list().filter((b) => b.hostId === me && b.status !== "cancelled" && b.status !== "declined").forEach((b) => {
      const sp = spOf(b.spaceId), time = timeOf(b.start, b.hours), place = (sp && sp.region) || "";
      evs.push({ date: b.date, time, title: b.spaceName || "예약", who: b.guestName || "게스트", where: place, phone: b.guestPhone || "", sub: `${b.guestName || "게스트"} · ${b.status === "confirmed" ? "확정" : "대기"}`, kind: b.status === "confirmed" ? "ok" : "amber", tab: "reqs", key: "b" + b.id,
        badge: (b.guestName || "게스트") + " 님 · " + (b.spaceName || "예약"), status: (b.status === "confirmed" ? (b.date < todayStr ? { l: "이용 완료", t: "green" } : { l: "예약 확정", t: "blue" }) : { l: "승인 대기", t: "amber" }), goLabel: "예약 관리로 이동 →", goKind: "bk", goId: b.id,
        det: [["공간", b.spaceName], ["장소", place || "-"], ["일시", `${b.date}${time ? " " + time : ""}`], ["고객", b.guestName ? window.PRIVACY.name(b.guestName) : "-"], ["연락처", b.guestPhone ? window.PRIVACY.phone(b.guestPhone) : "-"], ["인원", (b.guests || "-") + "명"], ["상태", b.status === "confirmed" ? "예약 확정" : "승인 대기"], ["결제액", won(b.total) + "원"]] });
    });
  } else if (isVendor) {
    window.QUOTES.byVendor(me).filter((q) => q.status === "accepted").forEach((q) => {
      const r = window.REQUESTS.find(q.requestId); if (!r || !r.date) return;
      const note = (r.catNotes && r.catNotes[q.cat]) || r.detail || "";
      evs.push({ date: r.date, time: "", title: reqCatById(q.cat).label + " 납품·행사", who: r.memberName || "의뢰인", where: r.region || "", phone: r.memberPhone || "", sub: `${r.memberName || "의뢰인"} · ${r.region || ""}`, kind: q.paid ? "ok" : "amber", tab: "vreq", key: "q" + q.id,
        badge: (r.memberName || "의뢰인") + " 님 · " + reqCatById(q.cat).label + " 건", status: (q.paid ? { l: "결제 완료", t: "green" } : { l: "확정", t: "blue" }), goLabel: "상세 견적서 보기 →", goKind: "req", goId: r.id,
        det: [["서비스", reqCatById(q.cat).label], ["의뢰인(고객)", r.memberName || "-"], ["연락처", r.memberPhone || "-"], ["이용일", r.date], ["행사 지역", r.region || "-"], ["예상 인원", (r.capacity || "-") + "명"], ["준비/요청사항", note || "-"], ["견적가", won(q.price) + "원"], ["상태", q.paid ? "결제 완료" : "확정(결제 대기)"]] });
    });
  } else {
    window.BOOKINGS.list().filter((b) => b.guestId === me && b.status !== "cancelled" && b.status !== "declined").forEach((b) => {
      const sp = spOf(b.spaceId), time = timeOf(b.start, b.hours), place = (sp && sp.region) || "";
      const pk = (b.pkg && typeof pkgById === "function") ? pkgById(b.pkgId) : null;
      const img = pk ? pkgImg(pk, 560, 360) : (sp ? spaceImg(sp, 560, 360) : "");
      const grad = (sp && sp.g) ? sp.g : (pk && pk.g) ? pk.g : ["#5b7f8c", "#87a7b2"];
      evs.push({ date: b.date, time, title: b.spaceName || "예약", kicker: b.pkg ? "패키지" : "공간 예약", img, grad, who: "", where: place, phone: "", sub: b.status === "confirmed" ? "예약 확정" : "승인 대기", kind: b.status === "confirmed" ? "ok" : "amber", tab: "book", key: "b" + b.id,
        badge: b.spaceName || "예약", status: (b.status === "confirmed" ? { l: "예약 확정", t: "blue" } : { l: "승인 대기", t: "amber" }), goLabel: "예약 내역 보기 →", goKind: "bk", goId: b.id,
        det: [["공간", b.spaceName], ["장소", place || "-"], ["일시", `${b.date}${time ? " " + time : ""}`], ["인원", (b.guests || "-") + "명"], ["상태", b.status === "confirmed" ? "예약 확정" : "승인 대기"], ["결제액", won(b.total) + "원"]] });
    });
    window.REQUESTS.mine(me).forEach((r) => {
      if (!r.date) return; const done = window.QUOTES.forReq(r.id).some((q) => q.status === "accepted");
      const needList = (r.cats || []).map((c) => reqCatById(c).label).join(", ") || "견적 요청";
      evs.push({ date: r.date, time: "", title: needList, kicker: r.directVendorId ? "맞춤 견적" : "견적 요청", img: "", grad: ["#6b6b8a", "#9494ad"], who: "", where: r.region || "", phone: "", sub: r.paid ? "결제 완료" : (done ? "확정" : "진행 중"), kind: r.paid ? "ok" : "amber", tab: "rfp", key: "r" + r.id,
        badge: (r.directVendorId ? "맞춤 견적" : "견적 요청"), status: (r.paid ? { l: "결제 완료", t: "green" } : (done ? { l: "확정", t: "blue" } : { l: "진행 중", t: "amber" })), goLabel: "견적 관리로 이동 →", goKind: "req", goId: r.id,
        det: [["이용일", r.date, "full"], ["요청 항목", needList, "full"], ["지역", r.region || "-"], ["인원", (r.capacity || "-") + "명"], ["상태", r.paid ? "결제 완료" : (done ? "확정" : "진행 중")]] });
    });
  }
  return evs;
}
// 요청이 마감(입찰마감·이용일 경과·closed)되어 더 이상 응답 불가한가
function reqDead(r) {
  return r.blinded || r.status === "closed" || (r.deadline && todayStr > r.deadline) || ((r.date || "") !== "" && r.date < todayStr);
}
function vendorPending() {
  const cats = auth.serviceCats || [];
  const my = window.QUOTES.byVendor(me);
  return window.REQUESTS.list().filter((r) => {
    if (!(r.directVendorId ? r.directVendorId === me : (r.cats || []).some((c) => cats.includes(c)))) return false;
    if (reqDead(r)) return false;                                  // 마감·지난 요청 제외
    return !my.some((q) => q.requestId === r.id);                  // 아직 견적 미제출
  }).length;
}
function dashKPIs() {
  if (isHost) {
    const mine = window.BOOKINGS.list().filter((b) => b.hostId === me);
    const monthC = mine.filter((b) => b.status === "confirmed" && (b.date || "").startsWith(todayStr.slice(0, 7)));
    const settle = monthC.reduce((a, b) => a + window.settleOf(b), 0);
    const hreqN = window.REQUESTS.list().filter((r) => (r.cats || []).includes("space") && hreqStageOf(r) === "new").length;
    const reqN = mine.filter((b) => b.status === "requested").length;
    return [{ l: "승인 대기", v: reqN + "건", alert: reqN > 0, tab: "reqs", f: "requested" }, { l: "이번 달 확정", v: monthC.length + "건", tab: "reqs", f: "confirmed" }, { l: "예상 정산", v: won(settle) + "원", tab: "settle" }, { l: "신규 견적요청", v: hreqN + "건", alert: hreqN > 0, tab: "hreq", f: "new" }];
  }
  if (isVendor) {
    const my = window.QUOTES.byVendor(me), acc = my.filter((q) => q.status === "accepted");
    const settle = acc.filter((q) => { const r = window.REQUESTS.find(q.requestId); return r && (r.date || "").startsWith(todayStr.slice(0, 7)); }).reduce((a, q) => a + Math.round((+q.price || 0) * (1 - window.VENDOR_FEE)), 0);
    const pend = vendorPending();
    return [{ l: "미응답 요청", v: pend + "건", alert: pend > 0, tab: "vreq", f: "open" }, { l: "제출 견적", v: my.length + "건", tab: "vreq", f: "proposed" }, { l: "확정", v: acc.length + "건", tab: "vreq" }, { l: "이번 달 정산", v: won(settle) + "원", tab: "vsettle" }];
  }
  const bk = window.BOOKINGS.list().filter((b) => b.guestId === me), reqs = window.REQUESTS.mine(me);
  const acceptedReq = (r) => window.QUOTES.forReq(r.id).some((q) => q.status === "accepted");
  // 유저 프로세스 시간 흐름: 대기 → 결제 → 확정 → 완료
  const waitN = bk.filter((b) => b.status === "requested").length + reqs.filter((r) => !r.paid && !acceptedReq(r)).length;
  const payN = reqs.filter((r) => acceptedReq(r) && !r.paid).length;
  const confirmedN = bk.filter((b) => b.status === "confirmed" && daysUntil(b.date) >= 0).length + reqs.filter((r) => r.paid && daysUntil(r.date) >= 0).length;
  const doneN = bk.filter((b) => b.status === "confirmed" && daysUntil(b.date) < 0).length + reqs.filter((r) => r.paid && daysUntil(r.date) < 0).length;
  return [
    { l: "승인·견적 대기", v: waitN + "건", alert: waitN > 0, tab: "book" },
    { l: "결제 대기", v: payN + "건", alert: payN > 0, tab: "rfp" },
    { l: "예약 확정", v: confirmedN + "건", tab: "book" },
    { l: "이용 완료", v: doneN + "건", tab: "book" },
  ];
}
function dashTodo() {
  if (isVendor) { const n = vendorPending(); if (n > 0) return { n, tab: "vreq", msg: "건의 신규 견적 요청이 기다리고 있어요.", cta: "전체 요청 보러가기" }; }
  else if (isHost) { const n = window.BOOKINGS.list().filter((b) => b.hostId === me && b.status === "requested").length; if (n > 0) return { n, tab: "reqs", msg: "건의 예약 요청이 승인을 기다리고 있어요.", cta: "예약 요청 보러가기" }; }
  return null;
}
// 내 소유(관리) 공간 목록
function myHostSpaces() {
  let gi = []; try { gi = JSON.parse(localStorage.getItem("gi_spaces") || "[]"); } catch (e) {}
  const giIds = new Set(gi.map((s) => s.id));
  return getAllSpaces().filter((s) => s.ownerId === me || (giIds.has(s.id) && !s.ownerId));
}
// 특정 날짜에 내 공간 중 하나라도 종일 차단이면 true
function dayBlockedForHost(ds) { return myHostSpaces().some((s) => window.BLOCKS.has(s.id, ds)); }
// A-1: 대시보드 캘린더 날짜 클릭 → 휴업/공사 차단 · 특가 빠른 설정 (호스트)
function openDayManage(ds) {
  const spaces = myHostSpaces();
  const [Y, M, D] = ds.split("-");
  const past = ds < todayStr;
  const evs = window.BOOKINGS.list().filter((b) => b.hostId === me && b.date === ds && b.status !== "cancelled" && b.status !== "declined");
  modal.hidden = false; modalCard.classList.remove("modal__card--wide");
  const evHtml = evs.length
    ? `<div class="daymg-evs">${evs.map((b) => `<div class="daymg-ev"><b>${b.spaceName || "예약"}</b><span>${b.start != null ? `${pad(b.start)}:00~${pad(b.start + (b.hours || 1))}:00 · ` : ""}${b.guestName ? (window.PRIVACY ? window.PRIVACY.name(b.guestName) : b.guestName) : "게스트"} · ${b.status === "confirmed" ? "확정" : "승인대기"}</span></div>`).join("")}</div>`
    : `<p class="daymg-none">이 날 예약 일정이 없어요.</p>`;
  const spRows = spaces.length
    ? spaces.map((s) => {
        const hiddenSp = typeof isSpaceHidden === "function" ? isSpaceHidden(s.id) : !!s.hidden;
        const blk = window.BLOCKS.has(s.id, ds);
        const slotN = window.BLOCKS.slotCount(s.id, ds);
        const fl = window.DISCOUNT.get(s.id).flash || {};
        const dealOn = fl.pct && fl.from === ds && fl.to === ds;
        const meta = hiddenSp ? `<em>노출 숨김 상태 · 예약 불가</em>` : (dealOn ? `<em class="daymg-deal-on">⚡ 특가 ${fl.pct}%</em>` : (slotN && !blk ? `<em>${slotN}개 시간대 차단</em>` : ""));
        const right = hiddenSp
          ? `<span class="daymg-hiddenbadge">🔒 숨김 중</span>`
          : `<button type="button" class="daymg-tgl${blk ? " is-off" : ""}" data-dayblk="${s.id}"${past ? " disabled" : ""}>${blk ? "🚫 휴업·공사 차단됨" : "예약 가능"}</button>`;
        return `<div class="daymg-sp${hiddenSp ? " is-hidden" : ""}"><div class="daymg-sp__l"><b>${s.name}</b>${meta}</div>${right}</div>`;
      }).join("")
    : `<p class="daymg-none">등록된 공간이 없어요.</p>`;
  const anyDeal = spaces.some((s) => { const fl = window.DISCOUNT.get(s.id).flash || {}; return fl.pct && fl.from === ds && fl.to === ds; });
  modalCard.innerHTML = `<div class="modal__head"><b>${+M}월 ${+D}일 관리</b><button class="modal__x" data-mclose>✕</button></div>
    ${past ? `<p class="daymg-past">지난 날짜예요. 차단·특가는 오늘 이후 날짜에만 설정할 수 있어요.</p>` : ""}
    <div class="daymg-sec"><div class="daymg-sec__h">📅 이 날 일정</div>${evHtml}</div>
    <div class="daymg-sec"><div class="daymg-sec__h">🚫 휴업 · 공사 차단</div><p class="daymg-hint">차단하면 이 날짜(공간)가 모든 페이지에서 <b>예약 불가</b>로 표시돼요.</p>${spRows}</div>
    <div class="daymg-sec"><div class="daymg-sec__h">⚡ 이 날 특가</div>
      <div class="daymg-deal"><input type="number" id="dayDealPct" min="1" max="90" placeholder="할인율 %"${past ? " disabled" : ""} /><button type="button" class="btn btn--accent btn--sm" data-daydeal${past ? " disabled" : ""}>내 공간 전체 적용</button>${anyDeal ? `<button type="button" class="btn btn--ghost btn--sm" data-daydealclear>특가 해제</button>` : ""}</div>
      <p class="daymg-hint">선택한 날짜 <b>하루</b> 특가가 내 공간 전체에 적용돼요. 기간·공간별 상세 설정은 <button type="button" class="daymg-link" data-daygomanage>공간 관리 → 할인</button>에서.</p>
    </div>`;
  modalCard.dataset.daymanage = ds;
}
function renderDashCal(events) {
  const el = $("#dashCal"); if (!el) return;
  const y = dashMonth.getFullYear(), m = dashMonth.getMonth();
  const startWd = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
  const byDate = {}; events.forEach((e) => { (byDate[e.date] = byDate[e.date] || []).push(e); });
  const blkSet = isHost ? (function () { const set = new Set(); myHostSpaces().forEach((s) => window.BLOCKS.get(s.id).forEach((d) => set.add(d))); return set; })() : new Set();
  let cells = "";
  for (let i = 0; i < startWd; i++) cells += `<span class="dcal-e"></span>`;
  for (let d = 1; d <= days; d++) {
    const ds = `${y}-${pad(m + 1)}-${pad(d)}`, evs = byDate[ds] || [];
    const kind = evs.some((e) => e.kind === "ok") ? "ok" : (evs.length ? "amber" : "");
    const isBlk = blkSet.has(ds);
    const tipTxt = evs.map((e) => `• ${e.title}${e.time ? " " + e.time : ""}${e.who ? " · " + e.who : ""}${e.where ? " · " + e.where : ""}`).join("\n");
    const tipAttr = evs.length ? ` title="${tipTxt.replace(/"/g, "&quot;")}"` : (isBlk ? ` title="휴업·공사 차단"` : "");
    cells += `<button type="button" class="dcal-d${ds === dashSel ? " is-sel" : ""}${ds === todayStr ? " is-today" : ""}${evs.length ? " has-ev" : ""}${isBlk ? " is-blocked" : ""}" data-dday="${ds}"${tipAttr}>${d}${evs.length ? `<i class="dcal-dot ${kind}"></i>` : ""}${isBlk ? `<i class="dcal-blk">🚫</i>` : ""}</button>`;
  }
  el.innerHTML = `<div class="dcal-top"><button type="button" data-dnav="-1">‹</button><b>${y}년 ${m + 1}월</b><button type="button" data-dnav="1">›</button></div><div class="dcal-wd">${WDS.map((w) => `<span>${w}</span>`).join("")}</div><div class="dcal-grid">${cells}</div>${isHost ? `<p class="dcal-tip">💡 날짜를 클릭하면 휴업·공사 차단, 특가를 바로 설정할 수 있어요.</p>` : ""}`;
}
let dashEvOpen = null, dashEvents = [];
function openEventDetail(key) {
  const e = dashEvents.find((x) => x.key === key); if (!e) return;
  const st = e.status || { l: e.sub, t: "gray" };
  modal.hidden = false; modalCard.classList.remove("modal__card--wide");
  modalCard.innerHTML = `<div class="modal__head"><b>${e.badge || e.title}</b><button class="modal__x" data-mclose>✕</button></div>
    <div class="ev-modal__top"><span class="dash-st dash-st--${st.t}">${st.l}</span>${e.time ? `<span class="ev-modal__time">🕑 ${e.time}</span>` : ""}</div>
    <div class="ev-modal__grid">${e.det.map(([k, v, cls]) => `<div${cls === "full" ? ' class="ev-modal__full"' : ""}><span>${k}</span><b>${v == null ? "-" : String(v).replace(/</g, "&lt;")}</b></div>`).join("")}</div>
    <button class="btn btn--accent btn--block" data-evgo="${e.tab}" data-gokind="${e.goKind || ""}" data-goid="${e.goId || ""}" style="margin-top:16px">${e.goLabel || "메뉴로 이동 →"}</button>`;
}
// 탭 이동 후 해당 예약/요청 카드로 스크롤 + 하이라이트
function focusItem(kind, id) {
  if (!kind || !id) return;
  const sel = kind === "bk" ? `[data-bkid="${id}"]` : `[data-reqid="${id}"]`;
  let tries = 0;
  const go = () => {
    const el = document.querySelector(sel);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("mp-flash"); setTimeout(() => el.classList.remove("mp-flash"), 2200); }
    else if (tries++ < 8) setTimeout(go, 80);
  };
  setTimeout(go, 60);
}
function upCard(e) {
  const st = e.status || { l: e.sub, t: "gray" };
  const g = e.grad || ["#5b7f8c", "#87a7b2"];
  const dd = ddayLabel(e.date);
  return `<button type="button" class="upcard" data-evdetail="${e.key}">
    <div class="upcard__thumb" style="background:linear-gradient(135deg,${g[0]},${g[1]})">${e.img ? `<img src="${e.img}" alt="" loading="lazy" onerror="this.remove()" />` : ""}<span class="upcard__badge dash-st--${st.t}">${st.l}</span>${dd ? `<span class="upcard__dday">${dd}</span>` : ""}</div>
    <div class="upcard__body">
      <span class="upcard__kicker">${e.kicker || ""}</span>
      <b class="upcard__title">${e.title}</b>
      <span class="upcard__meta">${iconSVG("calendar", 13)} ${e.date}${e.time ? " · " + e.time : ""}</span>
      ${e.where ? `<span class="upcard__meta">${iconSVG("pin", 13)} ${e.where}</span>` : ""}
      <span class="upcard__more">상세 보기 →</span>
    </div>
  </button>`;
}
function renderDash() {
  const wrap = $("#dashWrap"); if (!wrap) return;
  const events = myEvents(); dashEvents = events;
  const todo = dashTodo();
  const kpiHTML = `<div class="dash-kpis">${dashKPIs().map((k) => `<button type="button" class="dash-kpi${k.alert ? " dash-kpi--alert" : ""}"${k.tab ? ` data-kpigo="${k.tab}"` : ""}${k.f ? ` data-kpifilter="${k.f}"` : ""}><strong>${k.v}</strong><span>${k.l}</span></button>`).join("")}</div>`;
  const todoHTML = todo ? `<button type="button" class="dash-cta" data-kpigo="${todo.tab}"><span class="dash-cta__t">${iconSVG("mail", 15)} <b>${todo.n}</b>${todo.msg}</span><span class="dash-cta__b">${todo.cta} →</span></button>` : "";
  // 게스트: 큰 달력 대신 '다가오는 일정'을 썸네일 카드로 크게
  if (!isHost && !isVendor) {
    const list = events.filter((e) => e.date >= todayStr).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, 6);
    wrap.innerHTML = kpiHTML + todoHTML + `<div class="dash-upwrap"><h3 class="dash-h dash-h--main">다가오는 일정</h3>${list.length ? `<div class="dash-upcards">${list.map(upCard).join("")}</div>` : `<div class="dash-upempty">${iconSVG("calendar", 26)}<p>예정된 일정이 없어요.<br />마음에 드는 공간을 찾아 예약해 보세요.</p><a href="search.html" class="btn btn--accent btn--sm">공간 둘러보기 →</a></div>`}</div>`;
    return;
  }
  wrap.innerHTML = kpiHTML + todoHTML + `
    <div class="dash-grid">
      <div><div class="dash-cal" id="dashCal"></div></div>
      <div class="dash-side"><h3 class="dash-h" id="dashUpH">다가오는 일정</h3><div class="dash-up" id="dashUp"></div></div>
    </div>`;
  renderDashCal(events);
  const up = $("#dashUp"), h = $("#dashUpH");
  let list;
  if (dashSel) { list = events.filter((e) => e.date === dashSel); h.textContent = `${dashSel} 일정`; }
  else { list = events.filter((e) => e.date >= todayStr).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, 8); h.textContent = "다가오는 일정"; }
  up.innerHTML = list.length ? list.map((e) => {
    const meta = [e.time, e.who].filter(Boolean).join(" · ");
    const st = e.status || { l: e.sub, t: "gray" };
    return `<div class="dash-ev" data-evdetail="${e.key}">
      <span class="dash-ev__dot ${e.kind}"></span>
      <div class="dash-ev__body">
        <div class="dash-ev__head"><span class="dash-ev__badge">${e.badge || e.title}</span><span class="dash-st dash-st--${st.t}">${st.l}</span></div>
        <b>${e.title}</b>
        ${meta ? `<span class="dash-ev__meta">🕑 ${meta}</span>` : ""}
        <span class="dash-ev__sub">${e.date}${e.where ? " · " + e.where : ""}</span>
        <span class="dash-ev__more">상세 정보 보기 →</span>
      </div>
    </div>`;
  }).join("") : `<div class="mp-empty" style="padding:24px 10px">${dashSel ? "이 날 일정이 없어요." : "예정된 일정이 없어요."}</div>`;
}
// C-8: 요약 카드 클릭 → 대상 탭의 상태 필터까지 즉시 적용
function applyTabFilter(tab, f) {
  if (tab === "reqs") { reqStatusF = f || "all"; reqPeriod = "all"; reqFrom = ""; reqTo = ""; if (typeof renderReqs === "function") renderReqs(); }
  else if (tab === "hreq") { hreqStatusF = f || "all"; hreqPeriod = "all"; hreqFrom = ""; hreqTo = ""; if (typeof renderHreq === "function") renderHreq(); }
  else if (tab === "vreq") { vreqStatusF = f || "all"; vreqPeriod = "all"; vreqFrom = ""; vreqTo = ""; if (typeof renderVreq === "function") renderVreq(); }
}
document.addEventListener("click", (e) => {
  const kg = e.target.closest("[data-kpigo]");
  if (kg) { const tab = kg.dataset.kpigo; if (tab) { applyTabFilter(tab, kg.dataset.kpifilter || ""); activate(tab); } return; }
  const eg = e.target.closest("[data-evgo]");
  if (eg) {
    if (typeof closeModal === "function") closeModal();
    const tab = eg.dataset.evgo;
    // 대상 카드가 필터에 가려지지 않도록 해당 탭 필터 초기화 후 재렌더
    if (tab === "reqs") { reqStatusF = "all"; reqPeriod = "all"; reqFrom = ""; reqTo = ""; if (typeof renderReqs === "function") renderReqs(); }
    else if (tab === "hreq") { hreqStatusF = "all"; hreqPeriod = "all"; hreqFrom = ""; hreqTo = ""; if (typeof renderHreq === "function") renderHreq(); }
    else if (tab === "vreq") { vreqStatusF = "all"; vreqPeriod = "all"; vreqFrom = ""; vreqTo = ""; if (typeof renderVreq === "function") renderVreq(); }
    activate(tab);
    focusItem(eg.dataset.gokind, eg.dataset.goid);
    return;
  }
  const ed = e.target.closest("[data-evdetail]");
  if (ed) { openEventDetail(ed.dataset.evdetail); return; }
  const nav = e.target.closest("[data-dnav]");
  if (nav) { dashMonth = new Date(dashMonth.getFullYear(), dashMonth.getMonth() + (+nav.dataset.dnav), 1); renderDash(); return; }
  const dd = e.target.closest("[data-dday]");
  if (dd) { if (isHost) { openDayManage(dd.dataset.dday); } else { dashSel = dashSel === dd.dataset.dday ? null : dd.dataset.dday; renderDash(); } return; }
  // A-1: 날짜 관리 모달 액션
  const dblk = e.target.closest("[data-dayblk]");
  if (dblk) { const ds = modalCard.dataset.daymanage; if (!ds) return; const on = window.BLOCKS.toggle(dblk.dataset.dayblk, ds); if (on) window.BLOCKS.clearSlots(dblk.dataset.dayblk, ds); openDayManage(ds); renderDash(); toast(on ? "이 날을 휴업·공사로 차단했어요" : "차단을 해제했어요"); return; }
  const ddeal = e.target.closest("[data-daydeal]");
  if (ddeal) { const ds = modalCard.dataset.daymanage; const pctEl = $("#dayDealPct"); const pct = pctEl ? parseInt(pctEl.value, 10) : 0; if (!pct || pct < 1 || pct > 90) { toast("할인율(1~90%)을 입력하세요"); return; } const sps = myHostSpaces().filter((s) => !(typeof isSpaceHidden === "function" && isSpaceHidden(s.id))); if (!sps.length) { toast("노출 중인 공간이 없어요 (숨김 공간은 제외)"); return; } sps.forEach((s) => { const cur = window.DISCOUNT.get(s.id) || {}; window.DISCOUNT.set(s.id, Object.assign({}, cur, { flash: { pct: pct, from: ds, to: ds } })); }); openDayManage(ds); toast(`노출 중 ${sps.length}개 공간에 ${ds} 하루 특가 ${pct}%를 적용했어요`); return; }
  const ddc = e.target.closest("[data-daydealclear]");
  if (ddc) { const ds = modalCard.dataset.daymanage; myHostSpaces().forEach((s) => { const cur = window.DISCOUNT.get(s.id) || {}; const fl = cur.flash || {}; if (fl.from === ds && fl.to === ds) { delete cur.flash; window.DISCOUNT.set(s.id, cur); } }); openDayManage(ds); toast("이 날 특가를 해제했어요"); return; }
  const dgm = e.target.closest("[data-daygomanage]");
  if (dgm) { if (typeof closeModal === "function") closeModal(); activate("disc"); return; }
});

// ---------- 견적 요청: 회원(견적 요청·비교) ----------
// 요청 상태를 카테고리별 선정 현황에 맞춰 동기화 (모든 카테고리 선정 시에만 closed)
function syncReqStatus(rid) {
  const r = window.REQUESTS.find(rid); if (!r) return;
  const picked = new Set(window.QUOTES.forReq(rid).filter((q) => q.status === "accepted").map((q) => q.cat));
  const allDone = r.cats.length > 0 && r.cats.every((c) => picked.has(c));
  window.REQUESTS.update(rid, { status: allDone ? "closed" : "open" });
}
// ── 첨부(사진·파일) 유틸 ──
function downscaleImg(file, max, cb) {
  const rd = new FileReader();
  rd.onload = () => { const img = new Image(); img.onload = () => {
    let w = img.width, h = img.height;
    if (w > max || h > max) { if (w > h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } }
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").drawImage(img, 0, 0, w, h);
    try { cb(cv.toDataURL("image/jpeg", 0.6)); } catch (e) { cb(rd.result); }
  }; img.onerror = () => cb(rd.result); img.src = rd.result; };
  rd.readAsDataURL(file);
}
function bindAttach(photoInput, docInput, previewEl) {
  photoInput._photos = []; if (docInput) docInput._files = [];
  photoInput.addEventListener("change", () => {
    [...photoInput.files].slice(0, 4).forEach((f) => { if (!/^image\//.test(f.type)) return; downscaleImg(f, 720, (url) => { photoInput._photos.push(url); previewEl.insertAdjacentHTML("beforeend", `<img src="${url}" alt="첨부 사진" />`); }); });
  });
  if (docInput) docInput.addEventListener("change", () => {
    docInput._files = [...docInput.files].map((f) => ({ name: f.name }));
    previewEl.insertAdjacentHTML("beforeend", docInput._files.map((x) => `<span class="att-file">📎 ${x.name}</span>`).join(""));
  });
}
const attachField = (idP, idD, idPrev) => `
  <div class="book__field"><label class="book__label">사진 첨부 <span style="color:var(--faint);font-weight:500">(최대 4장 · 미리보기)</span></label>
    <input type="file" id="${idP}" accept="image/*" multiple class="att-input" />
    <label class="book__label" style="margin-top:8px">견적서·파일 첨부</label>
    <input type="file" id="${idD}" multiple class="att-input" />
    <div class="att-prev" id="${idPrev}"></div>
  </div>`;
// 사진 캐러셀(<>) — 견적행/상세에서 미리보기
function photoStrip(photos) {
  if (!photos || !photos.length) return "";
  return `<div class="qphotos" data-photos='${JSON.stringify(photos).replace(/'/g, "&#39;")}'>
    <img src="${photos[0]}" alt="견적 사진" class="qphotos__img" data-pidx="0" />
    ${photos.length > 1 ? `<span class="qphotos__cnt">1/${photos.length}</span>` : ""}
  </div>`;
}
let _lb = { photos: [], i: 0 };
function openLightbox(photos, i) {
  _lb = { photos, i: i || 0 };
  modal.hidden = false;
  const draw = () => {
    modalCard.innerHTML = `<div class="modal__head"><b>사진 ${_lb.i + 1} / ${_lb.photos.length}</b><button class="modal__x" data-mclose>✕</button></div>
      <div class="lb"><button class="lb__nav lb__prev" data-lb="-1" ${_lb.photos.length < 2 ? "disabled" : ""}>‹</button>
      <img src="${_lb.photos[_lb.i]}" alt="사진" class="lb__img" />
      <button class="lb__nav lb__next" data-lb="1" ${_lb.photos.length < 2 ? "disabled" : ""}>›</button></div>`;
  };
  draw();
  modalCard._lbDraw = draw;
}
// 신뢰 지표 — 공간은 별점, 파트너는 후기 평점 + 거래 건수
function vendorTrust(q) {
  if (q.cat === "space") { const s = getAllSpaces().find((x) => String(x.id) === String(q.spaceId)); return s && s.rating ? `★${s.rating}${s.reviews ? ` (${s.reviews})` : ""}` : "신규 공간"; }
  const deals = window.QUOTES.list().filter((x) => x.vendorId === q.vendorId && x.status === "accepted").length;
  const sc = window.VREVIEWS.scoreOf(q.vendorId);
  return `${sc ? `★${sc.toFixed(1)} · ` : ""}거래 ${deals}건`;
}
function catStats(qs) { if (!qs.length) return null; const p = qs.map((q) => +q.price || 0); return { min: Math.min(...p), avg: Math.round(p.reduce((a, b) => a + b, 0) / p.length), count: qs.length }; }
function daysToDeadline(r) { return r.deadline ? daysUntil(r.deadline) : 99; }
// 입찰 마감까지 남은 일수 카운트다운 뱃지 (호스트·파트너 공용)
function deadlineBadge(r) {
  if (!r.deadline) return `<span class="req-ago req-ago--none">마감 미정</span>`;
  const d = daysUntil(r.deadline);
  if (d < 0) return `<span class="req-ago req-ago--closed">입찰 마감</span>`;
  if (d === 0) return `<span class="req-ago req-ago--urgent">⏰ 오늘 마감</span>`;
  return `<span class="req-ago${d <= 3 ? " req-ago--urgent" : ""}">⏰ 마감까지 <b>${d}일</b></span>`;
}
// 공간 시간대 충돌 (확정/예약 겹침)
function spaceBusy(spaceId, date, start, end, ignoreQuoteId) {
  if (start == null || end == null) return false;
  return window.BOOKINGS.list().some((b) => String(b.spaceId) === String(spaceId) && b.date === date && b.fromQuote !== ignoreQuoteId && b.status !== "declined" && b.status !== "cancelled" && !(end <= b.start || start >= (b.start + b.hours)));
}
function quoteRow(q, opts) {
  opts = opts || {};
  const isSpace = q.cat === "space";
  const nameHtml = isSpace
    ? `<b class="quote-name--link" data-spaceinfo="${q.spaceId}">${q.spaceName || "공간"} <span class="quote-name__see">상세▾</span></b>`
    : `<b class="quote-name--link" data-vendorinfo="${q.vendorId}">${q.vendorName} <span class="quote-name__see">상세▾</span></b>`;
  const meta = isSpace
    ? `<div class="quote-meta"><span class="quote-by">${q.vendorName} 제공</span>${q.discountPct ? `<span class="quote-disc">기존가 ${won(q.origPrice)}원 · ${q.discountPct}%↓</span>` : ""}</div>`
    : "";
  let rightBtn;
  if (q.status === "accepted") {
    rightBtn = `<span class="quote-badge">✅ 확정됨</span>`;
    if (q.refunded) rightBtn += `<span class="quote-badge quote-badge--refund">↩︎ 환불 ${won(q.refundAmt || 0)}원${q.penalty ? ` · 위약금 ${won(q.penalty)}원` : ""}</span>`;
    else if (q.paid) { rightBtn += `<button class="btn btn--soft btn--sm" data-qreceipt="${q.id}">🧾 영수증</button>`; if (q.cat !== "space" && window.JOBSTAGE) { const js = window.JOBSTAGE.get(q.id); rightBtn += `<span class="job-chip job-chip--s${js}">🚚 ${window.JOBSTAGE.STAGES[js]}</span>`; } }
    if (opts.reviewable && !window.VREVIEWS.ratedQuote(q.id, me)) rightBtn += `<button class="btn btn--soft btn--sm" data-vreview="${q.id}">후기</button>`;
    rightBtn += `<button class="btn btn--soft btn--sm" data-unacceptq="${q.id}">확정 취소</button>`;
  } else if (opts.catAccepted) rightBtn = ``; // 이미 이 카테고리 확정 → 다른 견적 잠금
  else if (q.status === "selected") rightBtn = `<span class="quote-picked">● 선택함</span>`;
  else rightBtn = `<button class="btn btn--accent btn--sm" data-selectq="${q.id}">선택</button>`;
  const cls = q.status === "accepted" ? "is-sel" : (q.status === "selected" ? "is-pick" : (opts.catAccepted ? "is-dim" : ""));
  const atts = `${photoStrip(q.photos)}${(q.files && q.files.length) ? `<div class="qfiles">${q.files.map((f) => `<span class="att-file">📎 ${f.name}</span>`).join("")}</div>` : ""}`;
  return `<div class="quote-row ${cls}">
    <div class="quote-row__l"><div class="quote-row__name">${nameHtml}${opts.isLow ? `<span class="quote-low">최저가</span>` : ""}${opts.recommend ? `<span class="quote-rec">추천</span>` : ""}</div><span class="quote-trust">${vendorTrust(q)}</span>${meta}${q.desc ? `<div class="quote-desc">${q.desc}</div>` : ""}${atts}</div>
    <div class="quote-row__r"><div class="quote-price">${won(q.price)}원</div>${rightBtn}<button class="btn btn--soft btn--sm" data-qchat="${q.id}">채팅</button></div>
  </div>`;
}
function timeRange(r) { return (r.start != null && r.end != null) ? `${pad(r.start)}:00~${pad(r.end)}:00` : ""; }
// 핵심 플로우 스텝: 요청 → 견적 → 확정 → 결제 → 이용
function reqDone(r) {
  const qs = window.QUOTES.forReq(r.id);
  const cats = r.cats || [];
  const accepted = new Set(qs.filter((q) => q.status === "accepted").map((q) => q.cat));
  const confirmed = cats.length > 0 && cats.every((c) => accepted.has(c));
  const acc = qs.filter((q) => q.status === "accepted");
  const paidAll = acc.length > 0 && acc.every((q) => q.paid);
  return [true, qs.length > 0, confirmed, paidAll, daysUntil(r.date) < 0 && paidAll];
}
function stepBar(done) {
  const L = ["요청", "견적", "확정", "결제", "이용"]; let curSet = false;
  return `<div class="steps">${L.map((l, i) => { const d = done[i]; const cur = !d && !curSet; if (cur) curSet = true; return `<div class="step${d ? " is-done" : ""}${cur ? " is-cur" : ""}"><span class="step__dot">${d ? "✓" : i + 1}</span><span class="step__l">${l}</span></div>`; }).join("")}</div>`;
}
// 건바이건·부분 결제 반영 버튼 — 확정 항목 중 미결제가 있으면 결제로
function payBtn(r) {
  const acc = window.QUOTES.forReq(r.id).filter((q) => q.status === "accepted");
  if (!acc.length) return "";
  const paidN = acc.filter((q) => q.paid).length;
  if (paidN === acc.length) return `<span class="pay-done">✓ 결제 완료</span>`;
  if (paidN > 0) return `<a href="checkout.html?req=${r.id}" class="btn btn--accent btn--sm">결제 계속 (${paidN}/${acc.length}) →</a>`;
  return `<a href="checkout.html?req=${r.id}" class="btn btn--accent btn--sm">결제하기 →</a>`;
}
function reqCardMember(r) {
  const quotes = window.QUOTES.forReq(r.id);
  const catsLabel = r.cats.map((c) => reqCatById(c).label).join(", ");
  const tr = timeRange(r);
  const collapsed = collapsedReqs.has(r.id);
  const dl = daysToDeadline(r);
  const nearDl = dl >= 0 && dl <= 3;
  const usePassed = daysUntil(r.date) < 0;
  let picked = 0, pickedSum = 0, comboMin = 0, anyQuotes = false, unconfirmed = 0;
  const cmpRows = [];
  const renderCatBlock = (cat) => {
    const svc = reqCatById(cat);
    const qs = quotes.filter((q) => q.cat === cat);
    const low = qs.length ? Math.min(...qs.map((q) => +q.price || 0)) : 0;
    const accepted = qs.find((q) => q.status === "accepted");
    const selected = qs.find((q) => q.status === "selected");
    if (accepted) { picked++; pickedSum += (+accepted.price || 0); }
    const st = catStats(qs);
    if (st) { anyQuotes = true; comboMin += st.min; }
    if (qs.length && !accepted) unconfirmed++;
    cmpRows.push(`<tr><td>${svc.label}</td><td>${st ? `${won(st.min)}원` : "–"}</td><td>${st ? `${won(st.avg)}원` : "–"}</td><td>${st ? st.count + "곳" : "0"}</td></tr>`);
    let headRight;
    if (accepted) headRight = `<span class="rfp-cat__done">✅ 확정 완료</span>`;
    else if (selected) headRight = `<button class="btn btn--accent btn--sm rfp-cat__confirm" data-confirmcat="${r.id}|${cat}">이 항목 확정</button>`;
    else headRight = `<span class="rfp-cat__cnt">${qs.length}곳</span>`;
    const key = r.id + "|" + cat;
    const catCollapsed = !expandedCats.has(key);
    const rowsHtml = qs.length ? qs.map((q) => quoteRow(q, { isLow: qs.length > 1 && (+q.price || 0) === low, catAccepted: !!accepted, recommend: nearDl && !accepted && qs.length > 1 && (+q.price || 0) === low, reviewable: usePassed })).join("") : `<div class="rfp-empty">아직 견적이 없어요 · 파트너 검토 중…</div>`;
    const folded = accepted
      ? `<div class="rfp-cat__folded">✅ <b>${accepted.cat === "space" ? (accepted.spaceName || "공간") : accepted.vendorName}</b> · ${won(accepted.price)}원 <button class="rfp-cat__more" data-catcollapse="${key}">펼치기</button></div>`
      : `<div class="rfp-cat__folded">견적 ${qs.length}곳 <button class="rfp-cat__more" data-catcollapse="${key}">펼쳐보기</button></div>`;
    return `<div class="rfp-cat">
      <div class="rfp-cat__h" data-catcollapse="${key}"><span class="rfp-cat__chev">${catCollapsed ? "▸" : "▾"}</span>${iconSVG(svc.icon, 16)}<span>${svc.label}</span>${headRight}</div>
      ${catCollapsed ? folded : rowsHtml}
    </div>`;
  };
  // 공간(호스트) / 부대서비스(파트너) 그룹 분리 — 그룹 전체 접기/펼치기
  const hasSpace = r.cats.includes("space"), hasSvc = r.cats.some((c) => c !== "space");
  const grouped = hasSpace && hasSvc;
  const spaceHtml = r.cats.filter((c) => c === "space").map(renderCatBlock).join("");
  const svcHtml = r.cats.filter((c) => c !== "space").map(renderCatBlock).join("");
  const grpBlock = (gkey, iconKey, title, cnt, inner) => {
    const off = collapsedGroups.has(gkey);
    return `<div class="rfp-group">
      <button type="button" class="rfp-group__h${off ? " is-off" : ""}" data-grpcollapse="${gkey}">${iconSVG(iconKey, 15)} ${title} <span class="rfp-group__cnt">${cnt}</span><span class="rfp-group__chev">${iconSVG("arrow", 14)}</span></button>
      <div class="rfp-group__body"${off ? " hidden" : ""}>${inner}</div>
    </div>`;
  };
  let blocks = "";
  if (hasSpace) blocks += grouped ? grpBlock(r.id + "|g-space", "home", "공간 대관 · 호스트", r.cats.filter((c) => c === "space").length, spaceHtml) : spaceHtml;
  if (hasSvc) blocks += grouped ? grpBlock(r.id + "|g-svc", "wrench", "부대서비스 · 파트너", r.cats.filter((c) => c !== "space").length, svcHtml) : svcHtml;
  const total = r.cats.length;
  const allDone = picked === total && total > 0;
  // 견적 비교 요약 (feature 3)
  const compareCard = anyQuotes ? `<div class="rfp-compare">
    <div class="rfp-compare__h">📊 견적 비교 요약</div>
    <table class="rfp-cmp"><thead><tr><th>항목</th><th>최저가</th><th>평균가</th><th>견적</th></tr></thead><tbody>${cmpRows.join("")}</tbody></table>
    <div class="rfp-compare__foot">최저가 조합 총액 <b>${won(comboMin)}원</b>${r.budget ? ` · 예산 ${won(r.budget)}원 (${comboMin <= r.budget ? `여유 ${won(r.budget - comboMin)}원` : `초과 ${won(comboMin - r.budget)}원`})` : ""}</div>
  </div>` : "";
  // 마감 임박 알림 (feature 2)
  const dlBanner = (nearDl && unconfirmed > 0) ? `<div class="rfp-dl">⏰ 선정 마감 <b>${dl === 0 ? "오늘" : "D-" + dl}</b> · 미확정 ${unconfirmed}개 항목은 <b>최저가(추천)</b>를 확인해 확정해 주세요.</div>` : "";
  // 예산 비교 게이지
  let budgetBar = "";
  if (pickedSum > 0 || r.budget) {
    const over = r.budget && pickedSum > r.budget;
    const pct = r.budget ? Math.min(100, Math.round((pickedSum / r.budget) * 100)) : 0;
    budgetBar = r.budget
      ? `<div class="rfp-budget ${over ? "is-over" : ""}">
          <div class="rfp-budget__top"><span class="rfp-budget__lbl">${iconSVG("won", 14)} 예산 사용 현황</span><span class="rfp-budget__pct">${pct}%</span></div>
          <div class="rfp-budget__bar"><i style="width:${pct}%"></i></div>
          <div class="rfp-budget__foot"><span>선정 합계 <b>${won(pickedSum)}원</b> (${picked}/${total})</span><span>내 예산 <b>${won(r.budget)}원</b></span></div>
          <div class="rfp-budget__note">${over ? `${iconSVG("alert", 13)} 예산보다 ${won(pickedSum - r.budget)}원 초과했어요` : `남은 예산 ${won(r.budget - pickedSum)}원`}</div>
        </div>`
      : `<div class="rfp-budget"><div class="rfp-budget__foot"><span>선정 합계 <b>${won(pickedSum)}원</b> (${picked}/${total})</span></div></div>`;
  }
  const deliverGuide = picked > 0
    ? `<div class="rfp-guide">📦 선정한 견적은 <b>이용일 최소 3일 전(${r.deadline})</b>까지 결제해 주세요. 물품은 <b>이용 당일 현장 셋팅 또는 직접 배송</b>으로 전달됩니다. 세부 조건은 파트너와 채팅으로 확인하세요.</div>`
    : "";
  return `<div class="mp-bk rfp-card ${collapsed ? "is-collapsed" : ""}" data-reqid="${r.id}">
    <div class="mp-bk__top rfp-card__head" data-toggle="${r.id}"><div class="mp-bk__info"><div class="mp-book__name">${r.directVendorId ? `<span class="rq-direct">🎯 ${r.directVendorName || "파트너"} 직접 요청</span> ` : ""}${r.region} · ${r.date}${tr ? ` · ${tr}` : ""}${r.capacity ? ` · ${r.capacity}인` : ""}</div><div class="mp-book__meta">필요: ${catsLabel}${r.parking ? ` · 주차 ${r.parking}대` : ""}${r.budget ? ` · 예산 ${won(r.budget)}원` : ""}${r.deadline ? ` · 🕑 선정 마감 ${r.deadline}` : ""}</div></div><div class="mp-bk__right"><span class="mp-book__status ${allDone ? "st-green" : "st-amber"}">${allDone ? "선정 완료" : `선정 ${picked}/${total}`}</span><span class="rfp-card__chev">▾</span></div></div>
    <div class="rfp-card__body">
      ${stepBar(reqDone(r))}
      ${(!allDone && r.deadline) ? `<div class="rfp-live"><span class="rfp-live__timer" data-deadline="${r.deadline}">⏳ 계산 중…</span><span class="rfp-live__bids">${iconSVG("users", 13)} 현재 <b>${new Set(window.QUOTES.forReq(r.id).map((q) => q.vendorId)).size}</b>개 파트너 입찰 중</span>${anyQuotes ? `<button type="button" class="rfp-live__cmp" data-opencmp="${r.id}">${iconSVG("stats", 13)} 견적 1:1 비교</button>` : ""}</div>` : ""}
      ${(anyQuotes && !allDone) ? `<p class="rfp-cta-copy">${iconSVG("target", 15)} 원하는 파트너의 견적을 선택하여 예약을 확정해 주세요</p>` : ""}
      ${r.detail ? `<div class="mp-bk__policy">${r.detail}</div>` : ""}
      ${dlBanner}
      ${compareCard}
      ${budgetBar}
      ${deliverGuide}
      <div class="rfp-quotes">${blocks}</div>
      <div class="mp-bk__act">${!allDone ? `<a href="request.html?id=${r.id}" class="btn btn--soft btn--sm">요청 수정</a>` : ""}${payBtn(r)}${reqReceiptBtn(r)}<button class="btn btn--danger btn--sm" data-delreq="${r.id}">요청 삭제</button></div>
    </div>
  </div>`;
}
// 파트너 직접 요청 — 간결 카드 (견적 요청 비교표 없음)
function reqCardDirect(r) {
  const cat = (r.cats || [])[0];
  const svc = reqCatById(cat);
  const quotes = window.QUOTES.forReq(r.id);
  const q = quotes[0];
  const accepted = q && q.status === "accepted";
  const usePassed = daysUntil(r.date) < 0;
  const collapsed = collapsedReqs.has(r.id);
  let headRight = "";
  if (accepted) headRight = `<span class="rfp-cat__done">✅ 확정 완료</span>`;
  else if (q && q.status === "selected") headRight = `<button class="btn btn--accent btn--sm rfp-cat__confirm" data-confirmcat="${r.id}|${cat}">확정</button>`;
  const catBlock = `<div class="rfp-cat"><div class="rfp-cat__h">${iconSVG(svc.icon, 16)}<span>${svc.label}</span>${headRight}</div>${q ? quoteRow(q, { catAccepted: accepted, reviewable: usePassed }) : `<div class="rfp-empty">${r.directVendorName || "파트너"}가 아직 견적을 보내지 않았어요 · 검토 중…</div>`}</div>`;
  const budgetLine = (r.budget || q) ? `<div class="rfp-dline">${r.budget ? `요청 예산 <b>${won(r.budget)}원</b>` : ""}${q ? `${r.budget ? " · " : ""}파트너 견적 <b>${won(q.price)}원</b>` : ""}</div>` : "";
  const guide = accepted ? `<div class="rfp-guide">📦 확정 견적은 <b>이용일 최소 3일 전(${r.deadline})</b>까지 결제해 주세요. 세부 조건은 파트너와 채팅으로 확인하세요.</div>` : "";
  const status = accepted ? "확정" : (q ? "견적 도착" : "견적 대기");
  return `<div class="mp-bk rfp-card ${collapsed ? "is-collapsed" : ""}" data-reqid="${r.id}">
    <div class="mp-bk__top rfp-card__head" data-toggle="${r.id}"><div class="mp-bk__info"><div class="mp-book__name"><span class="rq-direct">🎯 ${r.directVendorName || "파트너"}</span> ${r.region} · ${r.date}</div><div class="mp-book__meta">${svc.label}${r.deadline ? ` · 🕑 마감 ${r.deadline}` : ""} · ${window.timeago(r.ts)}</div></div><div class="mp-bk__right"><span class="mp-book__status ${accepted ? "st-green" : (q ? "st-amber" : "st-gray")}">${status}</span><span class="rfp-card__chev">▾</span></div></div>
    <div class="rfp-card__body">
      ${stepBar(reqDone(r))}
      ${r.detail ? `<div class="mp-bk__policy">${r.detail}</div>` : ""}
      ${budgetLine}
      ${guide}
      <div class="rfp-quotes">${catBlock}</div>
      <div class="mp-bk__act">${payBtn(r)}${reqReceiptBtn(r)}<button class="btn btn--danger btn--sm" data-delreq="${r.id}">요청 삭제</button></div>
    </div>
  </div>`;
}
let rfpSub = "auction";
function renderRfp() {
  const all = window.REQUESTS.mine(me);
  const direct = all.filter((r) => r.directVendorId);
  const auction = all.filter((r) => !r.directVendorId);
  const ca = $("#rfpCntAuc"), cd = $("#rfpCntDir");
  if (ca) ca.textContent = auction.length; if (cd) cd.textContent = direct.length;
  document.querySelectorAll(".rfp-subtab").forEach((b) => b.classList.toggle("is-active", b.dataset.sub === rfpSub));
  const list = (rfpSub === "direct" ? direct : auction).filter((r) => dateInRange(r.date, "rfpFrom", "rfpTo"));
  $("#rfpList").innerHTML = list.map(rfpSub === "direct" ? reqCardDirect : reqCardMember).join("");
  const emp = $("#rfpEmpty"); if (emp) { emp.hidden = list.length > 0; emp.textContent = rfpSub === "direct" ? "맞춤 업체에 직접 요청한 견적이 없어요. ‘맞춤 업체 찾아 직접 요청’에서 시작해보세요." : "견적 요청이 없어요. ‘견적 요청’으로 여러 파트너 견적을 받아보세요."; }
  updateRfpTimers();
}
// #3a: 라이브 카운트다운 (선정 마감) — 30초마다 갱신
function updateRfpTimers() {
  document.querySelectorAll("[data-deadline]").forEach((el) => {
    const dl = el.getAttribute("data-deadline"); if (!dl) return;
    let diff = new Date(dl + "T23:59:59").getTime() - Date.now();
    if (diff <= 0) { el.innerHTML = "⏳ 선정 마감됨"; el.classList.add("is-over"); return; }
    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const h = Math.floor(diff / 3600000); diff -= h * 3600000;
    const m = Math.floor(diff / 60000);
    el.classList.toggle("is-urgent", d === 0);
    el.innerHTML = d > 0 ? `⏳ 선정 마감 <b>D-${d}</b> · ${h}시간 ${m}분` : `🔥 마감까지 <b>${h}시간 ${m}분</b>`;
  });
}
if (!window._rfpTick) window._rfpTick = setInterval(function () { updateRfpTimers(); }, 30000);
// #3b: 들어온 견적 1:1 비교 모달 (카테고리별, 금액·구성·평점)
function openQuoteCompare(reqId) {
  const r = window.REQUESTS.find(reqId); if (!r) return;
  const um = (window.AUTH.users() || []).reduce((m, u) => { m[u.userId] = u; return m; }, {});
  const cats = (r.cats || []).map((c) => {
    const qs = window.QUOTES.forReq(reqId).filter((q) => q.cat === c).sort((a, b) => (+a.price || 0) - (+b.price || 0)).slice(0, 3);
    return { c: c, label: reqCatById(c).label, qs: qs };
  }).filter((x) => x.qs.length);
  if (!cats.length) { toast("아직 비교할 견적이 없어요"); return; }
  const min = (qs) => Math.min(...qs.map((q) => +q.price || 0));
  const body = cats.map((cat) => {
    const lo = min(cat.qs);
    const cols = cat.qs.map((q) => {
      const v = um[q.vendorId] || {};
      const nm = q.cat === "space" ? (q.spaceName || "공간") : (q.vendorName || v.nick || "파트너");
      const rating = q.cat === "space" ? (getAllSpaces().find((s) => String(s.id) === String(q.spaceId)) || {}).rating : v.manner;
      const isAcc = q.status === "accepted";
      return `<div class="qcmp-col${(+q.price || 0) === lo ? " is-low" : ""}">
        <div class="qcmp-col__nm">${nm}${(+q.price || 0) === lo ? ` <span class="qcmp-low">최저가</span>` : ""}</div>
        <div class="qcmp-col__price">${won(q.price)}원</div>
        <div class="qcmp-col__rate">${rating ? `${iconSVG("star", 12)} ${rating}` : "신규"}</div>
        <div class="qcmp-col__desc">${(q.desc || "-").replace(/</g, "&lt;").slice(0, 80)}</div>
        <button class="btn btn--xs ${isAcc ? "btn--soft" : "btn--accent"}" data-cmppick="${q.id}" ${isAcc ? "disabled" : ""}>${isAcc ? "선정됨" : "이 견적 선택"}</button>
      </div>`;
    }).join("");
    return `<div class="qcmp-cat"><div class="qcmp-cat__h">${cat.label} <span>${cat.qs.length}개 비교</span></div><div class="qcmp-cols">${cols}</div></div>`;
  }).join("");
  modal.hidden = false; modalCard.classList.add("modal__card--wide");
  modalCard.innerHTML = `<div class="modal__head"><b>${iconSVG("stats", 16)} 견적 1:1 비교</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="share__sub">${r.region || ""} · ${r.date || ""} · 항목별 최저가·구성·평점을 나란히 비교하세요.</p>${body}`;
}
// 하위탭 전환
document.addEventListener("click", (e) => { const b = e.target.closest(".rfp-subtab"); if (b) { rfpSub = b.dataset.sub; renderRfp(); } });

// ---------- 견적 요청: 파트너(들어온 요청·내 견적) ----------
function vqStatusRow(q, r, closed) {
  const catTaken = window.QUOTES.forReq(r.id).some((x) => x.cat === q.cat && x.status === "accepted");
  let st, actions;
  if (q.status === "accepted") {
    st = `<span class="quote-badge">🎉 선택됨</span>`;
    actions = `<button class="btn btn--soft btn--sm" data-qchat="${q.id}">채팅</button>`;
  } else if (catTaken) {
    st = `<span class="mp__sub">다른 파트너 선정</span>`; actions = "";
  } else {
    st = `<span class="vq-row__st">검토 중</span>`;
    actions = closed ? "" : `<button class="btn btn--soft btn--sm" data-editq="${q.id}">수정</button><button class="btn btn--danger btn--sm" data-delq="${q.id}">삭제</button><button class="btn btn--soft btn--sm" data-qchat="${q.id}">채팅</button>`;
  }
  return `<div class="vq-row"><span class="vq-row__cat">${reqCatById(q.cat).label}</span><b class="vq-row__price">${won(q.price)}원</b>${st}<span class="vq-row__act">${actions}</span></div>`;
}
function vreqCard(r) {
  const myQuotes = window.QUOTES.forReq(r.id).filter((q) => q.vendorId === me);
  const myCats = (auth.serviceCats || []).filter((c) => r.cats.includes(c));
  const quoted = new Set(myQuotes.map((q) => q.cat));
  const remaining = myCats.filter((c) => !quoted.has(c));
  const expired = r.deadline && todayStr > r.deadline;
  const closed = r.status === "closed" || expired;

  const rows = myQuotes.length ? `<div class="vq-list">${myQuotes.map((q) => vqStatusRow(q, r, closed)).join("")}</div>` : "";
  // 내 견적이 확정된 경우, 회원이 확정한 이용 공간(주소)을 안내 — 배송·셋팅 협의용
  let spaceBanner = "";
  if (myQuotes.some((q) => q.status === "accepted")) {
    const sp = window.QUOTES.forReq(r.id).find((q) => q.cat === "space" && q.status === "accepted");
    if (sp) {
      const s = getAllSpaces().find((x) => String(x.id) === String(sp.spaceId));
      const addr = s ? s.region : "";
      spaceBanner = `<div class="vq-space">📍 <b>이용 공간</b> · ${sp.spaceName}${addr ? ` — ${addr}` : ""}<div class="vq-space__sub">이용일 ${r.date}${timeRange(r) ? ` ${timeRange(r)}` : ""} · 요청자 ${r.memberName || "회원"} · 채팅으로 도착·셋팅을 협의하세요.</div></div>`;
    } else {
      spaceBanner = `<div class="vq-space vq-space--wait">📍 이용 공간은 회원이 공간을 확정하면 여기에 표시돼요.</div>`;
    }
  }
  // B-1: 확정된 내 견적의 현장 진행 상태 트래커
  const acceptedMine = myQuotes.filter((q) => q.status === "accepted");
  const jobTrk = acceptedMine.map((q) => jobTracker(q, r)).join("");
  // B-2: 1일 처리 한도(CAPA) — 그 날짜 확정 건이 한도에 도달하면 신규 견적 차단
  const meU = window.AUTH.users().find((x) => x.userId === me) || {};
  const cap = +(meU.dailyCap || 0);
  const dayAccepted = cap ? window.QUOTES.byVendor(me).filter((x) => x.status === "accepted" && ((window.REQUESTS.find(x.requestId) || {}).date === r.date)).length : 0;
  const capFull = cap > 0 && dayAccepted >= cap && !myQuotes.length;
  let mainBtn = "";
  if (capFull) mainBtn = `<span class="vq-capfull">🚫 이 날 처리 한도(${cap}팀/일) 초과 · 신규 견적 불가</span>`;
  else if (!closed && remaining.length) mainBtn = `<button class="btn btn--accent btn--sm hreq-cta" data-quote="${r.id}">${myQuotes.length ? `견적 추가 (${remaining.length}개) →` : "견적 제출하기 →"}</button>`;
  else if (myQuotes.length && !closed) mainBtn = `<button class="btn btn--soft btn--sm hreq-done" data-editq="${myQuotes[0].id}">✓ 제안 완료 · 관리</button>`;
  else if (!myQuotes.length) mainBtn = `<span class="mp__sub">${expired ? "입찰 마감 (이용일 임박)" : "마감된 요청"}</span>`;
  const purpose = (r.detail || "").split("\n")[0].trim();
  const needList = r.cats.map((c) => reqCatById(c).label).join(", ");
  return `<div class="mp-bk" data-reqid="${r.id}">
    <div class="mp-bk__top hreq-top">
      <div class="mp-bk__info mp-bk__info--click hreq-info" data-reqdetail="${r.id}">
        <div class="hreq-info__row"><div class="mp-book__name">${r.directVendorId ? `<span class="rq-direct">🎯 직접 요청</span> ` : ""}${r.region} · ${r.date}${timeRange(r) ? ` · ${timeRange(r)}` : ""}${r.capacity ? ` · ${r.capacity}인` : ""}</div>${deadlineBadge(r)}</div>
        <div class="mp-book__meta">요청: ${needList}${r.deadline ? ` · 입찰마감 ${r.deadline} · ` : " · "}${window.timeago(r.ts)} 접수</div>
      </div>
      <div class="hreq-right">
        <span class="mp-book__status ${closed ? "st-gray" : "st-green"}">${closed ? (r.status === "closed" ? "마감" : "입찰마감") : "모집중"}</span>
        <div class="hreq-budget${r.budget ? "" : " hreq-budget--none"}"><span class="hreq-budget__l">희망 예산</span>${r.budget ? `<b class="hreq-budget__v">${won(r.budget)}<em>원</em></b>` : `<b class="hreq-budget__v hreq-budget__v--none">협의</b>`}</div>
      </div>
    </div>
    ${purpose ? `<div class="hreq-purpose"><span class="hreq-purpose__t">🎯 요청 목적</span><span class="hreq-purpose__x">${purpose.replace(/</g, "&lt;")}</span></div>` : ""}
    ${rows}
    ${spaceBanner}
    ${jobTrk}
    <div class="mp-bk__act mp-bk__act--right"><button class="btn btn--outline btn--sm" data-reqdetail="${r.id}">상세 보기</button>${mainBtn}</div>
  </div>`;
}
// B-1: 현장 상태 단계 이동 + 게스트·호스트 알림
function advanceJob(qid, dir) {
  const q = window.QUOTES.list().find((x) => String(x.id) === String(qid)); if (!q) return;
  if (!q.paid) { toast("결제 완료 후 진행 상태를 바꿀 수 있어요"); return; }
  const S = window.JOBSTAGE.STAGES, next = window.JOBSTAGE.get(qid) + dir;
  if (next < 0 || next >= S.length) return;
  window.JOBSTAGE.set(qid, next);
  const r = window.REQUESTS.find(q.requestId) || {};
  const label = reqCatById(q.cat).label;
  if (dir > 0 && window.NOTIF) {
    if (r.memberId) window.NOTIF.add({ forUser: r.memberId, title: `현장 상태 업데이트 · ${label}`, sub: `${S[next]} · ${auth.nick || "파트너"}`, link: "mypage.html?tab=rfp" });
    const sp = window.QUOTES.forReq(q.requestId).find((x) => x.cat === "space" && x.status === "accepted");
    if (sp && sp.vendorId && window.NOTIF) window.NOTIF.add({ forUser: sp.vendorId, title: `부대서비스 현장 상태 · ${label}`, sub: `${S[next]} · 이용일 ${r.date || ""}`, link: "mypage.html" });
  }
  renderVreq();
  toast(`현장 상태를 ‘${S[next]}’로 변경했어요${dir > 0 ? " · 게스트에게 알림 전송" : ""}`);
}
// B-1: 현장 진행 상태 트래커 (맞춤업체용) — 게스트·호스트와 상황 공유
function jobTracker(q, r) {
  const S = window.JOBSTAGE.STAGES, cur = window.JOBSTAGE.get(q.id);
  const paid = !!q.paid;
  const steps = S.map((l, i) => `<div class="jobtrk__step${i < cur ? " is-done" : ""}${i === cur ? " is-cur" : ""}"><span class="jobtrk__dot">${i < cur ? "✓" : i + 1}</span><span class="jobtrk__l">${l}</span></div>`).join("<span class='jobtrk__line'></span>");
  const act = !paid
    ? `<span class="jobtrk__wait">💳 결제 완료 후 진행 상태를 업데이트할 수 있어요</span>`
    : `${cur > 0 ? `<button class="btn btn--soft btn--xs" data-jobback="${q.id}">이전 단계</button>` : ""}${cur < S.length - 1 ? `<button class="btn btn--accent btn--xs" data-jobnext="${q.id}">‘${S[cur + 1]}’로 →</button>` : `<span class="jobtrk__fin">✓ 회수·마감 완료</span>`}`;
  return `<div class="jobtrk"><div class="jobtrk__h">🚚 ${reqCatById(q.cat).label} 현장 진행 <span>게스트·호스트와 실시간 공유</span></div><div class="jobtrk__steps">${steps}</div><div class="jobtrk__act">${act}</div></div>`;
}
// 들어온 요청 — 상태(모집중/제안완료/마감) + 기간 필터 (호스트 공간 견적요청과 동일 UX)
function renderVreq() {
  const cats = auth.serviceCats || [];
  const iBid = (r) => window.QUOTES.forReq(r.id).some((q) => q.vendorId === me);
  const relevant = window.REQUESTS.list().filter((r) => {
    if (r.blinded) return false;
    if (!(r.directVendorId ? r.directVendorId === me : r.cats.some((c) => cats.includes(c)))) return false;
    // 마감·이용일 지난 요청은 내가 입찰한 건만 이력으로 유지, 미응찰 데드리드는 자동 제외
    if (reqDead(r) && !iBid(r)) return false;
    return true;
  });
  const stOf = (r) => {
    if (reqDead(r)) return "closed";
    const quoted = new Set(window.QUOTES.forReq(r.id).filter((q) => q.vendorId === me).map((q) => q.cat));
    const myCats = r.directVendorId ? r.cats : r.cats.filter((c) => cats.includes(c));
    return myCats.some((c) => !quoted.has(c)) ? "open" : "proposed";
  };
  const VST = [["all", "전체"], ["open", "모집중"], ["proposed", "제안 완료"], ["closed", "마감"]];
  const cnt = { all: relevant.length, open: 0, proposed: 0, closed: 0 };
  relevant.forEach((r) => { cnt[stOf(r)] = (cnt[stOf(r)] || 0) + 1; });
  const bd = $("#vreqBadge"); if (bd) { bd.textContent = cnt.open; bd.hidden = cnt.open === 0; }
  let shown = relevant.filter((r) => periodMatch(r.date, vreqPeriod, vreqFrom, vreqTo));
  if (vreqStatusF !== "all") shown = shown.filter((r) => stOf(r) === vreqStatusF);
  shown = shown.slice().sort((a, b) => ((a.date || "") < (b.date || "") ? 1 : -1));
  const statusBar = `<div class="mp-seg mp-seg--status">${VST.map(([v, l]) => `<button class="mp-seg__b${vreqStatusF === v ? " is-on" : ""}" data-vreqstatus="${v}">${l} <b>${cnt[v] || 0}</b></button>`).join("")}</div>`;
  const bar = `<div class="mp-toolbar">${statusBar}${periodBar(vreqPeriod, "vreq", vreqFrom, vreqTo)}</div>`;
  const el = $("#vreqList"); if (!el) return;
  el.innerHTML = bar + (shown.length ? shown.map(vreqCard).join("") : `<div class="mp-empty">해당 조건의 견적 요청이 없어요.</div>`);
  const emp = $("#vreqEmpty"); if (emp) emp.hidden = true;
}
// B-3: 연동 현황 — 내 서비스가 연결된 공간 상태 + 참여 패키지 판매
function renderVlink() {
  const wrap = $("#vlinkWrap"); if (!wrap) return;
  const myAcc = window.QUOTES.byVendor(me).filter((q) => q.status === "accepted");
  let warnN = 0;
  const spaceRows = myAcc.map((q) => {
    const r = window.REQUESTS.find(q.requestId) || {};
    const sp = window.QUOTES.forReq(q.requestId).find((x) => x.cat === "space" && x.status === "accepted");
    const s = sp ? getAllSpaces().find((x) => String(x.id) === String(sp.spaceId)) : null;
    let stt, cls;
    if (!sp || !s) { stt = "공간 미확정 · 회원 선택 대기"; cls = "wait"; }
    else if (typeof isSpaceHidden === "function" && isSpaceHidden(s.id)) { stt = "🔒 호스트가 공간 숨김 · 확인 필요"; cls = "warn"; warnN++; }
    else if (window.BLOCKS && window.BLOCKS.has(s.id, r.date)) { stt = "🚫 그 날짜 휴업·공사 차단 · 확인 필요"; cls = "warn"; warnN++; }
    else { stt = "✅ 정상 운영 중"; cls = "ok"; }
    const js = q.paid && window.JOBSTAGE ? ` · 현장 ${window.JOBSTAGE.label(q.id)}` : "";
    return `<div class="vlink-row vlink-row--${cls}"><div class="vlink-row__l"><b>${reqCatById(q.cat).label}</b><span>${r.date || "-"}${sp ? " · " + (sp.spaceName || "공간") : ""} · ${r.memberName || "회원"}${js}</span></div><span class="vlink-row__st vlink-st--${cls}">${stt}</span></div>`;
  }).join("");
  const pkgs = (typeof PACKAGES !== "undefined" ? PACKAGES : []).filter((p) => (p.items || []).some((it) => it.partnerId === me));
  const pkgRows = pkgs.map((p) => {
    const sold = window.BOOKINGS.list().filter((b) => b.pkg && String(b.pkgId) === String(p.id) && b.status === "confirmed" && b.paid !== false).length;
    const myItem = (p.items || []).find((it) => it.partnerId === me) || {};
    return `<div class="vlink-row"><div class="vlink-row__l"><b>📦 ${p.title}</b><span>내 구성: ${myItem.label || "-"} · ${won(myItem.price || 0)}원</span></div><span class="vlink-row__st">판매 <b>${sold}</b>건</span></div>`;
  }).join("");
  const bd = $("#vlinkBadge"); if (bd) { bd.textContent = warnN; bd.hidden = warnN === 0; }
  wrap.innerHTML = `
    <h2 class="sp-sec__title" style="margin-bottom:6px">연동 현황</h2>
    <p class="mp__sub" style="margin-bottom:16px">내 서비스가 연결된 공간·패키지의 상태를 한눈에 확인하세요.${warnN ? ` <b style="color:#b45309">확인 필요 ${warnN}건</b>` : ""}</p>
    <h3 class="mg-h">🔗 연동 공간 상태 <span class="mg-h__s">확정 건의 이용 공간 · 호스트 숨김/차단 감지</span></h3>
    ${spaceRows || `<div class="mp-empty">확정된 연동 공간이 없어요.</div>`}
    <h3 class="mg-h" style="margin-top:22px">📦 참여 패키지 판매 현황</h3>
    ${pkgRows || `<div class="mp-empty">참여 중인 패키지가 없어요.</div>`}`;
}
// 내 견적 — 제출한 견적 관리 (상태·수정·삭제·채팅)
function renderVquote() {
  const list = window.QUOTES.byVendor(me);
  $("#vquoteList").innerHTML = list.map((q) => {
    const r = window.REQUESTS.find(q.requestId) || {};
    const catTaken = window.QUOTES.forReq(q.requestId).some((x) => x.cat === q.cat && x.status === "accepted");
    let st, actions;
    if (q.status === "accepted") { st = `<span class="mp-book__status st-green">🎉 선택됨</span>`; actions = `<button class="btn btn--soft btn--sm" data-qchat="${q.id}">채팅</button>`; }
    else if (catTaken) { st = `<span class="mp-book__status st-gray">다른 파트너 선정</span>`; actions = ""; }
    else { st = `<span class="mp-book__status st-amber">검토 중</span>`; actions = `<button class="btn btn--soft btn--sm" data-editq="${q.id}">수정</button><button class="btn btn--danger btn--sm" data-delq="${q.id}">삭제</button><button class="btn btn--soft btn--sm" data-qchat="${q.id}">채팅</button>`; }
    return `<div class="mp-bk"><div class="mp-bk__top"><div class="mp-bk__info"><div class="mp-book__name">${reqCatById(q.cat).label} · ${won(q.price)}원${q.paid ? ` <span class="pay-done">✓ 결제완료</span>` : ""}</div><div class="mp-book__meta">${r.directVendorId ? "🎯 직접 · " : "🔨 견적 요청 · "}${r.region || ""} · ${r.date || ""}</div></div>${st}</div>${q.desc ? `<div class="mp-bk__policy">${q.desc}</div>` : ""}<div class="mp-bk__act">${actions}</div></div>`;
  }).join("");
  $("#vquoteEmpty").hidden = list.length > 0;
}
// 정산 — 확정 견적 기준 매출·수수료·정산액 (파트너)
// ── 정산 내역 상세·엑셀·계좌 (호스트·파트너 공용) ──
let settleItemsCache = [], _settleLabel = "";
function settleItemFor(kind, o) {
  if (kind === "host") {
    const pd = window.OPS ? window.OPS.payDateOf(o) : (o.date || "");
    const rate = window.OPS ? window.OPS.rateFor("host", me, pd) : 0.1;
    const fpct = window.FEERATES ? window.FEERATES.pctOn("host", me, pd) : 5;
    const sp = window.OPS ? window.OPS.split("host", o.total, rate) : { gross: o.total, provider: window.settleOf(o), wylie: o.total - window.settleOf(o) };
    const s = getAllSpaces().find((x) => String(x.id) === String(o.spaceId));
    return { id: o.id, date: o.date, time: (o.start != null ? `${pad(o.start)}:00~${pad(o.start + o.hours)}:00` : ""), customer: o.guestName || "게스트", item: o.spaceName || "공간", place: (s && s.region) || "", note: o.detail || "", gross: sp.gross, fee: sp.wylie, feePct: fpct, payout: sp.provider, paid: o.paid !== false, kind: "host" };
  }
  const r = window.REQUESTS.find(o.requestId) || {};
  const pd = window.OPS ? window.OPS.payDateOf(o) : (o.date || "");
  const vrate = window.OPS ? window.OPS.rateFor("vendor", me, pd) : 0.05;
  const vpct = window.FEERATES ? window.FEERATES.pctOn("vendor", me, pd) : 5;
  const sp = window.OPS ? window.OPS.split("vendor", +o.price || 0, vrate) : { gross: +o.price || 0, provider: Math.round((+o.price || 0) * 0.95), wylie: Math.round((+o.price || 0) * 0.05) };
  return { id: o.id, date: r.date || o.date || "", time: timeRange(r) || "", customer: r.memberName || "의뢰인", item: reqCatById(o.cat).label, place: r.region || "", note: (r.catNotes && r.catNotes[o.cat]) || r.detail || "", gross: sp.gross, fee: sp.wylie, feePct: vpct, payout: sp.provider, paid: !!o.paid, kind: "vendor" };
}
function settleItemCard(it) {
  return `<div class="mp-bk settle-item settle-item--rich">
    <div class="settle-item__head">
      <div class="settle-item__title"><b>${it.item}</b><span class="settle-st ${it.paid ? "is-paid" : "is-wait"}">${it.paid ? "결제완료" : "결제대기"}</span></div>
      <div class="settle-item__acts">
        <button type="button" class="btn btn--soft btn--sm" data-rcptset="${it.id}">🧾 결제 영수증</button>
        <button type="button" class="btn btn--soft btn--sm" data-taxset="${it.id}">📄 국세청 승인 조회</button>
      </div>
    </div>
    <div class="settle-item__meta">👤 ${it.customer}${it.place ? ` · ${it.place}` : ""} · ${it.date}${it.time ? ` · ${it.time}` : ""}${it.note ? ` · ${String(it.note).replace(/</g, "&lt;").slice(0, 40)}` : ""}</div>
    <div class="settle-item__nums">
      <span class="settle-num"><i>거래액</i><b>${won(it.gross)}원</b></span>
      <span class="settle-num settle-num--fee"><i>수수료(${it.feePct}%)</i><b>-${won(it.fee)}원</b></span>
      <span class="settle-num settle-num--pay"><i>최종 입금액</i><b>${won(it.payout)}원</b></span>
    </div>
  </div>`;
}
// 정산 목록 정렬 (날짜순·금액순·결제상태순 · 오름/내림)
function sortSettleItems(items) {
  const dir = setDir === "asc" ? 1 : -1;
  return items.slice().sort((a, b) => {
    if (setSort === "amount") { if (a.gross !== b.gross) return (a.gross - b.gross) * dir; }
    else if (setSort === "status") { const sa = a.paid ? 1 : 0, sb = b.paid ? 1 : 0; if (sa !== sb) return (sa - sb) * dir; }
    const ka = (a.date || "") + (a.time || ""), kb = (b.date || "") + (b.time || "");
    return ka < kb ? -dir : ka > kb ? dir : 0;
  });
}
// 정산 목록 툴바 (날짜 지정 + 정렬)
function settleControls() {
  const sortBtn = (key, label) => `<button type="button" class="mp-sort__b${setSort === key ? " is-on" : ""}" data-setsort="${key}">${label}${setSort === key ? `<span class="mp-sort__ar">${setDir === "asc" ? "▲" : "▼"}</span>` : ""}</button>`;
  return `<div class="settle-filter">
    <div class="settle-range">${iconSVG("calendar", 14)}<input type="date" id="setFrom" value="${setFrom || ""}" aria-label="시작일" /><span class="settle-range__t">~</span><input type="date" id="setTo" value="${setTo || ""}" aria-label="종료일" />${setPeriod === "custom" ? `<button type="button" class="btn btn--ghost btn--xs" data-setclear>초기화</button>` : ""}</div>
    <div class="mp-sort"><span class="mp-sort__l">정렬</span>${sortBtn("date", "날짜순")}${sortBtn("amount", "금액순")}${sortBtn("status", "결제상태순")}</div>
  </div>`;
}
// 필터된 목록 합계 요약
function settleSumBar(items) {
  const g = items.reduce((a, x) => a + (x.gross || 0), 0);
  const f = items.reduce((a, x) => a + (x.fee || 0), 0);
  const p = items.reduce((a, x) => a + (x.payout || 0), 0);
  const wait = items.filter((x) => !x.paid).length;
  return `<div class="settle-sumbar"><span>총 <b>${items.length}건</b>${wait ? ` · 결제대기 <b class="settle-sumbar__wait">${wait}건</b>` : ""}</span><span class="settle-sumbar__r">거래액 <b>${won(g)}원</b> · 수수료 <b>-${won(f)}원</b> · 입금액 <b class="settle-sumbar__pay">${won(p)}원</b></span></div>`;
}
// 요청 건 결제 영수증 일괄 다운로드 (일괄결제 = 합계 1건·승인번호 1개)
function reqReceiptBtn(r) {
  const paid = window.QUOTES.forReq(r.id).filter((q) => q.status === "accepted" && q.paid);
  return paid.length ? `<button class="btn btn--soft btn--sm" data-reqreceipt="${r.id}">🧾 영수증 일괄 다운로드</button>` : "";
}
function downloadReqReceipt(rid) {
  const r = window.REQUESTS.find(rid); if (!r) return;
  const paid = window.QUOTES.forReq(rid).filter((q) => q.status === "accepted" && q.paid);
  if (!paid.length) { toast("결제된 견적이 없어요"); return; }
  const esc = (s) => String(s == null ? "" : s);
  // 결제 회차(주문)별 그룹 — 같은 회차는 승인번호 1개 공유 (orderId 없으면 견적 단위 대체)
  const groups = {}; paid.forEach((q) => { const k = q.orderId || ("q:" + q.id); (groups[k] = groups[k] || []).push(q); });
  const keys = Object.keys(groups);
  const grand = paid.reduce((a, q) => a + (+q.price || 0), 0);
  const sections = keys.map((k, idx) => {
    const qs = groups[k];
    const otot = qs[0].orderTotal || qs.reduce((a, q) => a + (+q.price || 0), 0);
    const pp = window.OPS ? window.OPS.payInfo({ id: k, date: r.date, total: otot, ts: qs[0].paidAt }) : null;
    const trs = qs.map((q) => `<tr><td>${reqCatById(q.cat).label}</td><td>${q.cat === "space" ? (q.spaceName || "공간") : (q.vendorName || "파트너")}</td><td class="r">${won(q.price)}원</td></tr>`).join("");
    return `<div class="ord"><div class="ord__hd">결제 ${idx + 1}회차 · 승인번호 ${pp ? pp.approvalNo : "-"} · ${pp ? pp.approvedAt : ""}</div><table><thead><tr><th>품목</th><th>공급자</th><th class="r">금액</th></tr></thead><tbody>${trs}</tbody></table><div class="ord__ft">회차 합계 <b>${won(otot)}원</b>${pp ? " · " + pp.card + " " + pp.cardNo : ""}${pp ? " · 세금계산서 " + pp.taxNo : ""}</div></div>`;
  }).join("");
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>공간잇다 영수증 ${esc(r.date)}</title>
<style>body{font-family:-apple-system,"Malgun Gothic","맑은 고딕",sans-serif;background:#f4f5f8;color:#181b22;margin:0;padding:32px;word-break:keep-all;}
.rc{max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e8ee;border-radius:14px;overflow:hidden;}
.rc__hd{background:#181b22;color:#fff;padding:16px 22px;font-weight:800;}
.rc__hd span{display:block;font-size:.72rem;opacity:.7;font-weight:600;margin-top:2px;}
.rc__b{padding:18px 22px;}
.rc__meta{font-size:.82rem;color:#6b7280;margin-bottom:14px;}
table{width:100%;border-collapse:collapse;font-size:.9rem;margin-bottom:8px;}
th,td{text-align:left;padding:9px 6px;border-bottom:1px dashed #eef1f5;}
th{font-size:.72rem;color:#6b7280;text-transform:uppercase;}
td.r,th.r{text-align:right;}
.calc{border-top:1px solid #e5e8ee;padding-top:12px;margin-top:8px;font-size:.9rem;}
.calc .row{display:flex;justify-content:space-between;padding:3px 0;color:#6b7280;}
.calc .tot{color:#181b22;font-weight:800;font-size:1.1rem;border-top:1px solid #e5e8ee;margin-top:6px;padding-top:10px;}
.calc .tot b{color:#4f46e5;}
.pay{margin-top:14px;background:#f8f9fb;border-radius:10px;padding:12px 14px;font-size:.84rem;}
.pay div{display:flex;justify-content:space-between;padding:2px 0;}
.pay span{color:#6b7280;}.pay b{font-weight:700;}
.ord{border:1px solid #e5e8ee;border-radius:10px;padding:12px 14px;margin-bottom:12px;}
.ord__hd{font-size:.8rem;font-weight:800;color:#4f46e5;margin-bottom:8px;}
.ord__ft{font-size:.78rem;color:#6b7280;margin-top:6px;}
.foot{padding:12px 22px;font-size:.72rem;color:#9aa1ad;background:#f8f9fb;border-top:1px dashed #e5e8ee;}
@media print{body{background:#fff;padding:0;}.rc{border:0;}}</style></head>
<body><div class="rc">
  <div class="rc__hd">공간잇다 결제 영수증 <span>신용카드 매출전표 · 결제 ${keys.length}회차</span></div>
  <div class="rc__b">
    <div class="rc__meta">이용예정일 <b>${esc(r.date)}</b> · 지역 ${esc(r.region || "-")} · 결제자 ${esc(r.memberName || "본인")}</div>
    ${sections}
    <div class="calc"><div class="row tot"><span>전체 결제 합계</span><b>${won(grand)}원</b></div></div>
  </div>
  <div class="foot">공간잇다(주식회사 와일리) · 통신판매중개자로서 개별 공급자 상품·서비스 거래의 당사자가 아닙니다. 회차별 승인번호는 각 결제 건에 대응합니다. (데모 영수증)</div>
</div></body></html>`;
  const blob = new Blob(["﻿" + html], { type: "text/html;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `공간잇다_영수증_${esc(r.date || todayStr)}.html`;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 150);
  toast("영수증을 내려받았어요 (열어서 인쇄·PDF 저장 가능)");
}
// 결제 영수증 (카드 매출전표) — 게스트·호스트·업체 공용. 예약/정산 정보로 결정론적 생성
function openReceipt(b) {
  const p = window.OPS && window.OPS.payInfo ? window.OPS.payInfo({ id: b.id, date: b.date, total: b.total != null ? b.total : b.gross, ts: b.ts, paidAt: b.paidAt }) : null;
  if (!p) { toast("영수증 정보를 불러올 수 없어요"); return; }
  const name = b.spaceName || b.item || "결제";
  const when = (b.start != null && b.hours != null) ? `${b.date} ${pad(b.start)}:00~${pad(b.start + b.hours)}:00` : (b.time ? `${b.date} ${b.time}` : (b.date || "-"));
  modal.hidden = false; modalCard.classList.remove("modal__card--wide");
  modalCard.innerHTML = `<div class="modal__head"><b>결제 영수증</b><button class="modal__x" data-mclose>✕</button></div>
    <div class="rcpt">
      <div class="rcpt__brand">${iconSVG("card", 16)} 공간잇다 <span>신용카드 매출전표 (데모)</span></div>
      <div class="rcpt__rows">
        <div class="rcpt__r"><span>상품</span><b>${b.pkg ? "📦 " : ""}${name}</b></div>
        <div class="rcpt__r"><span>이용일시</span><b>${when}</b></div>
        ${b.customer ? `<div class="rcpt__r"><span>결제자</span><b>${b.customer}</b></div>` : ""}
        <div class="rcpt__r"><span>결제수단</span><b>${p.method} · ${p.card}</b></div>
        <div class="rcpt__r"><span>카드번호</span><b>${p.cardNo}</b></div>
        <div class="rcpt__r"><span>할부</span><b>${p.installment}</b></div>
        <div class="rcpt__r"><span>승인번호</span><b>${p.approvalNo}</b></div>
        <div class="rcpt__r"><span>승인일시</span><b>${p.approvedAt}</b></div>
      </div>
      <div class="rcpt__calc">
        <div class="rcpt__c"><span>공급가액</span><span>${won(p.supply)}원</span></div>
        <div class="rcpt__c"><span>부가세(VAT)</span><span>${won(p.vat)}원</span></div>
        <div class="rcpt__c rcpt__c--total"><span>결제 금액</span><b>${won(p.total)}원</b></div>
      </div>
      <div class="rcpt__foot">${iconSVG("shield", 13)} 국세청 전자세금계산서 승인번호 <b>${p.taxNo}</b></div>
    </div>`;
}
// 주문(결제 회차) 단위 영수증 — 1회 결제 = 승인번호 1개, 항목 여러 개 명세
function openOrderReceipt(orderId) {
  const qs = window.QUOTES.list().filter((q) => q.orderId === orderId);
  if (!qs.length) { toast("주문 정보를 찾을 수 없어요"); return; }
  const total = qs[0].orderTotal || qs.reduce((a, q) => a + (+q.price || 0), 0);
  const date = (window.REQUESTS.find(qs[0].requestId) || {}).date || "";
  const p = window.OPS ? window.OPS.payInfo({ id: orderId, date: date, total: total, ts: qs[0].paidAt }) : null;
  const supply = Math.round(total / 1.1), vat = total - supply;
  const rows = qs.map((q) => `<div class="rcpt__r"><span>${reqCatById(q.cat).label} · ${q.cat === "space" ? (q.spaceName || "공간") : (q.vendorName || "파트너")}</span><b>${won(q.price)}원</b></div>`).join("");
  modal.hidden = false; modalCard.classList.remove("modal__card--wide");
  modalCard.innerHTML = `<div class="modal__head"><b>결제 영수증</b><button class="modal__x" data-mclose>✕</button></div>
    <div class="rcpt">
      <div class="rcpt__brand">${iconSVG("card", 16)} 공간잇다 <span>신용카드 매출전표 · 항목 ${qs.length}건</span></div>
      <div class="rcpt__rows">${rows}</div>
      <div class="rcpt__calc">
        <div class="rcpt__c"><span>공급가액</span><span>${won(supply)}원</span></div>
        <div class="rcpt__c"><span>부가세(VAT)</span><span>${won(vat)}원</span></div>
        <div class="rcpt__c rcpt__c--total"><span>결제 합계</span><b>${won(total)}원</b></div>
      </div>
      ${p ? `<div class="rcpt__rows" style="border-top:1px solid var(--line)">
        <div class="rcpt__r"><span>결제수단</span><b>${p.method} · ${p.card}</b></div>
        <div class="rcpt__r"><span>카드번호</span><b>${p.cardNo}</b></div>
        <div class="rcpt__r"><span>승인번호</span><b>${p.approvalNo}</b></div>
        <div class="rcpt__r"><span>승인일시</span><b>${p.approvedAt}</b></div>
      </div>` : ""}
      <div class="rcpt__foot">${iconSVG("shield", 13)} 1회 결제(주문) = 승인번호 1개 · 국세청 전자세금계산서 승인번호 ${p ? p.taxNo : "-"}</div>
    </div>`;
}
// 국세청 승인 조회 — 플랫폼 이용료(수수료)분 전자세금계산서 (호스트·업체 정산용)
function openTaxMP(it) {
  const p = window.OPS && window.OPS.payInfo ? window.OPS.payInfo({ id: it.id, date: it.date, total: it.fee }) : null;
  const supply = Math.round(it.fee / 1.1), vat = it.fee - supply;
  modal.hidden = false; modalCard.classList.remove("modal__card--wide");
  modalCard.innerHTML = `<div class="modal__head"><b>전자세금계산서 · 국세청 승인</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="mp__sub" style="margin-bottom:12px">플랫폼 이용료(수수료)에 대해 결제 시 <b>국세청 e세로</b>로 전자세금계산서가 자동 발급됩니다. 별도 수기 발행이 없습니다.</p>
    <div class="rd-rows">
      <div class="rd-row"><span>공급자</span><b>(주)와일리 · 211-88-56742</b></div>
      <div class="rd-row"><span>품목</span><b>플랫폼 이용 수수료 (${it.feePct}%)</b></div>
      <div class="rd-row"><span>공급가액</span><b>${won(supply)}원</b></div>
      <div class="rd-row"><span>세액(VAT)</span><b>${won(vat)}원</b></div>
      <div class="rd-row"><span>합계</span><b>${won(it.fee)}원</b></div>
      <div class="rd-row"><span>발급 상태</span><b class="dash-st dash-st--green">국세청 승인 완료</b></div>
      <div class="rd-row"><span>승인번호</span><b>${p ? p.taxNo : "-"}</b></div>
    </div>
    <p class="modal__note">거래: ${it.date} · ${it.customer} · ${it.item} · 데모용 모의 승인번호입니다.</p>`;
}
function exportSettleXls() {
  if (!settleItemsCache.length) { toast("내려받을 내역이 없어요"); return; }
  const rows = [["행사일", "고객명", "품목", "거래액(원)", "플랫폼수수료(원)", "최종입금액(원)", "결제상태"]].concat(settleItemsCache.map((it) => [it.date, it.customer, it.item, it.gross, it.fee, it.payout, it.paid ? "결제완료" : "결제대기"]));
  const csv = rows.map((r) => r.map((v) => { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `정산내역_${_settleLabel || "전체"}.csv`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 120);
  toast("정산 내역을 내려받았어요");
}
function openAccountEdit() {
  const u = window.AUTH.users().find((x) => x.userId === me) || {};
  const esc = (s) => (s || "").replace(/"/g, "&quot;");
  const bank0 = u.bank || (u.biz || {}).bank || "", acct0 = u.account || (u.biz || {}).account || "";
  const holder0 = u.accountHolder || (u.biz || {}).accountHolder || u.owner || (u.biz || {}).owner || "";
  const banks = window.BANKS || [];
  let acVerified = !!(u.accountVerified || (u.biz || {}).accountVerified);
  modal.hidden = false; modalCard.classList.remove("modal__card--wide");
  modalCard.innerHTML = `<div class="modal__head"><b>PG 정산 계좌 변경</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="mp__sub" style="margin-bottom:12px">PG사가 예금주 <b>실명조회</b>로 계좌를 검증하고 이 계좌로 정산금을 자동 입금합니다. 통장 사본 제출은 필요 없어요.</p>
    <div class="book__field"><label class="book__label">은행</label><select id="acBank"><option value="">은행 선택</option>${banks.map((b) => `<option value="${b}"${b === bank0 ? " selected" : ""}>${b}</option>`).join("")}</select></div>
    <div class="book__field"><label class="book__label">계좌번호</label><input type="text" id="acNum" inputmode="numeric" value="${esc(acct0)}" placeholder="'-' 없이 숫자만" /></div>
    <div class="book__field"><label class="book__label">예금주명 · 계좌 실명인증</label><div class="hf-verify"><input type="text" id="acHolder" value="${esc(holder0)}" placeholder="대표자명 또는 상호와 동일하게" /><button type="button" class="btn btn--dark" id="acVerify">계좌 인증</button></div><span class="hf-hint" id="acVerifyMsg">${acVerified ? "실명확인 완료된 계좌예요." : ""}</span></div>
    <button class="btn btn--accent btn--block" id="acSave" style="margin-top:6px">저장</button>`;
  const vbtn = $("#acVerify"); if (acVerified) { vbtn.textContent = "인증 완료 ✓"; vbtn.classList.add("is-ok"); }
  const resetV = () => { acVerified = false; vbtn.textContent = "계좌 인증"; vbtn.classList.remove("is-ok"); };
  $("#acNum").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16); resetV(); });
  $("#acBank").addEventListener("change", resetV);
  $("#acHolder").addEventListener("input", resetV);
  vbtn.addEventListener("click", () => {
    const msg = $("#acVerifyMsg");
    const r = window.PGVERIFY.check($("#acBank").value, $("#acNum").value, $("#acHolder").value, [u.owner, (u.biz || {}).owner, u.name, u.nick]);
    acVerified = r.ok;
    msg.innerHTML = (r.ok ? "" : iconSVG("alert", 13) + " ") + r.msg;
    msg.className = "hf-hint " + (r.ok ? "hf-hint--ok" : "hf-hint--err");
    vbtn.textContent = r.ok ? "인증 완료 ✓" : "계좌 인증"; vbtn.classList.toggle("is-ok", r.ok);
  });
  $("#acSave").addEventListener("click", () => {
    const bank = $("#acBank").value.trim(), acct = $("#acNum").value.trim(), holder = $("#acHolder").value.trim();
    if (bank && acct && !acVerified) { const msg = $("#acVerifyMsg"); msg.innerHTML = iconSVG("alert", 13) + " 계좌 인증을 완료해 주세요."; msg.className = "hf-hint hf-hint--err"; return; }
    const users = window.AUTH.users(); const i = users.findIndex((x) => x.userId === me);
    if (i >= 0) { users[i].bank = bank; users[i].account = acct; users[i].accountHolder = holder; users[i].accountVerified = acVerified; users[i].biz = Object.assign({}, users[i].biz, { bank, account: acct, accountHolder: holder, accountVerified: acVerified }); window.AUTH.saveUsers(users); }
    closeModal(); toast("정산 계좌를 변경했어요"); if (isHost) renderSettle(); if (isVendor) renderVsettle();
  });
}
// 정산 패널(호스트·파트너 공용) — 관리자와 동일한 ops 엔진 · 이번 달 기준
function settleRangeMP() {
  const m0 = todayStr.slice(0, 7);
  if (setPeriod === "custom" && (setFrom || setTo)) { const f = setFrom || "2000-01-01", t = setTo || "2999-12-31"; return { key: "custom", from: f, to: t, label: `${setFrom || "처음"} ~ ${setTo || "오늘"}`, month: null }; }
  if (setPeriod === "1w") return { key: "1w", from: shiftDayStr(-6), to: todayStr, label: "최근 1주", month: null };
  if (setPeriod === "1m") return { key: "1m", from: shiftDayStr(-29), to: todayStr, label: "최근 1개월", month: null };
  return { key: setMonth, from: setMonth + "-01", to: setMonth + "-31", label: `${+setMonth.slice(5)}월 정산`, month: setMonth, atNow: setMonth >= m0 };
}
function settlePanel() {
  const R = settleRangeMP();
  const inR = (d) => { d = d || ""; return d >= R.from && d <= R.to; };
  const mb = window.BOOKINGS.list().filter((b) => inR(b.date));
  const mq = window.QUOTES.list().filter((q) => { const d = q.date || (window.REQUESTS.find(q.requestId) || {}).date || ""; return inR(d); });
  const set = ((window.OPS ? window.OPS.settlement(mb, mq, {}).byProvider[me] : null)) || { gross: 0, provider: 0, wylie: 0, count: 0 };
  _settleLabel = R.label;
  const u0 = window.AUTH.users().find((x) => x.userId === me) || {};
  const bank0 = u0.bank || (u0.biz || {}).bank || "", acct0 = u0.account || (u0.biz || {}).account || "";
  const maskAcct = acct0 ? (acct0.length > 7 ? acct0.slice(0, 3) + "-****-" + acct0.slice(-4) : acct0) : "";
  const acctRow = `<div class="settle-acct">${bank0 && acct0 ? `<span class="settle-acct__i">${iconSVG("bank", 15)} <b>${bank0}</b> <code>${maskAcct}</code> <span class="settle-acct__pg">PG 실명확인 완료</span></span>` : `<span class="settle-acct__i settle-acct__i--none">${iconSVG("alert", 14)} PG 정산 계좌 미등록</span>`}<button type="button" class="btn btn--soft btn--xs" id="setAcctBtn">계좌 변경</button></div>`;
  const nav = `<div class="settle-nav"><button class="settle-nav__b" data-setnav="-1" aria-label="이전 달">‹</button><b>${R.label}</b><button class="settle-nav__b" data-setnav="1" aria-label="다음 달"${R.month && R.atNow ? " disabled" : ""}>›</button></div>`;
  const presets = `<div class="mp-seg">${[["month", "월별"], ["1w", "최근 1주"], ["1m", "최근 1개월"]].map(([v, l]) => `<button class="mp-seg__b${setPeriod === v ? " is-on" : ""}" data-setperiod="${v}">${l}</button>`).join("")}</div>`;
  const splitBar = set.provider > 0
    ? `<div class="settle-split"><div class="settle-split__bar"><i class="settle-split__done" style="flex:${Math.max(set.settled, 0.0001)}"></i><i class="settle-split__sched" style="flex:${Math.max(set.scheduled, 0.0001)}"></i></div><div class="settle-split__lbl"><span><i class="dot dot--done"></i>정산 완료 <b>${won(set.settled)}원</b></span><span><i class="dot dot--sched"></i>정산 예정 <b>${won(set.scheduled)}원</b></span></div></div>`
    : "";
  const info = set.provider > 0
    ? `<div class="payout-box payout-box--pg">${iconSVG("shield", 15)} <b>PG 자동 분리정산</b> · 고객 결제 시 플랫폼 수수료를 제외한 정산금이 <b>이용일 경과 후 정산주기에 맞춰 위 계좌로 자동 입금</b>돼요. 별도 신청이 필요 없어요.</div>`
    : `<p class="mp__sub" style="margin-top:14px">${R.label} 대상 거래가 없어요.</p>`;
  return { R, set, html: `
    <div class="settle-toolbar">${nav}${presets}</div>
    ${acctRow}
    <div class="settle-kpis">
      <div class="settle-kpi"><strong>${set.count}건</strong><span>${R.label} 확정</span></div>
      <div class="settle-kpi"><strong>${won(set.gross)}원</strong><span>거래액</span></div>
      <div class="settle-kpi"><strong>-${won(set.wylie)}원</strong><span>플랫폼 수수료</span></div>
      <div class="settle-kpi settle-kpi--hl"><strong>${won(set.provider)}원</strong><span>내 정산금</span></div>
    </div>
    ${splitBar}
    <div style="margin-top:14px">${info}</div>
    ${set.wylie > 0 ? `<button type="button" class="btn btn--soft btn--sm settle-taxbtn" id="setTaxBtn" style="margin-top:10px">${iconSVG("doc", 14)} 수수료 세금계산서 조회 · 국세청 승인</button>` : ""}` };
}
// 수수료(플랫폼 이용료) 전자세금계산서 — 공급받는 자(호스트/파트너) 관점 · 국세청 자동발급 조회
function taxInvoiceData() {
  const R = settleRangeMP();
  const inR = (d) => { d = d || ""; return d >= R.from && d <= R.to; };
  const mb = window.BOOKINGS.list().filter((b) => inR(b.date));
  const mq = window.QUOTES.list().filter((q) => { const d = q.date || (window.REQUESTS.find(q.requestId) || {}).date || ""; return inR(d); });
  const set = (window.OPS ? window.OPS.settlement(mb, mq, {}).byProvider[me] : null) || { wylie: 0 };
  const u = window.AUTH.users().find((x) => x.userId === me) || {};
  const fee = set.wylie || 0, supply = Math.round(fee / 1.1), vat = fee - supply;
  const ym = R.month || setMonth;
  const seed = (me + ym).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd = (n, len) => String((seed * n) % Math.pow(10, len)).padStart(len, "0");
  const approvNo = `${ym.replace("-", "")}01-${rnd(7, 8)}-${rnd(13, 8)}`;
  const holder = u.owner || (u.biz || {}).owner || u.name || u.nick || "본인 사업자";
  return { R, fee, supply, vat, approvNo, holder, label: R.label };
}
function openTaxViewMP() {
  const d = taxInvoiceData();
  modal.hidden = false; modalCard.className = "modal__card modal__card--narrow";
  modalCard.innerHTML = `<div class="modal__head"><b>전자세금계산서 · 수수료 (매입)</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="mp__sub" style="margin:-2px 0 14px">와일리가 발행한 <b>플랫폼 이용료(수수료)</b> 전자세금계산서예요. <b>국세청 e세로</b>로 자동 발급되며, 부가세 신고 시 <b>매입세액 공제 증빙</b>으로 사용하세요. (${d.label})</p>
    <div class="ad-taxbox">
      <div class="ad-taxbox__row"><span>공급자</span><b>공간잇다 (와일리)</b></div>
      <div class="ad-taxbox__row"><span>공급받는 자</span><b>${d.holder}</b></div>
      <div class="ad-taxbox__row"><span>공급가액(수수료)</span><b>${won(d.supply)}원</b></div>
      <div class="ad-taxbox__row"><span>부가세(10%)</span><b>${won(d.vat)}원</b></div>
      <div class="ad-taxbox__row ad-taxbox__row--tot"><span>합계</span><b>${won(d.fee)}원</b></div>
      <div class="ad-taxbox__row"><span>발급 상태</span><b class="ad-st ad-st--ok">국세청 승인 완료</b></div>
      <div class="ad-taxbox__row"><span>승인번호</span><b class="ad-taxbox__no">${d.approvNo}</b></div>
    </div>
    <div class="settle-modal__docs" style="margin-top:14px">
      <button type="button" class="btn btn--accent btn--sm" data-taxpdf>${iconSVG("doc", 14)} 세금계산서 PDF 다운로드</button>
      <a class="btn btn--soft btn--sm" href="https://www.hometax.go.kr" target="_blank" rel="noopener">${iconSVG("link", 14)} 홈택스 조회</a>
    </div>`;
}
function downloadTaxInvoice() {
  const d = taxInvoiceData();
  if (!d.fee) { toast("해당 기간 수수료(세금계산서) 내역이 없어요"); return; }
  const esc = (s) => String(s == null ? "" : s);
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>전자세금계산서 · 수수료 ${esc(d.label)}</title>
<style>body{font-family:-apple-system,"Malgun Gothic","맑은 고딕",sans-serif;background:#f4f5f8;color:#181b22;margin:0;padding:32px;}
.iv{max-width:560px;margin:0 auto;background:#fff;border:1px solid #d7dce4;border-radius:12px;overflow:hidden;}
.iv__hd{background:#0f172a;color:#fff;padding:16px 22px;font-weight:800;font-size:1.05rem;}
.iv__hd span{display:block;font-size:.72rem;opacity:.7;font-weight:600;margin-top:3px;}
.iv__b{padding:20px 22px;}
table{width:100%;border-collapse:collapse;font-size:.9rem;}
th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #eef1f5;}
th{color:#6b7280;font-weight:600;width:42%;}
td{text-align:right;font-weight:700;}
.tot td,.tot th{border-top:2px solid #0f172a;border-bottom:0;font-size:1.05rem;color:#0f172a;}
.tot td{color:#2f6f7e;}
.st{display:inline-block;background:#e7f6ee;color:#067a4b;font-size:.75rem;font-weight:800;padding:3px 10px;border-radius:999px;}
.foot{padding:12px 22px;font-size:.72rem;color:#9aa1ad;background:#f8f9fb;border-top:1px dashed #e5e8ee;}
@media print{body{background:#fff;padding:0;}.iv{border:0;}}</style></head>
<body><div class="iv">
  <div class="iv__hd">전자세금계산서 (매입) <span>플랫폼 이용료(수수료) · ${esc(d.label)} · 국세청 e세로 자동발급</span></div>
  <div class="iv__b"><table>
    <tr><th>공급자</th><td>공간잇다 (주식회사 와일리) · 211-88-56742</td></tr>
    <tr><th>공급받는 자</th><td>${esc(d.holder)}</td></tr>
    <tr><th>품목</th><td>플랫폼 이용 수수료</td></tr>
    <tr><th>공급가액</th><td>${won(d.supply)}원</td></tr>
    <tr><th>부가세(10%)</th><td>${won(d.vat)}원</td></tr>
    <tr class="tot"><th>합계금액</th><td>${won(d.fee)}원</td></tr>
    <tr><th>발급 상태</th><td><span class="st">국세청 승인 완료</span></td></tr>
    <tr><th>승인번호</th><td>${esc(d.approvNo)}</td></tr>
  </table></div>
  <div class="foot">본 전자세금계산서는 국세청 e세로로 자동 발급되었습니다. 부가세 신고 시 매입세액 공제 증빙으로 사용하세요. (데모 문서)</div>
</div></body></html>`;
  const blob = new Blob(["﻿" + html], { type: "text/html;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `전자세금계산서_수수료_${esc(d.R.key || d.label)}.html`;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 150);
  toast("세금계산서를 내려받았어요 (열어서 인쇄·PDF 저장 가능)");
}
function bindPayout(rerender) {
  const ab = $("#setAcctBtn"); if (ab) ab.addEventListener("click", openAccountEdit);
  const tb = $("#setTaxBtn"); if (tb) tb.addEventListener("click", openTaxViewMP);
}
function renderVsettle() {
  const wrap = $("#vsettleWrap"); if (!wrap) return;
  const P = settlePanel(), R = P.R;
  const dOf = (q) => q.date || (window.REQUESTS.find(q.requestId) || {}).date || "";
  const acc = window.QUOTES.byVendor(me).filter((q) => q.status === "accepted" && dOf(q) >= R.from && dOf(q) <= R.to);
  settleItemsCache = sortSettleItems(acc.map((q) => settleItemFor("vendor", q)));
  wrap.innerHTML = `
    <h2 class="sp-sec__title" style="margin-bottom:14px">정산 · PG 자동 분리정산</h2>
    ${P.html}
    <div class="settle-listhead"><h3 class="mg-h" style="margin:0">${R.label} 확정 견적 내역</h3>${settleItemsCache.length ? `<button type="button" class="btn btn--soft btn--sm" data-setxls>📥 엑셀 다운로드</button>` : ""}</div>
    ${settleControls()}
    ${settleItemsCache.length ? settleSumBar(settleItemsCache) + settleItemsCache.map(settleItemCard).join("") : `<div class="mp-empty">${R.label} 확정된 견적이 없어요.</div>`}`;
  bindPayout(renderVsettle);
}
// 파트너 정보 편집 (담당 카테고리·파트너명·위치·연락처·소개·아이템·사진)
let bizPhotos = null;
function renderBizInfo() {
  const wrap = $("#bizWrap"); if (!wrap) return;
  const u = window.AUTH.users().find((x) => x.userId === me) || {};
  if (bizPhotos === null) bizPhotos = (u.photos || []).slice();
  const esc = (s) => (s || "").replace(/"/g, "&quot;");
  wrap.innerHTML = `
    <h2 class="sp-sec__title" style="margin-bottom:6px">파트너 정보</h2>
    <p class="mp__sub" style="margin-bottom:16px">여기서 수정한 내용은 <b>맞춤 찾기</b>와 견적 화면에 그대로 노출됩니다.</p>
    <div class="book__field"><label class="book__label">담당 카테고리</label><select id="bizCat">${SERVICES.map((s) => `<option value="${s.id}" ${(u.serviceCats || [])[0] === s.id ? "selected" : ""}>${s.label}</option>`).join("")}</select></div>
    <div class="book__field"><label class="book__label">파트너명</label><input type="text" id="bizName" value="${esc(u.nick)}" /></div>
    <div class="book__row">
      <div class="book__field"><label class="book__label">위치</label><input type="text" id="bizAddr" value="${esc(u.addr)}" placeholder="예: 서울 강남구" /></div>
      <div class="book__field"><label class="book__label">연락처</label><input type="text" id="bizPhone" value="${esc(u.phone)}" placeholder="010-0000-0000" /></div>
    </div>
    <div class="book__row">
      <div class="book__field"><label class="book__label">대표자명</label><input type="text" id="bizOwner" value="${esc(u.owner || (u.biz || {}).owner)}" placeholder="대표자 성함" /></div>
      <div class="book__field"><label class="book__label">사업자등록번호</label><input type="text" id="bizNo" value="${esc(u.bizNo || (u.biz || {}).bizNo)}" placeholder="000-00-00000" /></div>
    </div>
    <div class="book__row">
      <div class="book__field"><label class="book__label">정산 은행</label><input type="text" id="bizBank" value="${esc(u.bank || (u.biz || {}).bank)}" placeholder="예: 국민은행" /></div>
      <div class="book__field"><label class="book__label">정산 계좌번호</label><input type="text" id="bizAccount" value="${esc(u.account || (u.biz || {}).account)}" placeholder="'-' 없이 숫자만" /></div>
    </div>
    <div class="book__field"><label class="book__label">파트너 소개</label><textarea id="bizIntro" rows="4" placeholder="예) 방송·행사 촬영장비 전문 렌탈 업체입니다. 소니·캐논 최신 바디와 조명·짐벌·삼각대를 보유하고 있으며, 당일 배송과 현장 세팅이 가능합니다. 사진작가 매칭도 도와드립니다. (강남·서초 2시간 내 배송)">${(u.intro || "").replace(/</g, "&lt;")}</textarea><span class="hf-hint">💡 <b>취급 품목 · 경력/강점 · 배송·세팅 여부 · 가능 지역</b>을 적으면 회원이 신뢰하고 선택해요.</span></div>
    <div class="book__field"><label class="book__label">렌탈·판매 아이템 <span style="color:var(--faint);font-weight:500">(한 줄에 하나씩)</span></label><textarea id="bizItems" rows="5" placeholder="소니 A7M4 바디\n캐논 R5 바디\nLED 조명 키트\n짐벌·스태빌라이저\n무선 마이크\n삼각대">${(u.items || []).join("\n")}</textarea><span class="hf-hint">💡 회원이 <b>맞춤 업체</b> 목록에서 대표 품목을 한눈에 볼 수 있게 적어주세요. 위쪽 품목이 카드에 먼저 노출돼요.</span></div>
    <div class="book__field"><label class="book__label">대여 시작가 <span style="color:var(--faint);font-weight:500">(1일 기준 · 선택)</span></label><div class="hf-suffix"><input type="number" id="bizStartPrice" min="0" step="1000" value="${u.startPrice || ""}" placeholder="예: 150000" /><span class="hf-suffix__u">원~</span></div><span class="hf-hint">💡 입력하면 맞춤 업체 상세에 <b>‘대여 시작가 ~원’</b>으로 노출돼 회원이 가격 감을 잡을 수 있어요.</span></div>
    <div class="book__field"><label class="book__label">1일 최대 처리 팀 수 · CAPA <span style="color:var(--faint);font-weight:500">(선택 · 비우면 무제한)</span></label><div class="hf-suffix"><input type="number" id="bizCap" min="1" step="1" value="${u.dailyCap || ""}" placeholder="예: 3" /><span class="hf-suffix__u">팀/일</span></div><span class="hf-hint">💡 하루에 소화 가능한 최대 건수예요. 특정 날짜에 확정 건이 이 수에 도달하면 그 날짜의 <b>신규 견적 제출이 자동 차단</b>돼 과부하를 막아줘요.</span></div>
    <div class="book__field"><label class="book__label">파트너 사진</label><div class="biz-photos" id="bizPhotos">${bizPhotos.map((p, i) => `<div class="biz-photo"><img src="${p}" alt="" /><button type="button" class="biz-photo__x" data-bizrm="${i}">✕</button></div>`).join("")}</div><input type="file" id="bizAdd" accept="image/*" multiple class="att-input" style="margin-top:8px" /></div>
    <button class="btn btn--accent" id="bizSave">저장</button>
    <p class="hf-note" id="bizMsg" style="text-align:left"></p>`;
  $("#bizAdd").addEventListener("change", () => {
    [...$("#bizAdd").files].slice(0, 6).forEach((f) => { if (!/^image\//.test(f.type)) return; downscaleImg(f, 720, (url) => { bizPhotos.push(url); $("#bizPhotos").insertAdjacentHTML("beforeend", `<div class="biz-photo"><img src="${url}" alt="" /><button type="button" class="biz-photo__x" data-bizrm="${bizPhotos.length - 1}">✕</button></div>`); }); });
  });
  $("#bizSave").addEventListener("click", () => {
    const users = window.AUTH.users(); const i = users.findIndex((x) => x.userId === me); if (i < 0) return;
    const nick = $("#bizName").value.trim() || users[i].nick;
    users[i].serviceCats = [$("#bizCat").value];
    users[i].nick = nick; users[i].name = nick;
    users[i].addr = $("#bizAddr").value.trim();
    users[i].phone = $("#bizPhone").value.trim();
    users[i].owner = $("#bizOwner").value.trim();
    users[i].bizNo = $("#bizNo").value.trim();
    users[i].bank = $("#bizBank").value.trim();
    users[i].account = $("#bizAccount").value.trim();
    users[i].intro = $("#bizIntro").value.trim();
    users[i].items = $("#bizItems").value.split("\n").map((s) => s.trim()).filter(Boolean);
    users[i].startPrice = +$("#bizStartPrice").value || 0;
    users[i].dailyCap = parseInt($("#bizCap").value, 10) || 0;
    users[i].photos = bizPhotos.slice();
    users[i].biz = Object.assign({}, users[i].biz, { owner: users[i].owner, bizNo: users[i].bizNo, bank: users[i].bank, account: users[i].account, addr: users[i].addr, phone: users[i].phone });
    window.AUTH.saveUsers(users);
    auth.name = nick; auth.serviceCats = users[i].serviceCats;
    window.AUTH.set(Object.assign({}, auth, { name: nick, serviceCats: users[i].serviceCats }));
    $("#bizMsg").textContent = "저장되었어요 · 맞춤 찾기에 반영됩니다."; toast("파트너 정보를 저장했어요");
  });
}

// ---------- 견적 요청: 호스트(공간 견적요청) ----------
function myHostSpaces() {
  // 등록 대관(샘플 배정분 + 내가 직접 등록한 gi_spaces) 중 내 소유
  let gi = []; try { gi = JSON.parse(localStorage.getItem("gi_spaces") || "[]"); } catch (e) {}
  const owned = getAllSpaces().filter((s) => s.ownerId === me);
  if (owned.length) return owned;
  return gi.filter((s) => !s.ownerId); // 레거시(소유주 미설정) 등록분 호환
}
function hreqCard(r, spaces) {
  const myQuotes = window.QUOTES.forReq(r.id).filter((q) => q.vendorId === me && q.cat === "space");
  const expired = r.deadline && todayStr > r.deadline;
  const spaceTaken = window.QUOTES.forReq(r.id).some((q) => q.cat === "space" && q.status === "accepted");
  const closed = r.status === "closed" || expired || spaceTaken;
  const tr = timeRange(r);
  const rows = myQuotes.length ? `<div class="vq-list">${myQuotes.map((q) => {
    let st, actions;
    if (q.status === "accepted") { st = `<span class="quote-badge">🎉 선택됨 · 예약 확정</span>`; actions = `<button class="btn btn--soft btn--sm" data-qchat="${q.id}">채팅</button>`; }
    else if (spaceTaken) { st = `<span class="mp__sub">다른 공간 선정</span>`; actions = ""; }
    else { st = `<span class="vq-row__st">검토 중</span>`; actions = closed ? "" : `<button class="btn btn--soft btn--sm" data-editq="${q.id}">수정</button><button class="btn btn--danger btn--sm" data-delq="${q.id}">삭제</button><button class="btn btn--soft btn--sm" data-qchat="${q.id}">채팅</button>`; }
    return `<div class="vq-row"><span class="vq-row__cat">${q.spaceName || "공간"}</span><b class="vq-row__price">${won(q.price)}원</b>${q.discountPct ? `<span class="vq-row__disc">${q.discountPct}%↓</span>` : ""}${st}<span class="vq-row__act">${actions}</span></div>`;
  }).join("")}</div>` : "";
  let mainBtn = "";
  if (!spaces.length) mainBtn = `<span class="mp__sub">공간 등록 후 견적 가능 · <a href="host.html" style="color:var(--accent);font-weight:700">공간 등록</a></span>`;
  else if (closed) mainBtn = myQuotes.length ? "" : `<span class="mp__sub">${expired ? "입찰 마감 (이용일 임박)" : "마감된 요청"}</span>`;
  else if (myQuotes.length) mainBtn = `<button class="btn btn--soft btn--sm hreq-done" data-editq="${myQuotes[0].id}">✓ 제안 완료 · 수정하기</button>`;
  else mainBtn = `<button class="btn btn--accent btn--sm hreq-cta" data-spacequote="${r.id}">공간 견적 보내기 →</button>`;
  const purpose = (r.detail || "").split("\n")[0].trim();
  return `<div class="mp-bk" data-reqid="${r.id}">
    <div class="mp-bk__top hreq-top">
      <div class="mp-bk__info mp-bk__info--click hreq-info" data-reqdetail="${r.id}">
        <div class="hreq-info__row"><div class="mp-book__name">${r.region} · ${r.date}${tr ? ` · ${tr}` : ""} · ${r.capacity}인</div>${deadlineBadge(r)}</div>
        <div class="mp-book__meta">${r.spaceType ? `${catById(r.spaceType).label} 선호 · ` : ""}${r.parking ? `주차 ${r.parking}대 · ` : ""}${r.deadline ? `🕑 입찰마감 ${r.deadline} · ` : ""}${window.timeago(r.ts)} 접수</div>
      </div>
      <div class="hreq-right">
        <span class="mp-book__status ${closed ? "st-gray" : "st-green"}">${closed ? (spaceTaken ? "선정 완료" : "마감") : "모집중"}</span>
        <div class="hreq-budget${r.budget ? "" : " hreq-budget--none"}"><span class="hreq-budget__l">희망 예산</span>${r.budget ? `<b class="hreq-budget__v">${won(r.budget)}<em>원</em></b>` : `<b class="hreq-budget__v hreq-budget__v--none">협의</b>`}</div>
      </div>
    </div>
    ${purpose ? `<div class="hreq-purpose"><span class="hreq-purpose__t">🎯 요청 목적</span><span class="hreq-purpose__x">${purpose.replace(/</g, "&lt;")}</span></div>` : ""}
    ${rows}
    <div class="mp-bk__act mp-bk__act--right"><button class="btn btn--outline btn--sm" data-reqdetail="${r.id}">상세 보기</button>${mainBtn}</div>
  </div>`;
}
// 견적 요청 상세 모달 (호스트·파트너가 회원 요청 내용 전체 확인)
function openReqDetail(r) {
  modal.hidden = false;
  const tr = timeRange(r);
  const chips = (r.cats || []).map((c) => `<span class="rd-chip">${iconSVG(reqCatById(c).icon, 14)} ${reqCatById(c).label}</span>`).join("");
  const rows = [
    ["지역", r.region],
    ["이용 일시", `${r.date}${tr ? ` · ${tr} (${r.end - r.start}시간)` : ""}`],
    r.capacity ? ["인원", `${r.capacity}인`] : null,
    r.parking ? ["주차", `${r.parking}대`] : null,
    r.budget ? ["예산", `${won(r.budget)}원`] : null,
    r.spaceType ? ["공간 유형", `${catById(r.spaceType).label} 선호`] : null,
    r.memberPhone ? ["연락처", `<a href="tel:${r.memberPhone}" style="color:var(--accent);font-weight:700">${r.memberPhone}</a>`] : null,
    r.deadline ? ["선정·결제 마감", r.deadline] : null,
  ].filter(Boolean);
  const expired = r.deadline && todayStr > r.deadline;
  const spaceTaken = window.QUOTES.forReq(r.id).some((q) => q.cat === "space" && q.status === "accepted");
  const canBid = isHost && (r.cats || []).includes("space") && !(r.status === "closed" || expired || spaceTaken) && myHostSpaces().length;
  // 뷰어 역할에 맞는 카테고리만 노출 (파트너=내 카테고리, 호스트=공간, 회원=전체)
  let showCats = r.cats || [];
  if (isVendor) showCats = (r.cats || []).filter((c) => (auth.serviceCats || []).includes(c));
  else if (isHost) showCats = (r.cats || []).filter((c) => c === "space");
  const notes = (r.catNotes || {}), files = (r.catFiles || {});
  const catNotesHtml = showCats.filter((c) => notes[c] || (files[c] && files[c].length)).map((c) => `<div class="rd-catnote"><b>${iconSVG(reqCatById(c).icon, 14)} ${reqCatById(c).label}</b>${notes[c] ? `<p>${(notes[c] || "").replace(/</g, "&lt;")}</p>` : ""}${(files[c] && files[c].length) ? `<div class="rd-files">${files[c].map((f) => f.url && /^data:image/.test(f.url) ? `<a href="${f.url}" target="_blank"><img src="${f.url}" alt="" /></a>` : `<span class="rqn-file rqn-file--doc">📄 <span>${f.name}</span></span>`).join("")}</div>` : ""}</div>`).join("");
  modalCard.innerHTML = `<div class="modal__head"><b>견적 요청 상세</b><button class="modal__x" data-mclose>✕</button></div>
    <div class="rd-chips">${(showCats.length ? showCats : r.cats || []).map((c) => `<span class="rd-chip">${iconSVG(reqCatById(c).icon, 14)} ${reqCatById(c).label}</span>`).join("")}</div>
    <div class="rd-rows">${rows.map(([k, v]) => `<div class="rd-row"><span>${k}</span><b>${v}</b></div>`).join("")}</div>
    ${catNotesHtml ? `<div class="rd-sec">📝 항목별 요청사항</div>${catNotesHtml}` : ""}
    ${r.detail ? `<div class="rd-note"><b>전체 공통 요청사항</b><p>${(r.detail || "").replace(/</g, "&lt;")}</p></div>` : ""}
    <p class="modal__note">요청자: ${r.memberName || "회원"} · 등록 ${window.timeago(r.ts)}</p>
    ${canBid ? `<button class="btn btn--accent btn--block" data-spacequote="${r.id}">이 요청에 공간 견적 보내기 →</button>` : ""}`;
}
// 공간 상세 정보 모달 (회원이 견적 비교 중 공간 확인)
// 파트너(부대서비스 업체) 상세 — 회원이 견적 비교 중 어떤 업체인지 확인
function openVendorInfoMP(vid) {
  const v = window.AUTH.users().find((x) => x.userId === vid);
  if (!v) { toast("파트너 정보를 찾을 수 없어요"); return; }
  const cats = (v.serviceCats || []).map((c) => reqCatById(c).label).join(", ");
  const sc = window.VREVIEWS ? window.VREVIEWS.scoreOf(vid) : null;
  const cnt = window.VREVIEWS ? window.VREVIEWS.countOf(vid) : 0;
  const gu = (v.addr || v.region || "").match(/([가-힣]+구)/);
  const img = (v.photos && v.photos[0]) || "";
  modal.hidden = false; modalCard.classList.remove("modal__card--wide");
  modalCard.innerHTML = `<div class="modal__head"><b>${v.nick || v.name}</b><button class="modal__x" data-mclose>✕</button></div>
    ${img ? `<div class="si-thumb"><img src="${img}" alt="" onerror="this.parentNode.style.display='none'" /></div>` : ""}
    <div class="si-head"><span class="sp-card__cat">${cats || "파트너"}</span>${sc ? `<span class="si-price">★ ${sc.toFixed(1)} <em>(후기 ${cnt})</em></span>` : `<span class="si-price">신규 파트너</span>`}</div>
    ${v.intro ? `<p class="vinfo-intro" style="margin:8px 0 12px;line-height:1.6">${String(v.intro).replace(/</g, "&lt;")}</p>` : ""}
    <div class="rd-rows">
      <div class="rd-row"><span>취급 서비스</span><b>${cats || "-"}</b></div>
      <div class="rd-row"><span>지역</span><b>${(gu && gu[1]) || v.region || "-"}</b></div>
      ${v.phone ? `<div class="rd-row"><span>연락처</span><b><a href="tel:${v.phone}">${v.phone}</a></b></div>` : ""}
    </div>
    ${(v.items && v.items.length) ? `<div class="si-tags">${v.items.slice(0, 8).map((it) => `<span>${it}</span>`).join("")}</div>` : ""}
    <a href="vendors.html?v=${vid}" class="btn btn--soft btn--block" style="margin-top:14px">맞춤 업체에서 전체 정보 보기 →</a>`;
}
function openSpaceInfo(spaceId) {
  const s = getAllSpaces().find((x) => String(x.id) === String(spaceId));
  if (!s) { toast("공간 정보를 찾을 수 없어요"); return; }
  modal.hidden = false;
  const c = catById(s.cat); const g = s.g || [c.ink, "#cfc7b8"]; const img = spaceImg(s, 900, 600);
  modalCard.innerHTML = `<div class="modal__head"><b>${s.name}</b><button class="modal__x" data-mclose>✕</button></div>
    <div class="si-thumb" style="background:linear-gradient(135deg,${g[0]},${g[1]})">${img ? `<img src="${img}" alt="${s.name}" onerror="this.remove()" />` : ""}</div>
    <div class="si-head"><span class="sp-card__cat">${c.label}</span><span class="si-price">${won(s.price)}원 <em>/ 시간</em></span></div>
    <div class="rd-rows">
      <div class="rd-row"><span>위치</span><b>${s.region}</b></div>
      <div class="rd-row"><span>최대 인원</span><b>${s.capacity}인</b></div>
      ${s.rating ? `<div class="rd-row"><span>평점</span><b>★ ${s.rating} (${s.reviews || 0})</b></div>` : ""}
    </div>
    ${s.tags && s.tags.length ? `<div class="si-tags">${s.tags.map((t) => `<span>${t}</span>`).join("")}</div>` : ""}
    ${s.desc ? `<div class="rd-note"><b>공간 소개</b><p>${(s.desc || "").replace(/</g, "&lt;")}</p></div>` : ""}
    <a class="btn btn--outline btn--block" href="space.html?id=${s.id}" target="_blank" rel="noopener" style="margin-top:12px">상세 페이지·달력 열기 →</a>`;
}
// 이용 완료 후 파트너/공간 후기 — 신뢰 지표로 축적
function openVendorReview(q) {
  modal.hidden = false;
  const isSpace = q.cat === "space";
  const target = isSpace ? (q.spaceName || "공간") : q.vendorName;
  modalCard.innerHTML = `<div class="modal__head"><b>후기 남기기</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="modal__sub">${reqCatById(q.cat).label} · ${target}</p>
    <div class="sp-revstars" id="vrStars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}">★</button>`).join("")}</div>
    <textarea id="vrText" rows="3" placeholder="서비스 품질·시간 준수·소통 등 경험을 남겨주세요" style="width:100%;padding:11px 13px;border:1px solid var(--line);border-radius:10px;font-family:inherit;resize:vertical;margin:10px 0"></textarea>
    <button class="btn btn--accent btn--block" id="vrSave">등록</button>`;
  let star = 5;
  const paint = () => modalCard.querySelectorAll("#vrStars button").forEach((x, i) => x.classList.toggle("on", i < star));
  paint();
  $("#vrStars").addEventListener("click", (e) => { const x = e.target.closest("[data-star]"); if (x) { star = +x.dataset.star; paint(); } });
  $("#vrSave").addEventListener("click", () => {
    window.VREVIEWS.add({ quoteId: q.id, vendorId: q.vendorId, userId: me, cat: q.cat, rating: star, text: $("#vrText").value.trim() });
    if (isSpace && q.spaceId) window.REVIEWS.add({ spaceId: +q.spaceId || q.spaceId, userId: me, name: window.AUTH.displayName(auth), rating: star, text: $("#vrText").value.trim() });
    closeModal(); toast("후기가 등록되었어요 · 신뢰 지표에 반영됩니다"); renderAll();
  });
}
// 공간 견적요청 파이프라인 단계: new(신규·미입찰) → bid(입찰완료·진행) → won(낙찰) · lost(마감/놓침)
function hreqStageOf(r) {
  const mineQ = window.QUOTES.forReq(r.id).filter((q) => q.vendorId === me && q.cat === "space");
  if (mineQ.some((q) => q.status === "accepted")) return "won";
  const otherWon = window.QUOTES.forReq(r.id).some((q) => q.cat === "space" && q.status === "accepted");
  const closed = r.status === "closed" || (r.deadline && todayStr > r.deadline) || ((r.date || "") !== "" && r.date < todayStr) || otherWon;
  if (mineQ.length) return closed ? "lost" : "bid";
  return closed ? "lost" : "new";
}
function renderHreq() {
  const spaces = myHostSpaces();
  const regions = spaces.map((s) => s.region || "");
  const iBidSpace = (r) => window.QUOTES.forReq(r.id).some((q) => q.vendorId === me && q.cat === "space");
  let list = window.REQUESTS.list().filter((r) => {
    if (!(r.cats || []).includes("space") || r.blinded) return false;
    // 마감·이용일 지난 요청은 내가 입찰한 건만 유지, 미응찰 데드리드는 자동 제외
    if (reqDead(r) && !iBidSpace(r)) return false;
    return true;
  });
  // 내 공간 지역과 겹치는 요청 우선. 매칭이 하나도 없으면 전체 노출(요청을 놓치지 않도록).
  if (spaces.length) {
    const matched = list.filter((r) => regions.some((rg) => rg.includes(r.region)));
    if (matched.length) list = matched;
  }
  const stOf = hreqStageOf;
  const cnt = { all: list.length, new: 0, bid: 0, won: 0, lost: 0 };
  list.forEach((r) => { cnt[stOf(r)] = (cnt[stOf(r)] || 0) + 1; });
  const bd = $("#hreqBadge"); if (bd) { bd.textContent = cnt.new; bd.hidden = cnt.new === 0; }
  const el = $("#hreqList"); if (!el) return;
  let shown = list.filter((r) => periodMatch(r.date, hreqPeriod, hreqFrom, hreqTo));
  if (hreqStatusF !== "all") shown = shown.filter((r) => stOf(r) === hreqStatusF);
  shown = shown.slice().sort((a, b) => ((a.date || "") < (b.date || "") ? 1 : -1));
  // 파이프라인 3단계 (신규 → 입찰 → 낙찰) + 마감/전체 보조 필터
  const stg = (v, l) => `<button type="button" class="hpipe__stage${hreqStatusF === v ? " is-on" : ""}" data-hreqstatus="${v}"><span class="hpipe__n">${cnt[v] || 0}</span><span class="hpipe__l">${l}</span></button>`;
  const pipeline = `<div class="hpipe">${stg("new", "신규 요청")}<span class="hpipe__arrow">→</span>${stg("bid", "입찰 완료")}<span class="hpipe__arrow">→</span>${stg("won", "낙찰·계약")}</div>`;
  const subFilter = `<div class="mp-seg mp-seg--status hpipe-sub">${[["all", "전체", cnt.all], ["lost", "마감·놓침", cnt.lost]].map(([v, l, c]) => `<button class="mp-seg__b${hreqStatusF === v ? " is-on" : ""}" data-hreqstatus="${v}">${l} <b>${c || 0}</b></button>`).join("")}</div>`;
  const bar = `${pipeline}<div class="mp-toolbar">${subFilter}${periodBar(hreqPeriod, "hreq", hreqFrom, hreqTo)}</div>`;
  el.innerHTML = bar + (shown.length ? shown.map((r) => hreqCard(r, spaces)).join("") : `<div class="mp-empty">해당 단계의 공간 견적요청이 없어요.</div>`);
  const emp = $("#hreqEmpty");
  if (emp) { emp.hidden = true; }
}
// 호스트: 공간 견적 제출/수정 (보유 공간 선택 + 시간기준 정가 대비 할인)
function openSpaceQuoteForm(r, editQuote) {
  modal.hidden = false;
  const editing = !!editQuote;
  const allSpaces = myHostSpaces();
  if (!allSpaces.length) { toast("공간을 먼저 등록해주세요"); return; }
  // 이미 이 요청에 제안한 공간은 제외(중복 제안 방지). 수정 시엔 해당 공간만.
  const offered = new Set(window.QUOTES.forReq(r.id).filter((q) => q.vendorId === me && q.cat === "space").map((q) => String(q.spaceId)));
  const spaces = editing ? allSpaces : allSpaces.filter((s) => !offered.has(String(s.id)));
  if (!spaces.length) { toast("보유한 공간을 이미 모두 제안했어요"); return; }
  const hours = (r.start != null && r.end != null) ? (r.end - r.start) : 0;
  const tr = timeRange(r);
  const spaceOpts = spaces.map((s) => `<option value="${s.id}" data-price="${s.price}" ${editing && editQuote.spaceId == s.id ? "selected" : ""}>${s.name} (${won(s.price)}원/시간)</option>`).join("");
  const needList = (r.cats || []).map((c) => reqCatById(c).label).join(", ");
  modalCard.innerHTML = `<div class="modal__head"><b>${editing ? "공간 견적 수정" : "공간 견적 보내기"}</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="modal__sub">${r.region} · ${r.date}${tr ? ` · ${tr} (${hours}시간)` : ""} · ${r.capacity}인</p>
    <div class="sq-req">회원 요청: <b>${needList}</b>${r.spaceType ? ` · ${catById(r.spaceType).label} 선호` : ""}${r.budget ? ` · 예산 ${won(r.budget)}원` : ""}${r.detail ? `<span class="sq-req__detail">“${(r.detail || "").replace(/</g, "&lt;")}”</span>` : ""} <button type="button" class="sq-req__more" data-reqdetail="${r.id}">전체 상세</button></div>
    <div class="book__field"><label class="book__label">제안할 공간</label><select id="sqSpace" ${editing ? "disabled" : ""}>${spaceOpts}</select></div>
    <div class="q-orig" id="sqOrig"></div>
    <div class="book__field"><label class="book__label">제시 총액 (원)${hours ? ` · ${hours}시간 기준` : ""}</label><input type="number" id="sqPrice" min="0" step="1000" value="${editing ? editQuote.price : ""}" placeholder="예: 150000" /></div>
    <div class="q-disc-live" id="sqDisc"></div>
    <div class="sq-conflict" id="sqConflict" hidden></div>
    <div class="book__field"><label class="book__label">공간 소개 · 제안</label><textarea id="sqDesc" rows="3" placeholder="공간 강점, 포함 사항(음향·주차 등), 셋팅 안내를 적어주세요.">${editing ? (editQuote.desc || "").replace(/</g, "&lt;") : ""}</textarea></div>
    ${attachField("sqPhoto", "sqDoc", "sqPrev")}
    <button class="btn btn--accent btn--block" id="sqSend">${editing ? "수정 저장" : "견적 보내기"}</button>`;
  bindAttach($("#sqPhoto"), $("#sqDoc"), $("#sqPrev"));
  const origOf = () => { const opt = $("#sqSpace").selectedOptions[0]; const unit = opt ? +opt.dataset.price : 0; return hours ? unit * hours : unit; };
  const conflictOf = () => { const opt = $("#sqSpace").selectedOptions[0]; if (!opt) return false; return spaceBusy(opt.value, r.date, r.start, r.end, editing ? editQuote.id : null); };
  const refresh = () => {
    const orig = origOf(); const price = +$("#sqPrice").value || 0;
    $("#sqOrig").innerHTML = orig ? `정가 <b>${won(orig)}원</b>${hours ? ` <span>(${won(orig / hours)}원/시간 × ${hours}시간)</span>` : ""}` : "";
    let pct = 0;
    if (orig && price && price < orig) pct = Math.round((orig - price) / orig * 100);
    $("#sqDisc").innerHTML = price ? (pct ? `<span class="q-disc-badge">기존가 대비 ${pct}%↓ · ${won(orig - price)}원 할인</span>` : (orig && price >= orig ? `<span class="q-disc-none">정가 이상 제안</span>` : "")) : "";
    const busy = conflictOf();
    const cf = $("#sqConflict"); cf.hidden = !busy; cf.textContent = busy ? "⚠️ 이 공간은 해당 일시에 이미 예약이 있어요. 다른 공간을 선택하거나 회원과 시간을 조율하세요." : "";
    $("#sqSend").disabled = busy;
    return { orig, price, pct, busy };
  };
  $("#sqSpace").addEventListener("change", refresh);
  $("#sqPrice").addEventListener("input", refresh);
  refresh();
  $("#sqSend").addEventListener("click", () => {
    const opt = $("#sqSpace").selectedOptions[0];
    const sid = opt ? opt.value : (editing ? editQuote.spaceId : null);
    const sName = opt ? opt.text.replace(/\s*\(.*$/, "") : (editing ? editQuote.spaceName : "공간");
    const { orig, price, pct, busy } = refresh();
    if (busy) { toast("해당 일시에 이미 예약이 있는 공간이에요"); return; }
    if (!price) { toast("제시 금액을 입력해주세요"); return; }
    const desc = $("#sqDesc").value.trim();
    const photos = $("#sqPhoto")._photos || [], files = $("#sqDoc")._files || [];
    if (editing) {
      const patch = { price, desc, origPrice: orig, discountPct: pct, ts: Date.now() };
      if (photos.length) patch.photos = photos; if (files.length) patch.files = files;
      window.QUOTES.update(editQuote.id, patch);
      window.NOTIF.add({ forUser: r.memberId, title: "공간 견적이 수정됐어요 ✏️", sub: `${sName} · ${won(price)}원`, link: "mypage.html?tab=rfp" });
      closeModal(); toast("견적을 수정했어요"); renderAll(); return;
    }
    window.QUOTES.add({ requestId: r.id, vendorId: me, vendorName: window.AUTH.displayName(auth), cat: "space", spaceId: sid, spaceName: sName, price, origPrice: orig, discountPct: pct, hours, desc, photos, files });
    window.NOTIF.add({ forUser: r.memberId, title: "새 공간 견적 도착 🏠", sub: `${sName} · ${won(price)}원${pct ? ` (${pct}%↓)` : ""}`, link: "mypage.html?tab=rfp" });
    closeModal(); toast("공간 견적을 보냈어요"); renderAll();
  });
}
// 공간 견적 선정 시 확정 예약 자동 생성 / 선정 취소 시 예약 취소
function createBookingFromQuote(q) {
  if (window.BOOKINGS.list().some((b) => b.fromQuote === q.id)) return;
  const r = window.REQUESTS.find(q.requestId); if (!r) return;
  const hours = q.hours || ((r.start != null && r.end != null) ? (r.end - r.start) : 1);
  const start = r.start != null ? r.start : 9;
  window.BOOKINGS.add({ id: window.uid("b"), fromQuote: q.id, spaceId: q.spaceId, spaceName: q.spaceName || "공간", hostId: q.vendorId, guestId: r.memberId, guestName: r.memberName || "회원", guestPhone: r.memberPhone, detail: r.detail, price: hours ? Math.round(q.price / hours) : q.price, date: r.date, start, hours, guests: r.capacity, total: q.price, status: "confirmed", paid: false, ts: Date.now() });
  window.NOTIF.add({ forUser: q.vendorId, title: `${q.spaceName || "공간"} 예약 확정 🎉`, sub: `${r.date} · 견적이 선정돼 예약이 확정됐어요`, link: "mypage.html?tab=reqs" });
}
function cancelQuoteBooking(quoteId) {
  const b = window.BOOKINGS.list().find((x) => x.fromQuote === quoteId);
  if (b) { window.BOOKINGS.save(window.BOOKINGS.list().filter((x) => x.id !== b.id)); if (b.hostId) window.NOTIF.add({ forUser: b.hostId, title: `${b.spaceName || "공간"} 예약 취소`, sub: `${b.date} · 회원이 선정을 취소했어요`, link: "mypage.html?tab=reqs" }); }
}
// 견적으로 생성된 예약을 취소/거절하면 원 견적을 '선택' 상태로 되돌려 desync 방지
function revertQuoteBooking(b) {
  if (!b || !b.fromQuote) return;
  const q = window.QUOTES.list().find((x) => x.id === b.fromQuote);
  if (q && q.status === "accepted") { window.QUOTES.update(q.id, { status: "selected", paid: false }); if (q.requestId) syncReqStatus(q.requestId); }
}
// 견적 제출(다중 카테고리) / 수정(단일 카테고리)
function openQuoteForm(r, editQuote) {
  modal.hidden = false;
  const editing = !!editQuote;
  // 편집: 해당 카테고리 하나. 신규: 아직 견적 안 낸 제공 가능 카테고리들.
  const quoted = new Set(window.QUOTES.forReq(r.id).filter((q) => q.vendorId === me).map((q) => q.cat));
  const cats = editing ? [editQuote.cat] : (auth.serviceCats || []).filter((c) => r.cats.includes(c) && !quoted.has(c));
  const deliverNote = `<div class="q-flow-note">📦 선정 시 <b>이용일 최소 3일 전</b> 결제가 완료되며, 물품은 <b>이용 당일 현장 셋팅 또는 회원 배송</b>으로 전달합니다. 준비·전달 조건을 제안 내용에 적어주세요.</div>`;
  const catBlock = (c) => {
    const svc = svcById(c);
    const pre = editing ? editQuote : null;
    const memNote = (r.catNotes || {})[c];
    const memFiles = (r.catFiles || {})[c] || [];
    const reqBox = (memNote || memFiles.length) ? `<div class="q-memreq">📋 회원 요청: ${memNote ? memNote.replace(/</g, "&lt;") : ""}${memFiles.length ? `<div class="q-memreq__files">${memFiles.map((f) => f.url && /^data:image/.test(f.url) ? `<a href="${f.url}" target="_blank"><img src="${f.url}" alt="" /></a>` : `<span class="rqn-file rqn-file--doc">📄 <span>${f.name}</span></span>`).join("")}</div>` : ""}</div>` : "";
    return `<div class="q-cat" data-qcat="${c}">
      ${editing ? "" : `<label class="q-cat__pick"><input type="checkbox" class="q-cat__chk" checked /><span>${iconSVG(svc.icon, 16)} ${svc.label}</span></label>`}
      ${editing ? `<div class="book__label" style="font-weight:800">${iconSVG(svc.icon, 16)} ${svc.label}</div>` : ""}
      ${reqBox}
      <div class="book__row">
        <div class="book__field"><label class="book__label">견적 금액 (원)</label><input type="number" class="q-price" min="0" step="1000" placeholder="예: 50000" value="${pre ? pre.price : ""}" /></div>
      </div>
      <div class="book__field"><label class="book__label">제안 내용 <span style="color:var(--faint);font-weight:500">(수량·전달 방식 등)</span></label><textarea class="q-desc" rows="2" placeholder="예: ${svc.unit ? svc.unit + " 기준 · " : ""}당일 오전 배송·셋팅">${pre ? (pre.desc || "").replace(/</g, "&lt;") : ""}</textarea></div>
      <div class="book__field"><label class="book__label">사진·견적서 첨부 <span style="color:var(--faint);font-weight:500">(사진 미리보기 지원)</span></label>
        <input type="file" class="att-input q-photo" accept="image/*" multiple />
        <input type="file" class="att-input q-doc" multiple style="margin-top:6px" />
        <div class="att-prev q-prev"></div></div>
    </div>`;
  };
  modalCard.innerHTML = `<div class="modal__head"><b>${editing ? "견적 수정" : "견적 제출"}</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="modal__sub">${r.region} · ${r.date} · ${r.capacity}인 · 요청: ${r.cats.map((c) => svcById(c).label).join(", ")}</p>
    ${editing ? "" : `<p class="modal__note" style="margin:-4px 0 10px">제공 가능한 항목을 체크하고 항목별 금액을 입력하세요. 여러 항목을 한 번에 보낼 수 있어요.</p>`}
    <div class="q-cats">${cats.map(catBlock).join("")}</div>
    ${deliverNote}
    <button class="btn btn--accent btn--block" id="qSend">${editing ? "견적 수정 저장" : "견적 보내기"}</button>`;
  modalCard.querySelectorAll(".q-cat").forEach((el) => bindAttach(el.querySelector(".q-photo"), el.querySelector(".q-doc"), el.querySelector(".q-prev")));
  $("#qSend").addEventListener("click", () => {
    if (editing) {
      const el0 = modalCard.querySelector(".q-cat");
      const price = +modalCard.querySelector(".q-price").value;
      if (!price) { toast("금액을 입력해주세요"); return; }
      const patch = { price, desc: modalCard.querySelector(".q-desc").value.trim(), ts: Date.now() };
      const ph = el0.querySelector(".q-photo")._photos || [], fl = el0.querySelector(".q-doc")._files || [];
      if (ph.length) patch.photos = ph; if (fl.length) patch.files = fl;
      window.QUOTES.update(editQuote.id, patch);
      window.NOTIF.add({ forUser: r.memberId, title: "견적이 수정됐어요 ✏️", sub: `${svcById(editQuote.cat).label} · ${won(price)}원`, link: "mypage.html?tab=rfp" });
      closeModal(); toast("견적을 수정했어요"); renderAll(); return;
    }
    const picks = [...modalCard.querySelectorAll(".q-cat")].filter((el) => el.querySelector(".q-cat__chk").checked);
    const items = picks.map((el) => ({ cat: el.dataset.qcat, price: +el.querySelector(".q-price").value, desc: el.querySelector(".q-desc").value.trim(), photos: el.querySelector(".q-photo")._photos || [], files: el.querySelector(".q-doc")._files || [] })).filter((x) => x.price > 0);
    if (!items.length) { toast("제출할 항목의 금액을 입력해주세요"); return; }
    items.forEach((it) => window.QUOTES.add({ requestId: r.id, vendorId: me, vendorName: window.AUTH.displayName(auth), cat: it.cat, price: it.price, desc: it.desc, photos: it.photos, files: it.files }));
    const label = items.length === 1 ? `${svcById(items[0].cat).label} · ${won(items[0].price)}원` : `${items.length}개 항목 · 합계 ${won(items.reduce((a, b) => a + b.price, 0))}원`;
    window.NOTIF.add({ forUser: r.memberId, title: "새 견적 도착 💰", sub: `${window.AUTH.displayName(auth)} · ${label}`, link: "mypage.html?tab=rfp" });
    closeModal(); toast(`${items.length}개 견적을 보냈어요`); renderAll();
  });
}
function openQuoteChat(q) {
  if (window.openChatWidget) { window.openChatWidget("q:" + q.id); return; }
  const r = window.REQUESTS.find(q.requestId) || {};
  openChat({ id: "q:" + q.id, spaceName: me === q.vendorId ? `${r.memberName || "회원"} 요청` : `${q.vendorName} 견적`, hostId: q.vendorId, guestId: r.memberId });
}
document.addEventListener("click", (e) => {
  const dr = e.target.closest("[data-delreq]");
  if (dr) { if (!confirm("이 견적 요청을 삭제할까요? 받은 견적도 함께 삭제됩니다.")) return; const id = dr.dataset.delreq; window.REQUESTS.save(window.REQUESTS.list().filter((x) => x.id !== id)); window.QUOTES.save(window.QUOTES.list().filter((x) => x.requestId !== id)); toast("요청을 삭제했어요"); renderAll(); return; }
  const db = e.target.closest("[data-delbk]");
  if (db) { if (!confirm("이 예약 내역을 삭제할까요? 되돌릴 수 없어요.")) return; window.BOOKINGS.save(window.BOOKINGS.list().filter((x) => x.id !== db.dataset.delbk)); toast("예약 내역을 삭제했어요"); renderAll(); return; }
  // 견적 결제 영수증 — 주문(결제 회차) 단위로 표시(같은 회차면 승인번호 1개 공유)
  const qrc = e.target.closest("[data-qreceipt]");
  if (qrc) { const q = window.QUOTES.list().find((x) => x.id === qrc.dataset.qreceipt); if (!q) return; if (q.orderId) { openOrderReceipt(q.orderId); } else { const r = window.REQUESTS.find(q.requestId) || {}; openReceipt({ id: q.id, item: reqCatById(q.cat).label + (q.cat === "space" ? " · " + (q.spaceName || "공간") : " · " + (q.vendorName || "파트너")), total: q.price, date: r.date || q.date || "", ts: q.ts, customer: r.memberName || "본인" }); } return; }
  // 견적 요청 영수증 일괄 다운로드
  const rqrc = e.target.closest("[data-reqreceipt]");
  if (rqrc) { downloadReqReceipt(rqrc.dataset.reqreceipt); return; }
  // 요청 카드 접기/펼치기
  const tg = e.target.closest("[data-toggle]");
  if (tg) { const id = tg.dataset.toggle; if (collapsedReqs.has(id)) collapsedReqs.delete(id); else collapsedReqs.add(id); renderRfp(); return; }
  // 파트너 사진 삭제
  const brm = e.target.closest("[data-bizrm]");
  if (brm) { if (bizPhotos) { bizPhotos.splice(+brm.dataset.bizrm, 1); renderBizInfo(); } return; }
  // 공간 상세 정보 보기
  const si = e.target.closest("[data-spaceinfo]");
  if (si) { openSpaceInfo(si.dataset.spaceinfo); return; }
  const vi = e.target.closest("[data-vendorinfo]");
  if (vi) { openVendorInfoMP(vi.dataset.vendorinfo); return; }
  // 이용 완료 후 파트너/공간 후기 (신뢰 지표)
  const vr = e.target.closest("[data-vreview]");
  if (vr) { const q = window.QUOTES.list().find((x) => x.id === vr.dataset.vreview); if (q) openVendorReview(q); return; }
  // 사진 미리보기 라이트박스 (<>)
  const ph = e.target.closest(".qphotos__img");
  if (ph) { try { openLightbox(JSON.parse(ph.closest(".qphotos").dataset.photos), 0); } catch (e2) {} return; }
  const lbn = e.target.closest("[data-lb]");
  if (lbn) { if (_lb.photos.length) { _lb.i = (_lb.i + (+lbn.dataset.lb) + _lb.photos.length) % _lb.photos.length; if (modalCard._lbDraw) modalCard._lbDraw(); } return; }
  // 1단계: 견적 선택(카테고리당 1곳, 잠정)
  const ocmp = e.target.closest("[data-opencmp]"); if (ocmp) { openQuoteCompare(ocmp.dataset.opencmp); return; }
  const cpick = e.target.closest("[data-cmppick]");
  if (cpick) {
    const q = window.QUOTES.list().find((x) => x.id === cpick.dataset.cmppick);
    if (q) { window.QUOTES.forReq(q.requestId).forEach((x) => { if (x.cat === q.cat && x.id !== q.id && x.status === "selected") window.QUOTES.update(x.id, { status: "sent" }); }); window.QUOTES.update(q.id, { status: "selected" }); if (typeof closeModal === "function") closeModal(); toast(`${reqCatById(q.cat).label} 파트너를 선택했어요 · 확정 버튼을 눌러주세요`); renderAll(); }
    return;
  }
  const selq = e.target.closest("[data-selectq]");
  if (selq) {
    const q = window.QUOTES.list().find((x) => x.id === selq.dataset.selectq);
    if (q) {
      window.QUOTES.forReq(q.requestId).forEach((x) => { if (x.cat === q.cat && x.id !== q.id && x.status === "selected") window.QUOTES.update(x.id, { status: "sent" }); });
      window.QUOTES.update(q.id, { status: "selected" });
      toast(`${reqCatById(q.cat).label} 파트너를 선택했어요 · 확정 버튼을 눌러주세요`); renderAll();
    }
    return;
  }
  // 2단계: 카테고리 확정
  const cc = e.target.closest("[data-confirmcat]");
  if (cc) {
    const [rid, cat] = cc.dataset.confirmcat.split("|");
    const q = window.QUOTES.forReq(rid).find((x) => x.cat === cat && x.status === "selected");
    if (!q) { toast("먼저 파트너를 선택해주세요"); return; }
    window.QUOTES.update(q.id, { status: "accepted" });
    expandedCats.delete(rid + "|" + cat); // 확정 시 자동 접힘(요약)
    syncReqStatus(rid);
    if (cat === "space") { createBookingFromQuote(q); toast("공간을 확정했어요 · 예약 일정에 반영됐어요"); }
    else { window.NOTIF.add({ forUser: q.vendorId, title: "견적이 확정됐어요 🎉", sub: `${reqCatById(cat).label} · ${won(q.price)}원`, link: "mypage.html?tab=vquote" }); toast(`${reqCatById(cat).label} 견적을 확정했어요`); }
    renderAll();
    return;
  }
  // 확정 취소 (선택 상태로 되돌림)
  const uq = e.target.closest("[data-unacceptq]");
  if (uq) { const q = window.QUOTES.list().find((x) => x.id === uq.dataset.unacceptq); if (q) { window.QUOTES.update(q.id, { status: "selected" }); if (q.cat === "space") cancelQuoteBooking(q.id); syncReqStatus(q.requestId); window.NOTIF.add({ forUser: q.vendorId, title: "확정이 취소됐어요", sub: `${reqCatById(q.cat).label} · 재검토`, link: q.cat === "space" ? "mypage.html?tab=hreq" : "mypage.html?tab=vquote" }); toast("확정을 취소했어요"); renderAll(); } return; }
  const qb = e.target.closest("[data-quote]");
  if (qb) { const r = window.REQUESTS.find(qb.dataset.quote); if (!r) return; if (r.deadline && todayStr > r.deadline) { toast("입찰이 마감된 요청이에요 (이용일 임박)"); return; } openQuoteForm(r); return; }
  const sq = e.target.closest("[data-spacequote]");
  if (sq) { const r = window.REQUESTS.find(sq.dataset.spacequote); if (!r) return; if (r.deadline && todayStr > r.deadline) { toast("입찰이 마감된 요청이에요 (이용일 임박)"); return; } openSpaceQuoteForm(r); return; }
  const rd = e.target.closest("[data-reqdetail]");
  if (rd) { const r = window.REQUESTS.find(rd.dataset.reqdetail); if (r) openReqDetail(r); return; }
  const eq = e.target.closest("[data-editq]");
  if (eq) { const q = window.QUOTES.list().find((x) => x.id === eq.dataset.editq); if (q) { const r = window.REQUESTS.find(q.requestId); if (r) { q.cat === "space" ? openSpaceQuoteForm(r, q) : openQuoteForm(r, q); } } return; }
  const dq = e.target.closest("[data-delq]");
  if (dq) { if (!confirm("이 견적을 삭제할까요?")) return; const q = window.QUOTES.list().find((x) => x.id === dq.dataset.delq); if (q) { if (q.cat === "space") cancelQuoteBooking(q.id); window.QUOTES.save(window.QUOTES.list().filter((x) => x.id !== q.id)); const r = window.REQUESTS.find(q.requestId); if (r) window.NOTIF.add({ forUser: r.memberId, title: "견적이 철회됐어요", sub: `${reqCatById(q.cat).label}`, link: "mypage.html?tab=rfp" }); toast("견적을 삭제했어요"); renderAll(); } return; }
  const qc = e.target.closest("[data-qchat]");
  if (qc) { const q = window.QUOTES.list().find((x) => x.id === qc.dataset.qchat); if (q) openQuoteChat(q); return; }
  const ccx = e.target.closest("[data-catcollapse]");
  if (ccx) { const k = ccx.dataset.catcollapse; if (expandedCats.has(k)) expandedCats.delete(k); else expandedCats.add(k); renderRfp(); return; }
  const gcx = e.target.closest("[data-grpcollapse]");
  if (gcx) { const k = gcx.dataset.grpcollapse; if (collapsedGroups.has(k)) collapsedGroups.delete(k); else collapsedGroups.add(k); renderRfp(); return; }
});

// 데모: 내 요청의 각 카테고리에 견적이 최소 2곳씩 보이도록 시드 (카테고리별 1곳 선정 시연)
function seedDemoQuotes() {
  const reqs = window.REQUESTS.mine(me);
  if (!reqs.length) return;
  const vendors = window.AUTH.users().filter((u) => u.role === "vendor");
  const ownedSpaces = getAllSpaces().filter((s) => s.ownerId); // 호스트 소유 등록 대관
  const priceBase = { camera: 50000, catering: 120000, office: 40000, cleaning: 35000, repair: 60000, interior: 150000, banner: 45000, projector: 55000, goods: 30000 };
  const U = (id) => `https://images.unsplash.com/photo-${id}?w=560&h=380&fit=crop&q=70`;
  const PHOTOS = {
    camera: [U("1502920917128-1aa500764cbd"), U("1519638831568-d9897f54ed69")],
    catering: [U("1555244162-803834f70033"), U("1414235077428-338989a2e8c0")],
    office: [U("1497366216548-37526070297c"), U("1524758631624-e2822e304c36")],
    cleaning: [U("1581578731548-c64695cc6952")],
    repair: [U("1581092160562-40aa08e78837")],
    interior: [U("1618221195710-dd6b41faaea6"), U("1618219908412-a29a1bb7b86e")],
    banner: [U("1561070791-2526d30994b5")],
    projector: [U("1517604931442-7e0c8ed2963c"), U("1505373877841-8d25f7d46678")],
    goods: [U("1513885535751-8b9238bd345a")],
    space: [U("1600585154340-be6161a56a0c"), U("1505373877841-8d25f7d46678")],
  };
  reqs.forEach((r) => {
    (r.cats || []).forEach((cat) => {
      const cur = () => window.QUOTES.forReq(r.id).filter((q) => q.cat === cat);
      if (cur().length >= 2) return;
      if (cat === "space") {
        const hours = (r.start != null && r.end != null) ? (r.end - r.start) : 4;
        ownedSpaces.filter((s) => (s.region || "").includes(r.region)).slice(0, 2).forEach((s, i) => {
          if (cur().some((q) => q.spaceId === s.id) || cur().length >= 2) return;
          const orig = (s.price || 30000) * hours;
          const price = Math.round(orig * (0.9 - i * 0.06) / 1000) * 1000;
          const owner = window.AUTH.users().find((u) => u.userId === s.ownerId);
          const ph = spaceImg(s, 560, 380);
          window.QUOTES.add({ requestId: r.id, vendorId: s.ownerId || "host1", vendorName: (owner && owner.nick) || "호스트", cat: "space", spaceId: s.id, spaceName: s.name, price, origPrice: orig, discountPct: Math.round((orig - price) / orig * 100), hours, desc: `${s.name} · 음향·주차 포함, 당일 셋팅`, photos: ph ? [ph].concat(PHOTOS.space.slice(0, 1)) : PHOTOS.space, files: [{ name: `${s.name}_견적서.pdf` }] });
        });
      } else {
        // 직접 요청은 대상 파트너만 1건, 공개 견적 요청은 매칭 파트너 2건
        const bidders = r.directVendorId
          ? vendors.filter((v) => v.userId === r.directVendorId)
          : vendors.filter((v) => (v.serviceCats || []).includes(cat)).slice(0, 2);
        const maxN = r.directVendorId ? 1 : 2;
        bidders.forEach((v, i) => {
          if (cur().some((q) => q.vendorId === v.userId) || cur().length >= maxN) return;
          const base = priceBase[cat] || 50000;
          window.QUOTES.add({ requestId: r.id, vendorId: v.userId, vendorName: v.nick || v.name, cat, price: Math.round(base * (1 - i * 0.12)), desc: `${reqCatById(cat).label} 견적 · 당일 준비 가능`, photos: PHOTOS[cat] || [], files: [{ name: `${v.nick || "파트너"}_견적서.pdf` }] });
        });
      }
    });
  });
}
if (!isHost && !isVendor) seedDemoQuotes();

// 마감 임박 1회성 알림 (feature 2)
function fireDeadlineReminders() {
  let flags = {}; try { flags = JSON.parse(localStorage.getItem("gi_rfp_reminded") || "{}"); } catch (e) {}
  let changed = false;
  window.REQUESTS.mine(me).forEach((r) => {
    if (r.status === "closed") return;
    const dl = daysToDeadline(r);
    if (dl < 0 || dl > 3) return;
    const unconfirmed = (r.cats || []).filter((cat) => { const qs = window.QUOTES.forReq(r.id).filter((q) => q.cat === cat); return qs.length && !qs.some((q) => q.status === "accepted"); });
    if (!unconfirmed.length) return;
    const key = r.id + ":" + r.deadline;
    if (flags[key]) return;
    window.NOTIF.add({ forUser: me, title: "선정 마감 임박 ⏰", sub: `${r.region} ${r.date} · 미확정 ${unconfirmed.length}개 항목 (마감 ${dl === 0 ? "오늘" : "D-" + dl})`, link: "mypage.html?tab=rfp" });
    flags[key] = 1; changed = true;
  });
  if (changed) localStorage.setItem("gi_rfp_reminded", JSON.stringify(flags));
}
if (!isHost && !isVendor) { try { fireDeadlineReminders(); } catch (e) { console.error("[mypage] deadline reminder:", e); } }

renderAll();

// 기간 필터 · 리셋
["bkFrom", "bkTo"].forEach((id) => { const el = $("#" + id); if (el) el.addEventListener("change", renderBooks); });
const _bkR = $("#bkReset"); if (_bkR) _bkR.addEventListener("click", () => { $("#bkFrom").value = ""; $("#bkTo").value = ""; renderBooks(); });
["rfpFrom", "rfpTo"].forEach((id) => { const el = $("#" + id); if (el) el.addEventListener("change", renderRfp); });
const _rfpR = $("#rfpReset"); if (_rfpR) _rfpR.addEventListener("click", () => { $("#rfpFrom").value = ""; $("#rfpTo").value = ""; renderRfp(); });

// ---------- 내 후기 ----------
function renderMyRev() {
  const wrap = $("#myrevWrap"); if (!wrap) return;
  const all = getAllSpaces();
  const rows = window.REVIEWS.all().filter((r) => r.userId === me);
  wrap.innerHTML = rows.length ? rows.map((r) => {
    const sp = all.find((s) => String(s.id) === String(r.spaceId));
    return `<div class="mp-bk"><div class="mp-bk__top"><div class="mp-bk__info" onclick="location.href='space.html?id=${r.spaceId}'"><div class="mp-book__name">${sp ? sp.name : "공간"}</div><div class="mp-bk__sub" style="color:var(--gold)">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div></div></div><div class="mp-bk__policy" style="color:var(--ink-2);font-size:0.9rem">${r.text}</div></div>`;
  }).join("") : `<div class="mp-empty">아직 작성한 후기가 없어요. 이용 완료한 예약에서 후기를 남겨보세요.</div>`;
}
// ---------- 1:1 문의 (모달) ----------
function openInq() {
  modal.hidden = false;
  modalCard.innerHTML = `
    <div class="modal__head"><b>1:1 문의 · 관리자</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="mp__sub" style="margin:-2px 0 12px">공간잇다 <b>운영 관리자</b>에게 1:1로 문의가 전달됩니다.</p>
    <div class="book__field"><label class="book__label">제목</label><input type="text" id="iqSubject" placeholder="문의 제목" /></div>
    <div class="book__field"><label class="book__label">내용</label><textarea id="iqText" rows="3" placeholder="문의 내용을 입력하세요"></textarea></div>
    <button class="btn btn--accent btn--block" id="iqSend">관리자에게 문의 등록</button>
    <h3 class="mg-h" style="border:none;padding-top:20px;margin-bottom:10px">문의 내역</h3>
    <div id="iqList"></div>`;
  const drawList = () => {
    const l = window.INQUIRY.list(me);
    $("#iqList").innerHTML = l.length ? l.map((q) => { const answered = q.status === "answered" && q.answer; return `<div class="mp-bk"><div class="mp-bk__top"><div class="mp-bk__info"><div class="mp-book__name">${q.subject}</div><div class="mp-book__meta">${new Date(q.ts).toLocaleDateString("ko-KR")} · ${q.text}</div></div><span class="mp-book__status ${answered ? "st-green" : "st-amber"}">${answered ? "답변완료" : "접수됨"}</span></div>${answered ? `<div class="mp-bk__policy" style="background:var(--accent-soft);color:var(--ink-2)">🏢 <b>관리자 답변</b> · ${q.answer}</div>` : `<div class="mp-bk__policy">📩 관리자가 확인 후 답변드릴 예정입니다.</div>`}</div>`; }).join("") : `<div class="mp-empty">문의 내역이 없어요.</div>`;
  };
  drawList();
  $("#iqSend").addEventListener("click", () => {
    const s = $("#iqSubject").value.trim(), t = $("#iqText").value.trim();
    if (!s || !t) { toast("제목과 내용을 입력해주세요"); return; }
    window.INQUIRY.add({ userId: me, name: window.AUTH.displayName(auth), subject: s, text: t });
    $("#iqSubject").value = ""; $("#iqText").value = ""; drawList(); toast("문의가 접수되었어요");
  });
}
$("#mpInq").addEventListener("click", openInq);
renderMyRev();

// ---------- 토스트 ----------
let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2400); }

// ---------- 액션 (수락/거절/취소/일정변경/채팅) ----------
function notifyOther(b, title, sub, link) {
  const other = (me === b.hostId) ? b.guestId : b.hostId;
  window.NOTIF.add({ forUser: other, title, sub, link: link || "mypage.html" });
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-accept],[data-decline],[data-cancel],[data-resched],[data-chat],[data-ticket],[data-review],[data-manner],[data-split],[data-receipt]");
  if (!t) return;
  const id = t.dataset.accept || t.dataset.decline || t.dataset.cancel || t.dataset.resched || t.dataset.chat || t.dataset.ticket || t.dataset.review || t.dataset.manner || t.dataset.split || t.dataset.receipt;
  const b = window.BOOKINGS.find(id); if (!b) return;
  if (t.dataset.receipt) { openReceipt(b); return; }
  if (t.dataset.manner) { openManner(b); return; }
  if (t.dataset.split) { openSplit(b); return; }
  if (t.dataset.accept) { window.BOOKINGS.update(id, { status: "confirmed", reschedFrom: null }); notifyOther(b, b.spaceName, `예약이 확정되었어요 · ${slot(b)}`); toast("예약을 수락했어요"); renderAll(); }
  else if (t.dataset.decline) { window.BOOKINGS.update(id, { status: "declined", reschedFrom: null }); revertQuoteBooking(b); notifyOther(b, b.spaceName, `예약이 거절되었어요 · ${b.date}`); toast("예약을 거절했어요"); renderAll(); }
  else if (t.dataset.cancel) { if (!confirm("예약을 취소할까요?")) return; window.BOOKINGS.update(id, { status: "cancelled" }); revertQuoteBooking(b); notifyOther(b, b.spaceName, `예약이 취소되었어요 · ${b.date}`); toast("예약을 취소했어요"); renderAll(); }
  else if (t.dataset.resched) openResched(b);
  else if (t.dataset.chat) { if (window.openChatWidget) window.openChatWidget(b.id); else openChat(b); }
  else if (t.dataset.ticket) openTicket(b);
  else if (t.dataset.review) openReview(b);
});

// 이용권(입장 코드)
function fauxQR(seed) {
  let h = 2166136261; for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const N = 13; let cells = "";
  for (let i = 0; i < N * N; i++) { h = Math.imul(h ^ (h >>> 13), 16777619); cells += `<span class="${(h >>> 5) & 1 ? "on" : ""}"></span>`; }
  return `<div class="qr" style="grid-template-columns:repeat(${N},1fr)">${cells}</div>`;
}
function openTicket(b) {
  modal.hidden = false;
  const code = ("GI" + b.id).toUpperCase().slice(0, 12);
  modalCard.innerHTML = `
    <div class="modal__head"><b>🎫 이용권</b><button class="modal__x" data-mclose>✕</button></div>
    <div class="ticket">
      ${fauxQR(b.id)}
      <div class="ticket__code">${code}</div>
      <div class="ticket__info"><b>${b.spaceName}</b><br />${slot(b)} · ${b.guests}인</div>
      <div class="ticket__note">입장 시 이 화면을 호스트에게 제시하세요. (데모)</div>
    </div>`;
}
// 후기 작성 (이용 완료 예약)
function openReview(b) {
  modal.hidden = false;
  modalCard.innerHTML = `
    <div class="modal__head"><b>후기 쓰기</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="modal__sub">${b.spaceName} · ${b.date}</p>
    <div class="sp-revstars" id="rvStars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}">★</button>`).join("")}</div>
    <textarea id="rvText" rows="3" placeholder="이용 경험을 남겨주세요" style="width:100%;padding:11px 13px;border:1px solid var(--line);border-radius:10px;font-family:inherit;resize:vertical;margin:10px 0"></textarea>
    <button class="btn btn--accent btn--block" id="rvSave">등록</button>`;
  let star = 5;
  const paint = () => modalCard.querySelectorAll("#rvStars button").forEach((x, i) => x.classList.toggle("on", i < star));
  paint();
  $("#rvStars").addEventListener("click", (e) => { const x = e.target.closest("[data-star]"); if (x) { star = +x.dataset.star; paint(); } });
  $("#rvSave").addEventListener("click", () => {
    const txt = $("#rvText").value.trim(); if (!txt) { toast("후기 내용을 입력해주세요"); return; }
    if (reviewedBk(b.id)) { toast("이미 이 예약에 후기를 남겼어요"); closeModal(); return; }
    window.REVIEWS.add({ bookingId: b.id, spaceId: b.spaceId, userId: me, name: window.AUTH.displayName(auth), rating: star, text: txt });
    closeModal(); toast("후기가 등록되었어요! 감사합니다");
    _safe(renderBooks); _safe(renderMyRev);
  });
}

// ---------- 모달 ----------
const modal = $("#modal"), modalCard = $("#modalCard");
function closeModal() { modal.hidden = true; modalCard.className = "modal__card"; modalCard.innerHTML = ""; }
modal.addEventListener("click", (e) => { if (e.target.closest("[data-mclose]")) closeModal(); });

function openResched(b) {
  modal.hidden = false;
  const opts = (a, c) => { let o = ""; for (let i = a; i <= c; i++) o += `<option value="${i}">${i}</option>`; return o; };
  const unit = unitOf(b);
  modalCard.innerHTML = `
    <div class="modal__head"><b>일정 변경</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="modal__sub">${b.spaceName}</p>
    <div class="mp-bk__change" style="margin-bottom:14px">현재 예약<br /><b>${slot(b)}</b> · ${b.guests}인</div>
    <div class="book__field"><label class="book__label">변경할 날짜</label><input type="date" id="rsDate" value="${b.date}" min="${new Date().toISOString().slice(0, 10)}" /></div>
    <div class="book__row">
      <div class="book__field"><label class="book__label">시작 시간</label><select id="rsStart">${opts(9, 21)}</select></div>
      <div class="book__field"><label class="book__label">이용 시간</label><select id="rsHours">${opts(1, 8)}</select></div>
    </div>
    <div class="book__total" style="margin:6px 0 14px"><span>변경 후 금액</span><b id="rsTotal"></b></div>
    <button class="btn btn--accent btn--block" id="rsSave">변경 요청</button>
    <p class="modal__note">${won(unit)}원/시간 기준 · 일정을 바꾸면 상대방의 재확인이 필요해 '승인 대기'로 돌아갑니다.</p>`;
  $("#rsStart").value = b.start; $("#rsHours").value = b.hours;
  const calc = () => { const h = +$("#rsHours").value; const sub = unit * h, total = sub + Math.round(sub * (window.CUSTOMER_FEE || 0)); $("#rsTotal").textContent = won(total) + "원"; return total; };
  calc();
  $("#rsStart").addEventListener("change", calc);
  $("#rsHours").addEventListener("change", calc);
  $("#rsSave").addEventListener("click", () => {
    const date = $("#rsDate").value, start = +$("#rsStart").value, hours = +$("#rsHours").value;
    const total = calc();
    if (date === b.date && start === b.start && hours === b.hours) { toast("변경 사항이 없어요"); return; }
    window.BOOKINGS.update(b.id, { reschedFrom: { date: b.date, start: b.start, hours: b.hours }, date, start, hours, total, status: "requested" });
    notifyOther(b, b.spaceName, `일정 변경 요청 · ${slot({ date, start, hours })}`);
    closeModal(); toast("일정 변경을 요청했어요"); renderAll();
  });
}

let chatDraw = null;
function openChat(b) {
  modal.hidden = false;
  window.CHAT.markRead(me, b.id); renderAll();
  function draw() {
    window.CHAT.markRead(me, b.id);
    const msgs = window.CHAT.get(b.id);
    modalCard.innerHTML = `
      <div class="modal__head"><b>채팅 · ${b.spaceName}</b><button class="modal__x" data-mclose>✕</button></div>
      <div class="chat" id="chatBox">${msgs.length ? msgs.map((m) => `<div class="chat-msg ${m.from === me ? "mine" : ""}"><span class="chat-msg__n">${m.name}</span><span class="chat-msg__b">${m.text}</span><time>${window.timeago(m.ts)}</time></div>`).join("") : `<div class="chat-empty">첫 메시지를 보내보세요</div>`}</div>
      <form class="chat-input" id="chatForm"><input type="text" id="chatText" placeholder="메시지 입력" autocomplete="off" /><button class="btn btn--accent btn--sm" type="submit">전송</button></form>`;
    const box = $("#chatBox"); box.scrollTop = box.scrollHeight;
    $("#chatForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = $("#chatText").value.trim(); if (!v) return;
      window.CHAT.send(b.id, { from: me, name: window.AUTH.displayName(auth), text: v });
      const other = (me === b.hostId) ? b.guestId : b.hostId;
      window.NOTIF.add({ forUser: other, title: b.spaceName, sub: "💬 새 메시지", link: `mypage.html?chat=${b.id}` });
      draw();
    });
  }
  chatDraw = draw; draw();
}
const _closeModal = closeModal; closeModal = function () { chatDraw = null; _closeModal(); };

// 다른 탭에서 실시간 갱신
window.addEventListener("storage", (e) => {
  if (e.key === window.CHAT.KEY) { if (chatDraw && !modal.hidden) chatDraw(); renderAll(); }
  if (e.key === window.BOOKINGS.KEY) renderAll();
});

// 게스트 매너 평가 (호스트)
function openManner(b) {
  modal.hidden = false;
  modalCard.innerHTML = `
    <div class="modal__head"><b>게스트 매너 평가</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="modal__sub">${b.guestName || "게스트"} · ${b.spaceName} (${b.date})</p>
    <div class="sp-revstars" id="mnStars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}">★</button>`).join("")}</div>
    <p class="modal__note">약속 시간 준수·공간 사용·소통을 기준으로 평가해 주세요.</p>
    <button class="btn btn--accent btn--block" id="mnSave">평가 등록</button>`;
  let star = 5;
  const paint = () => modalCard.querySelectorAll("#mnStars button").forEach((x, i) => x.classList.toggle("on", i < star));
  paint();
  $("#mnStars").addEventListener("click", (e) => { const x = e.target.closest("[data-star]"); if (x) { star = +x.dataset.star; paint(); } });
  $("#mnSave").addEventListener("click", () => {
    window.MANNER.add({ bookingId: b.id, hostId: me, guestId: b.guestId, score: star });
    closeModal(); toast("게스트 매너를 평가했어요"); renderAll();
  });
}

// N빵 더치페이
function openSplit(b) {
  modal.hidden = false;
  const head = `<div class="modal__head"><b>🤝 N빵 대관</b><button class="modal__x" data-mclose>✕</button></div>`;
  function render() {
    let sp = window.SPLIT.get(b.id);
    if (!sp || !sp.n) {
      modalCard.innerHTML = head + `
        <p class="modal__sub">${b.spaceName} · 총 <b>${won(b.total)}원</b></p>
        <div class="book__field"><label class="book__label">몇 명이서 나눌까요?</label><select id="spN">${[2, 3, 4, 5, 6, 7, 8].map((k) => `<option value="${k}">${k}명</option>`).join("")}</select></div>
        <div class="book__field"><label class="book__label">예상 1인당 금액</label><div class="split-per" id="spPer"></div></div>
        <button class="btn btn--accent btn--block" id="spCreate">N빵 시작하기</button>`;
      const per = () => { const n = +$("#spN").value; $("#spPer").textContent = won(Math.ceil(b.total / n / 100) * 100) + "원"; };
      per(); $("#spN").addEventListener("change", per);
      $("#spCreate").addEventListener("click", () => { const n = +$("#spN").value; window.SPLIT.set(b.id, { n, paid: Array(n).fill(false) }); render(); renderAll(); toast("N빵을 시작했어요"); });
    } else {
      const per = Math.ceil(b.total / sp.n / 100) * 100;
      const paidCnt = sp.paid.filter(Boolean).length;
      modalCard.innerHTML = head + `
        <p class="modal__sub">${b.spaceName} · ${b.date}</p>
        <div class="split-top"><div><b>${won(per)}원</b><span>1인당</span></div><div><b>${paidCnt}/${sp.n}</b><span>결제 완료</span></div></div>
        <div class="split-list">${sp.paid.map((p, i) => `<label class="split-p"><input type="checkbox" data-p="${i}" ${p ? "checked" : ""} /><span class="split-p__box"></span><span>참여자 ${i + 1}</span><em>${won(per)}원</em></label>`).join("")}</div>
        <button class="btn btn--soft btn--block" id="spCopy">참여 링크 복사</button>
        <button class="btn btn--danger btn--block" id="spReset" style="margin-top:8px">초기화</button>`;
      modalCard.querySelectorAll("[data-p]").forEach((c) => c.addEventListener("change", (e) => { sp.paid[+e.target.dataset.p] = e.target.checked; window.SPLIT.set(b.id, sp); render(); renderAll(); }));
      $("#spCopy").addEventListener("click", () => { const url = location.origin + "/mypage.html?split=" + b.id; if (navigator.clipboard) navigator.clipboard.writeText(url); toast("참여 링크를 복사했어요"); });
      $("#spReset").addEventListener("click", () => { window.SPLIT.set(b.id, { n: 0, paid: [] }); render(); renderAll(); });
    }
  }
  render();
}

// 알림/링크에서 바로 진입 (?chat= / ?split=)
(function openFromURL() {
  const q = new URLSearchParams(location.search);
  const cbid = q.get("chat"); if (cbid) { const b = window.BOOKINGS.find(cbid); if (b) openChat(b); }
  const sbid = q.get("split"); if (sbid) { const b = window.BOOKINGS.find(sbid); if (b) openSplit(b); }
})();

// ---------- 내 공간 삭제 ----------
document.addEventListener("click", (e) => {
  const d = e.target.closest("[data-delspace]"); if (!d) return;
  if (!confirm("이 공간을 삭제할까요? 되돌릴 수 없어요.")) return;
  const sid = +d.dataset.delspace;
  let mine = []; try { mine = JSON.parse(localStorage.getItem("gi_spaces") || "[]"); } catch (x) {}
  const had = mine.some((s) => s.id === sid);
  mine = mine.filter((s) => s.id !== sid);
  localStorage.setItem("gi_spaces", JSON.stringify(mine));
  // 샘플 공간(gi_spaces에 없던 것)은 숨김 목록에 추가해 삭제 반영
  let removed = []; try { removed = JSON.parse(localStorage.getItem("gi_spaces_removed") || "[]"); } catch (x) {}
  if (!removed.includes(sid)) { removed.push(sid); localStorage.setItem("gi_spaces_removed", JSON.stringify(removed)); }
  renderMine(); toast("공간을 삭제했어요");
});

// ---------- 내 공간 공개/숨김 토글 (공사·일시 이용 불가 등) ----------
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-togglehide]"); if (!t) return;
  const sid = +t.dataset.togglehide;
  const willHide = !isSpaceHidden(sid);
  if (willHide) {
    let pkgWarn = "";
    if (typeof PACKAGES !== "undefined") {
      const inPkgs = PACKAGES.filter((p) => (p.spaceOptions || []).map(String).includes(String(sid)));
      if (inPkgs.length) {
        const sole = inPkgs.filter((p) => (p.spaceOptions || []).filter((x) => x !== sid && !isSpaceHidden(x)).length === 0);
        pkgWarn = `\n\n이 공간은 ${inPkgs.length}개 패키지에 제휴 공간으로 포함돼 있어요.` + (sole.length ? ` 그중 ${sole.length}개는 대체 공간이 없어 패키지 판매도 함께 중지됩니다.` : " 다른 제휴 공간이 있어 패키지 판매는 유지됩니다.");
      }
    }
    if (!confirm("이 공간을 숨길까요?\n홈·검색·지도·공간 상세 등 게스트 노출 화면에서 모두 비노출됩니다." + pkgWarn)) return;
  }
  setSpaceHidden(sid, willHide);
  renderMine();
  toast(willHide ? "공간을 숨겼어요 · 게스트 노출 화면에서 비노출됩니다" : "공간을 다시 공개했어요");
});

// ---------- 정보 수정 ----------
$("#mpEdit").addEventListener("click", () => {
  modal.hidden = false;
  const u = window.AUTH.users().find((x) => x.userId === me) || {};
  modalCard.innerHTML = `
    <div class="modal__head"><b>정보 수정</b><button class="modal__x" data-mclose>✕</button></div>
    <div class="book__field"><label class="book__label">닉네임</label><input type="text" id="pfNick" value="${(u.nick || u.name || "").replace(/"/g, "&quot;")}" /></div>
    <div class="book__field"><label class="book__label">이메일</label><input type="email" id="pfEmail" value="${u.email || ""}" /></div>
    <div class="book__field"><label class="book__label">새 비밀번호 <span style="color:var(--faint);font-weight:500">(변경 시에만)</span></label><input type="password" id="pfPw" placeholder="영문·숫자·특수문자 조합 8자 이상" /><span class="hf-hint">변경 시 ${window.PW_RULE || "영문·숫자·특수문자 포함 8자 이상"}으로 설정하세요.</span></div>
    <label class="mkt-toggle"><span class="mkt-toggle__tx"><b>마케팅 정보 수신</b><em>혜택·이벤트·할인 소식 알림</em></span><input type="checkbox" id="pfMktg" ${u.marketing ? "checked" : ""} /><span class="mkt-toggle__sw"></span></label>
    <button class="btn btn--accent btn--block" id="pfSave">저장</button>
    <div class="pf-danger"><button type="button" class="pf-withdraw" id="pfWithdraw">회원 탈퇴 · 개인정보 파기</button><span>탈퇴 시 이름·연락처 등 개인정보는 즉시 파기(익명화)됩니다. 거래·결제 기록은 관계 법령(전자상거래법)에 따라 5년간 익명 보관 후 자동 파기됩니다.</span></div>`;
  $("#pfSave").addEventListener("click", () => {
    const nick = $("#pfNick").value.trim(), email = $("#pfEmail").value.trim(), pw = $("#pfPw").value;
    const mktg = $("#pfMktg").checked;
    if (!nick) { toast("닉네임을 입력해주세요"); return; }
    if (pw && !(window.PWCHECK ? window.PWCHECK(pw) : pw.length >= 8)) { toast("비밀번호는 " + (window.PW_RULE || "영문·숫자·특수문자 포함 8자 이상") + "로 설정해 주세요"); return; }
    const users = window.AUTH.users(); const i = users.findIndex((x) => x.userId === me);
    if (i >= 0) { users[i].nick = nick; users[i].name = nick; users[i].email = email; if (pw) { users[i].pwHash = window.AUTH.hashPw(pw); delete users[i].pw; } if (users[i].marketing !== mktg) { users[i].marketing = mktg; users[i].marketingAt = mktg ? Date.now() : 0; } window.AUTH.saveUsers(users); }
    window.AUTH.set(Object.assign({}, auth, { name: nick, email }));
    toast("저장되었어요"); setTimeout(() => location.reload(), 700);
  });
  $("#pfWithdraw").addEventListener("click", () => {
    if (!confirm("정말 탈퇴하시겠어요?\n\n이름·연락처 등 개인정보가 즉시 파기(익명화)되며 되돌릴 수 없습니다.\n거래·결제 기록은 법령에 따라 5년간 익명 보관됩니다.")) return;
    if (window.PRIVACY && window.PRIVACY.purgeUser) window.PRIVACY.purgeUser(me);
    window.AUTH.logout();
    alert("탈퇴가 완료되었습니다. 개인정보가 파기되었어요.");
    location.href = "index.html";
  });
});

// ---------- 호스트: 공간 관리 (할인 · 가용성 · 예약설정) ----------
// 공간 관리 전용 커스텀 듀오톤 아이콘
function mgIc(p, s) { return `<svg class="mgic" viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`; }
const MGI = {
  ops: '<rect x="3" y="4.5" width="18" height="16" rx="2.5" fill="currentColor" opacity=".12"/><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2.4" x2="8" y2="6"/><line x1="16" y1="2.4" x2="16" y2="6"/><circle cx="15.3" cy="14.6" r="2.3"/><path d="M15.3 12.3v-.8M15.3 17.7v-.8M13 14.6h-.8M18.6 14.6h-.8"/>',
  promo: '<path d="M4 4.2h7.5a2 2 0 0 1 1.42.6l6.3 6.3a2 2 0 0 1 0 2.83l-5.57 5.57a2 2 0 0 1-2.83 0L4.5 12.9A2 2 0 0 1 4 11.6z" fill="currentColor" opacity=".12"/><path d="M4 4.2h7.5a2 2 0 0 1 1.42.6l6.3 6.3a2 2 0 0 1 0 2.83l-5.57 5.57a2 2 0 0 1-2.83 0L4.5 12.9A2 2 0 0 1 4 11.6z"/><circle cx="8.4" cy="8.4" r="1.5" fill="currentColor"/>',
  flash: '<path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z" fill="currentColor" opacity=".16"/><path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z"/>',
  coupon: '<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" fill="currentColor" opacity=".12"/><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z"/><line x1="14.5" y1="6.6" x2="14.5" y2="15.4" stroke-dasharray="1.5 2"/>',
  block: '<rect x="3" y="4.5" width="18" height="16" rx="2.5" fill="currentColor" opacity=".1"/><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2.4" x2="8" y2="6"/><line x1="16" y1="2.4" x2="16" y2="6"/><path d="M9.5 12.8l5 4.4M14.5 12.8l-5 4.4"/>',
  rules: '<circle cx="8.5" cy="7" r="2.3" fill="currentColor" opacity=".18"/><circle cx="8.5" cy="7" r="2.3"/><circle cx="15.5" cy="16.5" r="2.3" fill="currentColor" opacity=".18"/><circle cx="15.5" cy="16.5" r="2.3"/><line x1="11" y1="7" x2="20" y2="7"/><line x1="4" y1="7" x2="6.2" y2="7"/><line x1="13" y1="16.5" x2="4" y2="16.5"/><line x1="20" y1="16.5" x2="17.8" y2="16.5"/>',
  clock: '<circle cx="12" cy="12" r="9" fill="currentColor" opacity=".1"/><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
  broom: '<path d="M9.6 9.4 4.2 14.8c-1 1-1.1 2.7-.1 3.7 1 1 2.7.9 3.7-.1l5.4-5.4z" fill="currentColor" opacity=".13"/><path d="M9.6 9.4 4.2 14.8c-1 1-1.1 2.7-.1 3.7 1 1 2.7.9 3.7-.1l5.4-5.4z"/><path d="M9.6 9.4l5 5 4.9-4.9a2.1 2.1 0 0 0 0-3 2.1 2.1 0 0 0-3 0z"/><path d="M6 16.5l1.5 1.5" opacity=".6"/>',
};
let mgRoomId = null, discTab = "flash";
let blkMonth = (function () { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; })();
function renderManage() {
  const wrap = $("#discWrap"); if (!wrap) return;
  const rooms = myHostSpaces();
  if (!rooms.length) { wrap.innerHTML = `<div class="mp-empty" style="margin-top:10px">등록한 공간이 없어요. <a href="host.html" style="color:var(--accent);font-weight:700">공간 등록하기</a> 후 관리할 수 있어요.</div>`; return; }
  if (mgRoomId == null || !rooms.some((r) => String(r.id) === String(mgRoomId))) mgRoomId = rooms[0].id;
  const cur = () => rooms.find((r) => String(r.id) === String(mgRoomId)) || rooms[0];
  const rid = () => cur().id;
  const thumb = (s) => { const u = (typeof spaceImg === "function") ? spaceImg(s, 120, 90) : ""; return u ? `<img src="${u}" alt="" onerror="this.style.display='none'" />` : `<span class="mgsel__ph">${(s.name || "공")[0]}</span>`; };

  wrap.innerHTML = `
    <div class="book__field"><label class="book__label">공간 선택 <span class="mp__sub" style="font-weight:600">(${rooms.length}곳)</span></label>
      <div class="mgsel" id="mgSel">
        <button type="button" class="mgsel__cur" id="mgSelBtn"><span class="mgsel__thumb">${thumb(cur())}</span><span class="mgsel__info"><b>${cur().name}</b><em>${iconSVG("pin", 12)} ${cur().region || "-"}</em></span><span class="mgsel__chev">▾</span></button>
        <div class="mgsel__pop" id="mgSelPop" hidden>
          ${rooms.length > 4 ? `<input type="text" class="mgsel__search" id="mgSelSearch" placeholder="공간 이름·지역 검색" />` : ""}
          <div class="mgsel__list" id="mgSelList"></div>
        </div>
      </div>
    </div>

    <div class="mg-sec mg-promo">
      <div class="mg-sec__head"><h3 class="mg-h"><span class="mg-hic">${mgIc(MGI.promo, 18)}</span> 할인 · 프로모션</h3><span class="mg-sec__desc">반짝할인과 쿠폰을 탭으로 전환해 설정하세요</span></div>
      <div class="promo-tabs">
        <button type="button" class="promo-tab promo-tab--flash${discTab === "flash" ? " is-on" : ""}" data-disctab="flash">${mgIc(MGI.flash, 16)} 반짝할인</button>
        <button type="button" class="promo-tab promo-tab--coupon${discTab === "coupon" ? " is-on" : ""}" data-disctab="coupon">${mgIc(MGI.coupon, 16)} 쿠폰 발급</button>
      </div>
      <div class="promo-body promo-body--flash" data-promo="flash"${discTab === "flash" ? "" : " hidden"}>
        <p class="promo-hint">지정한 기간 동안 이 공간 가격을 자동으로 할인해요.</p>
        <div class="book__field"><label class="book__label">할인율</label><div class="mg-unitfield"><input type="number" id="dcFlashPct" min="0" max="70" placeholder="예: 20" /><span class="mg-unit">%</span></div></div>
        <div class="book__row"><div class="book__field"><label class="book__label">시작일</label><input type="date" id="dcFlashFrom" /></div><div class="book__field"><label class="book__label">종료일</label><input type="date" id="dcFlashTo" /></div></div>
        <div class="mg-sec__foot"><button class="btn btn--accent" id="dcFlashSave">⚡ 반짝할인 적용</button></div>
      </div>
      <div class="promo-body promo-body--coupon" data-promo="coupon"${discTab === "coupon" ? "" : " hidden"}>
        <p class="promo-hint">코드를 입력하면 할인되는 쿠폰을 발급해요. 적용 대상: <b>${cur().name}</b> <span style="color:var(--faint)">(이 공간 전용)</span></p>
        <div class="book__field"><label class="book__label">쿠폰 코드</label><input type="text" id="dcCoupCode" placeholder="예: WELCOME10" /></div>
        <div class="book__field"><label class="book__label">할인 유형</label><div class="seg2" id="dcCoupType"><label class="seg2__o"><input type="radio" name="dcCoupType" value="percent" checked /><span>할인율 (%)</span></label><label class="seg2__o"><input type="radio" name="dcCoupType" value="amount" /><span>정액 (원)</span></label></div></div>
        <div class="book__row">
          <div class="book__field"><label class="book__label">할인 값</label><div class="mg-unitfield"><input type="number" id="dcCoupVal" min="0" step="1000" placeholder="예: 10" /><span class="mg-unit" id="dcCoupUnit">%</span></div></div>
          <div class="book__field"><label class="book__label">최소 이용시간</label><div class="mg-unitfield"><input type="number" id="dcCoupMinH" min="0" max="24" placeholder="예: 2" /><span class="mg-unit">시간</span></div></div>
          <div class="book__field"><label class="book__label">최소 결제액</label><div class="mg-unitfield"><input type="number" id="dcCoupMinAmt" min="0" step="1000" placeholder="예: 50000" /><span class="mg-unit">원</span></div></div>
        </div>
        <div class="book__row"><div class="book__field"><label class="book__label">시작일</label><input type="date" id="dcCoupFrom" /></div><div class="book__field"><label class="book__label">종료일</label><input type="date" id="dcCoupTo" /></div></div>
        <span class="hf-hint">💡 최소 조건은 비워두면 제한 없이 적용돼요. 정액 할인은 결제액 한도 내에서 차감됩니다.</span>
        <div class="mg-sec__foot"><button class="btn btn--accent" id="dcCoupSave">🎟️ 쿠폰 생성</button></div>
      </div>
    </div>

    <div class="mg-sec">
      <div class="mg-sec__head"><h3 class="mg-h"><span class="mg-hic">${mgIc(MGI.ops, 18)}</span> 예약 운영 설정</h3><span class="mg-sec__desc">차단 날짜와 예약 규칙을 한 곳에서 관리하세요</span></div>
      <div class="mg-opsgrid">
        <div class="mg-opscol">
          <div class="mg-subhead"><span class="mg-hic mg-hic--red">${mgIc(MGI.block, 16)}</span> 가용성 차단 <span>날짜 클릭 → 종일 또는 시간대 단위로 예약 차단 (즉시 저장)</span></div>
          <div class="mgcal" id="blkCal"></div>
          <div class="mg-blkslots" id="blkSlots"></div>
        </div>
        <div class="mg-opscol mg-opscol--rules">
          <div class="mg-subhead"><span class="mg-hic">${mgIc(MGI.rules, 16)}</span> 예약 규칙</div>
          <label class="mg-check mg-check--auto"><span class="mg-lic mg-lic--gold">${mgIc(MGI.flash, 15)}</span><input type="checkbox" id="stAuto" /><span class="mg-check__body"><b>즉시 예약 자동 수락</b><em>게스트가 결제를 완료하면 호스트 승인 없이 예약이 바로 확정됩니다.</em></span></label>
          <div class="book__field" id="stAutoMsgWrap"><label class="book__label">📩 자동 수락 시 게스트 안내 메시지 <span class="mg-tip" tabindex="0" data-tip="자동 수락으로 예약이 확정되면 이 메시지가 게스트에게 알림으로 전달돼요. 출입 방법·주차·비밀번호·연락처 등 이용에 필요한 정보를 미리 적어두면 문의가 크게 줄어요.">?</span></label><textarea id="stAutoMsg" rows="4" placeholder="예) 예약 감사합니다! 건물 1층 공동현관 비밀번호는 *1234이며, 주차는 건물 뒤편 2대 가능합니다. 입실 후 조명·냉난방 리모컨은 TV 옆 서랍에 있어요. 궁금한 점은 010-0000-0000으로 연락 주세요."></textarea><span class="hf-hint">💡 출입 방법·주차·와이파이·연락처 등을 적어두면 게스트가 헤매지 않아요.</span></div>
          <div class="book__field"><label class="book__label">${mgIc(MGI.clock, 13)} 최소 시간</label><div class="mg-unitfield"><input type="number" id="stMin" min="1" max="12" /><span class="mg-unit">시간</span></div></div>
          <div class="book__field"><label class="book__label">${mgIc(MGI.clock, 13)} 최대 시간</label><div class="mg-unitfield"><input type="number" id="stMax" min="1" max="12" /><span class="mg-unit">시간</span></div></div>
          <div class="book__field"><label class="book__label">${mgIc(MGI.broom, 13)} 청소 버퍼 <span class="mg-tip" tabindex="0" data-tip="다음 예약 사이의 필수 정비 시간이에요. 이 시간만큼 연속 예약을 막아 청소·세팅 여유를 둡니다.">?</span></label><div class="mg-unitfield"><input type="number" id="stBuf" min="0" max="4" /><span class="mg-unit">시간</span></div></div>
          <div class="mg-sec__foot"><button class="btn btn--accent" id="stSave">예약 규칙 저장</button></div>
        </div>
      </div>
    </div>
    <p class="hf-note" id="mgMsg"></p>`;

  // 공간 선택(검색 가능한 셀렉트 카드)
  const selPop = $("#mgSelPop");
  const renderSelList = (q) => {
    q = (q || "").toLowerCase();
    const list = rooms.filter((r) => !q || (r.name + " " + (r.region || "")).toLowerCase().includes(q));
    $("#mgSelList").innerHTML = list.length ? list.map((r) => `<button type="button" class="mgsel__item${String(r.id) === String(mgRoomId) ? " is-on" : ""}" data-room="${r.id}"><span class="mgsel__thumb">${thumb(r)}</span><span class="mgsel__info"><b>${r.name}</b><em>${r.region || "-"}</em></span></button>`).join("") : `<div class="mgsel__empty">검색 결과가 없어요.</div>`;
  };
  $("#mgSelBtn").addEventListener("click", () => { const opening = selPop.hidden; selPop.hidden = !opening; if (opening) { renderSelList(""); const s = $("#mgSelSearch"); if (s) { s.value = ""; s.focus(); } } });
  selPop.addEventListener("click", (e) => { const it = e.target.closest("[data-room]"); if (!it) return; mgRoomId = it.dataset.room; renderManage(); });
  const ss = $("#mgSelSearch"); if (ss) ss.addEventListener("input", () => renderSelList(ss.value));

  // 프로모션 탭 전환
  wrap.querySelectorAll("[data-disctab]").forEach((btn) => btn.addEventListener("click", () => {
    discTab = btn.dataset.disctab;
    wrap.querySelectorAll("[data-disctab]").forEach((b) => b.classList.toggle("is-on", b === btn));
    wrap.querySelectorAll("[data-promo]").forEach((p) => (p.hidden = p.dataset.promo !== discTab));
  }));

  // 로드
  const loadDisc = () => {
    const d = window.DISCOUNT.get(rid()), f = d.flash || {}, c = d.coupon || {};
    $("#dcFlashPct").value = f.pct || ""; $("#dcFlashFrom").value = f.from || todayStr; $("#dcFlashTo").value = f.to || "";
    $("#dcCoupCode").value = c.code || "";
    const dt = c.discType || "percent"; const rb = document.querySelector(`input[name="dcCoupType"][value="${dt}"]`); if (rb) rb.checked = true;
    $("#dcCoupVal").value = (c.value != null ? c.value : c.pct) || "";
    $("#dcCoupMinH").value = c.minHours || ""; $("#dcCoupMinAmt").value = c.minAmount || "";
    $("#dcCoupFrom").value = c.from || todayStr; $("#dcCoupTo").value = c.to || "";
    if ($("#dcCoupUnit")) $("#dcCoupUnit").textContent = dt === "amount" ? "원" : "%";
  };
  const dcType = document.getElementById("dcCoupType");
  if (dcType) dcType.addEventListener("change", () => { const dt = (document.querySelector('input[name="dcCoupType"]:checked') || {}).value; if ($("#dcCoupUnit")) $("#dcCoupUnit").textContent = dt === "amount" ? "원" : "%"; });
  function toggleAutoMsg() { const w = $("#stAutoMsgWrap"), a = $("#stAuto"); if (w && a) w.style.display = a.checked ? "" : "none"; }
  const loadSet = () => { const s = window.SETTINGS.get(rid()); $("#stAuto").checked = !!s.autoAccept; $("#stMin").value = s.minH; $("#stMax").value = s.maxH; $("#stBuf").value = s.buffer; if ($("#stAutoMsg")) $("#stAutoMsg").value = s.autoMsg || ""; toggleAutoMsg(); };
  $("#stAuto").addEventListener("change", toggleAutoMsg);
  ["dcFlashFrom", "dcFlashTo", "dcCoupFrom", "dcCoupTo"].forEach((id) => { const el = document.getElementById(id); if (el) el.min = todayStr; });
  loadDisc(); loadSet();

  // 차단 달력 (날짜 종일 + 시간대 단위)
  const WDS2 = ["일", "월", "화", "수", "목", "금", "토"];
  let blkSelDate = null;
  function renderBlkCal() {
    const el = $("#blkCal"); if (!el) return;
    const y = blkMonth.getFullYear(), m = blkMonth.getMonth();
    const startWd = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    const blocked = new Set(window.BLOCKS.get(rid()));
    let cells = "", dayCnt = 0, slotDays = 0;
    for (let i = 0; i < startWd; i++) cells += `<span class="mgcal-e"></span>`;
    for (let d = 1; d <= days; d++) {
      const ds = `${y}-${pad(m + 1)}-${pad(d)}`, past = ds < todayStr, isBlk = blocked.has(ds);
      const partial = !isBlk && window.BLOCKS.slotCount(rid(), ds) > 0;
      if (isBlk) dayCnt++; if (partial) slotDays++;
      cells += `<button type="button" class="mgcal-d${isBlk ? " is-blocked" : ""}${partial ? " is-partial" : ""}${ds === blkSelDate ? " is-sel" : ""}${ds === todayStr ? " is-today" : ""}${past ? " is-past" : ""}" ${past ? "disabled" : ""} data-blk="${ds}">${d}</button>`;
    }
    el.innerHTML = `<div class="mgcal-top"><button type="button" data-blknav="-1" aria-label="이전 달">‹</button><b>${y}년 ${m + 1}월</b><button type="button" data-blknav="1" aria-label="다음 달">›</button></div><div class="mgcal-wd">${WDS2.map((w) => `<span>${w}</span>`).join("")}</div><div class="mgcal-grid">${cells}</div><p class="mgcal-hint"><span class="mgcal-legend"></span> 종일 차단 <span class="mgcal-legend mgcal-legend--p"></span> 일부 시간 차단 ${dayCnt || slotDays ? `· 종일 ${dayCnt}일${slotDays ? ` · 일부 ${slotDays}일` : ""}` : "· 날짜를 클릭하세요"}</p>`;
  }
  function renderBlkSlots() {
    const el = $("#blkSlots"); if (!el) return;
    if (!blkSelDate) { el.innerHTML = ""; return; }
    const dayBlocked = window.BLOCKS.has(rid(), blkSelDate);
    const slots = new Set(window.BLOCKS.getSlots(rid(), blkSelDate));
    const [yy, mm, dd] = blkSelDate.split("-");
    let chips = "";
    for (let h = 9; h <= 21; h++) chips += `<button type="button" class="blk-slot${slots.has(h) ? " is-off" : ""}" data-blkslot="${h}" ${dayBlocked ? "disabled" : ""}>${pad(h)}~${pad(h + 1)}</button>`;
    el.innerHTML = `<div class="blk-edit">
      <div class="blk-edit__hd"><b>${+mm}월 ${+dd}일</b> 예약 차단<button type="button" class="blk-edit__x" data-blkclose aria-label="닫기">✕</button></div>
      <label class="blk-allday"><input type="checkbox" data-blkallday ${dayBlocked ? "checked" : ""} /> <span>이 날 <b>종일 차단</b></span></label>
      <div class="blk-slots-hd">시간대 선택 <span>${dayBlocked ? "종일 차단 중 — 해제하면 시간대 지정 가능" : "빨간 시간대는 예약 불가"}</span></div>
      <div class="blk-slots">${chips}</div>
    </div>`;
  }
  renderBlkCal(); renderBlkSlots();
  $("#blkCal").addEventListener("click", (e) => {
    const nav = e.target.closest("[data-blknav]");
    if (nav) { blkMonth = new Date(blkMonth.getFullYear(), blkMonth.getMonth() + (+nav.dataset.blknav), 1); renderBlkCal(); return; }
    const d = e.target.closest("[data-blk]"); if (!d || d.disabled) return;
    blkSelDate = d.dataset.blk; renderBlkCal(); renderBlkSlots();
  });
  $("#blkSlots").addEventListener("click", (e) => {
    if (e.target.closest("[data-blkclose]")) { blkSelDate = null; renderBlkCal(); renderBlkSlots(); return; }
    const s = e.target.closest("[data-blkslot]"); if (s && !s.disabled && blkSelDate) {
      window.BLOCKS.toggleSlot(rid(), blkSelDate, +s.dataset.blkslot); renderBlkCal(); renderBlkSlots(); return;
    }
  });
  $("#blkSlots").addEventListener("change", (e) => {
    const a = e.target.closest("[data-blkallday]"); if (!a || !blkSelDate) return;
    window.BLOCKS.toggle(rid(), blkSelDate); // 종일 차단 토글
    if (window.BLOCKS.has(rid(), blkSelDate)) window.BLOCKS.clearSlots(rid(), blkSelDate); // 종일이면 시간대 초기화
    renderBlkCal(); renderBlkSlots();
    toast(window.BLOCKS.has(rid(), blkSelDate) ? "이 날을 종일 차단했어요" : "종일 차단을 해제했어요");
  });

  // 저장
  $("#dcFlashSave").addEventListener("click", () => {
    const d = window.DISCOUNT.get(rid());
    const flash = $("#dcFlashPct").value ? { pct: +$("#dcFlashPct").value, from: $("#dcFlashFrom").value, to: $("#dcFlashTo").value } : null;
    window.DISCOUNT.set(rid(), { flash, coupon: d.coupon || null });
    $("#mgMsg").textContent = "반짝할인 저장됨 · 목록·상세에 반영됩니다."; toast(flash ? "반짝할인을 적용했어요" : "반짝할인을 해제했어요");
  });
  $("#dcCoupSave").addEventListener("click", () => {
    const d = window.DISCOUNT.get(rid());
    const dt = (document.querySelector('input[name="dcCoupType"]:checked') || {}).value || "percent";
    const val = +$("#dcCoupVal").value || 0;
    const coupon = ($("#dcCoupCode").value && val) ? {
      code: $("#dcCoupCode").value.trim(), discType: dt, value: val,
      pct: dt === "percent" ? val : 0, // 레거시 couponPct 호환
      minHours: +$("#dcCoupMinH").value || 0, minAmount: +$("#dcCoupMinAmt").value || 0,
      spaceId: rid(), from: $("#dcCoupFrom").value, to: $("#dcCoupTo").value,
    } : null;
    window.DISCOUNT.set(rid(), { flash: d.flash || null, coupon });
    $("#mgMsg").textContent = coupon ? `쿠폰 '${coupon.code}' 생성됨` : "쿠폰 삭제됨"; toast(coupon ? "쿠폰을 생성했어요" : "쿠폰을 삭제했어요");
  });
  $("#stSave").addEventListener("click", () => {
    window.SETTINGS.set(rid(), { autoAccept: $("#stAuto").checked, minH: Math.max(1, +$("#stMin").value || 1), maxH: Math.max(1, +$("#stMax").value || 8), buffer: Math.max(0, +$("#stBuf").value || 0), autoMsg: $("#stAutoMsg") ? $("#stAutoMsg").value.trim() : "" });
    $("#mgMsg").textContent = "예약 설정 저장됨"; toast("예약 설정을 저장했어요");
  });
}
// 공간 선택 팝업 바깥 클릭 시 닫기 (한 번만 등록)
document.addEventListener("click", (e) => { if (!e.target.closest(".mgsel")) { const p = document.getElementById("mgSelPop"); if (p) p.hidden = true; } });
// ---------- 호스트: 정산 요약 ----------
function renderSettle() {
  const wrap = $("#settleWrap"); if (!wrap) return;
  const P = settlePanel(), R = P.R;
  const mine = window.BOOKINGS.list().filter((b) => b.hostId === me && b.status === "confirmed" && (b.date || "") >= R.from && (b.date || "") <= R.to);
  settleItemsCache = sortSettleItems(mine.map((b) => settleItemFor("host", b)));
  wrap.innerHTML = `
    <h2 class="sp-sec__title" style="margin-bottom:14px">정산 · PG 자동 분리정산</h2>
    ${P.html}
    <div class="settle-listhead"><h3 class="mg-h" style="margin:0">${R.label} 확정 예약 내역</h3>${settleItemsCache.length ? `<button type="button" class="btn btn--soft btn--sm" data-setxls>📥 엑셀 다운로드</button>` : ""}</div>
    ${settleControls()}
    ${settleItemsCache.length ? settleSumBar(settleItemsCache) + settleItemsCache.map(settleItemCard).join("") : `<div class="mp-empty">${R.label} 확정된 예약이 없어요.</div>`}`;
  bindPayout(renderSettle);
}
// A-4: 매출 리포트 — 공간 단독 vs 올인원 패키지 매출 비중
function salesMixHTML(bookings) {
  const seg = { solo: { gross: 0, n: 0 }, pkg: { gross: 0, n: 0 } };
  bookings.forEach((b) => { const k = b.pkg ? "pkg" : "solo"; seg[k].gross += (b.total || 0); seg[k].n++; });
  const tot = seg.solo.gross + seg.pkg.gross;
  if (!tot) return "";
  const soloPct = Math.round(seg.solo.gross / tot * 100), pkgPct = 100 - soloPct;
  const promo = seg.pkg.n === 0
    ? `<p class="smix__tip">💡 아직 패키지 매출이 없어요. <button type="button" class="daymg-link" data-daygopkg>올인원 패키지</button>에 공간을 등록하면 케이터링·연출과 묶여 <b>객단가</b>를 높일 수 있어요.</p>`
    : (pkgPct < 30 ? `<p class="smix__tip">💡 패키지 비중이 ${pkgPct}%예요. 패키지 노출을 늘리면 예약 단가를 더 높일 수 있어요.</p>` : `<p class="smix__tip">👍 패키지 매출 비중이 ${pkgPct}%로 안정적이에요.</p>`);
  return `<div class="smix">
    <div class="smix__h">📊 매출 리포트 <span>공간 단독 vs 올인원 패키지 · 거래액 기준</span></div>
    <div class="smix__bar"><i class="smix__solo" style="flex:${Math.max(seg.solo.gross, 0.001)}"></i><i class="smix__pkg" style="flex:${Math.max(seg.pkg.gross, 0.001)}"></i></div>
    <div class="smix__legend">
      <div class="smix__item"><span class="smix__dot smix__dot--solo"></span><span class="smix__lbl">공간 단독</span><b>${won(seg.solo.gross)}원</b><em>${soloPct}% · ${seg.solo.n}건</em></div>
      <div class="smix__item"><span class="smix__dot smix__dot--pkg"></span><span class="smix__lbl">올인원 패키지</span><b>${won(seg.pkg.gross)}원</b><em>${pkgPct}% · ${seg.pkg.n}건</em></div>
    </div>
    ${promo}
  </div>`;
}
if (isHost) { _safe(renderManage); _safe(renderSettle); }

// 정렬·기간 필터 컨트롤 (예약요청·공간견적요청·정산)
document.addEventListener("click", (e) => {
  const rs = e.target.closest("[data-reqstatus]"); if (rs) { reqStatusF = rs.dataset.reqstatus; renderReqs(); return; }
  const rp = e.target.closest("[data-reqp]"); if (rp) { reqPeriod = rp.dataset.reqp; renderReqs(); return; }
  const hp = e.target.closest("[data-hreqp]"); if (hp) { hreqPeriod = hp.dataset.hreqp; renderHreq(); return; }
  const hst = e.target.closest("[data-hreqstatus]"); if (hst) { hreqStatusF = hst.dataset.hreqstatus; renderHreq(); return; }
  const vp = e.target.closest("[data-vreqp]"); if (vp) { vreqPeriod = vp.dataset.vreqp; renderVreq(); return; }
  const vst = e.target.closest("[data-vreqstatus]"); if (vst) { vreqStatusF = vst.dataset.vreqstatus; renderVreq(); return; }
  const jn = e.target.closest("[data-jobnext]"); if (jn) { advanceJob(jn.dataset.jobnext, 1); return; }
  const jb = e.target.closest("[data-jobback]"); if (jb) { advanceJob(jb.dataset.jobback, -1); return; }
  const sn = e.target.closest("[data-setnav]"); if (sn) { setPeriod = "month"; setMonth = shiftMonth(setMonth, +sn.dataset.setnav); if (isHost) renderSettle(); if (isVendor) renderVsettle(); return; }
  const sp2 = e.target.closest("[data-setperiod]"); if (sp2) { setPeriod = sp2.dataset.setperiod; setFrom = ""; setTo = ""; if (isHost) renderSettle(); if (isVendor) renderVsettle(); return; }
  const ss = e.target.closest("[data-setsort]"); if (ss) { const k = ss.dataset.setsort; if (setSort === k) { setDir = setDir === "asc" ? "desc" : "asc"; } else { setSort = k; setDir = k === "status" ? "asc" : "desc"; } if (isHost) renderSettle(); if (isVendor) renderVsettle(); return; }
  const sc = e.target.closest("[data-setclear]"); if (sc) { setPeriod = "month"; setFrom = ""; setTo = ""; if (isHost) renderSettle(); if (isVendor) renderVsettle(); return; }
  const rcs = e.target.closest("[data-rcptset]"); if (rcs) { const it = settleItemsCache.find((x) => String(x.id) === String(rcs.dataset.rcptset)); if (it) openReceipt({ id: it.id, item: it.item, total: it.gross, date: it.date, time: it.time, customer: it.customer }); return; }
  const txs = e.target.closest("[data-taxset]"); if (txs) { const it = settleItemsCache.find((x) => String(x.id) === String(txs.dataset.taxset)); if (it) openTaxMP(it); return; }
  const sx = e.target.closest("[data-setxls]"); if (sx) { exportSettleXls(); return; }
  const tpdf = e.target.closest("[data-taxpdf]"); if (tpdf) { downloadTaxInvoice(); return; }
  const gpkg = e.target.closest("[data-daygopkg]"); if (gpkg) { window.location.href = "packages.html"; return; }
});
// 날짜 지정(시작~종료) 입력
document.addEventListener("change", (e) => {
  const id = e.target.id;
  if (id === "reqFrom") { reqFrom = e.target.value; reqPeriod = "custom"; renderReqs(); }
  else if (id === "reqTo") { reqTo = e.target.value; reqPeriod = "custom"; renderReqs(); }
  else if (id === "hreqFrom") { hreqFrom = e.target.value; hreqPeriod = "custom"; renderHreq(); }
  else if (id === "hreqTo") { hreqTo = e.target.value; hreqPeriod = "custom"; renderHreq(); }
  else if (id === "vreqFrom") { vreqFrom = e.target.value; vreqPeriod = "custom"; renderVreq(); }
  else if (id === "vreqTo") { vreqTo = e.target.value; vreqPeriod = "custom"; renderVreq(); }
  else if (id === "setFrom") { setFrom = e.target.value; setPeriod = "custom"; if (isHost) renderSettle(); if (isVendor) renderVsettle(); }
  else if (id === "setTo") { setTo = e.target.value; setPeriod = "custom"; if (isHost) renderSettle(); if (isVendor) renderVsettle(); }
});

// 탭
function activate(t) {
  const tab = document.querySelector(`.mp-tab[data-tab="${t}"]`);
  if (!tab || tab.hidden) return false;
  document.querySelectorAll(".mp-tab").forEach((x) => x.classList.toggle("is-active", x === tab));
  document.querySelectorAll(".mp-panel").forEach((p) => (p.hidden = p.dataset.panel !== t));
  return true;
}
$("#mpTabs").addEventListener("click", (e) => { const b = e.target.closest(".mp-tab"); if (b) activate(b.dataset.tab); });
(function initTab() {
  const urlTab = new URLSearchParams(location.search).get("tab");
  if (urlTab && activate(urlTab)) return;
  const first = [...document.querySelectorAll(".mp-tab")].find((t) => !t.hidden);
  if (first) activate(first.dataset.tab);
})();

// 실시간 자동 갱신 (대시보드 탭 한정 · live.js 유입/크로스탭/주기 폴링) — 변경 있을 때만, 입력 중엔 건너뜀
let _liveSig = "";
function _liveSignature() { return [window.BOOKINGS.list().length, window.QUOTES.list().length, window.REQUESTS.list().length].join("|"); }
window.refreshLive = function () {
  const sig = _liveSignature();
  if (sig === _liveSig) return;
  const active = document.querySelector(".mp-tab.is-active");
  if (!active || active.dataset.tab !== "dash") { _liveSig = sig; return; }
  const ae = document.activeElement;
  if (ae && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName)) return;
  _liveSig = sig; if (typeof renderDash === "function") renderDash();
};
_liveSig = _liveSignature();
setInterval(() => { if (window.refreshLive) window.refreshLive(); }, 20000);
window.addEventListener("storage", (e) => { if (/^gi_/.test(e.key || "") && window.refreshLive) window.refreshLive(); });

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
