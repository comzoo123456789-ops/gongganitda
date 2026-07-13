// ============================================================
// 공간잇다 — 클라이언트 인증(데모) + 찜 + 헤더 주입
// ⚠️ 데모용 localStorage 저장 (실서비스는 서버 인증 필요)
// role: "guest"(일반) | "host"(호스트)
// ============================================================
window.AUTH = (function () {
  const SK = "gi_auth", UK = "gi_users";
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { return JSON.parse(d); } };
  // 데모 계정 시드
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

// 찜(위시리스트) — 기기 기준 localStorage
window.FAV = {
  KEY: "gi_liked",
  list: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  has: function (id) { return this.list().includes(+id); },
  toggle: function (id) {
    id = +id;
    let l = this.list();
    if (l.includes(id)) l = l.filter((x) => x !== id); else l.push(id);
    localStorage.setItem(this.KEY, JSON.stringify(l));
    return l.includes(id);
  },
};

// 예약 내역
window.BOOKINGS = {
  KEY: "gi_bookings",
  list: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  add: function (b) { const l = this.list(); l.unshift(b); localStorage.setItem(this.KEY, JSON.stringify(l)); },
};

// 헤더 인증 영역 주입 + 접근 가드
(function initHeaderAuth() {
  function apply() {
    const a = window.AUTH.get();
    document.querySelectorAll("[data-authbox]").forEach((box) => {
      if (a) {
        const tag = a.role === "host" ? "🏠" : "👤";
        box.innerHTML = `<a href="mypage.html" class="header__link">마이페이지</a><span class="auth-name">${tag} ${a.name}</span><a href="#" class="header__link" data-logout>로그아웃</a>`;
      } else {
        box.innerHTML = `<a href="login.html" class="header__link">로그인</a><a href="signup.html" class="btn btn--primary btn--sm">회원가입</a>`;
      }
    });
    const lo = document.querySelector("[data-logout]");
    if (lo) lo.addEventListener("click", (e) => { e.preventDefault(); window.AUTH.logout(); location.href = "index.html"; });

    // 로그인 필요 페이지 가드
    const req = document.body.getAttribute("data-require");
    if (req === "auth" && !a) { location.href = "login.html"; }
  }
  if (document.readyState !== "loading") apply();
  else document.addEventListener("DOMContentLoaded", apply);
})();
