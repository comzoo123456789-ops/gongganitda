// 회원가입 (데모) — 일반 회원 전용

// 약관 본문은 공용 저장소 window.LEGAL(auth.js)로 이관됨 — 관리자 '이용 약관' 탭에서 편집/실시간 반영

// 약관 보기: 공용 뷰어(window.openLegal) + 전역 [data-legal] 핸들러(auth.js)가 처리

// ---------- 카카오 등 소셜 회원가입 모드 ----------
var socialPending = null;
try { if (new URLSearchParams(location.search).get("social")) { const sp = sessionStorage.getItem("gi_social_pending"); if (sp) socialPending = JSON.parse(sp); } } catch (e) {}
if (socialPending) {
  const t = document.querySelector(".auth-card__title"); if (t) t.textContent = "카카오로 회원가입";
  const s = document.querySelector(".auth-card__sub"); if (s) s.innerHTML = "카카오 계정으로 <b>공간잇다 신규 회원가입</b>이에요. 닉네임 확인 후 약관에 동의하면 가입이 완료됩니다.";
  const nickEl = document.getElementById("suNick"); if (nickEl) nickEl.value = socialPending.nickname || "";
  // 소셜은 아이디·비밀번호·이메일 입력 불필요 → 숨김
  ["suId", "suPw", "suEmail"].forEach((id) => { const el = document.getElementById(id); if (el) { const f = el.closest(".field"); if (f) f.style.display = "none"; el.removeAttribute("required"); } });
  const btn = document.querySelector("#signupForm button[type=submit]"); if (btn) btn.textContent = "카카오로 가입 완료";
}

// ---------- 회원가입 ----------
document.getElementById("signupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  // 소셜(카카오) 가입 — 기존 회원이 아니라 이 화면으로 온 경우
  if (socialPending) {
    const snick = (document.getElementById("suNick").value.trim()) || socialPending.nickname || "카카오회원";
    const sErr = document.getElementById("suErr");
    if (!document.getElementById("suAgree").checked) { sErr.textContent = "서비스 이용약관 및 개인정보 처리방침에 동의해 주세요."; sErr.hidden = false; document.getElementById("suAgreeWrap").classList.add("su-agree--err"); return; }
    const smktg = document.getElementById("suMktg").checked, snow = Date.now();
    const su = window.AUTH.socialUpsert(socialPending.provider, String(socialPending.id), snick, { photo: socialPending.image || "", marketing: smktg, marketingAt: smktg ? snow : 0, termsAgreedAt: snow });
    try { sessionStorage.removeItem("gi_social_pending"); } catch (x) {}
    if (window.POINTS && su) window.POINTS.add(su.userId, 3000, "신규가입 축하 포인트");
    location.href = "mypage.html";
    return;
  }
  const nick = document.getElementById("suNick").value.trim();
  const userId = document.getElementById("suId").value.trim();
  const pw = document.getElementById("suPw").value;
  const email = document.getElementById("suEmail").value.trim();
  const agree = document.getElementById("suAgree").checked;
  const mktg = document.getElementById("suMktg").checked;
  const err = document.getElementById("suErr");
  if (!nick || !userId || !pw || !email) { err.textContent = "모든 항목을 입력해 주세요."; err.hidden = false; return; }
  if (!(window.PWCHECK ? window.PWCHECK(pw) : pw.length >= 8)) { err.textContent = "비밀번호는 " + (window.PW_RULE || "영문·숫자·특수문자 포함 8자 이상") + "로 설정해 주세요."; err.hidden = false; return; }
  if (!agree) {
    err.textContent = "서비스 이용약관 및 개인정보 처리방침에 동의해 주세요."; err.hidden = false;
    document.getElementById("suAgreeWrap").classList.add("su-agree--err");
    return;
  }
  const users = window.AUTH.users();
  if (users.some((u) => u.userId === userId)) { err.textContent = "이미 사용 중인 아이디입니다."; err.hidden = false; return; }
  const now = Date.now();
  const u = { userId, pwHash: window.AUTH.hashPw(pw), nick, name: nick, email, role: "guest", marketing: mktg, marketingAt: mktg ? now : 0, termsAgreedAt: now };
  users.push(u);
  window.AUTH.saveUsers(users);
  window.AUTH.set({ userId, name: nick, role: "guest", email });
  if (window.POINTS) window.POINTS.add(userId, 3000, "신규가입 축하 포인트");
  location.href = "index.html";
});

// 체크 시 에러 표시 해제
document.getElementById("suAgree").addEventListener("change", (e) => {
  if (e.target.checked) document.getElementById("suAgreeWrap").classList.remove("su-agree--err");
});
// 비밀번호 복잡도 실시간 안내
(function () {
  const pwEl = document.getElementById("suPw"), hint = document.getElementById("suPwHint"); if (!pwEl || !hint) return;
  pwEl.addEventListener("input", () => {
    const v = pwEl.value, ok = window.PWCHECK ? window.PWCHECK(v) : v.length >= 8;
    hint.textContent = !v ? "영문·숫자·특수문자를 모두 포함해 8자 이상 입력하세요." : (ok ? "✓ 사용 가능한 비밀번호예요." : "영문·숫자·특수문자를 모두 포함해 8자 이상이어야 해요.");
    hint.classList.toggle("field__hint--ok", ok && !!v);
    hint.classList.toggle("field__hint--no", !ok && !!v);
  });
})();
