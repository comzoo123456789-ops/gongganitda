// ============================================================
// 공간잇다 — 마이페이지 (찜 · 예약 내역 · 내 등록 공간)
// ============================================================
const $ = (s) => document.querySelector(s);
const won = (n) => (+n || 0).toLocaleString("ko-KR");
const auth = window.AUTH.get();
if (!auth) { location.href = "login.html"; }

$("#mpTitle").textContent = `${auth ? auth.name : ""} 님`;
$("#mpSub").textContent = auth && auth.role === "host" ? "호스트 회원 · 공간을 등록하고 예약을 관리하세요." : "일반 회원 · 찜한 공간과 예약 내역을 확인하세요.";
if (auth && auth.role === "host") document.querySelector('.js-host').hidden = false;

// 카드
function cardHTML(s) {
  const c = catById(s.cat);
  const g = s.g || [c.ink, "#cfc7b8"];
  const img = spaceImg(s, 640, 480);
  return `<article class="sp-card" onclick="location.href='space.html?id=${s.id}'">
    <div class="sp-card__thumb" style="background:linear-gradient(135deg,${g[0]},${g[1]})">
      ${img ? `<img src="${img}" alt="${s.name}" loading="lazy" onerror="this.remove()" />` : ""}
    </div>
    <div class="sp-card__body">
      <span class="sp-card__cat">${c.label}</span>
      <h3 class="sp-card__name">${s.name}</h3>
      <div class="sp-card__meta"><span>${iconSVG("pin", 14)}${s.region.replace("서울 ", "")}</span><span>${iconSVG("users", 14)}~${s.capacity}인</span></div>
      <div class="sp-card__foot"><span class="sp-card__price">${won(s.price)}<span>원 / 시간</span></span><span class="sp-card__rating">${iconSVG("star", 14)}${s.rating || "신규"}</span></div>
    </div>
  </article>`;
}

// 찜
const all = getAllSpaces();
const favIds = window.FAV.list();
const favs = all.filter((s) => favIds.includes(+s.id));
$("#favGrid").innerHTML = favs.map(cardHTML).join("");
$("#favEmpty").hidden = favs.length > 0;

// 예약 내역
const books = window.BOOKINGS.list();
$("#bookList").innerHTML = books.map((b) => `
  <div class="mp-book" onclick="location.href='space.html?id=${b.spaceId}'">
    <div class="mp-book__main">
      <div class="mp-book__name">${b.spaceName}</div>
      <div class="mp-book__meta">${b.date} · ${String(b.start).padStart(2, "0")}:00~${String(b.start + b.hours).padStart(2, "0")}:00 · ${b.guests}인</div>
    </div>
    <div class="mp-book__right">
      <span class="mp-book__status">예약 요청</span>
      <span class="mp-book__price">${won(b.total)}원</span>
    </div>
  </div>`).join("");
$("#bookEmpty").hidden = books.length > 0;

// 내 등록 공간 (호스트)
if (auth && auth.role === "host") {
  let mine = [];
  try { mine = JSON.parse(localStorage.getItem("gi_spaces") || "[]"); } catch (e) {}
  $("#mineGrid").innerHTML = mine.map(cardHTML).join("");
  $("#mineEmpty").hidden = mine.length > 0;
}

// 탭
$("#mpTabs").addEventListener("click", (e) => {
  const b = e.target.closest(".mp-tab"); if (!b) return;
  const t = b.dataset.tab;
  document.querySelectorAll(".mp-tab").forEach((x) => x.classList.toggle("is-active", x === b));
  document.querySelectorAll(".mp-panel").forEach((p) => (p.hidden = p.dataset.panel !== t));
});

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
