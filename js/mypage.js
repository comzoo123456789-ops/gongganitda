// ============================================================
// 공간잇다 — 마이페이지 (찜 · 예약내역 · 예약요청 · 내공간 + 취소/변경/채팅)
// ============================================================
const $ = (s) => document.querySelector(s);
const won = (n) => (+n || 0).toLocaleString("ko-KR");
const auth = window.AUTH.get();
if (!auth) { location.href = "login.html"; }
const me = auth ? auth.userId : null;
const isHost = auth && auth.role === "host";

$("#mpTitle").textContent = `${window.AUTH.displayName(auth)} 님`;
$("#mpSub").textContent = isHost ? "호스트 회원 · 공간을 등록하고 예약을 관리하세요." : "일반 회원 · 찜한 공간과 예약 내역을 확인하세요.";
if (isHost) document.querySelectorAll(".js-host").forEach((e) => (e.hidden = false));

const STATUS = {
  requested: { t: "승인 대기", c: "amber" },
  confirmed: { t: "예약 확정", c: "green" },
  declined: { t: "거절됨", c: "gray" },
  cancelled: { t: "취소됨", c: "gray" },
};
const timeLabel = (b) => `${b.date} · ${String(b.start).padStart(2, "0")}:00~${String(b.start + b.hours).padStart(2, "0")}:00 · ${b.guests}인`;

// ---------- 공간 카드 (찜/내공간) ----------
function cardHTML(s) {
  const c = catById(s.cat);
  const g = s.g || [c.ink, "#cfc7b8"];
  const img = spaceImg(s, 640, 480);
  return `<article class="sp-card" onclick="location.href='space.html?id=${s.id}'">
    <div class="sp-card__thumb" style="background:linear-gradient(135deg,${g[0]},${g[1]})">${img ? `<img src="${img}" alt="${s.name}" loading="lazy" onerror="this.remove()" />` : ""}</div>
    <div class="sp-card__body">
      <span class="sp-card__cat">${c.label}</span><h3 class="sp-card__name">${s.name}</h3>
      <div class="sp-card__meta"><span>${iconSVG("pin", 14)}${s.region.replace("서울 ", "")}</span><span>${iconSVG("users", 14)}~${s.capacity}인</span></div>
      <div class="sp-card__foot"><span class="sp-card__price">${won(s.price)}<span>원 / 시간</span></span><span class="sp-card__rating">${iconSVG("star", 14)}${s.rating || "신규"}</span></div>
    </div>
  </article>`;
}

// 찜
const all = getAllSpaces();
const favs = all.filter((s) => window.FAV.list().includes(+s.id));
$("#favGrid").innerHTML = favs.map(cardHTML).join("");
$("#favEmpty").hidden = favs.length > 0;

// ---------- 예약 카드 (액션 포함) ----------
function actionBtns(b, asHost) {
  const btns = [];
  if (asHost && b.status === "requested") {
    btns.push(`<button class="btn btn--accent btn--sm" data-accept="${b.id}">수락</button>`);
    btns.push(`<button class="btn btn--outline btn--sm" data-decline="${b.id}">거절</button>`);
  }
  if (b.status === "requested" || b.status === "confirmed") {
    btns.push(`<button class="btn btn--soft btn--sm" data-chat="${b.id}">💬 채팅</button>`);
    btns.push(`<button class="btn btn--soft btn--sm" data-resched="${b.id}">일정 변경</button>`);
    btns.push(`<button class="btn btn--danger btn--sm" data-cancel="${b.id}">예약 취소</button>`);
  }
  return btns.length ? `<div class="mp-bk__act">${btns.join("")}</div>` : "";
}
function bookingCard(b, asHost) {
  const s = STATUS[b.status] || STATUS.requested;
  const who = asHost ? `👤 ${b.guestName || "게스트"}` : b.spaceName;
  return `<div class="mp-bk">
    <div class="mp-bk__top">
      <div class="mp-bk__info" onclick="location.href='space.html?id=${b.spaceId}'">
        <div class="mp-book__name">${asHost ? b.spaceName : b.spaceName}</div>
        <div class="mp-book__meta">${asHost ? who + " · " : ""}${timeLabel(b)} · ${won(b.total)}원</div>
      </div>
      <span class="mp-book__status st-${s.c}">${s.t}</span>
    </div>
    ${actionBtns(b, asHost)}
  </div>`;
}

function renderBooks() {
  const list = window.BOOKINGS.list().filter((b) => b.guestId === me);
  $("#bookList").innerHTML = list.map((b) => bookingCard(b, false)).join("");
  $("#bookEmpty").hidden = list.length > 0;
}
function renderReqs() {
  if (!isHost) return;
  const list = window.BOOKINGS.list().filter((b) => b.hostId === me);
  const pending = list.filter((b) => b.status === "requested").length;
  const badge = $("#reqBadge"); if (badge) { badge.textContent = pending; badge.hidden = pending === 0; }
  $("#reqList").innerHTML = list.map((b) => bookingCard(b, true)).join("");
  $("#reqEmpty").hidden = list.length > 0;
}
function renderMine() {
  let mine = [];
  try { mine = JSON.parse(localStorage.getItem("gi_spaces") || "[]"); } catch (e) {}
  $("#mineGrid").innerHTML = mine.map(cardHTML).join("");
  $("#mineEmpty").hidden = mine.length > 0;
}
function renderAll() { renderBooks(); if (isHost) { renderReqs(); renderMine(); } }
renderAll();

// ---------- 토스트 ----------
let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2400); }

// ---------- 액션 (수락/거절/취소/일정변경/채팅) ----------
function notifyOther(b, text) {
  const other = (me === b.hostId) ? b.guestId : b.hostId;
  window.NOTIF.add({ forUser: other, text, link: "mypage.html" });
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-accept],[data-decline],[data-cancel],[data-resched],[data-chat]");
  if (!t) return;
  const id = t.dataset.accept || t.dataset.decline || t.dataset.cancel || t.dataset.resched || t.dataset.chat;
  const b = window.BOOKINGS.find(id); if (!b) return;
  if (t.dataset.accept) { window.BOOKINGS.update(id, { status: "confirmed" }); notifyOther(b, `예약이 확정되었어요 · ${b.spaceName} (${b.date})`); toast("예약을 수락했어요"); renderAll(); }
  else if (t.dataset.decline) { window.BOOKINGS.update(id, { status: "declined" }); notifyOther(b, `예약이 거절되었어요 · ${b.spaceName} (${b.date})`); toast("예약을 거절했어요"); renderAll(); }
  else if (t.dataset.cancel) { if (!confirm("예약을 취소할까요?")) return; window.BOOKINGS.update(id, { status: "cancelled" }); notifyOther(b, `예약이 취소되었어요 · ${b.spaceName} (${b.date})`); toast("예약을 취소했어요"); renderAll(); }
  else if (t.dataset.resched) openResched(b);
  else if (t.dataset.chat) openChat(b);
});

// ---------- 모달 ----------
const modal = $("#modal"), modalCard = $("#modalCard");
function closeModal() { modal.hidden = true; modalCard.innerHTML = ""; }
modal.addEventListener("click", (e) => { if (e.target.closest("[data-mclose]")) closeModal(); });

function openResched(b) {
  modal.hidden = false;
  const opts = (a, c) => { let o = ""; for (let i = a; i <= c; i++) o += `<option value="${i}">${i}</option>`; return o; };
  modalCard.innerHTML = `
    <div class="modal__head"><b>일정 변경</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="modal__sub">${b.spaceName}</p>
    <div class="book__field"><label class="book__label">날짜</label><input type="date" id="rsDate" value="${b.date}" min="${new Date().toISOString().slice(0, 10)}" /></div>
    <div class="book__row">
      <div class="book__field"><label class="book__label">시작(시)</label><select id="rsStart">${opts(9, 21)}</select></div>
      <div class="book__field"><label class="book__label">이용(시간)</label><select id="rsHours">${opts(1, 8)}</select></div>
    </div>
    <button class="btn btn--accent btn--block" id="rsSave">변경 요청</button>
    <p class="modal__note">일정을 바꾸면 상대방의 재확인이 필요해 '승인 대기'로 돌아갑니다.</p>`;
  $("#rsStart").value = b.start; $("#rsHours").value = b.hours;
  $("#rsSave").addEventListener("click", () => {
    const date = $("#rsDate").value, start = +$("#rsStart").value, hours = +$("#rsHours").value;
    window.BOOKINGS.update(b.id, { date, start, hours, status: "requested" });
    notifyOther(b, `일정 변경 요청 · ${b.spaceName} (${date} ${String(start).padStart(2, "0")}:00)`);
    closeModal(); toast("일정 변경을 요청했어요"); renderAll();
  });
}

function openChat(b) {
  modal.hidden = false;
  function draw() {
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
      window.NOTIF.add({ forUser: other, text: `💬 새 메시지 · ${b.spaceName}`, link: "mypage.html" });
      draw();
    });
  }
  draw();
}
// 다른 탭에서 채팅/예약 변화 시 갱신
window.addEventListener("storage", (e) => { if (e.key === window.CHAT.KEY && !modal.hidden) { /* 열려있는 채팅 갱신은 재열기 */ } if (e.key === window.BOOKINGS.KEY) renderAll(); });

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
