// ============================================================
// 공간잇다 — 사업자 등록 (호스트 / 파트너) + 서류 제출 (데모)
// ============================================================
const $ = (s) => document.querySelector(s);
const activeRoles = () => [$("#bzRoleHost").checked && "host", $("#bzRoleVendor").checked && "vendor"].filter(Boolean);

$("#bzRegion").innerHTML = REGIONS.map((r) => `<option value="${r}">${r}</option>`).join("");
// 파트너: 제공 서비스 1개 (라디오)
$("#bzSvc").innerHTML = SERVICES.map((s) => `<label class="hf-chk"><input type="radio" name="bzsvc" value="${s.id}" /><span>${iconSVG(s.icon, 16)} ${s.label}</span></label>`).join("");

// ── 제출 서류 정의 (역할별) ──
const DOCS = {
  host: [
    { key: "bizreg", label: "사업자등록증", req: true },
    { key: "photo", label: "공간·건물 사진", req: false },
  ],
  vendor: [
    { key: "bizreg", label: "사업자등록증", req: true },
    { key: "port", label: "포트폴리오 / 회사 소개서", req: false },
  ],
};
const docState = {}; // key -> [{name,url}]
// 선택 역할들의 서류를 합집합(중복 key 제거)으로
function activeDocs() {
  const rs = activeRoles(), seen = {}, out = [];
  (rs.length ? rs : ["host"]).forEach((r) => (DOCS[r] || []).forEach((d) => { if (!seen[d.key]) { seen[d.key] = 1; out.push(d); } }));
  return out;
}
function downscale(file, cb) {
  if (!/^image\//.test(file.type)) { cb(null); return; }
  const rd = new FileReader(); rd.onload = () => { const img = new Image(); img.onload = () => { let w = img.width, h = img.height, m = 720; if (w > m || h > m) { if (w > h) { h = Math.round(h * m / w); w = m; } else { w = Math.round(w * m / h); h = m; } } const cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").drawImage(img, 0, 0, w, h); try { cb(cv.toDataURL("image/jpeg", 0.7)); } catch (e) { cb(null); } }; img.onerror = () => cb(null); img.src = rd.result; }; rd.readAsDataURL(file);
}
// 이미지는 리사이즈, PDF 등은 그대로 dataURL
function readFile(file, cb) { if (/^image\//.test(file.type)) downscale(file, cb); else { const rd = new FileReader(); rd.onload = () => cb(rd.result); rd.onerror = () => cb(null); rd.readAsDataURL(file); } }
function addFiles(key, fileList) {
  const st = docState[key] || (docState[key] = []);
  [...fileList].filter((f) => /^image\//.test(f.type) || /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name)).slice(0, 5).forEach((f) => readFile(f, (url) => {
    st.push({ name: f.name, url });
    const wrap = document.querySelector(`.bz-doc[data-doc="${key}"] .rqn__files`);
    if (wrap) wrap.innerHTML = st.map((x, i) => fileChip(key, x, i)).join("");
  }));
}
function fileChip(key, f, i) {
  return (f.url && /^data:image/.test(f.url))
    ? `<span class="rqn-file"><img src="${f.url}" alt="" /><button type="button" data-delfile="${key}|${i}">✕</button></span>`
    : `<span class="rqn-file rqn-file--doc">📄 <span>${f.name}</span><button type="button" data-delfile="${key}|${i}">✕</button></span>`;
}
function renderDocs() {
  $("#bzDocs").innerHTML = activeDocs().map((d) => {
    const files = docState[d.key] || (docState[d.key] = []);
    return `<div class="bz-doc" data-doc="${d.key}">
      <div class="bz-doc__head"><b>${d.label}</b>${d.req ? '<span class="bz-doc__req">필수</span>' : '<span class="bz-doc__opt">선택</span>'}</div>
      <div class="dropzone dropzone--sm" data-dz="${d.key}" tabindex="0" role="button" aria-label="${d.label} 업로드">
        <input type="file" data-file="${d.key}" accept="image/*,.pdf,application/pdf" multiple hidden />
        <span class="dropzone__ic">⬆️</span>
        <span class="dropzone__t">파일을 끌어다 놓거나 <b>클릭해 업로드</b></span>
        <span class="dropzone__s">JPG · PNG · PDF</span>
      </div>
      <div class="rqn__files">${files.map((f, i) => fileChip(d.key, f, i)).join("")}</div>
    </div>`;
  }).join("");
}
// 파일 선택(input)
$("#bzDocs").addEventListener("change", (e) => { const fi = e.target.closest("[data-file]"); if (!fi) return; addFiles(fi.dataset.file, fi.files); fi.value = ""; });
// 클릭 → 파일창 열기 / ✕ 삭제
$("#bzDocs").addEventListener("click", (e) => {
  const del = e.target.closest("[data-delfile]");
  if (del) { const [key, i] = del.dataset.delfile.split("|"); docState[key].splice(+i, 1); const wrap = document.querySelector(`.bz-doc[data-doc="${key}"] .rqn__files`); if (wrap) wrap.innerHTML = docState[key].map((x, k) => fileChip(key, x, k)).join(""); return; }
  const dz = e.target.closest(".dropzone"); if (dz) { const inp = dz.querySelector("[data-file]"); if (inp) inp.click(); }
});
// 드래그 앤 드롭
["dragenter", "dragover"].forEach((ev) => $("#bzDocs").addEventListener(ev, (e) => { const dz = e.target.closest(".dropzone"); if (dz) { e.preventDefault(); dz.classList.add("is-over"); } }));
$("#bzDocs").addEventListener("dragleave", (e) => { const dz = e.target.closest(".dropzone"); if (dz && !dz.contains(e.relatedTarget)) dz.classList.remove("is-over"); });
$("#bzDocs").addEventListener("drop", (e) => { const dz = e.target.closest(".dropzone"); if (!dz) return; e.preventDefault(); dz.classList.remove("is-over"); if (e.dataTransfer && e.dataTransfer.files) addFiles(dz.dataset.dz, e.dataTransfer.files); });

// ── 가입 유형(다중) ──
function applyRoles() {
  const rs = activeRoles(), vendor = rs.includes("vendor"), host = rs.includes("host");
  $("#bzSvcWrap").hidden = !vendor;
  $("#bzHostHint").hidden = !host;
  $("#bzNameLbl").innerHTML = (vendor && !host) ? "파트너명 (상호) <i>*</i>" : "상호 (사업자명) <i>*</i>";
  $("#bzName").placeholder = (vendor && !host) ? "예: 와일리 케이터링" : "예: 와일리 스튜디오";
  renderDocs();
}
$("#bzRoles").addEventListener("change", applyRoles);
applyRoles();

// ── 우편번호 검색 (카카오/다음 주소 API) ──
$("#bzAddrBtn").addEventListener("click", () => {
  if (window.daum && daum.Postcode) {
    new daum.Postcode({
      oncomplete: (d) => {
        $("#bzAddr").value = d.roadAddress || d.jibunAddress || d.address;
        const sido = d.sido || "";
        const reg = REGIONS.find((r) => sido.indexOf(r) >= 0);
        if (reg) $("#bzRegion").value = reg;
        $("#bzAddrDetail").focus();
      },
    }).open();
  } else { $("#bzAddr").readOnly = false; $("#bzAddr").placeholder = "주소를 직접 입력해 주세요"; $("#bzAddr").focus(); }
});

// ── 자동 포맷터 (사업자번호 000-00-00000 · 연락처 010-0000-0000) ──
$("#bzNo").addEventListener("input", (e) => { let n = e.target.value.replace(/\D/g, "").slice(0, 10); e.target.value = n.length < 4 ? n : n.length < 6 ? `${n.slice(0, 3)}-${n.slice(3)}` : `${n.slice(0, 3)}-${n.slice(3, 5)}-${n.slice(5)}`; });
$("#bzPhone").addEventListener("input", (e) => { let n = e.target.value.replace(/\D/g, "").slice(0, 11); e.target.value = n.length < 4 ? n : n.length < 8 ? `${n.slice(0, 3)}-${n.slice(3)}` : `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}`; });

// 정산 계좌 — 은행 목록 + PG 계좌 실명인증
if (window.BANKS) $("#bzBank").innerHTML = `<option value="">은행 선택</option>` + window.BANKS.map((b) => `<option value="${b}">${b}</option>`).join("");
let bzAcctVerified = false;
function resetBzVerify() { bzAcctVerified = false; const b = $("#bzVerify"); if (b) { b.textContent = "계좌 인증"; b.classList.remove("is-ok"); } }
$("#bzAccount").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16); resetBzVerify(); });
$("#bzBank").addEventListener("change", resetBzVerify);
$("#bzHolder").addEventListener("input", resetBzVerify);
$("#bzVerify").addEventListener("click", () => {
  const msg = $("#bzVerifyMsg");
  const r = window.PGVERIFY.check($("#bzBank").value, $("#bzAccount").value, $("#bzHolder").value, [$("#bzOwner").value, $("#bzName").value]);
  bzAcctVerified = r.ok;
  msg.innerHTML = (r.ok ? "" : iconSVG("alert", 13) + " ") + r.msg;
  msg.className = "hf-hint " + (r.ok ? "hf-hint--ok" : "hf-hint--err");
  const b = $("#bzVerify"); b.textContent = r.ok ? "인증 완료 ✓" : "계좌 인증"; b.classList.toggle("is-ok", r.ok);
});

let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2400); }

// ── 제출 ──
$("#bzForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("#bzErr"); const fail = (m) => { err.textContent = m; err.hidden = false; };
  const v = (id) => $("#" + id).value.trim();
  const name = v("bzName"), owner = v("bzOwner"), bizNo = v("bzNo"), phone = v("bzPhone"), email = v("bzEmail");
  const region = v("bzRegion"), intro = v("bzIntro"), userId = v("bzId"), pw = $("#bzPw").value;
  const addr = (v("bzAddr") + " " + v("bzAddrDetail")).trim();
  const bank = v("bzBank"), account = v("bzAccount"), accountHolder = v("bzHolder");
  const svc = (document.querySelector('input[name="bzsvc"]:checked') || {}).value;
  const roles = activeRoles();

  if (!roles.length) return fail("가입 유형(공간 임대·서비스 제공)을 최소 1개 선택해 주세요.");
  if (!name || !owner || !bizNo || !phone || !email || !v("bzAddr")) return fail("사업자 정보·주소를 입력해 주세요.");
  if (roles.includes("vendor") && !svc) return fail("제공 서비스를 1개 선택해 주세요.");
  const reqDocs = activeDocs().filter((d) => d.req);
  if (reqDocs.some((d) => !(docState[d.key] || []).length)) return fail("필수 서류(사업자등록증)를 첨부해 주세요.");
  if (!userId || !pw) return fail("로그인 아이디와 비밀번호를 입력해 주세요.");
  if (!(window.PWCHECK ? window.PWCHECK(pw) : pw.length >= 8)) return fail("비밀번호는 " + (window.PW_RULE || "영문·숫자·특수문자 포함 8자 이상") + "로 설정해 주세요.");
  if (!$("#bzAgree").checked) return fail("입점 약관에 동의해 주세요.");
  const users = window.AUTH.users();
  if (users.some((u) => u.userId === userId)) return fail("이미 사용 중인 아이디입니다.");
  err.hidden = true;

  const primary = roles.includes("host") ? "host" : "vendor"; // 단일역할 로직 호환용 대표 역할
  const docs = {}; activeDocs().forEach((d) => { if ((docState[d.key] || []).length) docs[d.key] = docState[d.key]; });
  const u = {
    userId, pwHash: window.AUTH.hashPw(pw), nick: name, name, email, role: primary, roles, region, phone, addr,
    owner, bizNo, bank, account, accountHolder, accountVerified: bzAcctVerified, openDate: v("bzOpen"),
    serviceCats: (roles.includes("vendor") && svc) ? [svc] : undefined,
    intro,
    biz: { owner, bizNo, open: v("bzOpen"), phone, addr, bank, account, accountHolder, accountVerified: bzAcctVerified, docs, status: "pending", ts: Date.now() },
  };
  users.push(u);
  window.AUTH.saveUsers(users);
  window.AUTH.set({ userId, name, role: primary, roles, email, serviceCats: u.serviceCats || [], region, phone });
  toast("사업자 등록 신청이 접수됐어요!");
  setTimeout(() => (location.href = "mypage.html?tab=dash"), 1000);
});

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
