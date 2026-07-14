// ============================================================
// 공간잇다 — 견적 요청(역경매) 작성 + 매칭 업체 알림
// ============================================================
const $ = (s) => document.querySelector(s);
const auth = window.AUTH.get();
const pad = (n) => String(n).padStart(2, "0");
const today = new Date(); today.setHours(0, 0, 0, 0);
const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

const fmtD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const minStr = fmtD(new Date(today.getTime() + 14 * 86400000)); // 최소 2주 전 요청

$("#rqRegion").innerHTML = REGIONS.map((r) => `<option value="${r}">${r}</option>`).join("");
$("#rqSvc").innerHTML = SERVICES.map((s) => `<label class="hf-chk"><input type="checkbox" value="${s.id}" /><span>${s.label}</span></label>`).join("");
$("#rqDate").min = minStr; $("#rqDate").value = minStr;

// 수정 모드 (?id=) — 내 요청 불러오기
const editId = new URLSearchParams(location.search).get("id");
let editReq = editId ? window.REQUESTS.find(editId) : null;
if (editReq && editReq.memberId !== auth.userId) editReq = null;
if (editReq) {
  $("#rqTitle").textContent = "견적 요청 수정";
  $("#rqSubmit").textContent = "수정 저장";
  if (editReq.date < minStr) $("#rqDate").min = editReq.date; // 기존 날짜 유지 허용
  $("#rqDate").value = editReq.date;
  $("#rqRegion").value = editReq.region;
  $("#rqCap").value = editReq.capacity;
  $("#rqPark").value = editReq.parking || "";
  $("#rqBudget").value = editReq.budget || "";
  $("#rqDetail").value = editReq.detail || "";
  document.querySelectorAll("#rqSvc input").forEach((i) => { i.checked = (editReq.cats || []).includes(i.value); });
}

let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2400); }

$("#reqForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("#rqErr");
  const date = $("#rqDate").value, region = $("#rqRegion").value;
  const capacity = +$("#rqCap").value, parking = +$("#rqPark").value || 0;
  const cats = [...document.querySelectorAll("#rqSvc input:checked")].map((i) => i.value);
  if (!date || !region || !capacity) { err.textContent = "날짜·지역·인원을 입력해 주세요."; err.hidden = false; return; }
  if (!editReq && date < minStr) { err.textContent = "원활한 준비를 위해 이용일은 최소 2주 뒤로 선택해 주세요."; err.hidden = false; return; }
  if (!cats.length) { err.textContent = "필요한 서비스를 하나 이상 선택해 주세요."; err.hidden = false; return; }
  err.hidden = true;

  const deadline = fmtD(new Date(new Date(date).getTime() - 7 * 86400000)); // 이용 1주 전 = 선정·준비 마감
  const fields = { date, region, capacity, parking, cats, deadline, budget: $("#rqBudget").value.trim(), detail: $("#rqDetail").value.trim() };
  const catLabels = cats.map((c) => svcById(c).label).join("·");
  const vendors = window.AUTH.users().filter((u) => u.role === "vendor" && (u.serviceCats || []).some((c) => cats.includes(c)));

  if (editReq) {
    window.REQUESTS.update(editReq.id, fields);
    vendors.forEach((v) => window.NOTIF.add({ forUser: v.userId, title: "견적 요청이 수정됐어요 ✏️", sub: `${region} · ${date} · ${catLabels}`, link: "mypage.html?tab=vreq" }));
    toast("견적 요청을 수정했어요");
  } else {
    window.REQUESTS.add(Object.assign({ memberId: auth.userId, memberName: window.AUTH.displayName(auth) }, fields));
    vendors.forEach((v) => window.NOTIF.add({ forUser: v.userId, title: "새 견적 요청 📩", sub: `${region} · ${date} · ${catLabels}`, link: "mypage.html?tab=vreq" }));
    toast(`견적 요청 완료! ${vendors.length}개 업체에 전달됐어요`);
  }
  setTimeout(() => (location.href = "mypage.html?tab=rfp"), 1100);
});

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
