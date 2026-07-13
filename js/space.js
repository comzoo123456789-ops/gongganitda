// ============================================================
// 공간잇다 — 공간 상세 · 예약 페이지
// ============================================================
const $ = (s) => document.querySelector(s);
const won = (n) => n.toLocaleString("ko-KR");
const params = new URLSearchParams(location.search);
const id = +params.get("id");
const ALL = getAllSpaces();
const S = ALL.find((s) => s.id === id) || ALL[0];
const C = catById(S.cat);
const SG = S.g || [C.ink, "#cfc7b8"];

// 같은 유형의 다른 공간 (갤러리 보조 이미지 + 관련 공간)
const others = ALL.filter((s) => s.id !== S.id);
const sameCat = others.filter((s) => s.cat === S.cat);
// 같은 유형 우선, 부족하면 다른 공간으로 채워 항상 3개 확보
const galleryExtra = [...sameCat, ...others.filter((s) => s.cat !== S.cat)].slice(0, 3);

// 결정적 후기 생성
const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const REV_NAMES = ["김도현", "이서연", "박준영", "최유진", "정민석", "한지우"];
const REV_TXT = [
  "사진보다 실물이 훨씬 좋았어요. 청결하고 위치도 편했습니다.",
  "모임하기 딱 좋은 공간이었어요. 호스트님도 친절하셨습니다.",
  "시설이 잘 갖춰져 있어서 준비 없이도 편하게 이용했어요.",
  "가격 대비 만족도 최고입니다. 다음에 또 예약할게요!",
  "조용하고 아늑해서 집중하기 좋았습니다. 추천해요.",
];
function reviews() {
  const n = 3;
  return Array.from({ length: n }, (_, i) => {
    const seed = hash(S.name + i);
    return {
      name: REV_NAMES[seed % REV_NAMES.length],
      txt: REV_TXT[seed % REV_TXT.length],
      stars: 4 + (seed % 2),
      color: SG[i % 2],
    };
  });
}

// 편의시설 아이콘 매핑
const amenIcon = (t) => {
  if (/주차/.test(t)) return "pin";
  if (/와이파이|wifi/i.test(t)) return "grid";
  if (/음향|스피커|마이크|앰프|노래방/.test(t)) return "practice";
  if (/빔|프로젝터|넷플/.test(t)) return "studio";
  if (/조명/.test(t)) return "event";
  if (/취사|오븐|냉장고|식기|정수기/.test(t)) return "cafe";
  if (/화이트보드|프린터|콘센트|화상/.test(t)) return "meeting";
  return "star";
};

// ---------- 렌더 ----------
$("#sp").innerHTML = `
  <a href="index.html" class="sp-back"><span style="display:inline-flex;transform:scaleX(-1)">${iconSVG("arrow", 16)}</span>목록으로</a>

  <div class="sp-gallery">
    <div class="sp-gallery__main" style="background:linear-gradient(135deg,${SG[0]},${SG[1]})">${spaceImg(S, 1000, 900) ? `<img src="${spaceImg(S, 1000, 900)}" alt="${S.name}" onerror="this.remove()" />` : ""}</div>
    ${galleryExtra.slice(0, 2).map((g) => { const gg = g.g || [C.ink, "#cfc7b8"]; const u = spaceImg(g, 500, 400); return `<div class="sp-gallery__sm" style="background:linear-gradient(135deg,${gg[0]},${gg[1]})">${u ? `<img src="${u}" alt="" onerror="this.remove()" />` : ""}</div>`; }).join("")}
  </div>

  <div class="sp-layout">
    <div class="sp-main">
      <div class="sp-head">
        <span class="sp-head__cat">${C.label}</span>
        <h1 class="sp-head__title">${S.name}</h1>
        <div class="sp-head__meta">
          <span class="rate">${S.reviews ? `${iconSVG("star", 16)}${S.rating} <em style="color:var(--faint);font-weight:500">· 후기 ${S.reviews}</em>` : `<em style="color:var(--accent);font-weight:700">신규 공간</em>`}</span>
          <span>${iconSVG("pin", 16)}${S.region}</span>
          <span>${iconSVG("users", 16)}최대 ${S.capacity}인</span>
        </div>
      </div>

      <div class="sp-sec">
        <h2 class="sp-sec__title">공간 소개</h2>
        <p class="sp-desc">${S.desc ? S.desc.replace(/</g, "&lt;").replace(/\n/g, "<br />") : `${S.region}에 위치한 <b>${S.name}</b>은(는) 최대 ${S.capacity}인까지 이용 가능한 ${C.label} 공간입니다. 시간 단위로 편하게 대관할 수 있으며, 필요한 기본 시설을 모두 갖추고 있어 준비 없이도 바로 이용하실 수 있습니다. 모임·행사·작업 등 목적에 맞게 자유롭게 활용해 보세요.`}</p>
      </div>

      <div class="sp-sec">
        <h2 class="sp-sec__title">편의시설</h2>
        <ul class="sp-amen">
          ${S.tags.map((t) => `<li>${iconSVG(amenIcon(t), 18)}${t}</li>`).join("")}
        </ul>
      </div>

      <div class="sp-sec">
        <h2 class="sp-sec__title">위치</h2>
        <div class="sp-loc">
          <div class="sp-loc__addr">${iconSVG("pin", 18)} ${S.region}</div>
          <a class="btn btn--outline btn--sm" href="${naverMapUrl(S.addr || S.region)}" target="_blank" rel="noopener">네이버 지도에서 보기 →</a>
        </div>
      </div>

      <div class="sp-sec">
        <h2 class="sp-sec__title">이용 후기 <span id="spRevAvg"></span></h2>
        <div id="spReviewForm"></div>
        <div class="sp-rev" id="spRev"></div>
      </div>

      <div class="sp-sec">
        <h2 class="sp-sec__title">이용 안내</h2>
        <p class="sp-desc" style="font-size:0.9rem;color:var(--muted)">· 예약은 시간 단위로 가능합니다.<br />· 퇴실 시 공간을 이용 전 상태로 정리해 주세요.<br />· <b style="color:var(--ink-2)">취소·환불 규정</b> — 이용 <b>3일 전까지 100%</b> 환불, <b>1~2일 전 50%</b>, <b>당일 환불 불가</b>. (데모 기준)</p>
      </div>

      <div class="sp-sec">
        <h2 class="sp-sec__title">비슷한 공간</h2>
        <div class="sp-rel" id="relGrid"></div>
      </div>
    </div>

    <!-- 예약 카드 -->
    <aside>
      <div class="book">
        <div class="book__price" id="bkPrice"></div>
        <div class="book__field">
          <label class="book__label">날짜 선택</label>
          <div class="cal" id="bkCal"></div>
        </div>
        <div class="book__row">
          <div class="book__field">
            <label class="book__label">시작 시간</label>
            <select id="bkStart"></select>
          </div>
          <div class="book__field">
            <label class="book__label">이용 시간</label>
            <select id="bkHours"></select>
          </div>
        </div>
        <div class="book__field">
          <label class="book__label">인원</label>
          <input type="number" id="bkGuests" min="1" max="${S.capacity}" value="2" />
        </div>
        <div class="book__field book__coupon">
          <label class="book__label">쿠폰 코드</label>
          <div class="book__couponrow"><input type="text" id="bkCoupon" placeholder="코드 입력" autocomplete="off" /><button type="button" class="btn btn--soft btn--sm" id="bkCouponBtn">적용</button></div>
          <span class="book__couponmsg" id="bkCouponMsg"></span>
        </div>
        <div class="book__sum">
          <div class="book__sumrow"><span id="bkCalc"></span><span id="bkSub"></span></div>
          <div class="book__sumrow book__disc" id="bkDiscRow" hidden><span id="bkDiscLbl"></span><span id="bkDisc"></span></div>
          <div class="book__sumrow"><span>서비스 수수료</span><span id="bkFee"></span></div>
          <div class="book__total"><span>총 결제금액</span><b id="bkTotal"></b></div>
        </div>
        <button class="btn btn--accent btn--lg btn--block" id="bkGo">예약 요청하기</button>
        <p class="book__note">아직 결제되지 않아요 · 호스트 승인 후 확정됩니다</p>
      </div>
    </aside>
  </div>
`;

document.title = `${S.name} · 공간잇다`;

// 관련 공간 카드
$("#relGrid").innerHTML = galleryExtra.map((s) => {
  const c = catById(s.cat);
  const gg = s.g || [c.ink, "#cfc7b8"];
  const u = spaceImg(s, 500, 400);
  return `<article class="sp-card" onclick="location.href='space.html?id=${s.id}'">
    <div class="sp-card__thumb" style="background:linear-gradient(135deg,${gg[0]},${gg[1]})">
      ${u ? `<img src="${u}" alt="${s.name}" loading="lazy" onerror="this.remove()" />` : ""}
    </div>
    <div class="sp-card__body">
      <span class="sp-card__cat">${c.label}</span>
      <h3 class="sp-card__name">${s.name}</h3>
      <div class="sp-card__foot"><span class="sp-card__price">${won(s.price)}<span>원 / 시간</span></span><span class="sp-card__rating">${iconSVG("star", 14)}${s.rating}</span></div>
    </div>
  </article>`;
}).join("");

// ---------- 후기 ----------
function allReviews() {
  const real = window.REVIEWS.list(S.id).map((r) => ({ name: r.name, txt: r.text, stars: r.rating, color: SG[0] }));
  const demo = S.reviews ? reviews() : [];
  return real.concat(demo);
}
function renderReviews() {
  const list = allReviews();
  const cnt = list.length;
  const avg = cnt ? (list.reduce((a, r) => a + r.stars, 0) / cnt).toFixed(1) : 0;
  $("#spRevAvg").innerHTML = cnt ? `<span style="color:var(--gold)">★ ${avg}</span> <span style="color:var(--faint);font-weight:500;font-size:0.9rem">(${cnt})</span>` : "";
  $("#spRev").innerHTML = cnt ? list.map((r) => `<div class="sp-revrow">
    <span class="sp-revrow__av" style="background:${r.color}">${(r.name || "익명").charAt(0)}</span>
    <div><div class="sp-revrow__name">${r.name || "익명"}</div><div class="sp-revrow__stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div><div class="sp-revrow__txt">${r.txt}</div></div>
  </div>`).join("") : `<p class="sp-desc" style="color:var(--muted)">아직 등록된 후기가 없어요. 첫 후기를 남겨보세요.</p>`;
}
function renderReviewForm() {
  const a = window.AUTH.get();
  const box = $("#spReviewForm");
  if (!a) { box.innerHTML = `<p class="sp-revlogin">후기를 남기려면 <a href="login.html">로그인</a>하세요.</p>`; return; }
  box.innerHTML = `<button class="btn btn--outline btn--sm" id="revToggle">✏️ 후기 쓰기</button>
    <div class="sp-revform" id="revForm" hidden>
      <div class="sp-revstars" id="revStars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}">★</button>`).join("")}</div>
      <textarea id="revText" rows="3" placeholder="이용 경험을 남겨주세요"></textarea>
      <button class="btn btn--accent btn--sm" id="revSubmit">등록하기</button>
    </div>`;
  let star = 5;
  const paint = () => box.querySelectorAll("#revStars button").forEach((b, i) => b.classList.toggle("on", i < star));
  paint();
  $("#revToggle").addEventListener("click", () => { const f = $("#revForm"); f.hidden = !f.hidden; });
  $("#revStars").addEventListener("click", (e) => { const b = e.target.closest("[data-star]"); if (b) { star = +b.dataset.star; paint(); } });
  $("#revSubmit").addEventListener("click", () => {
    const t = $("#revText").value.trim();
    if (!t) { toast("후기 내용을 입력해주세요"); return; }
    window.REVIEWS.add({ spaceId: S.id, userId: a.userId, name: window.AUTH.displayName(a), rating: star, text: t });
    $("#revText").value = ""; $("#revForm").hidden = true;
    renderReviews(); toast("후기가 등록되었어요!");
  });
}
renderReviews(); renderReviewForm();

// ---------- 예약 위젯 (달력 + 시간, 중복 방지) ----------
const bkStart = $("#bkStart"), bkHours = $("#bkHours"), bkGuests = $("#bkGuests");
const pad = (n) => String(n).padStart(2, "0");
const fmtD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
let calMonth = new Date(todayD.getFullYear(), todayD.getMonth(), 1);
let selDate = fmtD(new Date(todayD.getTime() + 86400000)); // 내일

const SET = window.SETTINGS.get(S.id);
for (let h = 9; h <= 21; h++) bkStart.insertAdjacentHTML("beforeend", `<option value="${h}">${pad(h)}:00</option>`);
bkStart.value = 14;
for (let h = SET.minH; h <= SET.maxH; h++) bkHours.insertAdjacentHTML("beforeend", `<option value="${h}">${h}시간</option>`);
bkHours.value = Math.max(SET.minH, Math.min(2, SET.maxH));

// 이미 예약된 시간(같은 공간·같은 날짜) + 청소 버퍼 → 중복 방지
function occupiedHours(dateStr) {
  const occ = new Set();
  const buf = SET.buffer || 0;
  window.BOOKINGS.list().filter((b) => b.spaceId === S.id && b.date === dateStr && b.status !== "declined" && b.status !== "cancelled")
    .forEach((b) => { for (let h = b.start; h < b.start + b.hours + buf; h++) occ.add(h); });
  return occ;
}
const WD = ["일", "월", "화", "수", "목", "금", "토"];
function renderCal() {
  const y = calMonth.getFullYear(), m = calMonth.getMonth();
  const startWd = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const canPrev = calMonth > new Date(todayD.getFullYear(), todayD.getMonth(), 1);
  const canNext = calMonth < new Date(todayD.getFullYear(), todayD.getMonth() + 2, 1);
  let cells = "";
  for (let i = 0; i < startWd; i++) cells += `<span class="cal-e"></span>`;
  for (let d = 1; d <= days; d++) {
    const dt = new Date(y, m, d); const ds = fmtD(dt); const past = dt < todayD; const blk = window.BLOCKS.has(S.id, ds);
    cells += `<button type="button" class="cal-d ${ds === selDate ? "is-sel" : ""} ${blk ? "is-block" : ""}" data-d="${ds}" ${past || blk ? "disabled" : ""}>${d}</button>`;
  }
  $("#bkCal").innerHTML =
    `<div class="cal-top"><button type="button" class="cal-nav" data-cal="-1" ${canPrev ? "" : "disabled"}>‹</button><b>${y}년 ${m + 1}월</b><button type="button" class="cal-nav" data-cal="1" ${canNext ? "" : "disabled"}>›</button></div>
     <div class="cal-wd">${WD.map((w) => `<span>${w}</span>`).join("")}</div>
     <div class="cal-grid">${cells}</div>`;
}
function refreshSlots() {
  const occ = occupiedHours(selDate);
  const isToday = selDate === fmtD(todayD);
  const nowH = new Date().getHours();
  [...bkStart.options].forEach((o) => { o.disabled = occ.has(+o.value) || (isToday && +o.value <= nowH); });
  if (bkStart.selectedOptions[0] && bkStart.selectedOptions[0].disabled) { const av = [...bkStart.options].find((o) => !o.disabled); if (av) bkStart.value = av.value; }
  const start = +bkStart.value;
  [...bkHours.options].forEach((o) => { const h = +o.value; let ok = start + h <= 22; for (let x = start; x < start + h; x++) if (occ.has(x)) ok = false; o.disabled = !ok; });
  if (bkHours.selectedOptions[0] && bkHours.selectedOptions[0].disabled) { const av = [...bkHours.options].find((o) => !o.disabled); if (av) bkHours.value = av.value; }
  recalc();
}
let couponPct = 0;
function renderPrice() {
  const fp = window.priceOf(S);
  $("#bkPrice").innerHTML = fp.pct
    ? `<span class="book__old">${won(fp.orig)}원</span><strong>${won(fp.price)}원</strong><span>/ 시간</span><span class="book__flash">⚡${fp.pct}%</span>`
    : `<strong>${won(fp.price)}원</strong><span>/ 시간</span>`;
}
function recalc() {
  const hours = +bkHours.value;
  const fp = window.priceOf(S);
  const unit = couponPct ? Math.round(fp.price * (100 - couponPct) / 100 / 100) * 100 : fp.price;
  const sub = unit * hours, fee = Math.round(sub * 0.05);
  const save = fp.orig * hours - sub;
  $("#bkCalc").textContent = `${won(unit)}원 × ${hours}시간`;
  $("#bkSub").textContent = won(sub) + "원";
  const dr = $("#bkDiscRow");
  if (save > 0) { dr.hidden = false; $("#bkDiscLbl").textContent = "할인" + (fp.pct ? ` ⚡${fp.pct}%` : "") + (couponPct ? ` · 쿠폰 ${couponPct}%` : ""); $("#bkDisc").textContent = "-" + won(save) + "원"; }
  else dr.hidden = true;
  $("#bkFee").textContent = won(fee) + "원";
  $("#bkTotal").textContent = won(sub + fee) + "원";
  recalc._unit = unit; recalc._total = sub + fee;
}
renderPrice();
if ($("#bkCouponBtn")) $("#bkCouponBtn").addEventListener("click", () => {
  const code = $("#bkCoupon").value.trim();
  const p = window.DISCOUNT.couponPct(S.id, code);
  const msg = $("#bkCouponMsg");
  if (p) { couponPct = p; msg.textContent = `쿠폰 적용됨 · ${p}% 추가 할인`; msg.className = "book__couponmsg ok"; }
  else { couponPct = 0; msg.textContent = code ? "유효하지 않거나 기간이 지난 쿠폰이에요" : ""; msg.className = "book__couponmsg no"; }
  recalc();
});
$("#bkCal").addEventListener("click", (e) => {
  const nav = e.target.closest(".cal-nav");
  if (nav && !nav.disabled) { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + +nav.dataset.cal, 1); renderCal(); return; }
  const day = e.target.closest(".cal-d");
  if (day && !day.disabled) { selDate = day.dataset.d; renderCal(); refreshSlots(); }
});
bkStart.addEventListener("change", refreshSlots);
bkHours.addEventListener("change", recalc);
renderCal(); refreshSlots();

// 토스트
let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2600); }

const modal = $("#modal"), modalCard = $("#modalCard");
function closeModal() { modal.hidden = true; modalCard.innerHTML = ""; }
modal.addEventListener("click", (e) => { if (e.target.closest("[data-mclose]")) closeModal(); });

$("#bkGo").addEventListener("click", () => {
  const start = +bkStart.value, hours = +bkHours.value, g = +bkGuests.value;
  if (bkStart.selectedOptions[0] && bkStart.selectedOptions[0].disabled) { toast("선택한 시간은 예약이 찼어요"); return; }
  if (!g || g < 1) { toast("인원을 입력해주세요"); return; }
  if (g > S.capacity) { toast(`최대 ${S.capacity}인까지 이용 가능해요`); return; }
  const a = window.AUTH.get();
  if (!a) { toast("로그인 후 예약할 수 있어요"); setTimeout(() => (location.href = "login.html"), 900); return; }
  openConfirm(start, hours, g);
});

function openConfirm(start, hours, g) {
  const total = recalc._total, unit = recalc._unit;
  const auto = window.SETTINGS.get(S.id).autoAccept;
  modal.hidden = false;
  modalCard.innerHTML = `
    <div class="modal__head"><b>예약 확인</b><button class="modal__x" data-mclose>✕</button></div>
    <div class="cf">
      <div class="cf-row"><span>공간</span><b>${S.name}</b></div>
      <div class="cf-row"><span>일시</span><b>${selDate} ${pad(start)}:00~${pad(start + hours)}:00</b></div>
      <div class="cf-row"><span>인원</span><b>${g}인</b></div>
      <div class="cf-row"><span>시간요금</span><b>${won(unit)}원 × ${hours}시간</b></div>
      <div class="cf-total"><span>총 결제금액</span><b>${won(total)}원</b></div>
    </div>
    <p class="cf-policy">취소·환불: 이용 3일 전 100% · 1~2일 전 50% · 당일 환불 불가</p>
    <button class="btn btn--accent btn--lg btn--block" id="cfGo">${auto ? "결제하고 즉시 예약" : "결제하고 예약 요청"}</button>
    <p class="modal__note">데모 결제 — 실제로 청구되지 않습니다.</p>`;
  $("#cfGo").addEventListener("click", () => doBooking(start, hours, g));
}
function doBooking(start, hours, g) {
  const a = window.AUTH.get();
  const unit = recalc._unit, total = recalc._total;
  const hostId = S.ownerId || "host";
  const auto = window.SETTINGS.get(S.id).autoAccept;
  const status = auto ? "confirmed" : "requested";
  window.BOOKINGS.add({ id: "b" + Date.now(), spaceId: S.id, spaceName: S.name, hostId, guestId: a.userId, guestName: window.AUTH.displayName(a), price: unit, coupon: couponPct || 0, date: selDate, start, hours, guests: g, total, status, ts: Date.now() });
  window.NOTIF.add({ forUser: hostId, title: S.name, sub: (auto ? "새 예약(자동수락)" : "새 예약 요청") + ` · ${selDate} ${pad(start)}:00`, link: "mypage.html" });
  closeModal();
  toast(auto ? "예약이 확정되었어요!" : "예약을 요청했어요! 호스트 확인을 기다려 주세요");
  setTimeout(() => (location.href = "mypage.html"), 1100);
}

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
