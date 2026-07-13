// ============================================================
// 공간잇다 — 인증 + 찜 + 예약 + 알림 + 후기 + 채팅 + 로고/헤더 주입
// ⚠️ 데모용 localStorage (실서비스는 서버 인증·DB 필요)
// ============================================================
window.AUTH = (function () {
  const SK = "gi_auth", UK = "gi_users";
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { return JSON.parse(d); } };
  const seeded = read(UK, "[]");
  if (!seeded.length) {
    localStorage.setItem(UK, JSON.stringify([
      { userId: "guest", pw: "1234", nick: "손님", name: "손님", email: "guest@demo.kr", role: "guest" },
      { userId: "host", pw: "1234", nick: "사장", name: "사장", email: "host@demo.kr", role: "host" },
    ]));
  }
  return {
    users: () => read(UK, "[]"),
    saveUsers: (u) => localStorage.setItem(UK, JSON.stringify(u)),
    get: () => read(SK, "null"),
    set: (a) => localStorage.setItem(SK, JSON.stringify(a)),
    logout: () => localStorage.removeItem(SK),
    roleWord: (r) => (r === "host" ? "호스트" : "회원"),
    displayName: function (a) { a = a || this.get(); if (!a) return ""; const w = this.roleWord(a.role); const n = a.name || ""; return (n === w || n.endsWith(w)) ? n : `${n} ${w}`; },
  };
})();

window.FAV = {
  KEY: "gi_liked",
  list: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  has: function (id) { return this.list().includes(+id); },
  toggle: function (id) { id = +id; let l = this.list(); if (l.includes(id)) l = l.filter((x) => x !== id); else l.push(id); localStorage.setItem(this.KEY, JSON.stringify(l)); return l.includes(id); },
};

window.BOOKINGS = {
  KEY: "gi_bookings",
  list: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save: function (l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  add: function (b) { const l = this.list(); l.unshift(b); this.save(l); },
  find: function (id) { return this.list().find((b) => b.id === id); },
  update: function (id, patch) { const l = this.list(); const i = l.findIndex((b) => b.id === id); if (i >= 0) { l[i] = Object.assign({}, l[i], patch); this.save(l); } },
};

window.NOTIF = {
  KEY: "gi_notifs",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save: function (l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  list: function (user) { return this.all().filter((n) => n.forUser === user); },
  unread: function (user) { return this.list(user).filter((n) => !n.read).length; },
  add: function (n) { const l = this.all(); l.unshift(Object.assign({ id: Date.now() + "" + Math.floor(Math.random() * 1000), read: false, ts: Date.now() }, n)); this.save(l); if (window.refreshBell) window.refreshBell(); },
  markRead: function (user) { const l = this.all(); l.forEach((n) => { if (n.forUser === user) n.read = true; }); this.save(l); },
};

window.REVIEWS = {
  KEY: "gi_reviews",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  list: function (spaceId) { return this.all().filter((r) => r.spaceId === spaceId); },
  add: function (r) { const l = this.all(); l.unshift(Object.assign({ ts: Date.now() }, r)); localStorage.setItem(this.KEY, JSON.stringify(l)); },
};

window.CHAT = {
  KEY: "gi_chat", RKEY: "gi_chatread",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "{}"); } catch (e) { return {}; } },
  get: function (bid) { return this.all()[bid] || []; },
  send: function (bid, msg) { const a = this.all(); (a[bid] = a[bid] || []).push(Object.assign({ ts: Date.now() }, msg)); localStorage.setItem(this.KEY, JSON.stringify(a)); },
  reads: function () { try { return JSON.parse(localStorage.getItem(this.RKEY) || "{}"); } catch (e) { return {}; } },
  lastRead: function (user, bid) { const r = this.reads(); return (r[user] && r[user][bid]) || 0; },
  markRead: function (user, bid) { const r = this.reads(); (r[user] = r[user] || {})[bid] = Date.now(); localStorage.setItem(this.RKEY, JSON.stringify(r)); },
  unread: function (user, bid) { const lr = this.lastRead(user, bid); return this.get(bid).filter((m) => m.from !== user && m.ts > lr).length; },
};

// 할인 (반짝할인 + 쿠폰) — 호스트가 룸별로 설정
function _today() { const d = new Date(), p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }
window.DISCOUNT = {
  KEY: "gi_discounts",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "{}"); } catch (e) { return {}; } },
  get: function (sid) { return this.all()[sid] || {}; },
  set: function (sid, obj) { const a = this.all(); a[sid] = obj; localStorage.setItem(this.KEY, JSON.stringify(a)); },
  _active: function (d) { if (!d || !d.pct) return 0; const t = _today(); if (d.from && t < d.from) return 0; if (d.to && t > d.to) return 0; return +d.pct; },
  flashPct: function (sid) { return this._active(this.get(sid).flash); },
  coupon: function (sid) { return this.get(sid).coupon || null; },
  couponPct: function (sid, code) { const c = this.get(sid).coupon; if (!c || !c.pct || !code) return 0; if (code.trim().toUpperCase() !== (c.code || "").toUpperCase()) return 0; const t = _today(); if (c.from && t < c.from) return 0; if (c.to && t > c.to) return 0; return +c.pct; },
};
// 반짝할인 반영 가격
window.priceOf = function (s) { const pct = window.DISCOUNT.flashPct(s.id); return { pct, orig: s.price, price: pct ? Math.round(s.price * (100 - pct) / 100 / 100) * 100 : s.price }; };

// 가용성 차단(호스트가 특정 날짜를 예약 불가로)
window.BLOCKS = {
  KEY: "gi_blocks",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "{}"); } catch (e) { return {}; } },
  get: function (sid) { return this.all()[sid] || []; },
  has: function (sid, date) { return this.get(sid).indexOf(date) >= 0; },
  toggle: function (sid, date) { const a = this.all(); const l = a[sid] || []; const i = l.indexOf(date); if (i >= 0) l.splice(i, 1); else l.push(date); a[sid] = l; localStorage.setItem(this.KEY, JSON.stringify(a)); return l.indexOf(date) >= 0; },
};

// 예약 설정(자동수락·최소/최대시간·청소버퍼)
window.SETTINGS = {
  KEY: "gi_settings",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "{}"); } catch (e) { return {}; } },
  get: function (sid) { return Object.assign({ autoAccept: false, minH: 1, maxH: 8, buffer: 0 }, this.all()[sid] || {}); },
  set: function (sid, obj) { const a = this.all(); a[sid] = obj; localStorage.setItem(this.KEY, JSON.stringify(a)); },
};

// 정산 계산(호스트 수수료 10%)
window.HOST_FEE = 0.10;
window.settleOf = function (b) { const sub = Math.round(b.total / 1.05); return Math.round(sub * (1 - window.HOST_FEE)); };

// ---------- 로고/아이콘 ----------
const GI_SYMBOL = '<svg class="logo__mark" width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 6 C21 6 12 14.5 12 25 C12 36 22 42 32 54 C42 42 52 36 52 25 C52 14.5 43 6 32 6 Z" stroke="#211E1A" stroke-width="5" stroke-linejoin="round"/><circle cx="28" cy="24" r="4.6" fill="#4C93B8"/><circle cx="36" cy="24" r="4.6" fill="#D97852"/></svg>';
const BELL_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>';
window.timeago = function (ts) { const s = (Date.now() - ts) / 1000; if (s < 60) return "방금"; if (s < 3600) return Math.floor(s / 60) + "분 전"; if (s < 86400) return Math.floor(s / 3600) + "시간 전"; return Math.floor(s / 86400) + "일 전"; };

// ---------- 헤더/로고/알림 주입 + 가드 ----------
(function initUI() {
  function refreshBell() {
    const a = window.AUTH.get(); if (!a) return;
    const n = window.NOTIF.unread(a.userId);
    document.querySelectorAll(".bell__badge").forEach((b) => { b.textContent = n; b.hidden = n === 0; });
  }
  window.refreshBell = refreshBell;

  function apply() {
    document.querySelectorAll(".logo").forEach((l) => { l.innerHTML = GI_SYMBOL + '<span class="logo__wm">공간<em>잇다</em></span>'; });
    if (!document.querySelector('link[rel="icon"]')) {
      const link = document.createElement("link"); link.rel = "icon"; link.type = "image/svg+xml";
      link.href = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M32 6 C21 6 12 14.5 12 25 C12 36 22 42 32 54 C42 42 52 36 52 25 C52 14.5 43 6 32 6 Z" stroke="#211E1A" stroke-width="5" stroke-linejoin="round"/><circle cx="28" cy="24" r="4.6" fill="#4C93B8"/><circle cx="36" cy="24" r="4.6" fill="#D97852"/></svg>');
      document.head.appendChild(link);
    }

    const a = window.AUTH.get();

    // 찜한 공간에 반짝할인이 뜨면 알림(기기·유저별 1회)
    try {
      if (a && window.FAV) {
        const key = a.userId;
        const alerted = JSON.parse(localStorage.getItem("gi_favalert") || "{}"); alerted[key] = alerted[key] || {};
        const mine = (function () { try { return JSON.parse(localStorage.getItem("gi_spaces") || "[]"); } catch (e) { return []; } })();
        const pool = (typeof SPACES !== "undefined" ? SPACES : []).concat(mine);
        window.FAV.list().forEach((id) => {
          const pct = window.DISCOUNT.flashPct(id);
          const sp = pool.find((s) => s.id === id);
          if (pct && sp && !alerted[key][id]) { window.NOTIF.add({ forUser: a.userId, title: sp.name, sub: `⚡ 찜한 공간 반짝할인 ${pct}%`, link: "space.html?id=" + id }); alerted[key][id] = 1; }
          if (!pct && alerted[key][id]) delete alerted[key][id];
        });
        localStorage.setItem("gi_favalert", JSON.stringify(alerted));
      }
    } catch (e) {}

    // 호스트 전용 내비 — 일반회원에겐 숨김, 호스트에겐 '공간 등록'으로
    document.querySelectorAll(".js-host-nav").forEach((e) => { e.style.display = (!a || a.role === "host") ? "" : "none"; e.textContent = (a && a.role === "host") ? "공간 등록" : "호스트 등록"; });

    document.querySelectorAll("[data-authbox]").forEach((box) => {
      if (a) {
        const tag = a.role === "host" ? "🏠" : "👤";
        const un = window.NOTIF.unread(a.userId);
        box.innerHTML =
          `<div class="bell-wrap">
             <button class="bell" data-bell aria-label="알림">${BELL_SVG}<span class="bell__badge"${un ? "" : " hidden"}>${un}</span></button>
             <div class="bell-dd" data-belldd hidden></div>
           </div>
           <a href="mypage.html" class="header__link">마이페이지</a>
           <span class="auth-name">${tag} ${a.name} ${window.AUTH.roleWord(a.role)}</span>
           <a href="#" class="header__link" data-logout>로그아웃</a>`;
        wireBell(box, a);
      } else {
        box.innerHTML = `<a href="login.html" class="header__link">로그인</a><a href="signup.html" class="btn btn--primary btn--sm">회원가입</a>`;
      }
    });

    const lo = document.querySelector("[data-logout]");
    if (lo) lo.addEventListener("click", (e) => { e.preventDefault(); window.AUTH.logout(); location.href = "index.html"; });

    // 접근 가드
    const req = document.body.getAttribute("data-require");
    if (req === "auth" && !a) location.href = "login.html";
    if (req === "host" && (!a || a.role !== "host")) { alert("호스트 회원 전용입니다."); location.href = a ? "index.html" : "login.html"; }

    // 실시간 배지(다른 탭에서 알림 변화 시)
    window.addEventListener("storage", (e) => { if (e.key === window.NOTIF.KEY) refreshBell(); });
  }

  function wireBell(box, a) {
    const bell = box.querySelector("[data-bell]"), dd = box.querySelector("[data-belldd]");
    if (!bell) return;
    bell.addEventListener("click", (e) => {
      e.stopPropagation();
      if (dd.hasAttribute("hidden")) {
        const items = window.NOTIF.list(a.userId).slice(0, 12);
        dd.innerHTML = `<div class="bell-dd__t">알림</div>` + (items.length
          ? items.map((n) => `<a class="bell-item ${n.read ? "" : "is-unread"}" href="${n.link || "#"}">${n.title ? `<b class="bell-item__t">${n.title}</b><span class="bell-item__s">${n.sub || ""}</span>` : `<span class="bell-item__txt">${n.text || ""}</span>`}<time>${window.timeago(n.ts)}</time></a>`).join("")
          : `<div class="bell-empty">알림이 없어요</div>`);
        dd.removeAttribute("hidden");
        window.NOTIF.markRead(a.userId); refreshBell();
      } else dd.setAttribute("hidden", "");
    });
    document.addEventListener("click", () => dd.setAttribute("hidden", ""));
  }

  if (document.readyState !== "loading") apply();
  else document.addEventListener("DOMContentLoaded", apply);
})();
