// ============================================================
// 공간잇다 — 패키지 기획전 (즉시 결제)
// ============================================================
const $ = (s) => document.querySelector(s);
const won = (n) => (+n || 0).toLocaleString("ko-KR");
const auth = window.AUTH.get();
const pad = (n) => String(n).padStart(2, "0");
const _t = new Date(); _t.setHours(0, 0, 0, 0);
const todayStr = `${_t.getFullYear()}-${pad(_t.getMonth() + 1)}-${pad(_t.getDate())}`;

// 통계
(function stats() {
  const maxSave = Math.max(...PACKAGES.map((p) => p.list - p.price));
  const maxPct = Math.max(...PACKAGES.map((p) => p.pct));
  const partnerSet = new Set();
  PACKAGES.forEach((p) => (p.items || []).forEach((x) => x.partnerId && partnerSet.add(x.partnerId)));
  const themeCnt = new Set(PACKAGES.map((p) => p.theme)).size;
  $("#pkgStats").innerHTML = [
    ["goods", PACKAGES.length + "종", "기획 패키지"],
    ["grid", themeCnt + "종", "행사 테마"],
    ["bolt", "최대 " + maxPct + "%", "묶음 할인"],
    ["spark", "최대 " + won(maxSave) + "원", "절약 혜택"],
    ["users", partnerSet.size + "곳", "참여 파트너"],
  ].map((i) => `<div class="pkg-hstat"><span class="pkg-hstat__ic">${iconSVG(i[0], 18)}</span><div class="pkg-hstat__tx"><strong>${i[1]}</strong><span>${i[2]}</span></div></div>`).join("");
})();

// 테마 필터
// 관리자 노출/순서 반영
function visiblePkgs() {
  const f = window.PKGFLAGS ? window.PKGFLAGS.all() : {};
  return PACKAGES.filter((p) => !(f[p.id] && f[p.id].hidden)).slice().sort((a, b) => ((f[a.id] && f[a.id].order) || 0) - ((f[b.id] && f[b.id].order) || 0));
}
const THEMES = ["전체", ...[...new Set(visiblePkgs().map((p) => p.theme))]];
let activeTheme = "전체";
function renderFilter() {
  $("#pkgFilter").innerHTML = THEMES.map((t) => `<button class="chip${t === activeTheme ? " is-active" : ""}" data-theme="${t}">${t}</button>`).join("");
}
$("#pkgFilter").addEventListener("click", (e) => { const b = e.target.closest("[data-theme]"); if (!b) return; activeTheme = b.dataset.theme; renderFilter(); renderGrid(); });

// 카드
function cardHTML(p) {
  const img = pkgImg(p, 720, 480);
  const avail = pkgAvailSpaces(p);
  const sold = avail.length === 0;
  return `<article class="pkg-card${sold ? " is-sold" : ""}" data-pkg="${p.id}">
    <div class="pkg-card__thumb" style="background:linear-gradient(135deg,${p.g[0]},${p.g[1]})">
      ${img ? `<img src="${img}" alt="${p.title}" loading="lazy" onerror="this.remove()" />` : ""}
      ${p.badge ? `<span class="pkg-card__badge">${p.badge}</span>` : ""}
      <span class="pkg-card__save">${p.pct}% 할인</span>
      ${sold ? `<span class="pkg-card__soldout">${iconSVG("lock", 14)} 일시 판매중지</span>` : ""}
    </div>
    <div class="pkg-card__body">
      <span class="pkg-card__theme">${p.theme}</span>
      <h3 class="pkg-card__title">${p.title}</h3>
      <p class="pkg-card__sub">${p.subtitle}</p>
      <div class="pkg-card__meta">${iconSVG("pin", 14)}${p.region}<span class="pkg-card__dot">·</span>${iconSVG("users", 14)}${p.cap}<span class="pkg-card__dot">·</span>${p.hours}</div>
      <div class="sp-tags">${p.tags.map((t) => `<span class="optag">#${t}</span>`).join("")}</div>
      <div class="pkg-card__incl">${iconSVG("goods", 14)}<span><b>${p.items.length}가지 올인원</b> · ${sold ? "제휴 공간 준비 중" : `제휴 공간 <b>${avail.length}곳</b> 중 선택`} + 부대서비스 ${p.items.filter((x) => x.role === "vendor").length}</span></div>
      <div class="pkg-card__pwrap"><span class="pkg-card__plabel">참여 파트너 ${pkgPartners(p).length}</span><div class="pkg-card__partners">${pkgPartners(p).map((v) => { const u = window.AUTH.users().find((x) => x.userId === v.id); const tip = (u && (u.intro || "")) ? (u.nick || v.name) + " · " + u.intro.slice(0, 60) : v.name; return `<button type="button" class="pkg-partner" data-partner="${v.id}" data-prole="${v.role}" title="${tip.replace(/"/g, "&quot;")}"><span class="pkg-partner__av pkg-partner__av--${v.role}" aria-hidden="true">${iconSVG(v.role === "host" ? "home" : (v.icon || "wrench"), 13)}</span><span class="pkg-partner__nm">${v.name}</span></button>`; }).join("")}</div></div>
      <div class="pkg-card__foot">
        <div class="pkg-card__price"><span class="pkg-card__list">${won(p.list)}원</span><b>${won(p.price)}<em>원</em></b></div>
      </div>
      ${sold
        ? `<button class="btn btn--block pkg-card__cta" disabled>일시 판매중지 · 예약 불가</button>`
        : `<button class="btn btn--accent btn--block pkg-card__cta" data-open="${p.id}">구성 확인 및 바로 예약 →</button>`}
    </div>
  </article>`;
}
function renderGrid() {
  const vis = visiblePkgs();
  const list = activeTheme === "전체" ? vis : vis.filter((p) => p.theme === activeTheme);
  $("#pkgGrid").innerHTML = list.length ? list.map(cardHTML).join("") : `<p class="mp-empty">노출 중인 패키지가 없습니다.</p>`;
}
renderFilter(); renderGrid();

// ---------- 모달 ----------
const modal = $("#modal"), card = $("#modalCard");
function openModal(html) { card.innerHTML = html; modal.hidden = false; document.body.style.overflow = "hidden"; }
function closeModal() { modal.hidden = true; document.body.style.overflow = ""; }
modal.addEventListener("click", (e) => { if (e.target.matches("[data-mclose]")) closeModal(); });

function detailHTML(p) {
  const img = pkgImg(p, 720, 400);
  return `<div class="pkgm">
    <button class="modal__x" data-mclose aria-label="닫기">✕</button>
    <div class="pkgm__thumb" style="background:linear-gradient(135deg,${p.g[0]},${p.g[1]})">${img ? `<img src="${img}" alt="" onerror="this.remove()" />` : ""}<span class="pkg-card__save">${p.pct}% 할인</span></div>
    <span class="pkg-card__theme">${p.theme}</span>
    <h2 class="pkgm__title">${p.title}</h2>
    <p class="pkgm__sub">${p.subtitle}</p>
    <div class="pkgm__meta">${iconSVG("pin", 15)}${p.region}<span class="pkg-card__dot">·</span>${iconSVG("users", 15)}${p.cap}<span class="pkg-card__dot">·</span>${p.hours}</div>

    <div class="pkgm__sec">패키지 구성 · 참여 파트너</div>
    <ul class="pkgm__items">
      ${p.items.map((x) => `<li><span class="pkgm__ic">${iconSVG(x.icon, 18)}</span><div class="pkgm__it"><b>${x.label}</b><span>${x.detail}${x.partner ? ` · <b class="pkgm__partner">${iconSVG(x.role === "host" ? "home" : "wrench", 13)} ${x.partner}</b>` : ""}</span></div><span class="pkgm__ip">${won(x.price)}원</span></li>`).join("")}
    </ul>

    ${(() => { const av = pkgAvailSpaces(p); return `<div class="pkgm__sec">공간 선택 <span class="pkgm__sec-sub">· 제휴 공간 중 원하는 곳을 고르세요 (동일 패키지 가격)</span></div>
    <div class="pkgm__spaces">${av.map((s, i) => `<label class="pkgm__space"><input type="radio" name="pkSpace" value="${s.id}" ${i === 0 ? "checked" : ""} /><span class="pkgm__space-info"><b>${s.name}</b><span>${regionShort(s.region)} · ~${s.capacity}인</span></span></label>`).join("")}</div>`; })()}

    <div class="pkgm__calc">
      <div class="pkgm__row"><span>개별 정가 합계</span><span class="pkgm__strike">${won(p.list)}원</span></div>
      <div class="pkgm__row pkgm__row--save"><span>패키지 할인 (${p.pct}%)</span><span>-${won(p.list - p.price)}원</span></div>
      <div class="pkgm__row pkgm__row--total"><span>최종 결제 금액</span><b>${won(p.price)}원</b></div>
    </div>

    <div class="pkgm__form">
      <div class="pkgm__fld"><label>이용 날짜</label><input type="date" id="pkDate" min="${todayStr}" value="${todayStr}" /></div>
      <div class="pkgm__fld"><label>연락처</label><input type="tel" id="pkPhone" placeholder="010-0000-0000" /></div>
    </div>
    <div class="pkgm__coupon"><input type="text" id="pkCoupon" placeholder="와일리 쿠폰 코드" /><button type="button" class="btn btn--soft btn--sm" id="pkCouponBtn">적용</button><span class="pkgm__couponmsg" id="pkCouponMsg"></span></div>
    <p class="pkgm__err" id="pkErr" hidden></p>
    <button class="btn btn--accent btn--lg btn--block" data-pay="${p.id}"><span id="pkPayLabel">${won(p.price)}원</span> · 즉시 결제하기</button>
    <p class="pkgm__note">결제 즉시 예약이 확정되고, 담당 매니저가 구성 준비를 시작합니다. (데모 — 브라우저에 저장)</p>
  </div>`;
}

function successHTML(p, date, spaceName) {
  return `<div class="pkgm pkgm--done">
    <div class="co-done__ic">✓</div>
    <h2 class="pkgm__title">결제 완료!</h2>
    <p class="pkgm__sub"><b>${p.title}</b>${spaceName ? ` · ${spaceName}` : ""} · ${date}<br />이용일에 맞춰 매니저가 ${p.items.length}가지 구성을 준비합니다.</p>
    <div class="pkgm__calc"><div class="pkgm__row pkgm__row--total"><span>결제 금액</span><b>${won(p.price)}원</b></div></div>
    <a href="mypage.html?tab=book" class="btn btn--accent btn--lg btn--block">예약 내역 보기</a>
    <button class="btn btn--outline btn--block" data-mclose style="margin-top:8px">계속 둘러보기</button>
  </div>`;
}

let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2400); }

// ---------- 이벤트 ----------
document.addEventListener("click", (e) => {
  const partner = e.target.closest("[data-partner]");
  if (partner) {
    e.stopPropagation();
    const id = partner.dataset.partner;
    if (partner.dataset.prole === "vendor") location.href = "vendors.html?v=" + encodeURIComponent(id);
    else location.href = "search.html";
    return;
  }
  const open = e.target.closest("[data-open]") || e.target.closest(".pkg-card");
  if (open && !e.target.closest("[data-pay]")) {
    const id = open.dataset.open || open.dataset.pkg;
    const p = pkgById(id);
    if (p) {
      if (pkgAvailSpaces(p).length === 0) { toast("예약 가능한 제휴 공간이 없어 일시 판매중지된 패키지예요"); return; }
      openModal(detailHTML(p));
    }
    return;
  }
});
let pkgCoupon = null; // {id, off, label}
modal.addEventListener("click", (e) => {
  // 와일리 쿠폰 적용
  const cb = e.target.closest("#pkCouponBtn");
  if (cb) {
    const pid = (modalCard.querySelector("[data-pay]") || {}).dataset ? modalCard.querySelector("[data-pay]").dataset.pay : null;
    const p = pkgById(pid); const code = $("#pkCoupon").value.trim(); const msg = $("#pkCouponMsg");
    pkgCoupon = null;
    const r = window.PCOUPONS ? window.PCOUPONS.validate(code, { scope: "package", amount: p ? p.price : 0 }) : null;
    if (r && r.ok) { pkgCoupon = { id: r.coupon.id, off: r.off, label: r.label, bearer: r.coupon.bearer || "platform" }; msg.textContent = `적용됨 · ${r.label}`; msg.className = "pkgm__couponmsg ok"; const f = $("#pkPayLabel"); if (f) f.textContent = won(Math.max(0, p.price - r.off)) + "원"; }
    else { msg.textContent = code ? (r ? r.msg : "유효하지 않은 쿠폰") : ""; msg.className = "pkgm__couponmsg no"; const f = $("#pkPayLabel"); if (f && p) f.textContent = won(p.price) + "원"; }
    return;
  }
  const pay = e.target.closest("[data-pay]"); if (!pay) return;
  const p = pkgById(pay.dataset.pay); if (!p) return;
  if (!auth) { location.href = "login.html"; return; }
  const date = $("#pkDate").value, phone = $("#pkPhone").value.trim();
  const err = $("#pkErr");
  if (!date) { err.textContent = "이용 날짜를 선택해 주세요."; err.hidden = false; return; }
  if (!phone) { err.textContent = "연락처를 입력해 주세요."; err.hidden = false; return; }
  err.hidden = true;
  // 선택한 제휴 공간 (숨김 공간은 후보에서 이미 제외됨)
  const av = pkgAvailSpaces(p);
  const spIn = card.querySelector('input[name="pkSpace"]:checked');
  const chosen = (spIn ? av.find((s) => String(s.id) === String(spIn.value)) : null) || av[0];
  if (!chosen) { err.textContent = "예약 가능한 제휴 공간이 없어요."; err.hidden = false; return; }
  const off = pkgCoupon ? pkgCoupon.off : 0; const total = Math.max(0, p.price - off);
  window.BOOKINGS.add({
    id: window.uid("b"), pkg: true, pkgId: p.id, spaceId: chosen.id, pkgSpaceName: chosen.name,
    spaceName: p.title, hostId: "wylie", guestId: auth.userId,
    guestName: window.AUTH.displayName(auth), guestPhone: phone,
    detail: "공간: " + chosen.name + " (" + regionShort(chosen.region) + ") · " + p.items.map((x) => x.label).join(", "),
    price: total, date, start: null, hours: null, guests: (parseInt(String(p.cap).replace(/[^0-9]/g, ""), 10) || null), capLabel: p.cap,
    total, coupon: pkgCoupon ? pkgCoupon.label : "", couponOff: off, couponBearer: pkgCoupon ? pkgCoupon.bearer : "", couponScope: "package", status: "confirmed", paid: true, ts: Date.now(),
  });
  if (pkgCoupon && window.PCOUPONS) window.PCOUPONS.redeem(pkgCoupon.id);
  const done = Object.assign({}, p, { price: total }); pkgCoupon = null;
  toast("결제가 완료됐어요!");
  openModal(successHTML(done, date, chosen.name));
});

// 참여 파트너 칩 — 마우스 드래그로 가로 스크롤 (데스크톱: 스크롤바 숨김 상태에서도 이동 가능)
(function dragScrollPartners() {
  let el = null, startX = 0, startScroll = 0, moved = false;
  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return; // 터치는 네이티브 스크롤 사용
    const row = e.target.closest(".pkg-card__partners");
    if (!row || row.scrollWidth <= row.clientWidth + 1) return;
    el = row; startX = e.clientX; startScroll = row.scrollLeft; moved = false;
    row.classList.add("is-dragging");
  });
  document.addEventListener("pointermove", (e) => {
    if (!el) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 3) moved = true;
    el.scrollLeft = startScroll - dx;
  });
  const end = () => {
    if (!el) return;
    const row = el; el = null; row.classList.remove("is-dragging");
    if (moved) { const stop = (ev) => { ev.stopPropagation(); ev.preventDefault(); document.removeEventListener("click", stop, true); }; document.addEventListener("click", stop, true); }
  };
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);
})();

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
