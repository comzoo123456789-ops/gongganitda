// 로그인 (데모) — 통합 로그인: 아이디·비밀번호만 입력, 계정의 역할로 자동 분기
const lgTabs = document.getElementById("lgTabs"); if (lgTabs) lgTabs.style.display = "none"; // 역할 탭 제거(계정이 역할을 이미 가짐)

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("lgId").value.trim();
  const pw = document.getElementById("lgPw").value;
  const err = document.getElementById("lgErr");
  const user = window.AUTH.users().find((u) => u.userId === id);
  if (!user || !window.AUTH.checkPw(user, pw)) { err.textContent = "아이디 또는 비밀번호가 올바르지 않습니다."; err.hidden = false; return; }
  if (user._withdrawn) { err.textContent = "탈퇴한 계정입니다."; err.hidden = false; return; }
  window.AUTH.set({ userId: user.userId, name: user.nick || user.name, role: user.role, roles: user.roles || [user.role], email: user.email, serviceCats: user.serviceCats || [], region: user.region || "", phone: user.phone || "" });
  // 계정 역할에 따라 자동 분기
  location.href = user.role === "admin" ? "admin.html" : (user.role === "guest" ? "index.html" : "mypage.html?tab=dash");
});
