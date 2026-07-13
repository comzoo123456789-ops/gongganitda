// 회원가입 (데모) — 닉네임 + 역할(회원·호스트·업체)
let role = "guest";
// 업체 서비스 카테고리 · 지역 채우기
document.getElementById("suSvc").innerHTML = SERVICES.map((s) => `<label class="hf-chk"><input type="checkbox" value="${s.id}" /><span>${s.label}</span></label>`).join("");
document.getElementById("suRegion").innerHTML = `<option value="서울">서울</option>` + REGIONS.filter((r) => r !== "서울").map((r) => `<option value="${r}">${r}</option>`).join("");

document.getElementById("suTabs").addEventListener("click", (e) => {
  const b = e.target.closest(".auth-tab"); if (!b) return;
  role = b.dataset.role;
  document.querySelectorAll("#suTabs .auth-tab").forEach((t) => t.classList.toggle("is-active", t === b));
  document.getElementById("suHostHint").hidden = role !== "host";
  document.getElementById("suVendor").hidden = role !== "vendor";
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
  const u = { userId, pw, nick, name: nick, email, role };
  if (role === "vendor") {
    const cats = [...document.querySelectorAll("#suSvc input:checked")].map((i) => i.value);
    if (!cats.length) { err.textContent = "제공 서비스를 하나 이상 선택해 주세요."; err.hidden = false; return; }
    u.serviceCats = cats;
    u.region = document.getElementById("suRegion").value;
  }
  users.push(u);
  window.AUTH.saveUsers(users);
  window.AUTH.set({ userId, name: nick, role, email });
  location.href = "mypage.html";
});
