// ============================================================
// 공간잇다 홈 — 카테고리·공간 카드·검색·플래그십
// ============================================================
const $ = (s) => document.querySelector(s);
const won = (n) => n.toLocaleString("ko-KR");
const liked = new Set();
let activeCat = "all";

// 검색바 아이콘 주입
document.querySelectorAll(".searchbar__input[data-ic]").forEach((el) => {
  el.insertAdjacentHTML("afterbegin", iconSVG(el.dataset.ic, 18));
});
$("#searchbar .searchbar__go").innerHTML = iconSVG("search", 20);
$("#sfType").insertAdjacentHTML("beforeend", CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join(""));

// 히어로 통계
(function heroStats() {
  const nowN = SPACES.filter((s) => s.now).length;
  const avg = (SPACES.reduce((a, s) => a + s.rating, 0) / SPACES.length).toFixed(1);
  const items = [[SPACES.length + "곳", "등록 공간"], [nowN + "곳", "지금 예약 가능"], ["★ " + avg, "평균 평점"]];
  $("#heroStats").innerHTML = items.map((i) => `<div><strong>${i[0]}</strong><span>${i[1]}</span></div>`).join("");
})();

// 카테고리 그리드
$("#catGrid").innerHTML = CATEGORIES.map((c) => `
  <button class="cat" data-cat="${c.id}">
    <span class="cat__ic" style="background:${c.tint};color:${c.ink}">${iconSVG(c.icon, 27)}</span>
    <span class="cat__label">${c.label}</span>
  </button>`).join("");

// 필터 칩
$("#catChips").innerHTML =
  `<button class="chip is-active" data-cat="all">전체</button>` +
  CATEGORIES.map((c) => `<button class="chip" data-cat="${c.id}">${c.label}</button>`).join("");

// 공간 카드
function cardHTML(s) {
  const c = catById(s.cat);
  const nowBadge = s.now ? `<span class="sp-card__badge"><i></i>실시간 예약</span>` : "";
  const g = s.g || [c.ink, "#cfc7b8"];
  const img = spaceImg(s, 640, 480);
  return `<article class="sp-card" data-id="${s.id}">
    <div class="sp-card__thumb" style="background:linear-gradient(135deg,${g[0]},${g[1]})">
      ${img ? `<img src="${img}" alt="${s.name}" loading="lazy" onerror="this.remove()" />` : ""}
      ${nowBadge}
      <button class="sp-card__heart ${liked.has(s.id) ? "is-on" : ""}" data-heart="${s.id}" aria-label="찜">${iconSVG("heart", 18)}</button>
    </div>
    <div class="sp-card__body">
      <span class="sp-card__cat">${c.label}</span>
      <h3 class="sp-card__name">${s.name}</h3>
      <div class="sp-card__meta">
        <span>${iconSVG("pin", 14)}${s.region.replace("서울 ", "")}</span>
        <span>${iconSVG("users", 14)}~${s.capacity}인</span>
      </div>
      <div class="sp-card__foot">
        <span class="sp-card__price">${won(s.price)}<span>원 / 시간</span></span>
        <span class="sp-card__rating">${iconSVG("star", 14)}${s.rating || "신규"}${s.reviews ? `<em>(${s.reviews})</em>` : ""}</span>
      </div>
    </div>
  </article>`;
}
function renderGrid() {
  const all = getAllSpaces();
  const list = activeCat === "all" ? all : all.filter((s) => s.cat === activeCat);
  $("#spaceGrid").innerHTML = list.length ? list.map(cardHTML).join("") : `<p style="color:var(--faint);padding:20px">해당 유형의 공간이 아직 없어요.</p>`;
}
renderGrid();

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
    const id = +heart.dataset.heart;
    if (liked.has(id)) { liked.delete(id); heart.classList.remove("is-on"); }
    else { liked.add(id); heart.classList.add("is-on"); }
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

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });

// 헤더 스크롤 그림자
const header = $("#header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll); onScroll();
