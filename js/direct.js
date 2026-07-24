// ============================================================
// 공간잇다 — 파트너 1:1 직접 견적 요청 (견적 요청과 별개)
// ============================================================
const $ = (s) => document.querySelector(s);
const auth = window.AUTH.get();
const pad = (n) => String(n).padStart(2, "0");
const won = (n) => (+n || 0).toLocaleString("ko-KR");
const today = new Date(); today.setHours(0, 0, 0, 0);
const fmtD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = fmtD(today);
const calcDeadline = (dateStr) => fmtD(new Date(Math.max(today.getTime(), new Date(dateStr).getTime() - 3 * 86400000)));

// 일반 회원 전용 — 파트너/호스트/관리자는 경쟁사 연락처 열람·회원요청 불가
if (auth && auth.role !== "guest") {
  const m = document.querySelector("main");
  if (m) m.innerHTML = '<div class="hostreg" style="text-align:center;padding:80px 20px"><h1 class="hostreg__title">일반 회원 전용</h1><p class="hostreg__sub">파트너 직접 견적 요청은 일반 회원만 이용할 수 있어요.</p><a class="btn btn--accent btn--lg" href="vendors.html" style="margin-top:18px;display:inline-block">맞춤 업체 둘러보기 →</a></div>';
  throw new Error("guest-only");
}

$("#dqRegion").innerHTML = REGIONS.map((r) => `<option value="${r}">${r}</option>`).join("");
$("#dqDate").min = todayStr; $("#dqDate").value = todayStr;

// 대상 파트너
const vendorId = new URLSearchParams(location.search).get("vendor");
const vendor = (window.AUTH.users() || []).find((u) => u.userId === vendorId && u.role === "vendor");
if (!vendor) { $("#dqForm").innerHTML = '<p class="hf-err" style="display:block">파트너를 찾을 수 없어요. <a href="vendors.html" style="color:var(--accent);font-weight:700">맞춤 찾기로 돌아가기</a></p>'; }
const cat = vendor ? (vendor.serviceCats || [])[0] : null;

if (vendor) {
  const c = reqCatById(cat);
  const sc = window.VREVIEWS.scoreOf(vendor.userId), cnt = window.VREVIEWS.countOf(vendor.userId);
  const img = (vendor.photos && vendor.photos[0]) || "";
  if (vendor.region) { const reg = REGIONS.find((r) => (vendor.region || "").includes(r) || (vendor.addr || "").includes(r)); if (reg) $("#dqRegion").value = reg; }
  $("#dqVendor").hidden = false;
  $("#dqVendor").innerHTML = `<div class="rq-venue__thumb" style="background:${c.tint || "#eee"}">${img ? `<img src="${img}" alt="" onerror="this.remove()" />` : ""}</div>
    <div class="rq-venue__body"><span class="rq-venue__tag">${c.label} 전문</span><b>${vendor.nick}</b><div class="rq-venue__meta">${vendor.addr || "서울"}${vendor.phone ? ` · ${vendor.phone}` : ""} · ${sc ? `★ ${sc.toFixed(1)} (${cnt})` : "신규"}</div>${vendor.intro ? `<div class="rq-venue__slot" style="font-weight:500;color:var(--muted)">${vendor.intro}</div>` : ""}</div>`;
}

const budgetHint = () => { const v = +$("#dqBudget").value; $("#dqBudgetHint").textContent = v ? `${won(v)}원` : "비워두면 예산 제한 없이 견적을 받아요."; };
$("#dqBudget").addEventListener("input", budgetHint); budgetHint();

let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2400); }

$("#dqForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!vendor) return;
  const err = $("#dqErr");
  const date = $("#dqDate").value, region = $("#dqRegion").value, detail = $("#dqDetail").value.trim();
  const phone = $("#dqPhone").value.trim();
  if (!date || !region) { err.textContent = "이용 날짜와 지역을 입력해 주세요."; err.hidden = false; return; }
  if (!phone) { err.textContent = "파트너가 연락할 휴대폰 번호를 입력해 주세요."; err.hidden = false; return; }
  if (!detail) { err.textContent = "요청 사항을 입력해 주세요."; err.hidden = false; return; }
  if ($("#dqConsent") && !$("#dqConsent").checked) { $("#dqConsentWrap").classList.add("co-consent--err"); err.textContent = "개인정보 제3자 제공 동의가 필요해요."; err.hidden = false; return; }
  if (window.CONSENT && auth) window.CONSENT.record(auth.userId, "3rdparty:direct", vendor.nick);
  err.hidden = true;

  window.REQUESTS.add({
    type: "direct", directVendorId: vendor.userId, directVendorName: vendor.nick,
    memberId: auth.userId, memberName: window.AUTH.displayName(auth), memberPhone: phone,
    cats: [cat], date, region, capacity: 0, deadline: calcDeadline(date),
    budget: +$("#dqBudget").value || 0, detail, catNotes: {},
  });
  window.NOTIF.add({ forUser: vendor.userId, title: "새 1:1 견적 요청", sub: `${region} · ${date} · ${reqCatById(cat).label}`, link: "mypage.html?tab=vreq" });
  toast(`${vendor.nick}에 견적을 요청했어요`);
  setTimeout(() => (location.href = "mypage.html?tab=rfp"), 1100);
});

const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
