// ============================================================
// 공간잇다 — 카카오 간편로그인 (프론트)
//  흐름: [카카오로 시작하기] → Kakao.Auth.authorize(redirectUri=/oauth/kakao)
//        → 카카오 로그인창 → Worker(/oauth/kakao)가 토큰 교환 + 프로필 조회
//        → /login?kko=<base64url(json)> 로 리다이렉트 → 아래 콜백이 세션 생성
//  필요한 값: window.KAKAO_JS_KEY (config.js) · Worker의 KAKAO_REST_KEY(+CLIENT_SECRET)
// ============================================================
(function () {
  var KEY = window.KAKAO_JS_KEY || "";
  var SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";

  // UTF-8 안전 base64url 디코드 (한글 닉네임 대응)
  function fromB64url(s) {
    try {
      s = String(s).replace(/-/g, "+").replace(/_/g, "/");
      while (s.length % 4) s += "=";
      var bin = atob(s), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    } catch (e) { return ""; }
  }

  // 1) 콜백 처리 — Worker가 프로필을 ?kko= 로 실어 되돌려보냄
  try {
    var qs = new URLSearchParams(location.search);
    var kko = qs.get("kko"), kerr = qs.get("kko_err");
    if (kko && window.AUTH) {
      var p = JSON.parse(fromB64url(kko) || "{}");
      if (p && p.id) {
        var found = AUTH.socialFind ? AUTH.socialFind("kakao", String(p.id)) : null;
        if (found) { AUTH.set(found); location.replace("mypage.html"); return; } // 기존 회원 → 로그인
        // 신규(또는 탈퇴 후) → 회원가입 화면으로 (자동 가입·로그인 안 함)
        try { sessionStorage.setItem("gi_social_pending", JSON.stringify({ provider: "kakao", id: p.id, nickname: p.nickname || "", image: p.image || "" })); } catch (e2) {}
        location.replace("signup.html?social=kakao");
        return;
      }
    }
    if (kerr) {
      var msg = { no_code: "인가 코드를 받지 못했어요", token: "토큰 발급 실패", exception: "서버 오류", no_rest_key: "서버에 REST 키 미설정" }[kerr] || kerr;
      var detail = qs.get("kko_detail");
      setTimeout(function () { alert("카카오 로그인에 실패했어요: " + msg + (detail ? "\n\n[상세] " + detail : "")); }, 60);
    }
  } catch (e) {}

  // 2) SDK 로드 후 로그인창 이동
  function loadSdk(cb) {
    if (window.Kakao) return cb();
    var sc = document.createElement("script");
    sc.src = SDK_SRC; sc.async = true;
    sc.onload = cb;
    sc.onerror = function () { alert("카카오 SDK를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."); };
    document.head.appendChild(sc);
  }

  window.kakaoLogin = function () {
    if (!KEY) { alert("카카오 로그인 준비 중이에요. (관리자: JavaScript 키 미설정)"); return; }
    loadSdk(function () {
      try {
        if (!Kakao.isInitialized()) Kakao.init(KEY);
        Kakao.Auth.authorize({
          redirectUri: location.origin + "/oauth/kakao",
          scope: "profile_nickname,profile_image",
        });
      } catch (e) { alert("카카오 로그인을 시작할 수 없어요: " + (e && e.message ? e.message : e)); }
    });
  };

  // 3) 버튼 렌더 — [data-kakao-login] 자리에 버튼 주입 (키 없으면 숨김)
  function renderButtons() {
    document.querySelectorAll("[data-kakao-login]").forEach(function (slot) {
      if (!KEY) { slot.hidden = true; return; }
      slot.hidden = false;
      slot.innerHTML =
        '<div class="social-div"><span>또는</span></div>' +
        '<button type="button" class="btn btn--kakao btn--lg btn--block" id="kakaoBtn">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.2 4.7 6.6-.2.7-.7 2.6-.8 3-.1.5.2.5.4.4.2-.1 2.6-1.8 3.6-2.5.7.1 1.4.2 2.1.2 5.5 0 10-3.5 10-7.7C22 6.5 17.5 3 12 3Z"/></svg>' +
        '카카오로 시작하기</button>';
      var b = slot.querySelector("#kakaoBtn");
      if (b) b.addEventListener("click", window.kakaoLogin);
    });
  }
  if (document.readyState !== "loading") renderButtons();
  else document.addEventListener("DOMContentLoaded", renderButtons);
})();
