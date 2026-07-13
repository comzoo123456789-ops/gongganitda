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
const pad = (n) => String(n).padStart(2, "0");
const slot = (b) => `${b.date} ${pad(b.start)}:00~${pad(b.start + b.hours)}:00`;
const timeLabel = (b) => `${b.date} · ${pad(b.start)}:00~${pad(b.start + b.hours)}:00 · ${b.guests}인`;
const unitOf = (b) => b.price || Math.round(b.total / (b.hours * 1.05));
const _t0 = new Date(); _t0.setHours(0, 0, 0, 0);
const todayStr = `${_t0.getFullYear()}-${pad(_t0.getMonth() + 1)}-${pad(_t0.getDate())}`;
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
    const un = window.CHAT.unread(me, b.id);
    btns.push(`<button class="btn btn--soft btn--sm" data-chat="${b.id}">💬 채팅${un ? `<span class="chat-badge">${un}</span>` : ""}</button>`);
    btns.push(`<button class="btn btn--soft btn--sm" data-resched="${b.id}">일정 변경</button>`);
    btns.push(`<button class="btn btn--danger btn--sm" data-cancel="${b.id}">예약 취소</button>`);
  }
  // 게스트 전용: 이용권 / 후기
  if (!asHost && b.status === "confirmed") {
    if (daysUntil(b.date) >= 0) btns.push(`<button class="btn btn--soft btn--sm" data-ticket="${b.id}">🎫 이용권</button>`);
    else btns.push(`<button class="btn btn--accent btn--sm" data-review="${b.id}">후기 쓰기</button>`);
  }
  return btns.length ? `<div class="mp-bk__act">${btns.join("")}</div>` : "";
}
function bookingCard(b, asHost) {
  const s = STATUS[b.status] || STATUS.requested;
  const un = window.CHAT.unread(me, b.id);
  const changed = b.reschedFrom && b.status === "requested"
    ? `<div class="mp-bk__change">🔁 일정 변경 요청<br /><s>${slot(b.reschedFrom)}</s> → <b>${slot(b)}</b></div>` : "";
  const dd = (!asHost && (b.status === "confirmed" || b.status === "requested")) ? ddayLabel(b.date) : "";
  const hostSub = asHost ? `<div class="mp-bk__sub">요청 ${window.timeago(b.ts)} · 예상 정산 <b>${won(window.settleOf(b))}원</b></div>` : "";
  const policy = (!asHost && b.status === "confirmed") ? `<div class="mp-bk__policy">취소·환불: 3일 전 100% · 1~2일 전 50% · 당일 불가</div>` : "";
  return `<div class="mp-bk ${un ? "has-unread" : ""}">
    <div class="mp-bk__top">
      <div class="mp-bk__info" onclick="location.href='space.html?id=${b.spaceId}'">
        <div class="mp-book__name">${b.spaceName}</div>
        <div class="mp-book__meta">${asHost ? `👤 ${b.guestName || "게스트"} · ` : ""}${timeLabel(b)} · ${won(b.total)}원</div>
      </div>
      <div class="mp-bk__right">${dd ? `<span class="mp-dday">${dd}</span>` : ""}<span class="mp-book__status st-${s.c}">${s.t}</span></div>
    </div>
    ${hostSub}
    ${changed}
    ${policy}
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
  $("#mineGrid").innerHTML = mine.map((s) => `<div class="mine-wrap">${cardHTML(s)}<div class="mine-act"><a href="host.html?id=${s.id}" class="btn btn--soft btn--sm">수정</a><button class="btn btn--danger btn--sm" data-delspace="${s.id}">삭제</button></div></div>`).join("");
  $("#mineEmpty").hidden = mine.length > 0;
}
function renderAll() { renderBooks(); if (isHost) { renderReqs(); renderMine(); } }
renderAll();

// ---------- 내 후기 ----------
function renderMyRev() {
  const wrap = $("#myrevWrap"); if (!wrap) return;
  const all = getAllSpaces();
  const rows = window.REVIEWS.all().filter((r) => r.userId === me);
  wrap.innerHTML = rows.length ? rows.map((r) => {
    const sp = all.find((s) => s.id === r.spaceId);
    return `<div class="mp-bk"><div class="mp-bk__top"><div class="mp-bk__info" onclick="location.href='space.html?id=${r.spaceId}'"><div class="mp-book__name">${sp ? sp.name : "공간"}</div><div class="mp-bk__sub" style="color:var(--gold)">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div></div></div><div class="mp-bk__policy" style="color:var(--ink-2);font-size:0.9rem">${r.text}</div></div>`;
  }).join("") : `<div class="mp-empty">아직 작성한 후기가 없어요. 이용 완료한 예약에서 후기를 남겨보세요.</div>`;
}
// ---------- 1:1 문의 ----------
function renderInq() {
  const wrap = $("#inqWrap"); if (!wrap) return;
  wrap.innerHTML = `
    <h3 class="mg-h" style="margin-top:0;border:none;padding-top:0">1:1 문의하기</h3>
    <div class="book__field"><label class="book__label">제목</label><input type="text" id="iqSubject" placeholder="문의 제목" /></div>
    <div class="book__field"><label class="book__label">내용</label><textarea id="iqText" rows="3" placeholder="문의 내용을 입력하세요"></textarea></div>
    <button class="btn btn--accent" id="iqSend">문의 등록</button>
    <h3 class="mg-h">문의 내역</h3>
    <div id="iqList"></div>`;
  const drawList = () => {
    const l = window.INQUIRY.list(me);
    $("#iqList").innerHTML = l.length ? l.map((q) => `<div class="mp-bk"><div class="mp-bk__top"><div class="mp-bk__info"><div class="mp-book__name">${q.subject}</div><div class="mp-book__meta">${new Date(q.ts).toLocaleDateString("ko-KR")} · ${q.text}</div></div><span class="mp-book__status st-amber">접수됨</span></div><div class="mp-bk__policy">📩 담당자가 24시간 내 답변드릴 예정입니다. (데모)</div></div>`).join("") : `<div class="mp-empty">문의 내역이 없어요.</div>`;
  };
  drawList();
  $("#iqSend").addEventListener("click", () => {
    const s = $("#iqSubject").value.trim(), t = $("#iqText").value.trim();
    if (!s || !t) { toast("제목과 내용을 입력해주세요"); return; }
    window.INQUIRY.add({ userId: me, name: window.AUTH.displayName(auth), subject: s, text: t });
    $("#iqSubject").value = ""; $("#iqText").value = ""; drawList(); toast("문의가 접수되었어요");
  });
}
renderMyRev(); renderInq();

// ---------- 토스트 ----------
let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2400); }

// ---------- 액션 (수락/거절/취소/일정변경/채팅) ----------
function notifyOther(b, title, sub, link) {
  const other = (me === b.hostId) ? b.guestId : b.hostId;
  window.NOTIF.add({ forUser: other, title, sub, link: link || "mypage.html" });
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-accept],[data-decline],[data-cancel],[data-resched],[data-chat],[data-ticket],[data-review]");
  if (!t) return;
  const id = t.dataset.accept || t.dataset.decline || t.dataset.cancel || t.dataset.resched || t.dataset.chat || t.dataset.ticket || t.dataset.review;
  const b = window.BOOKINGS.find(id); if (!b) return;
  if (t.dataset.accept) { window.BOOKINGS.update(id, { status: "confirmed", reschedFrom: null }); notifyOther(b, b.spaceName, `예약이 확정되었어요 · ${slot(b)}`); toast("예약을 수락했어요"); renderAll(); }
  else if (t.dataset.decline) { window.BOOKINGS.update(id, { status: "declined", reschedFrom: null }); notifyOther(b, b.spaceName, `예약이 거절되었어요 · ${b.date}`); toast("예약을 거절했어요"); renderAll(); }
  else if (t.dataset.cancel) { if (!confirm("예약을 취소할까요?")) return; window.BOOKINGS.update(id, { status: "cancelled" }); notifyOther(b, b.spaceName, `예약이 취소되었어요 · ${b.date}`); toast("예약을 취소했어요"); renderAll(); }
  else if (t.dataset.resched) openResched(b);
  else if (t.dataset.chat) openChat(b);
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
    window.REVIEWS.add({ spaceId: b.spaceId, userId: me, name: window.AUTH.displayName(auth), rating: star, text: txt });
    closeModal(); toast("후기가 등록되었어요! 감사합니다");
  });
}

// ---------- 모달 ----------
const modal = $("#modal"), modalCard = $("#modalCard");
function closeModal() { modal.hidden = true; modalCard.innerHTML = ""; }
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
  const calc = () => { const h = +$("#rsHours").value; const sub = unit * h, total = sub + Math.round(sub * 0.05); $("#rsTotal").textContent = won(total) + "원"; return total; };
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

// 알림에서 채팅으로 바로 진입 (?chat=<bookingId>)
(function openChatFromURL() {
  const bid = new URLSearchParams(location.search).get("chat");
  if (bid) { const b = window.BOOKINGS.find(bid); if (b) openChat(b); }
})();

// ---------- 내 공간 삭제 ----------
document.addEventListener("click", (e) => {
  const d = e.target.closest("[data-delspace]"); if (!d) return;
  if (!confirm("이 공간을 삭제할까요? 되돌릴 수 없어요.")) return;
  let mine = []; try { mine = JSON.parse(localStorage.getItem("gi_spaces") || "[]"); } catch (x) {}
  mine = mine.filter((s) => s.id !== +d.dataset.delspace);
  localStorage.setItem("gi_spaces", JSON.stringify(mine));
  renderMine(); toast("공간을 삭제했어요");
});

// ---------- 정보 수정 ----------
$("#mpEdit").addEventListener("click", () => {
  modal.hidden = false;
  const u = window.AUTH.users().find((x) => x.userId === me) || {};
  modalCard.innerHTML = `
    <div class="modal__head"><b>정보 수정</b><button class="modal__x" data-mclose>✕</button></div>
    <div class="book__field"><label class="book__label">닉네임</label><input type="text" id="pfNick" value="${(u.nick || u.name || "").replace(/"/g, "&quot;")}" /></div>
    <div class="book__field"><label class="book__label">이메일</label><input type="email" id="pfEmail" value="${u.email || ""}" /></div>
    <div class="book__field"><label class="book__label">새 비밀번호 <span style="color:var(--faint);font-weight:500">(변경 시에만)</span></label><input type="password" id="pfPw" placeholder="••••••" /></div>
    <button class="btn btn--accent btn--block" id="pfSave">저장</button>`;
  $("#pfSave").addEventListener("click", () => {
    const nick = $("#pfNick").value.trim(), email = $("#pfEmail").value.trim(), pw = $("#pfPw").value;
    if (!nick) { toast("닉네임을 입력해주세요"); return; }
    const users = window.AUTH.users(); const i = users.findIndex((x) => x.userId === me);
    if (i >= 0) { users[i].nick = nick; users[i].name = nick; users[i].email = email; if (pw) users[i].pw = pw; window.AUTH.saveUsers(users); }
    window.AUTH.set(Object.assign({}, auth, { name: nick, email }));
    toast("저장되었어요"); setTimeout(() => location.reload(), 700);
  });
});

// ---------- 호스트: 공간 관리 (할인 · 가용성 · 예약설정) ----------
function renderManage() {
  const wrap = $("#discWrap"); if (!wrap) return;
  const rooms = getAllSpaces();
  wrap.innerHTML = `
    <div class="book__field"><label class="book__label">공간 선택</label><select id="mgRoom">${rooms.map((r) => `<option value="${r.id}">${r.name}</option>`).join("")}</select></div>

    <h3 class="mg-h">⚡ 반짝할인 · 🎟️ 쿠폰</h3>
    <div class="disc-grid">
      <div class="disc-card"><h3 class="disc-card__t">⚡ 반짝할인</h3>
        <label class="book__label">할인율 (%)</label><input type="number" id="dcFlashPct" min="0" max="70" placeholder="예: 20" />
        <div class="book__row"><div class="book__field"><label class="book__label">시작일</label><input type="date" id="dcFlashFrom" /></div><div class="book__field"><label class="book__label">종료일</label><input type="date" id="dcFlashTo" /></div></div>
      </div>
      <div class="disc-card"><h3 class="disc-card__t">🎟️ 쿠폰</h3>
        <label class="book__label">쿠폰 코드</label><input type="text" id="dcCoupCode" placeholder="예: WELCOME10" />
        <label class="book__label">할인율 (%)</label><input type="number" id="dcCoupPct" min="0" max="70" placeholder="예: 10" />
        <div class="book__row"><div class="book__field"><label class="book__label">시작일</label><input type="date" id="dcCoupFrom" /></div><div class="book__field"><label class="book__label">종료일</label><input type="date" id="dcCoupTo" /></div></div>
      </div>
    </div>
    <button class="btn btn--accent" id="dcSave">할인 저장</button>

    <h3 class="mg-h">🚫 가용성 차단</h3>
    <p class="mp__sub" style="margin-bottom:10px">예약을 받지 않을 날짜를 추가하세요. 상세 달력에서 자동 비활성됩니다.</p>
    <div class="book__row" style="align-items:flex-end">
      <div class="book__field" style="flex:1"><label class="book__label">차단할 날짜</label><input type="date" id="blkDate" min="${todayStr}" /></div>
      <button class="btn btn--soft" id="blkAdd">차단 추가</button>
    </div>
    <div class="blk-list" id="blkList"></div>

    <h3 class="mg-h">⚙️ 예약 설정</h3>
    <label class="mg-check"><input type="checkbox" id="stAuto" /><span>자동 수락 — 승인 없이 즉시 예약 확정</span></label>
    <div class="book__row">
      <div class="book__field"><label class="book__label">최소 시간</label><input type="number" id="stMin" min="1" max="12" /></div>
      <div class="book__field"><label class="book__label">최대 시간</label><input type="number" id="stMax" min="1" max="12" /></div>
      <div class="book__field"><label class="book__label">청소 버퍼(시간)</label><input type="number" id="stBuf" min="0" max="4" /></div>
    </div>
    <button class="btn btn--accent" id="stSave">설정 저장</button>
    <p class="hf-note" id="mgMsg"></p>`;

  const rid = () => +$("#mgRoom").value;
  const loadDisc = () => { const d = window.DISCOUNT.get(rid()), f = d.flash || {}, c = d.coupon || {}; $("#dcFlashPct").value = f.pct || ""; $("#dcFlashFrom").value = f.from || todayStr; $("#dcFlashTo").value = f.to || ""; $("#dcCoupCode").value = c.code || ""; $("#dcCoupPct").value = c.pct || ""; $("#dcCoupFrom").value = c.from || todayStr; $("#dcCoupTo").value = c.to || ""; };
  const loadBlk = () => { const l = window.BLOCKS.get(rid()).slice().sort(); $("#blkList").innerHTML = l.length ? l.map((d) => `<span class="blk-chip">${d}<button data-unblk="${d}">✕</button></span>`).join("") : `<span class="mp__sub">차단된 날짜가 없어요.</span>`; };
  const loadSet = () => { const s = window.SETTINGS.get(rid()); $("#stAuto").checked = !!s.autoAccept; $("#stMin").value = s.minH; $("#stMax").value = s.maxH; $("#stBuf").value = s.buffer; };
  ["dcFlashFrom", "dcFlashTo", "dcCoupFrom", "dcCoupTo", "blkDate"].forEach((id) => { const el = document.getElementById(id); if (el) el.min = todayStr; });
  $("#blkDate").value = todayStr;
  const loadAll = () => { loadDisc(); loadBlk(); loadSet(); };
  loadAll();
  $("#mgRoom").addEventListener("change", loadAll);
  $("#dcSave").addEventListener("click", () => {
    const flash = $("#dcFlashPct").value ? { pct: +$("#dcFlashPct").value, from: $("#dcFlashFrom").value, to: $("#dcFlashTo").value } : null;
    const coupon = ($("#dcCoupCode").value && $("#dcCoupPct").value) ? { code: $("#dcCoupCode").value.trim(), pct: +$("#dcCoupPct").value, from: $("#dcCoupFrom").value, to: $("#dcCoupTo").value } : null;
    window.DISCOUNT.set(rid(), { flash, coupon }); $("#mgMsg").textContent = "할인 저장됨 · 목록·상세에 반영됩니다."; toast("할인을 저장했어요");
  });
  $("#blkAdd").addEventListener("click", () => { const d = $("#blkDate").value; if (!d) return; if (!window.BLOCKS.has(rid(), d)) window.BLOCKS.toggle(rid(), d); loadBlk(); toast("날짜를 차단했어요"); });
  $("#blkList").addEventListener("click", (e) => { const x = e.target.closest("[data-unblk]"); if (!x) return; window.BLOCKS.toggle(rid(), x.dataset.unblk); loadBlk(); });
  $("#stSave").addEventListener("click", () => {
    window.SETTINGS.set(rid(), { autoAccept: $("#stAuto").checked, minH: Math.max(1, +$("#stMin").value || 1), maxH: Math.max(1, +$("#stMax").value || 8), buffer: Math.max(0, +$("#stBuf").value || 0) });
    $("#mgMsg").textContent = "예약 설정 저장됨"; toast("설정을 저장했어요");
  });
}
// ---------- 호스트: 정산 요약 ----------
function renderSettle() {
  const wrap = $("#settleWrap"); if (!wrap) return;
  const now = new Date(); const ym = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const mine = window.BOOKINGS.list().filter((b) => b.hostId === me);
  const monthC = mine.filter((b) => b.status === "confirmed" && (b.date || "").startsWith(ym));
  const gross = monthC.reduce((a, b) => a + Math.round(b.total / 1.05), 0);
  const fee = Math.round(gross * window.HOST_FEE), settle = gross - fee;
  const pending = mine.filter((b) => b.status === "requested").length;
  wrap.innerHTML = `
    <h2 class="sp-sec__title" style="margin-bottom:14px">${now.getMonth() + 1}월 정산 요약</h2>
    <div class="settle-kpis">
      <div class="settle-kpi"><strong>${monthC.length}건</strong><span>이번 달 확정</span></div>
      <div class="settle-kpi"><strong>${won(gross)}원</strong><span>총 매출</span></div>
      <div class="settle-kpi"><strong>-${won(fee)}원</strong><span>수수료 ${window.HOST_FEE * 100}%</span></div>
      <div class="settle-kpi settle-kpi--hl"><strong>${won(settle)}원</strong><span>예상 정산액</span></div>
    </div>
    <p class="mp__sub" style="margin-top:14px">승인 대기 ${pending}건 · 확정 예약만 매출·정산에 반영됩니다. (데모)</p>`;
}
if (isHost) { renderManage(); renderSettle(); }

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
