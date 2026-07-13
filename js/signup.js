// 회원가입 (데모) — 닉네임 + 역할
let role = "guest";
document.getElementById("suTabs").addEventListener("click", (e) => {
  const b = e.target.closest(".auth-tab"); if (!b) return;
  role = b.dataset.role;
  document.querySelectorAll("#suTabs .auth-tab").forEach((t) => t.classList.toggle("is-active", t === b));
  document.getElementById("suHostHint").hidden = role !== "host";
});

document.getElementById("signupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const nick = document.getElementById("suNick").value.trim();
  const userId = document.getElementById("suId").value.trim();
  const pw = document.getElementById("suPw").value;
  const email = document.getElementById("suEmail").value.trim();
  const err = document.getElementById("suErr");
  if (!nick || !userId || !pw || !email) { err.textContent = "모든 항목을 입력해 주세요."; err.hidden = false; return; }
  const users = window.AUTH.users();
  if (users.some((u) => u.userId === userId)) { err.textContent = "이미 사용 중인 아이디입니다."; err.hidden = false; return; }
  users.push({ userId, pw, nick, name: nick, email, role });
  window.AUTH.saveUsers(users);
  window.AUTH.set({ userId, name: nick, role, email });
  location.href = "mypage.html";
});
