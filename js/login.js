// 로그인 (데모)
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("lgId").value.trim();
  const pw = document.getElementById("lgPw").value;
  const err = document.getElementById("lgErr");
  const user = window.AUTH.users().find((u) => u.userId === id && u.pw === pw);
  if (!user) {
    err.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
    err.hidden = false;
    return;
  }
  window.AUTH.set({ userId: user.userId, name: user.name, role: user.role, email: user.email });
  location.href = "mypage.html";
});
