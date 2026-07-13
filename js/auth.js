// ============================================================
// 공간잇다 — 인증(데모) + 찜 + 예약 + 알림 + 로고/헤더 주입
// ⚠️ 데모용 localStorage (실서비스는 서버 인증·DB 필요)
// ============================================================
window.AUTH = (function () {
  const SK = "gi_auth", UK = "gi_users";
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { return JSON.parse(d); } };
  const seeded = read(UK, "[]");
  if (!seeded.length) {
    localStorage.setItem(UK, JSON.stringify([
      { userId: "guest", pw: "1234", name: "게스트", email: "guest@demo.kr", role: "guest" },
      { userId: "host", pw: "1234", name: "호스트", email: "host@demo.kr", role: "host" },
    ]));
  }
  return {
    users: () => read(UK, "[]"),
    saveUsers: (u) => localStorage.setItem(UK, JSON.stringify(u)),
    get: () => read(SK, "null"),
    set: (a) => localStorage.setItem(SK, JSON.stringify(a)),
    logout: () => localStorage.removeItem(SK),
    isLoggedIn: function () { return !!this.get(); },
    isHost: function () { const a = this.get(); return !!(a && a.role === "host"); },
  };
})();

// 찜
window.FAV = {
  KEY: "gi_liked",
  list: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  has: function (id) { return this.list().includes(+id); },
  toggle: function (id) { id = +id; let l = this.list(); if (l.includes(id)) l = l.filter((x) => x !== id); else l.push(id); localStorage.setItem(this.KEY, JSON.stringify(l)); return l.includes(id); },
};

// 예약
window.BOOKINGS = {
  KEY: "gi_bookings",
  list: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save: function (l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  add: function (b) { const l = this.list(); l.unshift(b); this.save(l); },
  update: function (id, patch) { const l = this.list(); const i = l.findIndex((b) => b.id === id); if (i >= 0) { l[i] = Object.assign({}, l[i], patch); this.save(l); } },
};

// 알림
window.NOTIF = {
  KEY: "gi_notifs",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save: function (l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  list: function (user) { return this.all().filter((n) => n.forUser === user); },
  unread: function (user) { return this.list(user).filter((n) => !n.read).length; },
  add: function (n) { const l = this.all(); l.unshift(Object.assign({ id: Date.now() + "" + Math.floor(Math.random() * 1000), read: false, ts: Date.now() }, n)); this.save(l); },
  markRead: function (user) { const l = this.all(); l.forEach((n) => { if (n.forUser === user) n.read = true; }); this.save(l); },
};

// ---------- 로고 심볼 ----------
const GI_SYMBOL = '<svg class="logo__mark" width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 6 C21 6 12 14.5 12 25 C12 36 22 42 32 54 C42 42 52 36 52 25 C52 14.5 43 6 32 6 Z" stroke="#211E1A" stroke-width="5" stroke-linejoin="round"/><circle cx="28" cy="24" r="4.6" fill="#4C93B8"/><circle cx="36" cy="24" r="4.6" fill="#D97852"/></svg>';
const BELL_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>';
function timeago(ts) { const s = (Date.now() - ts) / 1000; if (s < 60) return "방금"; if (s < 3600) return Math.floor(s / 60) + "분 전"; if (s < 86400) return Math.floor(s / 3600) + "시간 전"; return Math.floor(s / 86400) + "일 전"; }

// ---------- 헤더/로고/알림 주입 + 가드 ----------
(function initUI() {
  function apply() {
    // 로고
    document.querySelectorAll(".logo").forEach((l) => { l.innerHTML = GI_SYMBOL + '<span class="logo__wm">공간<em>잇다</em></span>'; });
    // 파비콘
    if (!document.querySelector('link[rel="icon"]')) {
      const link = document.createElement("link"); link.rel = "icon"; link.type = "image/svg+xml";
      link.href = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M32 6 C21 6 12 14.5 12 25 C12 36 22 42 32 54 C42 42 52 36 52 25 C52 14.5 43 6 32 6 Z" stroke="#211E1A" stroke-width="5" stroke-linejoin="round"/><circle cx="28" cy="24" r="4.6" fill="#4C93B8"/><circle cx="36" cy="24" r="4.6" fill="#D97852"/></svg>');
      document.head.appendChild(link);
    }

    const a = window.AUTH.get();
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
           <span class="auth-name">${tag} ${a.name}</span>
           <a href="#" class="header__link" data-logout>로그아웃</a>`;
        wireBell(box, a);
      } else {
        box.innerHTML = `<a href="login.html" class="header__link">로그인</a><a href="signup.html" class="btn btn--primary btn--sm">회원가입</a>`;
      }
    });

    const lo = document.querySelector("[data-logout]");
    if (lo) lo.addEventListener("click", (e) => { e.preventDefault(); window.AUTH.logout(); location.href = "index.html"; });

    const req = document.body.getAttribute("data-require");
    if (req === "auth" && !a) location.href = "login.html";
  }

  function wireBell(box, a) {
    const bell = box.querySelector("[data-bell]"), dd = box.querySelector("[data-belldd]");
    if (!bell) return;
    bell.addEventListener("click", (e) => {
      e.stopPropagation();
      const opening = dd.hasAttribute("hidden");
      if (opening) {
        const items = window.NOTIF.list(a.userId).slice(0, 12);
        dd.innerHTML = `<div class="bell-dd__t">알림</div>` + (items.length
          ? items.map((n) => `<a class="bell-item ${n.read ? "" : "is-unread"}" href="${n.link || "#"}"><span>${n.text}</span><time>${timeago(n.ts)}</time></a>`).join("")
          : `<div class="bell-empty">알림이 없어요</div>`);
        dd.removeAttribute("hidden");
        window.NOTIF.markRead(a.userId);
        const badge = box.querySelector(".bell__badge"); if (badge) { badge.hidden = true; }
      } else dd.setAttribute("hidden", "");
    });
    document.addEventListener("click", () => dd.setAttribute("hidden", ""));
  }

  if (document.readyState !== "loading") apply();
  else document.addEventListener("DOMContentLoaded", apply);
})();
