// ============================================================
// 공간잇다 — 마이페이지 (찜 · 예약 내역 · 내 등록 공간)
// ============================================================
const $ = (s) => document.querySelector(s);
const won = (n) => (+n || 0).toLocaleString("ko-KR");
const auth = window.AUTH.get();
if (!auth) { location.href = "login.html"; }

$("#mpTitle").textContent = `${auth ? auth.name : ""} 님`;
$("#mpSub").textContent = auth && auth.role === "host" ? "호스트 회원 · 공간을 등록하고 예약을 관리하세요." : "일반 회원 · 찜한 공간과 예약 내역을 확인하세요.";
const isHost = auth && auth.role === "host";
if (isHost) document.querySelectorAll(".js-host").forEach((e) => (e.hidden = false));

const STATUS = {
  requested: { t: "승인 대기", c: "amber" },
  confirmed: { t: "예약 확정", c: "green" },
  declined: { t: "거절됨", c: "gray" },
};
const timeLabel = (b) => `${b.date} · ${String(b.start).padStart(2, "0")}:00~${String(b.start + b.hours).padStart(2, "0")}:00 · ${b.guests}인`;

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

// 예약 내역 (내가 게스트로 신청한 것)
const myBooks = window.BOOKINGS.list().filter((b) => b.guestId === auth.userId);
$("#bookList").innerHTML = myBooks.map((b) => {
  const s = STATUS[b.status] || STATUS.requested;
  return `<div class="mp-book" onclick="location.href='space.html?id=${b.spaceId}'">
    <div class="mp-book__main">
      <div class="mp-book__name">${b.spaceName}</div>
      <div class="mp-book__meta">${timeLabel(b)}</div>
    </div>
    <div class="mp-book__right">
      <span class="mp-book__status st-${s.c}">${s.t}</span>
      <span class="mp-book__price">${won(b.total)}원</span>
    </div>
  </div>`;
}).join("");
$("#bookEmpty").hidden = myBooks.length > 0;

// 호스트: 받은 예약 요청 + 내 등록 공간
if (isHost) {
  let mine = [];
  try { mine = JSON.parse(localStorage.getItem("gi_spaces") || "[]"); } catch (e) {}
  $("#mineGrid").innerHTML = mine.map(cardHTML).join("");
  $("#mineEmpty").hidden = mine.length > 0;

  function renderReqs() {
    const reqs = window.BOOKINGS.list().filter((b) => b.hostId === auth.userId);
    const pending = reqs.filter((b) => b.status === "requested").length;
    const badge = $("#reqBadge");
    if (badge) { badge.textContent = pending; badge.hidden = pending === 0; }
    $("#reqList").innerHTML = reqs.map((b) => {
      const s = STATUS[b.status] || STATUS.requested;
      const actions = b.status === "requested"
        ? `<div class="mp-req__act"><button class="btn btn--accent btn--sm" data-accept="${b.id}">수락</button><button class="btn btn--outline btn--sm" data-decline="${b.id}">거절</button></div>`
        : `<span class="mp-book__status st-${s.c}">${s.t}</span>`;
      return `<div class="mp-req">
        <div class="mp-book__main">
          <div class="mp-book__name">${b.spaceName}</div>
          <div class="mp-book__meta">👤 ${b.guestName || "게스트"} · ${timeLabel(b)} · ${won(b.total)}원</div>
        </div>
        ${actions}
      </div>`;
    }).join("");
    $("#reqEmpty").hidden = reqs.length > 0;
  }
  renderReqs();

  $("#reqList").addEventListener("click", (e) => {
    const acc = e.target.closest("[data-accept]"), dec = e.target.closest("[data-decline]");
    const id = acc ? acc.dataset.accept : dec ? dec.dataset.decline : null;
    if (!id) return;
    const b = window.BOOKINGS.list().find((x) => x.id === id);
    if (!b) return;
    if (acc) {
      window.BOOKINGS.update(id, { status: "confirmed" });
      window.NOTIF.add({ forUser: b.guestId, text: `예약이 확정되었어요 · ${b.spaceName} (${b.date})`, link: "mypage.html" });
    } else {
      window.BOOKINGS.update(id, { status: "declined" });
      window.NOTIF.add({ forUser: b.guestId, text: `예약이 거절되었어요 · ${b.spaceName} (${b.date})`, link: "mypage.html" });
    }
    renderReqs();
  });
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
