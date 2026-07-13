// ============================================================
// 공간잇다 — 검색 결과 (필터 · 정렬)
// ============================================================
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const won = (n) => n.toLocaleString("ko-KR");
const params = new URLSearchParams(location.search);

const AMENITIES = ["주차", "와이파이", "빔프로젝터", "취사", "음향", "방음", "화이트보드", "조명"];

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
function cardHTML(s) {
  const c = catById(s.cat);
  const g = s.g || [c.ink, "#cfc7b8"];
  const img = spaceImg(s, 640, 480);
  const pr = window.priceOf(s);
  const nowBadge = s.now ? `<span class="sp-card__badge"><i></i>실시간 예약</span>` : "";
  return `<article class="sp-card" data-id="${s.id}">
    <div class="sp-card__thumb" style="background:linear-gradient(135deg,${g[0]},${g[1]})">
      ${img ? `<img src="${img}" alt="${s.name}" loading="lazy" onerror="this.remove()" />` : ""}
      ${nowBadge}
      ${pr.pct ? `<span class="sp-card__flash">⚡${pr.pct}%</span>` : ""}
      <button class="sp-card__heart ${window.FAV.has(s.id) ? "is-on" : ""}" data-heart="${s.id}" aria-label="찜">${iconSVG("heart", 18)}</button>
    </div>
    <div class="sp-card__body">
      <span class="sp-card__cat">${c.label}</span>
      <h3 class="sp-card__name">${s.name}</h3>
      <div class="sp-card__meta">
        <span>${iconSVG("pin", 14)}${s.region.replace("서울 ", "")}</span>
        <span>${iconSVG("users", 14)}~${s.capacity}인</span>
      </div>
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
  const priceRanges = [...$$('input[name="price"]:checked')].map((i) => i.value.split("-").map(Number));
  const amens = [...$$('input[name="amen"]:checked')].map((i) => i.value);

  let list = getAllSpaces().filter((s) => {
    if (region && !s.region.includes(region)) return false;
    if (type && s.cat !== type) return false;
    if (cap && s.capacity < cap) return false;
    if (now && !s.now) return false;
    if (priceRanges.length && !priceRanges.some(([lo, hi]) => s.price >= lo && s.price <= hi)) return false;
    if (amens.length && !amens.every((a) => (s.tags || []).some((t) => t.includes(a)))) return false;
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

  $("#srchCount").innerHTML = `<b>${list.length}</b>개 공간`;
  $("#results").innerHTML = list.map(cardHTML).join("");
  $("#srchEmpty").hidden = list.length > 0;
  $("#results").style.display = list.length ? "" : "none";
}

// ---------- 이벤트 ----------
document.addEventListener("change", (e) => { if (e.target.closest(".filters, #sort")) apply(); });
$("#fRegion").addEventListener("input", apply);

function reset() {
  $("#fRegion").value = "";
  $('input[name="type"][value=""]').checked = true;
  $("#fCap").value = "0";
  $("#fNow").checked = false;
  $$('input[name="price"], input[name="amen"]').forEach((i) => (i.checked = false));
  apply();
}
$("#fReset").addEventListener("click", reset);
$("#fReset2") && $("#fReset2").addEventListener("click", reset);

document.addEventListener("click", (e) => {
  const heart = e.target.closest("[data-heart]");
  if (heart) { e.stopPropagation(); heart.classList.toggle("is-on", window.FAV.toggle(heart.dataset.heart)); return; }
  const card = e.target.closest(".sp-card");
  if (card && card.dataset.id) location.href = "space.html?id=" + card.dataset.id;
});

// 모바일 필터 토글
$("#fMobile").addEventListener("click", () => { $("#filtersBody").classList.toggle("is-open"); });
// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });

apply();
