// ============================================================
// 공간잇다 홈 — 카테고리·공간 카드·검색·플래그십
// ============================================================
const $ = (s) => document.querySelector(s);
const won = (n) => n.toLocaleString("ko-KR");
let activeCat = "all";

// 검색바 아이콘 주입
document.querySelectorAll(".searchbar__input[data-ic]").forEach((el) => {
  el.insertAdjacentHTML("afterbegin", iconSVG(el.dataset.ic, 18));
});
$("#searchbar .searchbar__go").innerHTML = iconSVG("search", 20);
$("#sfType").insertAdjacentHTML("beforeend", CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join(""));
$("#sfRegion").insertAdjacentHTML("beforeend", REGIONS.map((r) => `<option value="${r}">${r}</option>`).join(""));
// 검색바 기본값: 날짜=오늘, 인원=2명
(function searchDefaults() {
  const d = new Date(), p = (n) => String(n).padStart(2, "0");
  const sd = $("#sfDate"); if (sd) { sd.value = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; sd.min = sd.value; }
  const sc = $("#sfCap"); if (sc && !sc.value) sc.value = 2;
})();

// 히어로 통계 (요소 있을 때만)
(function heroStats() {
  const el = $("#heroStats"); if (!el) return;
  const nowN = SPACES.filter((s) => s.now).length;
  const avg = (SPACES.reduce((a, s) => a + s.rating, 0) / SPACES.length).toFixed(1);
  const items = [[SPACES.length + "곳", "등록 공간"], [nowN + "곳", "지금 예약 가능"], ["★ " + avg, "평균 평점"]];
  el.innerHTML = items.map((i) => `<div><strong>${i[0]}</strong><span>${i[1]}</span></div>`).join("");
})();

// 실시간 활성도 티커 (신뢰도 + 경쟁 심리)
(function liveTicker() {
  const el = $("#liveTicker"); if (!el) return;
  const all = getPublicSpaces();
  const nowN = all.filter((s) => s.now).length;
  const names = all.map((s) => s.name);
  const regions = ["강남", "성수", "연남", "잠실", "여의도", "혜화"];
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const build = () => {
    const msgs = [
      `지금 예약 가능한 공간 <b>${nowN}곳</b>`,
      `방금 <b>‘${rand(names)}’</b> 예약이 완료됐어요`,
      `지금 <b>${12 + Math.floor(Math.random() * 34)}명</b>이 공간을 둘러보고 있어요`,
      `이번 주 <b>${rand(regions)}</b> 지역 견적 요청 <b>${6 + Math.floor(Math.random() * 22)}건</b> 진행 중`,
      `오늘 <b>${3 + Math.floor(Math.random() * 12)}건</b>의 예약이 확정됐어요`,
    ];
    return rand(msgs);
  };
  el.innerHTML = `<span class="livebar__dot"></span><span class="livebar__txt" id="liveTxt"></span>`;
  const txt = $("#liveTxt");
  let last = "";
  const show = () => { let m = build(); if (m === last) m = build(); last = m; txt.style.opacity = "0"; setTimeout(() => { txt.innerHTML = m; txt.style.opacity = "1"; }, 250); };
  show(); setInterval(show, 3400);
})();

// 카테고리 그리드 (홈 하단 중복 영역 제거 — 요소 있을 때만 렌더)
if ($("#catGrid")) $("#catGrid").innerHTML = CATEGORIES.map((c) => `
  <button class="cat" data-cat="${c.id}" style="--tint:${c.tint};--ink:${c.ink}">
    <span class="cat__img">${c.img ? `<img src="https://images.unsplash.com/photo-${c.img}?w=360&h=280&fit=crop&q=72" alt="${c.label}" loading="lazy" onerror="this.remove()" />` : ""}<span class="cat__ic">${iconSVG(c.icon, 24)}</span></span>
    <span class="cat__label">${c.label}</span>
  </button>`).join("");

// 필터 칩
$("#catChips").innerHTML =
  `<button class="chip is-active" data-cat="all">전체</button>` +
  CATEGORIES.map((c) => `<button class="chip" data-cat="${c.id}">${c.label}</button>`).join("");

// 공간 카드
function tagRow(s) {
  const chips = [];
  const hasPkg = s.timePkg && s.timePkg.length;
  if (hasPkg) chips.push(`<span class="optag optag--pkg">⏱ 패키지요금</span>`);
  (s.optTags || []).slice(0, hasPkg ? 2 : 3).forEach((t) => chips.push(`<span class="optag">#${t}</span>`));
  if (!chips.length) chips.push(`<span class="optag optag--ghost">${iconSVG("spark", 12)} 신규 공간 · 첫 후기를 남겨보세요</span>`);
  return `<div class="sp-tags sp-tags--row">${chips.join("")}</div>`;
}
function cardHTML(s) {
  const c = catById(s.cat);
  const nowBadge = s.now ? `<span class="sp-card__badge sp-card__badge--now"><i></i>바로예약</span>` : "";
  const g = s.g || [c.ink, "#cfc7b8"];
  const img = spaceImg(s, 640, 480);
  const pr = window.priceOf(s);
  return `<article class="sp-card" data-id="${s.id}">
    <div class="sp-card__thumb" style="background:linear-gradient(135deg,${g[0]},${g[1]})">
      <span class="sp-ph"><span class="sp-ph__mark"><i class="sp-ph__dot"></i>공간잇다</span></span>
      ${img ? `<img src="${img}" alt="${s.name}" loading="lazy" onerror="this.remove()" />` : ""}
      ${nowBadge}
      ${pr.pct ? `<span class="sp-card__flash">${iconSVG("bolt", 12)}${pr.pct}%</span>` : ""}
      <button class="sp-card__heart ${window.FAV.has(s.id) ? "is-on" : ""}" data-heart="${s.id}" aria-label="찜">${iconSVG("heart", 18)}</button>
    </div>
    <div class="sp-card__body">
      <span class="sp-card__cat">${c.label}</span>
      <h3 class="sp-card__name">${s.name}</h3>
      <div class="sp-card__meta">
        <span class="sp-card__loc">${iconSVG("pin", 14)}<span class="sp-card__loctxt">${regionShort(s.region)}</span></span>
        <span class="sp-card__cap">${iconSVG("users", 14)}~${s.capacity}인</span>
      </div>
      ${tagRow(s)}
      <div class="sp-card__foot">
        <span class="sp-card__price">${pr.pct ? `<span class="sp-old">${won(pr.orig)}</span> ` : ""}${won(pr.price)}<span>원 / 시간</span></span>
        <span class="sp-card__rating">${iconSVG("star", 14)}${s.rating || "신규"}${s.reviews ? `<em>(${s.reviews})</em>` : ""}</span>
      </div>
    </div>
  </article>`;
}
function renderGrid() {
  const all = getPublicSpaces();
  const list = activeCat === "all" ? all : all.filter((s) => s.cat === activeCat);
  $("#spaceGrid").innerHTML = list.length ? list.map(cardHTML).join("") : `<p style="color:var(--faint);padding:20px">해당 유형의 공간이 아직 없어요.</p>`;
}
renderGrid();

// 호스트 CTA 라우팅 — 호스트는 공간 등록, 그 외/비로그인은 사업자 등록 안내
(function hostCta() {
  const btn = $("#hostCta"); if (!btn) return;
  const a = window.AUTH && window.AUTH.get();
  if (a && a.role === "host") { btn.href = "host.html"; btn.textContent = "공간 등록하기 →"; }
  else if (a && a.role === "vendor") { btn.href = "mypage.html?tab=bizinfo"; btn.textContent = "파트너 정보 관리 →"; }
  else { btn.href = "business.html"; btn.textContent = "사업자 등록하고 시작하기 →"; }
})();

// 관리자 공지 배너 (실시간)
(function notices() {
  const el = $("#noticeBar"); if (!el || !window.NOTICES) return;
  const list = window.NOTICES.active();
  if (!list.length) return;
  el.hidden = false;
  el.innerHTML = list.slice(0, 3).map((n) => `<span class="noticebar__item">${iconSVG("megaphone", 13)} ${n.title}</span>`).join("");
})();

// 목적 온보딩 칩 (클릭 → 목적에 맞는 검색)
(function intent() {
  const el = $("#intentChips"); if (!el) return;
  const INTENTS = [
    ["party", "파티·모임"], ["meeting", "회의·세미나"], ["studio", "촬영·스튜디오"],
    ["event", "행사·공연"], ["popup", "팝업스토어"], ["practice", "연습·취미"],
  ];
  el.innerHTML = INTENTS.map(([id, label]) => { const c = catById(id); return `<a class="intent-tab" href="search.html?type=${id}" style="--ink:${c.ink}"><span class="intent-tab__ic">${iconSVG(c.icon, 17)}</span><span>${label}</span></a>`; }).join("");
})();
// 보조 진입 (공간/견적/파트너)
(function ways() {
  const el = $("#hpaths"); if (!el) return;
  el.innerHTML = `또는 <a href="search.html">공간 직접 찾기</a> · <a href="request.html">통합 견적 요청</a> · <a href="vendors.html">맞춤 찾기</a>`;
})();

// 부대 서비스 마켓 — 아이콘 옆 텍스트(가로형) 컴팩트 카드
(function svcMarket() {
  const el = $("#svcGrid"); if (!el || typeof SERVICES === "undefined") return;
  el.innerHTML = SERVICES.map((s) => `
    <a class="svc-card" href="request.html?svc=${s.id}" draggable="false" style="--tint:${s.tint};--ink:${s.ink}">
      <span class="svc-card__ic">${iconSVG(s.icon, 22)}</span>
      <span class="svc-card__body"><b class="svc-card__t">${s.label}</b><span class="svc-card__d">${s.desc || ""}</span></span>
    </a>`).join("");
  dragScroll(el);
})();

// 가로 캐러셀 마우스 드래그 스크롤 (링크 기본 드래그 차단 + 포인터 캡처)
function dragScroll(el) {
  if (!el) return; let down = false, sx = 0, sl = 0, moved = false, pid = null;
  el.addEventListener("dragstart", (e) => e.preventDefault());
  el.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    down = true; moved = false; sx = e.clientX; sl = el.scrollLeft; pid = e.pointerId;
    el.classList.add("is-drag"); try { el.setPointerCapture(pid); } catch (x) {}
  });
  el.addEventListener("pointermove", (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; el.scrollLeft = sl - dx; });
  const up = () => { if (!down) return; down = false; el.classList.remove("is-drag"); try { el.releasePointerCapture(pid); } catch (x) {} };
  el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  el.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
}

// 번개 특가 — 반짝할인 활성 공간
(function flashDeals() {
  const list = getPublicSpaces().filter((s) => window.DISCOUNT && window.DISCOUNT.flashPct(s.id) > 0);
  if (!list.length) return;
  const sec = $("#flashsec"); if (!sec) return;
  sec.hidden = false;
  $("#flashGrid").innerHTML = list.map(cardHTML).join("");
})();

// AI 한 줄 추천 → 조건 파싱 후 검색으로
const aiForm = $("#aiForm");
if (aiForm) aiForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = ($("#aiInput").value || "").trim();
  if (!q) { $("#aiInput").focus(); return; }
  const p = new URLSearchParams();
  const capM = q.match(/(\d+)\s*(명|인)/); if (capM) p.set("cap", capM[1]);
  const reg = (typeof REGIONS !== "undefined" ? REGIONS : []).find((r) => q.includes(r));
  if (reg) p.set("region", reg);
  else { const gu = q.match(/([가-힣]{2,10}(구|동|시))/); if (gu) p.set("region", gu[1]); }
  const catMap = [[/파티|생일|브라이덜|집들이/, "party"], [/회의|세미나|미팅|강의|컨퍼런스|워크숍/, "meeting"], [/연습|댄스|보컬|악기|밴드|합주/, "practice"], [/스튜디오|촬영|화보|방송|유튜브|영상/, "studio"], [/카페|주방|쿠킹|공유주방|베이킹/, "cafe"], [/공연|행사|전시|웨딩|파티룸/, "event"], [/스터디|공부|독서/, "study"], [/오피스|사무|코워킹|미팅룸/, "office"]];
  for (const [re, id] of catMap) { if (re.test(q)) { p.set("type", id); break; } }
  location.href = "search.html" + (p.toString() ? "?" + p.toString() : "");
});

// 플래그십
(function flagship() {
  const f = SPACES.find((s) => s.flagship);
  if (!f) return;
  $("#flag").innerHTML = `<div class="flag__inner">
    <div class="flag__media">
      <img src="${spaceImg(f, 900, 800)}" alt="${f.name}" onerror="this.style.display='none';this.parentNode.style.background='linear-gradient(135deg,${f.g[0]},${f.g[1]})'" />
      <div class="flag__mediascrim"></div>
      <span class="flag__tag">OFFICIAL · 직영</span>
    </div>
    <div class="flag__body">
      <span class="flag__eyebrow">공간잇다 직영 공간</span>
      <h2 class="flag__title">${f.name},<br />모임과 행사의 시작</h2>
      <p class="flag__desc">역삼동 중심 ${f.capacity}인 규모 라운지. 세미나·소규모 행사·파티까지, 빔프로젝터·음향·주차를 모두 갖췄습니다.</p>
      <div class="flag__spec">
        <div><strong>~${f.capacity}인</strong><span>수용 인원</span></div>
        <div><strong>${won(f.price)}원</strong><span>시간당</span></div>
        <div><strong>★ ${f.rating}</strong><span>후기 ${f.reviews}</span></div>
      </div>
      <a href="space.html?id=${f.id}" class="btn btn--accent btn--lg" style="align-self:flex-start">예약 가능 시간 보기 →</a>
    </div>
  </div>`;
})();

// 목적별 큐레이션
const COLLECTIONS = [
  { title: "파티·모임", sub: "생일·기념일·홈파티", type: "party", img: "1505373877841-8d25f7d46678" },
  { title: "촬영·스튜디오", sub: "화보·유튜브·라이브", type: "studio", img: "1519710164239-da123dc03ef4" },
  { title: "회의·워크숍", sub: "세미나·강의·미팅", type: "meeting", img: "1497366754035-f200968a6e72" },
  { title: "연습·취미", sub: "댄스·보컬·악기", type: "practice", img: "1511379938547-c1f69419868d" },
];
if ($("#colGrid")) $("#colGrid").innerHTML = COLLECTIONS.map((c) => `
  <a class="col" href="search.html?type=${c.type}">
    <div class="col__bg" style="background-image:url('https://images.unsplash.com/photo-${c.img}?w=700&q=80')"></div>
    <div class="col__scrim"></div>
    <div class="col__txt"><b>${c.title}</b><span>${c.sub}</span></div>
  </a>`).join("");

// 토스트
let toastT;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2200);
}

// 이벤트
document.addEventListener("click", (e) => {
  const heart = e.target.closest("[data-heart]");
  if (heart) {
    e.stopPropagation();
    heart.classList.toggle("is-on", window.FAV.toggle(heart.dataset.heart));
    return;
  }
  const cat = e.target.closest(".cat");
  if (cat) { location.href = "search.html?type=" + cat.dataset.cat; return; }
  const chip = e.target.closest(".chip");
  if (chip) { setCat(chip.dataset.cat); return; }
  const card = e.target.closest(".sp-card");
  if (card && card.dataset.id) { location.href = "space.html?id=" + card.dataset.id; }
});

function setCat(id) {
  activeCat = id;
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c.dataset.cat === id));
  renderGrid();
}

// 검색 → 검색 결과 페이지로 이동
$("#searchbar").addEventListener("submit", (e) => {
  e.preventDefault();
  const p = new URLSearchParams();
  const region = $("#sfRegion").value.trim();
  const type = $("#sfType").value;
  const cap = $("#sfCap").value;
  if (region) p.set("region", region);
  if (type) p.set("type", type);
  if (cap) p.set("cap", cap);
  location.href = "search.html" + (p.toString() ? "?" + p.toString() : "");
});

// 패키지 기획전 (홈 미리보기 3종)
if (window.PACKAGES && $("#pkgHome")) {
  $("#pkgHome").innerHTML = PACKAGES.slice(0, 3).map((p) => {
    const img = pkgImg(p, 720, 480);
    return `<a class="pkg-card" href="packages.html">
      <div class="pkg-card__thumb" style="background:linear-gradient(135deg,${p.g[0]},${p.g[1]})">
        ${img ? `<img src="${img}" alt="${p.title}" loading="lazy" onerror="this.remove()" />` : ""}
        ${p.badge ? `<span class="pkg-card__badge">${p.badge}</span>` : ""}
        <span class="pkg-card__save">${p.pct}% 할인</span>
      </div>
      <div class="pkg-card__body">
        <span class="pkg-card__theme">${p.theme}</span>
        <h3 class="pkg-card__title">${p.title}</h3>
        <p class="pkg-card__sub">${p.subtitle}</p>
        <div class="sp-tags">${p.tags.map((t) => `<span class="optag">#${t}</span>`).join("")}</div>
        ${typeof pkgPartners === "function" ? `<div class="pkg-card__partners"><span class="pkg-card__plabel">참여</span>${pkgPartners(p).slice(0, 3).map((v) => `<span class="pkg-partner"><span class="pkg-partner__av pkg-partner__av--${v.role}">${iconSVG(v.role === "host" ? "home" : (v.icon || "wrench"), 13)}</span><span class="pkg-partner__nm">${v.name}</span></span>`).join("")}</div>` : ""}
        <div class="pkg-card__foot">
          <div class="pkg-card__price"><span class="pkg-card__list">${won(p.list)}원</span><b>${won(p.price)}<em>원</em></b></div>
          <span class="btn btn--accent btn--sm">보기 →</span>
        </div>
      </div>
    </a>`;
  }).join("");
}

// 프로모션 배너 캐러셀 (자동 회전 + 도트)
(function promo() {
  const track = $("#promoTrack"), dots = $("#promoDots"); if (!track || !dots) return;
  const n = track.children.length; if (!n) return;
  let i = 0, timer = null;
  dots.innerHTML = Array.from({ length: n }, (_, k) => `<button type="button" class="promo__dot${k === 0 ? " is-on" : ""}" data-pg="${k}" aria-label="배너 ${k + 1}"></button>`).join("");
  const ds = dots.querySelectorAll(".promo__dot");
  function go(k) { i = (k + n) % n; track.style.transform = `translateX(-${i * 100}%)`; ds.forEach((d, di) => d.classList.toggle("is-on", di === i)); }
  function start() { stop(); timer = setInterval(() => go(i + 1), 4500); }
  function stop() { if (timer) clearInterval(timer); timer = null; }
  dots.addEventListener("click", (e) => { const b = e.target.closest("[data-pg]"); if (b) { go(+b.dataset.pg); start(); } });
  const wrap = $("#promo");
  wrap.addEventListener("mouseenter", stop); wrap.addEventListener("mouseleave", start);
  // 터치 스와이프
  let sx = null; track.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; stop(); }, { passive: true });
  track.addEventListener("touchend", (e) => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); sx = null; start(); }, { passive: true });
  go(0); start();
})();

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });

// 헤더 스크롤 그림자
const header = $("#header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll); onScroll();
