// ============================================================
// 공간잇다 — 견적 요청(역경매) 작성 + 매칭 업체 알림
// ============================================================
const $ = (s) => document.querySelector(s);
const auth = window.AUTH.get();
const pad = (n) => String(n).padStart(2, "0");
const today = new Date(); today.setHours(0, 0, 0, 0);
const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

$("#rqRegion").innerHTML = REGIONS.map((r) => `<option value="${r}">${r}</option>`).join("");
$("#rqSvc").innerHTML = SERVICES.map((s) => `<label class="hf-chk"><input type="checkbox" value="${s.id}" /><span>${s.label}</span></label>`).join("");
$("#rqDate").min = todayStr; $("#rqDate").value = todayStr;

let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2400); }

$("#reqForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("#rqErr");
  const date = $("#rqDate").value, region = $("#rqRegion").value;
  const capacity = +$("#rqCap").value, parking = +$("#rqPark").value || 0;
  const cats = [...document.querySelectorAll("#rqSvc input:checked")].map((i) => i.value);
  if (!date || !region || !capacity) { err.textContent = "날짜·지역·인원을 입력해 주세요."; err.hidden = false; return; }
  if (!cats.length) { err.textContent = "필요한 서비스를 하나 이상 선택해 주세요."; err.hidden = false; return; }
  err.hidden = true;

  const req = {
    memberId: auth.userId, memberName: window.AUTH.displayName(auth),
    date, region, capacity, parking, cats,
    budget: $("#rqBudget").value.trim(), detail: $("#rqDetail").value.trim(),
  };
  window.REQUESTS.add(req);
  const rid = window.REQUESTS.list()[0].id;

  // 매칭 업체에게 일괄 알림
  const catLabels = cats.map((c) => svcById(c).label).join("·");
  const vendors = window.AUTH.users().filter((u) => u.role === "vendor" && (u.serviceCats || []).some((c) => cats.includes(c)));
  vendors.forEach((v) => window.NOTIF.add({ forUser: v.userId, title: "새 견적 요청 📩", sub: `${region} · ${date} · ${catLabels}`, link: "mypage.html?tab=vreq" }));

  toast(`견적 요청 완료! ${vendors.length}개 업체에 전달됐어요`);
  setTimeout(() => (location.href = "mypage.html?tab=rfp"), 1100);
});

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
