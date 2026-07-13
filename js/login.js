// 로그인 (데모) — 회원/호스트 역할 탭
let loginRole = "guest";
document.getElementById("lgTabs").addEventListener("click", (e) => {
  const b = e.target.closest(".auth-tab"); if (!b) return;
  loginRole = b.dataset.role;
  document.querySelectorAll("#lgTabs .auth-tab").forEach((t) => t.classList.toggle("is-active", t === b));
});

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("lgId").value.trim();
  const pw = document.getElementById("lgPw").value;
  const err = document.getElementById("lgErr");
  const user = window.AUTH.users().find((u) => u.userId === id && u.pw === pw);
  if (!user) { err.textContent = "아이디 또는 비밀번호가 올바르지 않습니다."; err.hidden = false; return; }
  if (user.role !== loginRole) {
    err.textContent = `${window.AUTH.roleWord(loginRole)} 계정이 아닙니다. 상단에서 유형을 확인해 주세요.`;
    err.hidden = false; return;
  }
  window.AUTH.set({ userId: user.userId, name: user.nick || user.name, role: user.role, email: user.email });
  location.href = "mypage.html";
});
