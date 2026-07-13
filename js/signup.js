// 회원가입 (데모)
let role = "guest";
document.getElementById("suTabs").addEventListener("click", (e) => {
  const b = e.target.closest(".auth-tab"); if (!b) return;
  role = b.dataset.role;
  document.querySelectorAll(".auth-tab").forEach((t) => t.classList.toggle("is-active", t === b));
  document.getElementById("suHostHint").hidden = role !== "host";
});

document.getElementById("signupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("suName").value.trim();
  const userId = document.getElementById("suId").value.trim();
  const pw = document.getElementById("suPw").value;
  const email = document.getElementById("suEmail").value.trim();
  const err = document.getElementById("suErr");
  if (!name || !userId || !pw || !email) { err.textContent = "모든 항목을 입력해 주세요."; err.hidden = false; return; }
  const users = window.AUTH.users();
  if (users.some((u) => u.userId === userId)) { err.textContent = "이미 사용 중인 아이디입니다."; err.hidden = false; return; }
  users.push({ userId, pw, name, email, role });
  window.AUTH.saveUsers(users);
  window.AUTH.set({ userId, name, role, email });
  location.href = "mypage.html";
});
