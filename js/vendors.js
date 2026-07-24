// ============================================================
// 공간잇다 — 맞춤 찾기 (회원이 파트너를 직접 보고 견적 요청·문의)
// ============================================================
const $ = (s) => document.querySelector(s);
const won = (n) => (+n || 0).toLocaleString("ko-KR");
let filter = new URLSearchParams(location.search).get("cat") || "all";
let vkw = "", vregion = "", vsort = "reco";
// 주소에서 자치구 추출 (예: "서울 강남구 역삼동 12-3" → "강남구")
const guOf = (addr) => { const m = (addr || "").match(/([가-힣]+구)/); return m ? m[1] : ""; };
// 날짜 · 견적 마감(이용 3일 전) 헬퍼
const _fmtD = (d) => { const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const _todayD = new Date();
const todayStr = _fmtD(_todayD);
const calcDeadline = (ds) => _fmtD(new Date(Math.max(_todayD.getTime(), new Date(ds).getTime() - 3 * 86400000)));

// 파트너별 대표 이미지(더미) · 취급 품목 소개
const U = (id) => `https://images.unsplash.com/photo-${id}?w=560&h=360&fit=crop&q=70`;
const VPHOTO = {
  camera: U("1502920917128-1aa500764cbd"), catering: U("1555244162-803834f70033"),
  office: U("1497366216548-37526070297c"), cleaning: U("1581578731548-c64695cc6952"),
  repair: U("1581092160562-40aa08e78837"), interior: U("1618221195710-dd6b41faaea6"),
  banner: U("1561070791-2526d30994b5"), projector: U("1517604931442-7e0c8ed2963c"),
  goods: U("1513885535751-8b9238bd345a"),
};
const BLURB = {
  camera: "고성능 카메라·조명·짐벌 당일 대여, 사진작가 매칭",
  catering: "행사 규모별 도시락·뷔페·다과, 당일 세팅",
  office: "책상·의자·복합기·프린터 단기 렌탈",
  cleaning: "행사 전후 청소·정리, 폐기물 처리",
  repair: "설비·전기·시설 하자 즉시 보수",
  interior: "부스·데코·시공, 공간 연출 전문",
  banner: "현수막·배너·사인물 당일 제작·설치",
  projector: "빔프로젝터·대형 스크린·음향 렌탈",
  goods: "판촉물·기념품·굿즈 소량 제작",
};

function vendors() { return window.AUTH.users().filter((u) => u.role === "vendor"); }
function trust(v) {
  const deals = window.QUOTES.list().filter((q) => q.vendorId === v.userId && q.status === "accepted").length;
  const sc = window.VREVIEWS.scoreOf(v.userId);
  const cnt = window.VREVIEWS.countOf(v.userId);
  return { deals, sc, cnt };
}

function renderFilter() {
  const chips = [["all", "전체"]].concat(SERVICES.map((s) => [s.id, s.label]));
  $("#vFilter").innerHTML = chips.map(([id, label]) => `<button class="chip ${filter === id ? "is-active" : ""}" data-f="${id}">${label}</button>`).join("");
}
const picFallback = (v) => `this.onerror=null;this.src='https://picsum.photos/seed/${v.userId}/600/340'`;
function vcard(v) {
  const cats = v.serviceCats || [];
  const primary = cats[0] || "camera";
  const img = (v.photos && v.photos[0]) || VPHOTO[primary];
  const t = trust(v);
  const gu = (v.addr || "").match(/([가-힣]+구)/);
  const catTag = `<span class="v-tag">${iconSVG(reqCatById(primary).icon, 13)} ${reqCatById(primary).label}</span>`;
  const loc = gu ? `<span class="v-tag">${iconSVG("pin", 13)} ${gu[1]}</span>` : "";
  return `<article class="v-card">
    <div class="v-card__thumb" data-vinfo="${v.userId}">
      <img src="${img}" alt="${v.nick}" loading="lazy" onerror="${picFallback(v)}" />
      ${t.sc ? `<span class="v-card__rate">★ ${t.sc.toFixed(1)}${t.cnt ? ` (${t.cnt})` : ""}</span>` : `<span class="v-card__rate v-card__rate--new">NEW</span>`}
    </div>
    <div class="v-card__body">
      <b class="v-card__name" data-vinfo="${v.userId}">${v.nick || v.name}</b>
      <p class="v-card__blurb">${v.intro || BLURB[primary] || "행사에 필요한 서비스를 제공합니다."}</p>
      ${(v.items && v.items.length) ? `<div class="v-card__items" data-vinfo="${v.userId}"><span class="v-card__itemcap">${iconSVG(reqCatById(primary).icon, 12)} 대여 품목</span>${v.items.slice(0, 4).map((it) => `<span class="v-item">${String(it).replace(/</g, "&lt;")}</span>`).join("")}${v.items.length > 4 ? `<span class="v-item v-item--more">+${v.items.length - 4}</span>` : ""}</div>` : ""}
      <div class="v-tags">${catTag}${loc}</div>
      ${v.startPrice ? `<div class="v-card__from">대여 시작가 <b>${won(v.startPrice)}원~</b></div>` : ""}
      <button class="btn btn--accent btn--block v-card__cta" data-vinfo="${v.userId}">견적 요청하기</button>
      <div class="v-card__links"><button class="v-link" data-vinfo="${v.userId}">상세·후기 ${t.cnt}</button><span class="v-link__sep">·</span><button class="v-link" data-inq="${v.userId}">1:1 문의</button></div>
    </div>
  </article>`;
}
function matchKw(v) {
  if (!vkw) return true;
  const cats = (v.serviceCats || []).map((c) => reqCatById(c).label).join(" ");
  const hay = [v.nick, v.name, v.intro, (v.items || []).join(" "), cats, v.addr].join(" ").toLowerCase();
  return vkw.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
}
const vnum = (v) => parseInt((v.userId || "").replace(/\D/g, ""), 10) || 0;
function render() {
  let list = vendors().filter((v) => (filter === "all" || (v.serviceCats || []).includes(filter)) && (!vregion || guOf(v.addr) === vregion) && matchKw(v));
  list.sort((a, b) => {
    const ta = trust(a), tb = trust(b);
    if (vsort === "rating") return (tb.sc || 0) - (ta.sc || 0) || tb.cnt - ta.cnt;
    if (vsort === "reviews") return (tb.cnt || 0) - (ta.cnt || 0);
    if (vsort === "recent") return vnum(b) - vnum(a);
    return (tb.deals || 0) - (ta.deals || 0) || (tb.sc || 0) - (ta.sc || 0); // 추천
  });
  $("#vGrid").innerHTML = list.map(vcard).join("");
  $("#vGrid").style.display = list.length ? "" : "none";
  $("#vEmpty").hidden = list.length > 0;
  const cnt = $("#vCount"); if (cnt) cnt.innerHTML = `<b>${list.length}</b>개 파트너`;
}
// 지역(구) 셀렉트 채우기 — 실제 파트너 주소 기준
function fillRegions() {
  const gus = [...new Set(vendors().map((v) => guOf(v.addr)).filter(Boolean))].sort();
  $("#vRegion").innerHTML = `<option value="">지역 전체</option>` + gus.map((g) => `<option value="${g}">${g}</option>`).join("");
}
renderFilter(); fillRegions(); render();
// 패키지 등에서 파트너 칩으로 진입 시 해당 파트너 상세 자동 오픈
(function () { const v = new URLSearchParams(location.search).get("v"); if (v && vendors().some((x) => x.userId === v)) setTimeout(() => openVendorInfo(v), 100); })();

$("#vFilter").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (!b) return; filter = b.dataset.f; renderFilter(); render(); });
$("#vRegion").addEventListener("change", (e) => { vregion = e.target.value; render(); });
$("#vSort").addEventListener("change", (e) => { vsort = e.target.value; render(); });
$("#vReset") && $("#vReset").addEventListener("click", () => { filter = "all"; vregion = ""; vkw = ""; vsort = "reco"; if ($("#vKeyword")) $("#vKeyword").value = ""; if ($("#vkwClear")) $("#vkwClear").hidden = true; if ($("#vRegion")) $("#vRegion").value = ""; if ($("#vSort")) $("#vSort").value = "reco"; renderFilter(); render(); });
// 키워드 검색
const vkwInput = $("#vKeyword"), vkwClear = $("#vkwClear");
if (vkwInput) {
  const sync = () => { vkw = vkwInput.value.trim(); if (vkwClear) vkwClear.hidden = !vkw; render(); };
  vkwInput.addEventListener("input", sync);
  const f = $("#vkwForm"); if (f) f.addEventListener("submit", (ev) => { ev.preventDefault(); sync(); });
  if (vkwClear) vkwClear.addEventListener("click", () => { vkwInput.value = ""; vkw = ""; vkwClear.hidden = true; render(); vkwInput.focus(); });
}

// 토스트 · 모달
let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2400); }
const modal = $("#modal"), modalCard = $("#modalCard");
function closeModal() { modal.hidden = true; modalCard.innerHTML = ""; modalCard.classList.remove("modal__card--wide"); }
modal.addEventListener("click", (e) => { if (e.target.closest("[data-mclose]")) closeModal(); });

function openVendorInfo(vid) {
  const v = vendors().find((x) => x.userId === vid); if (!v) return;
  const a = window.AUTH.get();
  const maskView = !!(a && a.role === "vendor" && a.userId !== v.userId); // 다른 파트너가 볼 때 연락처·상세주소 가림
  const canContact = !!(a && a.role === "guest"); // 파트너 연락처·상세주소는 로그인 회원에게만 공개 (비로그인 스크래핑 방지)
  const t = trust(v);
  const primary = (v.serviceCats || [])[0] || "camera";
  const revs = window.VREVIEWS.forVendor(vid).slice().sort((a, b) => b.ts - a.ts);
  const photos = (v.photos && v.photos.length) ? v.photos : (VPHOTO[primary] ? [VPHOTO[primary]] : []);
  const bars = [5, 4, 3, 2, 1].map((s) => { const n = revs.filter((r) => r.rating === s).length; const pct = revs.length ? Math.round(n / revs.length * 100) : 0; return `<div class="vrev-bar"><span>${s}★</span><i><b style="width:${pct}%"></b></i><em>${n}</em></div>`; }).join("");
  // 1) 사진 캐러셀 (여러 장이면 스와이프)
  const gallery = photos.length ? `<div class="vmg${photos.length > 1 ? " vmg--multi" : ""}">${photos.map((u) => `<div class="vmg__slide"><img src="${u}" alt="${v.nick}" onerror="${picFallback(v)}" /></div>`).join("")}</div>` : "";
  // 2) 참고가 (파트너가 설정한 대여 시작가)
  const priceHint = v.startPrice ? `<div class="vinfo-price">${iconSVG("won", 15)} 대여 시작가 <b>${won(v.startPrice)}원~</b> <span>· 정확한 금액은 견적으로 안내돼요</span></div>` : "";
  // 3) 모달 내 견적 요청 폼
  const itemChecks = (v.items && v.items.length) ? `<div class="vreq__label">필요한 품목 선택 <span>(선택)</span></div><div class="vreq__items">${v.items.map((it, i) => `<label class="vreq__item"><input type="checkbox" value="${String(it).replace(/"/g, "&quot;")}" /><span>${String(it).replace(/</g, "&lt;")}</span></label>`).join("")}</div>` : "";
  let reqForm;
  if (!a) reqForm = `<div class="vreq"><p class="vreq__notice">견적을 요청하려면 <a href="login.html">로그인</a>이 필요해요.</p></div>`;
  else if (a.role !== "guest") reqForm = `<div class="vreq"><p class="vreq__notice">견적 요청은 일반 회원만 가능해요.</p></div>`;
  else reqForm = `<form class="vreq" id="vreqForm" data-vid="${v.userId}">
      <div class="vreq__head">${iconSVG("mail", 15)} 이 파트너에 바로 견적 요청</div>
      <div class="vreq__row">
        <label class="vreq__f"><span>이용 날짜 *</span><input type="date" id="vreqDate" min="${todayStr}" value="${todayStr}" /></label>
        <label class="vreq__f"><span>연락처 *</span><input type="tel" id="vreqPhone" placeholder="010-0000-0000" value="${a.phone || ""}" /></label>
      </div>
      <label class="vreq__f"><span>이용 지역 *</span><input type="text" id="vreqRegion" placeholder="예: 서울 강남구" value="${a.region || guOf(v.addr) || ""}" /></label>
      ${itemChecks}
      <label class="vreq__f"><span>요청 사항 *</span><textarea id="vreqDetail" rows="2" placeholder="필요 품목·수량·시간·예산 등을 적어주세요"></textarea></label>
      <label class="co-consent" id="vreqConsentWrap"><input type="checkbox" id="vreqConsent" /><span><b>[필수]</b> 개인정보 제3자 제공 동의 — 이름·연락처가 <b>${v.nick}</b>에게 제공되는 것에 동의합니다. <a href="#" data-consent-detail>자세히</a></span></label>
      <p class="vreq__err" id="vreqErr" hidden></p>
      <button type="submit" class="btn btn--accent btn--block">견적 요청 보내기 →</button>
    </form>`;
  modal.hidden = false;
  modalCard.classList.add("modal__card--wide");
  modalCard.innerHTML = `<div class="modal__head"><b>${v.nick}</b><button class="modal__x" data-mclose>✕</button></div>
    ${gallery}
    <div class="v-tags" style="margin:10px 0"><span class="v-tag">${iconSVG(reqCatById(primary).icon, 13)} ${reqCatById(primary).label}</span>${v.addr ? `<span class="v-tag">${iconSVG("pin", 13)} ${canContact ? v.addr : (guOf(v.addr) || "지역 비공개")}</span>` : ""}${canContact ? (v.phone ? `<span class="v-tag">${iconSVG("phone", 13)} ${v.phone}</span>` : "") : `<span class="v-tag v-tag--lock">${iconSVG("lock", 13)} 연락처는 로그인 회원에게만 공개</span>`}</div>
    ${v.intro ? `<p class="vinfo-intro">${v.intro}</p>` : ""}
    ${priceHint}
    ${(v.items && v.items.length) ? `<div class="vinfo-items"><b class="vinfo-items__t">${iconSVG("tag", 15)} 렌탈·판매 아이템 <span style="color:var(--faint);font-weight:600">${v.items.length}종</span></b><div class="vinfo-items__chips">${v.items.map((it) => `<span class="v-item">${String(it).replace(/</g, "&lt;")}</span>`).join("")}</div></div>` : ""}
    ${reqForm}
    <div class="vrev-summary"><div class="vrev-score"><strong>${t.sc ? t.sc.toFixed(1) : "-"}</strong><span>★ 후기 ${t.cnt}개</span></div><div class="vrev-bars">${bars}</div></div>
    <div class="vrev-list">${revs.length ? revs.slice(0, 40).map((r) => `<div class="vrev-row"><span class="vrev-av">${(r.name || "익").charAt(0)}</span><div><div class="vrev-nm">${window.PRIVACY ? window.PRIVACY.name(r.name) : r.name} <em>${"★".repeat(r.rating)}</em></div><div class="vrev-tx">${r.text}</div></div></div>`).join("") : `<p class="vreq__notice" style="text-align:center">아직 후기가 없어요 · 첫 거래의 주인공이 되어보세요</p>`}</div>
    <button class="btn btn--soft btn--block" data-inq="${v.userId}" style="margin-top:10px">${iconSVG("chat", 16)} 먼저 1:1 문의하기</button>`;
  const vf = $("#vreqForm");
  if (vf) vf.addEventListener("submit", (e) => {
    e.preventDefault();
    const err = $("#vreqErr");
    const date = $("#vreqDate").value, phone = $("#vreqPhone").value.trim(), detail = $("#vreqDetail").value.trim();
    const region = ($("#vreqRegion").value || "").trim();
    const picked = [...vf.querySelectorAll('.vreq__items input:checked')].map((i) => i.value);
    if (!date) { err.textContent = "이용 날짜를 선택해 주세요."; err.hidden = false; return; }
    if (!phone) { err.textContent = "연락처를 입력해 주세요."; err.hidden = false; return; }
    if (!region) { err.textContent = "이용 지역을 입력해 주세요."; err.hidden = false; return; }
    if (!detail && !picked.length) { err.textContent = "요청 사항을 적거나 품목을 선택해 주세요."; err.hidden = false; return; }
    if (!$("#vreqConsent").checked) { $("#vreqConsentWrap").classList.add("co-consent--err"); err.textContent = "개인정보 제3자 제공 동의가 필요해요."; err.hidden = false; return; }
    if (window.CONSENT) window.CONSENT.record(a.userId, "3rdparty:direct", v.nick);
    err.hidden = true;
    const fullDetail = (picked.length ? "✔ 필요 품목: " + picked.join(", ") + (detail ? "\n" : "") : "") + detail;
    window.REQUESTS.add({
      type: "direct", directVendorId: v.userId, directVendorName: v.nick,
      memberId: a.userId, memberName: window.AUTH.displayName(a), memberPhone: phone,
      cats: [primary], date, region, capacity: 0, deadline: calcDeadline(date),
      budget: 0, detail: fullDetail, catNotes: {}, catItems: picked.length ? { [primary]: picked } : {},
    });
    window.NOTIF.add({ forUser: v.userId, title: "새 1:1 견적 요청", sub: `${date} · ${reqCatById(primary).label}`, link: "mypage.html?tab=vreq" });
    closeModal(); toast(`${v.nick}에 견적을 요청했어요`);
    setTimeout(() => (location.href = "mypage.html?tab=rfp"), 1100);
  });
}
document.addEventListener("click", (e) => {
  const vf = e.target.closest("[data-vinfo]");
  if (vf) { openVendorInfo(vf.dataset.vinfo); return; }
  const dq = e.target.closest("[data-direct]");
  if (dq) { location.href = "direct.html?vendor=" + dq.dataset.direct; return; }
  const iq = e.target.closest("[data-inq]");
  if (iq) {
    const a = window.AUTH.get();
    if (!a) { toast("로그인 후 문의할 수 있어요"); setTimeout(() => (location.href = "login.html"), 900); return; }
    if (a.role !== "guest") { toast("파트너 문의·채팅은 일반 회원만 가능해요"); return; }
    const v = vendors().find((x) => x.userId === iq.dataset.inq); if (!v) return;
    modal.hidden = false;
    modalCard.classList.remove("modal__card--wide");
    modalCard.innerHTML = `<div class="modal__head"><b>${v.nick} · 1:1 문의</b><button class="modal__x" data-mclose>✕</button></div>
      <p class="modal__sub">취급: ${(v.serviceCats || []).map((c) => reqCatById(c).label).join(", ")}</p>
      <textarea id="iqText" rows="4" placeholder="필요한 품목·수량·일정을 적어주세요" style="width:100%;padding:11px 13px;border:1px solid var(--line);border-radius:10px;font-family:inherit;resize:vertical;margin:6px 0 12px"></textarea>
      <button class="btn btn--accent btn--block" id="iqSend">문의 보내기</button>`;
    $("#iqSend").addEventListener("click", () => {
      const t = $("#iqText").value.trim(); if (!t) { toast("문의 내용을 입력해주세요"); return; }
      // 채팅(메신저) 스레드 생성 + 첫 메시지 전송 (공간 1:1 문의와 동일 방식)
      const tid = "v:" + v.userId + ":" + a.userId;
      window.CHATMETA.set(tid, { title: v.nick, hostId: v.userId, guestId: a.userId });
      window.CHAT.send(tid, { from: a.userId, name: window.AUTH.displayName(a), text: t });
      window.NOTIF.add({ forUser: v.userId, title: "새 1:1 문의", sub: `${window.AUTH.displayName(a)} · ${t.slice(0, 20)}`, link: "mypage.html?chat=" + tid });
      closeModal(); toast("문의를 보냈어요 · 채팅으로 이어서 대화할 수 있어요");
      if (window.openChatWidget) setTimeout(() => window.openChatWidget(tid), 200);
    });
    return;
  }
});

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
