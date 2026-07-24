// ============================================================
// 공간잇다 — 관리자 콘솔 (상품·예약/결제·정산·CS·회원·일괄)
// ============================================================
const $ = (s) => document.querySelector(s);
const won = (n) => (+n || 0).toLocaleString("ko-KR");
// 고급 라인 아이콘 세트
const ICO_P = {
  dash: '<rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/>',
  stats: '<line x1="5" y1="21" x2="5" y2="11"/><line x1="12" y1="21" x2="12" y2="4"/><line x1="19" y1="21" x2="19" y2="14"/><line x1="3" y1="21" x2="21" y2="21"/>',
  approve: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
  box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><line x1="12" y1="13" x2="12" y2="21"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9"/><line x1="12" y1="8" x2="12" y2="21"/><path d="M12 8C11 4 7 4.5 7.5 7 8 8.5 12 8 12 8zM12 8c1-4 5-3.5 4.5-1C16 8.5 12 8 12 8z"/>',
  cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>',
  wallet: '<path d="M3 8a2 2 0 012-2h13a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M18 12h-3a1.5 1.5 0 000 3h3"/>',
  ticket: '<path d="M3 9a2 2 0 012-2h14a2 2 0 012 2 2 2 0 000 4 2 2 0 01-2 2H5a2 2 0 01-2-2 2 2 0 000-4z"/><line x1="14" y1="7" x2="14" y2="17" stroke-dasharray="1.5 2"/>',
  chat: '<path d="M21 15a2 2 0 01-2 2H8l-4 4V5a2 2 0 012-2h13a2 2 0 012 2z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0112 0"/><path d="M16 5a3.5 3.5 0 010 6.5M15 20a6 6 0 015-5.7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  upload: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
  shield: '<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/>',
  home: '<path d="M3 10l9-7 9 7v10a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',
  briefcase: '<rect x="2" y="7" width="20" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="2.5"/>',
  refresh: '<path d="M3 12a9 9 0 019-9 9 9 0 018 5"/><polyline points="20 3 20 8 15 8"/><path d="M21 12a9 9 0 01-9 9 9 9 0 01-8-5"/><polyline points="4 21 4 16 9 16"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 8.5A2 2 0 007 21h10a2 2 0 001.7-3.5L14 9V3"/><line x1="8" y1="14" x2="16" y2="14"/>',
  trash: '<polyline points="3 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>',
  refund: '<path d="M21 12a9 9 0 11-3-6.7"/><polyline points="21 3 21 8 16 8"/>',
  xcircle: '<circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  trend: '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>',
  door: '<path d="M14 3v18M4 3h10v18H4z"/><circle cx="11" cy="12" r="1"/>',
  hash: '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',
  star: '<polygon points="12 3 14.6 8.6 21 9.3 16.2 13.6 17.6 20 12 16.7 6.4 20 7.8 13.6 3 9.3 9.4 8.6"/>',
  doc: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><polyline points="14 3 14 8 19 8"/>',
  megaphone: '<path d="M4 10v4a1 1 0 001 1h2l4 4V5L7 9H5a1 1 0 00-1 1z"/><path d="M15 8a4 4 0 010 8"/>',
  pkg: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><line x1="9" y1="7" x2="9" y2="7"/><line x1="15" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="9" y2="11"/><line x1="15" y1="11" x2="15" y2="11"/><path d="M10 21v-4h4v4"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  chevron: '<polyline points="6 9 12 15 18 9"/>',
};
function ico(n, s) { s = s || 18; return `<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO_P[n] || ""}</svg>`; }
const ROLE_LABEL = { guest: "회원", host: "호스트", vendor: "파트너", admin: "관리자" };
const usersAll = () => window.AUTH.users();
const saveUsers = (l) => window.AUTH.saveUsers(l);
const userMap = () => { const m = {}; usersAll().forEach((u) => (m[u.userId] = u.nick || u.name || u.userId)); m["wylie"] = "와일리(직영)"; m["host"] = "호스트"; return m; };
const bizStatus = (u) => (u.biz ? (u.biz.status || "pending") : null);
const pendingUsers = () => usersAll().filter((u) => u.biz && (u.biz.status || "pending") === "pending");
const bookings = () => window.BOOKINGS.list();
const quotes = () => (window.QUOTES ? window.QUOTES.list() : []);
const spacesAll = () => (typeof getAllSpaces === "function" ? getAllSpaces() : []);
const fmtDate = (ts) => { if (!ts) return "-"; const d = new Date(ts); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`; };
const todayStr = OPS.dateStr(new Date());

// ---------- 표 정렬(오름/내림) 재사용 프레임워크 ----------
const sortState = {}; // tableId -> {key, dir}
function toggleSort(tid, key) { const s = sortState[tid]; if (s && s.key === key) { if (s.dir === "asc") s.dir = "desc"; else delete sortState[tid]; } else sortState[tid] = { key, dir: "asc" }; }
// 정렬 가능한 헤더 행 생성. cols: [{key?, label, cls?}] (key 없으면 정렬 불가 컬럼)
function sortHead(tid, rowCls, cols) {
  const s = sortState[tid] || {};
  return `<div class="ad-tr ad-tr--h ${rowCls}">${cols.map((c) => {
    if (!c.key) return `<span${c.cls ? ` class="${c.cls}"` : ""}>${c.label}</span>`;
    const active = s.key === c.key;
    const ar = active ? (s.dir === "asc" ? "▲" : "▼") : "↕";
    return `<span class="ad-sort${active ? " is-active" : ""}${c.cls ? " " + c.cls : ""}" data-sort="${tid}|${c.key}" role="button" tabindex="0" title="정렬">${c.label}<i class="ad-sort__ar">${ar}</i></span>`;
  }).join("")}</div>`;
}
// 배열 정렬 — accessors: {key: fn(item)}. 값이 숫자면 수치, 아니면 한글 로케일 비교
function applySort(list, tid, accessors) {
  const s = sortState[tid]; if (!s || !accessors[s.key]) return list;
  const acc = accessors[s.key], dir = s.dir === "asc" ? 1 : -1;
  return list.slice().sort((a, b) => {
    let x = acc(a), y = acc(b);
    if (typeof x === "number" && typeof y === "number") return (x - y) * dir;
    return String(x == null ? "" : x).localeCompare(String(y == null ? "" : y), "ko") * dir;
  });
}
const SORT_RERENDER = {}; // tid -> render fn (정렬 클릭 시 재렌더)
// 지표 툴팁 (?) — 마우스 오버/포커스 시 말풍선
function tip(text) { return `<span class="ad-tip" tabindex="0" role="button" aria-label="설명"><i>?</i><span class="ad-tip__bub">${String(text).replace(/</g, "&lt;")}</span></span>`; }

let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2400); }
const modal = $("#modal"), modalCard = $("#modalCard");
function closeModal() { modal.hidden = true; modalCard.innerHTML = ""; modalCard.classList.remove("modal__card--wide"); }
modal.addEventListener("click", (e) => { if (e.target.closest("[data-mclose]")) closeModal(); });

// ---------- 탭 ----------
$("#adTabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]"); if (!b) return;
  $("#adTabs").querySelectorAll(".mp-tab").forEach((t) => t.classList.toggle("is-active", t === b));
  document.querySelectorAll(".mp-panel").forEach((p) => (p.hidden = p.dataset.panel !== b.dataset.tab));
  const sb = $("#adSeedBar"); if (sb) sb.hidden = b.dataset.tab !== "dash"; // 데이터 버튼은 대시보드에서만
  setMenu(false); // 선택 후 메뉴 닫기
  renderPanel(b.dataset.tab);
});
// 관리자 좌측 드로어 토글 (햄버거)
function setMenu(open) {
  const nav = $("#adTabs"), tg = $("#adMenuToggle"), bd = $("#adBackdrop");
  if (open) nav.setAttribute("data-open", ""); else nav.removeAttribute("data-open");
  tg.classList.toggle("is-open", open); tg.setAttribute("aria-expanded", open ? "true" : "false");
  if (bd) bd.hidden = !open;
}
$("#adMenuToggle").addEventListener("click", (e) => { e.stopPropagation(); setMenu(!$("#adTabs").hasAttribute("data-open")); });
if ($("#adBackdrop")) $("#adBackdrop").addEventListener("click", () => setMenu(false));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
// 사이드바 메뉴 아이콘 + 시드 버튼 아이콘 주입
const MENU_ICO = { dash: "dash", stats: "stats", approve: "approve", products: "box", pkgadmin: "gift", bookings: "cal", rfp: "doc", orders: "refund", settle: "wallet", coupons: "ticket", fees: "card", cs: "chat", users: "users", audit: "lock", legal: "doc", settings: "gear", bulk: "upload" };
document.querySelectorAll("#adTabs .mp-tab").forEach((b) => { const k = MENU_ICO[b.dataset.tab]; if (k) b.insertAdjacentHTML("afterbegin", ico(k, 18)); });
if ($("#adReset")) $("#adReset").innerHTML = ico("refresh", 15) + " 금액 초기화";
if ($("#adSeed")) $("#adSeed").innerHTML = ico("flask", 15) + " 모의 데이터 생성/재설정";
function badge() { const n = pendingUsers().length, el = $("#apBadge"); el.hidden = !n; el.textContent = n; }

// ======================= 대시보드 =======================
function renderDash() {
  const us = usersAll(), cnt = (r) => us.filter((u) => u.role === r).length;
  const set = OPS.settlement(bookings(), quotes(), userMap());
  const t = set.totals;
  // [label, value, icon, cls, goto, userFilter]
  const kpis = [
    ["회원", cnt("guest"), "users", "", "users", "guest"], ["호스트", cnt("host"), "home", "", "users", "host"], ["파트너", cnt("vendor"), "briefcase", "", "users", "vendor"],
    ["승인 대기", pendingUsers().length, "clock", pendingUsers().length ? "hl" : "", "approve"],
    ["등록 공간", spacesAll().length, "pin", "", "products"], ["예약(확정)", t.count, "cal", "", "bookings"],
  ];
  const money = [
    ["총 거래액(GMV)", t.gmv, "card"], ["와일리 수수료", t.wylie, "shield"], ["호스트 정산", t.host, "home"], ["파트너 정산", t.vendor, "briefcase"], ["패키지 매출", t.pkg, "gift"],
  ];
  const kpiEl = (k, money) => { const link = k[4] || money; return `<${link ? "button" : "div"} class="ad-kpi ${k[3] || ""}${money ? " ad-kpi--money" : ""}${link ? " ad-kpi--link" : ""}"${k[4] ? ` data-goto="${k[4]}"` : (money ? ` data-goto="settle"` : "")}${k[5] ? ` data-uf="${k[5]}"` : ""}><span class="ad-kpi__ic">${ico(k[2], 20)}</span><b>${won(k[1])}${money ? "<em>원</em>" : ""}</b><span class="ad-kpi__l">${k[0]}${link ? ` ${ico("arrow", 12)}` : ""}</span></${link ? "button" : "div"}>`; };
  $("#adDash").innerHTML = `
    <div class="ad-kpis">${kpis.map((k) => kpiEl(k, false)).join("")}</div>
    <h3 class="ad-h3">${ico("wallet", 18)} 매출·정산 요약 <span class="ad-h3__s">확정 예약 ${t.count}건 기준 · 클릭 시 정산 화면</span></h3>
    <div class="ad-kpis">${money.map((k) => kpiEl(k, true)).join("")}</div>
    ${pendingUsers().length ? `<div class="ad-note">${ico("clock", 16)} <b>${pendingUsers().length}건</b> 사업자 승인 대기 <button class="btn btn--accent btn--sm" data-goto="approve">승인하러 가기 →</button></div>` : ""}
    <div class="ad-note ad-note--ok">${ico("approve", 16)} 회계 항등식: GMV(${won(t.gmv)}) = 와일리(${won(t.wylie)}) + 호스트(${won(t.host)}) + 파트너(${won(t.vendor)}) + 패키지(${won(t.pkg)}) → <b>${t.gmv === (t.wylie + t.host + t.vendor + t.pkg) ? "일치" : "불일치"}</b></div>`;
}

// ======================= 사업자 승인 =======================
function docsCount(u) { const d = (u.biz && u.biz.docs) || {}; return Object.keys(d).reduce((a, k) => a + (d[k] ? d[k].length : 0), 0); }
function renderApprove() {
  const list = pendingUsers();
  $("#adApprove").innerHTML = list.length ? list.map((u) => {
    const b = u.biz || {};
    return `<div class="ad-appr"><div class="ad-appr__top"><div><span class="ad-role ad-role--${u.role}">${ROLE_LABEL[u.role]}</span><b class="ad-appr__name">${u.nick || u.name}</b><span class="ad-appr__meta">신청일 ${fmtDate(b.ts)}</span></div><div class="ad-appr__act"><button class="btn btn--soft btn--sm" data-docs="${u.userId}">서류 ${docsCount(u)}건</button><button class="btn btn--outline btn--sm" data-reject="${u.userId}">반려</button><button class="btn btn--accent btn--sm" data-approve="${u.userId}">승인</button></div></div>
      <div class="ad-appr__grid"><div><span>대표자</span>${window.PRIVACY ? window.PRIVACY.name(b.owner) : (b.owner || "-")}</div><div><span>사업자번호</span>${window.PRIVACY ? window.PRIVACY.bizno(b.bizNo) : (b.bizNo || "-")}</div><div><span>연락처</span>${window.PRIVACY ? window.PRIVACY.phone(b.phone || u.phone) : (b.phone || u.phone || "-")}</div><div><span>이메일</span>${window.PRIVACY ? window.PRIVACY.email(u.email) : (u.email || "-")}</div><div><span>주소</span>${b.addr || "-"}</div>${u.role === "vendor" ? `<div><span>취급</span>${(u.serviceCats || []).map((c) => (window.reqCatById ? reqCatById(c).label : c)).join(", ") || "-"}</div>` : ""}</div></div>`;
  }).join("") : `<div class="mp-empty">대기 중인 사업자 가입 신청이 없습니다.</div>`;
}
function viewDocs(uid) {
  const u = usersAll().find((x) => x.userId === uid); if (!u) return;
  const docs = (u.biz && u.biz.docs) || {}, LBL = { bizreg: "사업자등록증", bank: "통장 사본", photo: "공간·건물 사진", port: "포트폴리오·파트너 사진" }, keys = Object.keys(docs);
  modal.hidden = false;
  modalCard.innerHTML = `<div class="modal__head"><b>${u.nick || u.name} · 제출 서류</b><button class="modal__x" data-mclose>✕</button></div>${keys.length ? keys.map((k) => `<div class="ad-doc"><div class="ad-doc__t">${LBL[k] || k}</div><div class="ad-doc__files">${docs[k].map((f) => (f.url && /^data:image/.test(f.url)) ? `<a href="${f.url}" target="_blank"><img src="${f.url}" alt="${f.name}" /></a>` : `<a class="ad-doc__file" href="${f.url || "#"}" target="_blank">📄 ${f.name}</a>`).join("")}</div></div>`).join("") : `<p class="mp-empty">제출된 서류가 없습니다.</p>`}`;
}
function setStatus(uid, status, msg) {
  const list = usersAll(), u = list.find((x) => x.userId === uid); if (!u) return;
  u.biz = Object.assign({}, u.biz, { status }); saveUsers(list);
  if (window.AUDIT) window.AUDIT.log("approve", "user:" + uid, "사업자 상태 변경 → " + status);
  if (window.NOTIF) window.NOTIF.add({ forUser: uid, title: msg, sub: status === "approved" ? "이제 모든 기능을 이용할 수 있어요" : "관리자에게 문의해 주세요", link: "mypage.html" });
  renderAll(); toast(msg);
}

// ======================= 상품 관리 (공간·장비) =======================
function renderProducts() {
  const um = userMap();
  const spStatus = (s) => { const f = window.SPACEFLAGS.get(s.id); return f.blinded ? 1 : f.rejected ? 2 : 3; };
  const spAll = applySort(spacesAll(), "prod", { name: (s) => s.name || "", cat: (s) => (window.catById ? catById(s.cat).label : s.cat), owner: (s) => um[s.ownerId] || s.ownerId || "", price: (s) => +s.price || 0, status: (s) => spStatus(s) });
  const q = _sq("prod");
  const sp = q ? spAll.filter((s) => _hit(q, s.name, (window.catById ? catById(s.cat).label : s.cat), um[s.ownerId] || s.ownerId)) : spAll;
  $("#adProducts").innerHTML = `
    <h3 class="ad-h3">${ico("box", 18)} 공간·장비 게시물 <span class="ad-h3__s">${sp.length}건${q ? ` · '${adSearch.prod}' 검색` : ""} · 반려/블라인드 처리</span></h3>
    ${searchBar("prod", "공간명 · 유형 · 호스트 검색")}
    <div class="ad-table">${sortHead("prod", "ad-tr--prod", [{ key: "name", label: "공간" }, { key: "cat", label: "유형" }, { key: "owner", label: "호스트" }, { key: "price", label: "가격" }, { key: "status", label: "상태" }, { label: "관리" }])}
    ${sp.length ? sp.map((s) => { const f = window.SPACEFLAGS.get(s.id); const blind = f.blinded, rej = f.rejected; return `<div class="ad-tr ad-tr--prod"><span class="ad-tr__id"><b>${s.name}</b></span><span>${(window.catById ? catById(s.cat).label : s.cat)}</span><span>${(userMap()[s.ownerId] || s.ownerId || "-")}</span><span>${won(s.price)}원</span><span>${blind ? `<span class="ad-st ad-st--sus">블라인드</span>` : rej ? `<span class="ad-st ad-st--rej">반려</span>` : `<span class="ad-st ad-st--ok">노출중</span>`}</span><span class="ad-tr__act"><a class="btn btn--soft btn--xs" href="space.html?id=${s.id}" target="_blank">보기</a><button class="btn btn--soft btn--xs" data-blind="${s.id}">${blind ? "블라인드 해제" : "블라인드"}</button><button class="btn btn--xs ad-del" data-reject-sp="${s.id}">${rej ? "반려 해제" : "반려"}</button></span></div>`; }).join("") : `<div class="mp-empty">검색 결과가 없습니다.</div>`}</div>
    <p class="ad-hint">패키지 기획전은 상단 <b>패키지 기획전</b> 메뉴에서 참여 파트너·판매·매출과 함께 관리합니다.</p>`;
}

// ======================= 패키지 기획전 (전용) =======================
function renderPkgAdmin() {
  const pkgs = (typeof PACKAGES !== "undefined" ? PACKAGES : []);
  const bks = bookings().filter((b) => b.pkg);
  // 패키지별 판매/매출 집계
  const stat = {}; bks.forEach((b) => { if (b.status !== "confirmed") return; const x = stat[b.pkgId] || (stat[b.pkgId] = { count: 0, gmv: 0 }); x.count++; x.gmv += b.total || 0; });
  const totalGmv = Object.values(stat).reduce((a, x) => a + x.gmv, 0);
  const totalCnt = Object.values(stat).reduce((a, x) => a + x.count, 0);
  const allPartners = {}; pkgs.forEach((p) => pkgPartners(p).forEach((v) => (allPartners[v.id || v.name] = v)));
  const ordered = pkgs.slice().sort((a, b) => ((window.PKGFLAGS.get(a.id).order || 0) - (window.PKGFLAGS.get(b.id).order || 0)));
  $("#adPkg").innerHTML = `
    <div class="ad-kpis">
      <div class="ad-kpi"><span class="ad-kpi__ic">${ico("gift", 20)}</span><b>${pkgs.length}</b><span class="ad-kpi__l">기획전</span></div>
      <div class="ad-kpi"><span class="ad-kpi__ic">${ico("users", 20)}</span><b>${Object.keys(allPartners).length}</b><span class="ad-kpi__l">참여 파트너·호스트</span></div>
      <div class="ad-kpi ad-kpi--money"><span class="ad-kpi__ic">${ico("box", 20)}</span><b>${won(totalCnt)}</b><span class="ad-kpi__l">패키지 판매(건)</span></div>
      <div class="ad-kpi ad-kpi--money hl"><span class="ad-kpi__ic">${ico("card", 20)}</span><b>${won(totalGmv)}<em>원</em></b><span class="ad-kpi__l">패키지 매출</span></div>
    </div>
    <h3 class="ad-h3">${ico("gift", 18)} 기획전 현황 <span class="ad-h3__s">카드를 잡고 위아래로 끌어 순서 변경 · 참여 파트너·판매·매출</span></h3>
    <div class="ad-pkgcards" id="adPkgList">
    ${ordered.map((p, i) => {
      const st = stat[p.id] || { count: 0, gmv: 0 }; const f = window.PKGFLAGS.get(p.id); const hidden = f.hidden;
      const partners = pkgPartners(p);
      return `<div class="ad-pkgcard ${hidden ? "is-hidden" : ""}" draggable="true" data-pkgid="${p.id}">
        <div class="ad-pkgcard__grip" title="끌어서 순서 변경">⠿</div>
        <span class="ad-pkgcard__ord">${i + 1}</span>
        <div class="ad-pkgcard__main">
          <div class="ad-pkgcard__top">
            <div><span class="pkg-card__theme">${p.theme}</span><b class="ad-pkgcard__title">${p.title}</b><span class="ad-pkgcard__price">${won(p.price)}원 · ${p.pct}%↓</span></div>
            <div class="ad-pkgcard__act"><span class="ad-st ${hidden ? "ad-st--sus" : "ad-st--ok"}">${hidden ? "숨김" : "노출중"}</span><button class="btn btn--soft btn--xs" data-pkghide="${p.id}">${hidden ? "노출" : "숨김"}</button></div>
          </div>
          <div class="ad-pkgcard__stat"><span>${ico("box", 15)} 판매 <b>${st.count}건</b></span><span>${ico("card", 15)} 매출 <b>${won(st.gmv)}원</b></span><button type="button" class="ad-pkgfee" data-feeeditor="pkg:${p.id}" data-feekind="pkg" data-feename="${(p.title || "").replace(/"/g, "&quot;")}" onclick="event.stopPropagation()">${ico("card", 13)} 수수료율 <b>${window.FEERATES.pctOf("pkg", "pkg:" + p.id)}%</b>${window.FEERATES.isCustom("pkg:" + p.id) ? "★" : ""}</button></div>
          <div class="ad-pkgcard__partners"><span class="ad-pkgcard__plabel">참여 파트너</span>${partners.map((v) => `<span class="pkg-partner pkg-partner--${v.role}">${ico(v.role === "host" ? "home" : "briefcase", 12)} ${v.name}</span>`).join("")}</div>
        </div>
      </div>`;
    }).join("")}
    </div>
    <p class="ad-hint">💡 <b>카드를 클릭한 채로 위/아래로 드래그</b>하면 순서가 자동 저장되고, <a href="packages.html" target="_blank">패키지 페이지</a>·홈에 실시간 반영됩니다.</p>`;
}
// 패키지 순서 드래그 앤 드롭 (adPkg 컨테이너에 위임)
(function pkgDnD() {
  const host = $("#adPkg"); if (!host) return;
  let dragId = null;
  const list = () => host.querySelector("#adPkgList");
  host.addEventListener("dragstart", (e) => { const c = e.target.closest(".ad-pkgcard"); if (!c) return; dragId = c.dataset.pkgid; c.classList.add("dragging"); try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", dragId); } catch (x) {} });
  host.addEventListener("dragend", () => { host.querySelectorAll(".ad-pkgcard").forEach((x) => x.classList.remove("dragging")); dragId = null; });
  host.addEventListener("dragover", (e) => {
    if (!dragId) return; e.preventDefault();
    const w = list(); if (!w) return;
    const drag = w.querySelector(`.ad-pkgcard[data-pkgid="${dragId}"]`); if (!drag) return;
    const over = e.target.closest(".ad-pkgcard");
    if (!over || over === drag) return;
    const r = over.getBoundingClientRect();
    const after = (e.clientY - r.top) / r.height > 0.5;
    w.insertBefore(drag, after ? over.nextSibling : over);
  });
  host.addEventListener("drop", (e) => {
    if (!dragId) return; e.preventDefault();
    const w = list(); if (!w) return;
    [...w.querySelectorAll(".ad-pkgcard")].forEach((c, i) => window.PKGFLAGS.set(c.dataset.pkgid, { order: i }));
    dragId = null; renderPkgAdmin(); toast("진열 순서를 저장했어요");
  });
})();

// ======================= 예약·결제 =======================
let bkFilter = "all", bkFrom = "", bkTo = "", bkPreset = "all";
function bkShiftDay(days) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days); return OPS.dateStr(d); }
function renderBookings() {
  const all = bookings().slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const derive = (b) => (b.status === "confirmed" && b.date < todayStr) ? "completed" : b.status;
  // 기간 필터 적용
  const inRange = (b) => (!bkFrom || (b.date || "") >= bkFrom) && (!bkTo || (b.date || "") <= bkTo);
  const ranged = all.filter(inRange);
  const counts = { all: ranged.length, requested: 0, confirmed: 0, completed: 0, cancelled: 0 };
  const sums = { all: 0, requested: 0, confirmed: 0, completed: 0, cancel: 0, refund: 0, net: 0 };
  ranged.forEach((b) => {
    const d = derive(b); counts[d] = (counts[d] || 0) + 1;
    if (d === "requested") sums.requested += b.total || 0;
    else if (d === "confirmed") { sums.confirmed += b.total || 0; sums.all += b.total || 0; }
    else if (d === "completed") { sums.completed += b.total || 0; sums.all += b.total || 0; }
    else if (d === "cancelled") { if (b.refund && b.refund.amount) sums.refund += b.refund.amount; else sums.cancel += b.total || 0; }
  });
  sums.net = sums.all; // 순매출 = 확정+완료 (환불건은 status=cancelled로 이미 제외됨 — 이중차감 방지)
  const chips = [["all", "전체"], ["requested", "대기"], ["confirmed", "확정"], ["completed", "완료"], ["cancelled", "취소/환불"]];
  const presets = [["all", "전체 기간"], ["month", "이번 달"], ["7d", "최근 7일"], ["30d", "최근 30일"]];
  let list = ranged;
  if (bkFilter !== "all") list = ranged.filter((b) => derive(b) === bkFilter);
  list = applySort(list, "bk", { date: (b) => (b.date || "") + String(b.start != null ? OPS.pad(b.start) : ""), name: (b) => b.spaceName || "", guest: (b) => b.guestName || b.guestId || "", total: (b) => +b.total || 0, status: (b) => derive(b) });
  const bq = _sq("bk"); if (bq) list = list.filter((b) => _hit(bq, b.spaceName, b.guestName, b.guestId, b.date));
  const stTag = (b) => { const d = derive(b); return d === "completed" ? `<span class="ad-st ad-st--ok">사용완료</span>` : d === "confirmed" ? `<span class="ad-st ad-st--ok">확정</span>` : d === "requested" ? `<span class="ad-st ad-st--pend">대기</span>` : `<span class="ad-st ad-st--rej">취소/환불</span>`; };
  // 선택 필터별 금액 요약
  const sumBar = () => {
    if (bkFilter === "requested") return `<span class="ad-bksum__i">${ico("clock", 15)} 대기 금액 <b>${won(sums.requested)}원</b></span>`;
    if (bkFilter === "confirmed") return `<span class="ad-bksum__i">${ico("approve", 15)} 확정 금액 <b>${won(sums.confirmed)}원</b></span>`;
    if (bkFilter === "completed") return `<span class="ad-bksum__i">${ico("check", 15)} 완료 결제액 <b>${won(sums.completed)}원</b></span>`;
    if (bkFilter === "cancelled") return `<span class="ad-bksum__i">${ico("xcircle", 15)} 취소 <b>${won(sums.cancel)}원</b></span><span class="ad-bksum__i ad-bksum__i--rf">${ico("refund", 15)} 환불 <b>${won(sums.refund)}원</b></span>`;
    return `<span class="ad-bksum__i ad-bksum__i--net">${ico("card", 15)} 순매출(확정+완료) <b>${won(sums.net)}원</b></span><span class="ad-bksum__i">${ico("clock", 15)} 대기 <b>${won(sums.requested)}원</b></span><span class="ad-bksum__i ad-bksum__i--rf">${ico("refund", 15)} 환불 <b>${won(sums.refund)}원</b></span>`;
  };
  const rangeLabel = (bkFrom || bkTo) ? `${bkFrom || "처음"} ~ ${bkTo || "오늘"}` : "전체 기간";
  const derKo = { requested: "대기", confirmed: "확정", completed: "사용완료", cancelled: "취소/환불" };
  _xls2.bk = { name: `예약결제_${(bkFrom || "전체") + (bkTo ? "_" + bkTo : "")}.csv`, rows: [["일시", "공간/상품", "고객", "인원", "결제액(원)", "상태", "결제여부"]].concat(list.map((b) => [(b.date || "") + (b.start != null ? " " + OPS.pad(b.start) + ":00" : ""), (b.pkg ? "[패키지] " : "") + (b.spaceName || ""), b.guestName || b.guestId || "", b.guests || "", b.total || 0, derKo[derive(b)] || derive(b), b.paid === false ? "미결제" : "결제완료"])) };
  $("#adBookings").innerHTML = `
    <div class="ad-period">
      <div class="ad-period__presets">${presets.map(([v, l]) => `<button class="chip chip--sm${bkPreset === v ? " is-active" : ""}" data-bkrange="${v}">${l}</button>`).join("")}</div>
      <div class="ad-period__range">
        <input type="date" id="bkFrom" value="${bkFrom}" max="${bkTo || ""}" aria-label="시작일" />
        <span class="ad-period__tilde">~</span>
        <input type="date" id="bkTo" value="${bkTo}" min="${bkFrom || ""}" aria-label="종료일" />
        <span class="ad-period__lbl">${rangeLabel} · <b>${ranged.length}</b>건</span>
        <button class="btn btn--soft btn--xs" data-xls2="bk">${ico("upload", 13)} 엑셀 다운로드</button>
      </div>
    </div>
    <div class="ad-filters">${chips.map(([v, l]) => `<button class="chip${bkFilter === v ? " is-active" : ""}" data-bkf="${v}">${l} <b>${counts[v] || 0}</b></button>`).join("")}</div>
    <div class="ad-bksum">${sumBar()}</div>
    ${searchBar("bk", "공간·상품·고객·날짜 검색")}
    <div class="ad-table" style="margin-top:14px">${sortHead("bk", "ad-tr--bk", [{ key: "date", label: "일시" }, { key: "name", label: "공간/상품" }, { key: "guest", label: "고객" }, { key: "total", label: "결제액" }, { key: "status", label: "상태" }, { label: "관리" }])}
    ${list.length ? list.map((b) => `<div class="ad-tr ad-tr--bk"><span>${b.date}${b.start != null ? ` ${OPS.pad(b.start)}:00` : ""}</span><span class="ad-tr__id"><b>${b.pkg ? "📦 " : ""}${b.spaceName}</b></span><span>${b.guestName ? (window.PRIVACY ? window.PRIVACY.name(b.guestName) : b.guestName) : b.guestId}</span><span>${won(b.total)}원</span><span>${stTag(b)}</span><span class="ad-tr__act">${(derive(b) !== "cancelled") ? `<button class="btn btn--xs ad-del" data-refund="${b.id}">환불</button>` : `<span class="ad-refund-done">환불완료</span>`}</span></div>`).join("") : `<div class="mp-empty">해당 예약이 없습니다.</div>`}</div>`;
}
function refund(id, kind) {
  const l = window.BOOKINGS.list(), b = l.find((x) => x.id === id); if (!b) return;
  let amt, penalty = 0, rate, days, label;
  if (kind === "half") { amt = Math.round(b.total / 2); penalty = b.total - amt; label = "부분 환불(50%)"; }
  else if (kind === "full") { amt = b.total; label = "전액 환불(예외 승인)"; }
  else { const c = OPS.cancelCalc("space", b.total, b.date, todayStr); amt = c.refund; penalty = c.penalty; rate = c.rate; days = c.days; label = "정책 환불(" + OPS.cancelTierLabel("space", c.days) + ")"; }
  b.status = "cancelled"; b.paid = false; b.refund = { amount: amt, penalty: penalty, rate: rate, days: days, kind: kind, ts: Date.now() };
  window.BOOKINGS.save(l);
  if (window.NOTIF) window.NOTIF.add({ forUser: b.guestId, title: `예약 취소·환불 · ${b.spaceName}`, sub: `환불 ${won(amt)}원${penalty ? ` · 위약금 ${won(penalty)}원` : ""} · 결제수단으로 자동 취소`, link: "mypage.html?tab=book" });
  if (window.AUDIT) window.AUDIT.log("edit", "booking:" + id, label + " " + won(amt) + "원" + (penalty ? " · 위약금 " + won(penalty) : ""));
  renderAll(); toast(`${won(amt)}원 환불 처리${penalty ? ` · 위약금 ${won(penalty)}원 정산 유지` : ""}`);
}
function refundModal(id) {
  const b = window.BOOKINGS.list().find((x) => x.id === id); if (!b) return;
  const c = OPS.cancelCalc("space", b.total, b.date, todayStr);
  modal.hidden = false; modalCard.classList.remove("modal__card--wide");
  modalCard.innerHTML = `<div class="modal__head"><b>예약 취소·환불</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="share__sub">${b.spaceName}<br /><span>${window.PRIVACY ? window.PRIVACY.name(b.guestName) : b.guestName} · 이용일 ${b.date} · 결제액 ${won(b.total)}원</span></p>
    <div class="ad-cancelbox">
      <div class="ad-cancelbox__tier">${ico("refund", 15)} ${OPS.cancelTierLabel("space", c.days)}</div>
      <div class="ad-cancelbox__row"><span>고객 환불액</span><b>${won(c.refund)}원</b></div>
      <div class="ad-cancelbox__row ad-cancelbox__row--pen"><span>취소 위약금 (공급자 정산 유지)</span><b>${won(c.penalty)}원</b></div>
    </div>
    <button class="btn btn--accent btn--block" data-refundpolicy="${b.id}" style="margin-top:12px">정책대로 환불 (${won(c.refund)}원)</button>
    <button class="btn btn--outline btn--block" data-refundfull="${b.id}" style="margin-top:8px">전액 환불 · 예외 승인 (${won(b.total)}원)</button>
    <p class="modal__note">공간 대관 취소 정책: <b>${OPS.cancelPolicyText("space")}</b>. PG 부분취소로 환불액만 고객 결제수단으로 반환되고, 위약금은 호스트에게 정산됩니다.</p>`;
}

// ======================= 정산·매출 =======================
let period = todayStr.slice(0, 7);
let setPreset = "month", setFrom = "", setTo = "";
let setStatusF = "all", _xls = {}, _xls2 = {}, _payoutXls = {};
// 섹션별 검색어
const adSearch = { prod: "", bk: "", rfp: "", ord: "", set: "", inq: "" };
function searchBar(key, ph) { return `<div class="ad-srch"><span class="ad-srch__ic">${ico("search", 15)}</span><input type="text" class="ad-srch__in" data-searchbox="${key}" value="${(adSearch[key] || "").replace(/"/g, "&quot;")}" placeholder="${ph}" autocomplete="off" />${adSearch[key] ? `<button type="button" class="ad-srch__x" data-searchclear="${key}" aria-label="지우기">✕</button>` : ""}</div>`; }
const _sq = (key) => (adSearch[key] || "").trim().toLowerCase();
const _hit = (q, ...vals) => vals.some((v) => String(v == null ? "" : v).toLowerCase().includes(q));
function runSearch(k) {
  const R = { prod: renderProducts, bk: renderBookings, rfp: renderRfp, ord: renderOrders, set: renderSettle, inq: renderCS, fee: renderFees }[k];
  if (!R) return;
  R();
  const el = document.querySelector(`[data-searchbox="${k}"]`);
  if (el) { el.focus(); const v = el.value; el.setSelectionRange(v.length, v.length); }
}
document.addEventListener("input", (e) => {
  const sb = e.target.closest("[data-searchbox]"); if (!sb) return;
  adSearch[sb.dataset.searchbox] = sb.value;
  if (e.isComposing) return; // 한글 조합 중에는 재렌더 금지(입력창 재생성으로 조합이 깨지는 것 방지)
  runSearch(sb.dataset.searchbox);
});
// 한글/일본어 등 IME 조합 완료 시점에 검색 실행
document.addEventListener("compositionend", (e) => {
  const sb = e.target.closest("[data-searchbox]"); if (!sb) return;
  adSearch[sb.dataset.searchbox] = sb.value;
  runSearch(sb.dataset.searchbox);
});
document.addEventListener("click", (e) => {
  const c = e.target.closest("[data-searchclear]"); if (!c) return;
  const k = c.dataset.searchclear; adSearch[k] = "";
  const R = { prod: renderProducts, bk: renderBookings, rfp: renderRfp, ord: renderOrders, set: renderSettle, inq: renderCS, fee: renderFees }[k]; if (R) R();
});
let memOpen = new Set();
// CSV(엑셀) 다운로드 — 한글 깨짐 방지 BOM 포함
function csvCell(v) { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
function downloadCSV(name, rows) {
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 120);
}
function lastDayOfMonth(ymd) { const [y, m] = ymd.split("-").map(Number); return `${y}-${OPS.pad(m)}-${OPS.pad(new Date(y, m, 0).getDate())}`; }
// 정산 조회 기간 계산 — {from,to,key,label}. key는 정산주기 식별자(월단위면 YYYY-MM)
function settleRange() {
  const t = todayStr;
  if (setPreset === "all") return { from: "", to: "", key: "all", label: "전체 기간" };
  if (setPreset === "month") { const m = t.slice(0, 7); return { from: m + "-01", to: t, key: m, label: `이번 달 (${m})` }; }
  if (setPreset === "7d") { const f = bkShiftDay(-6); return { from: f, to: t, key: f + "~" + t, label: "최근 7일" }; }
  if (setPreset === "30d") { const f = bkShiftDay(-29); return { from: f, to: t, key: f + "~" + t, label: "최근 30일" }; }
  const f = setFrom, to = setTo; // custom
  let key;
  if (f && to && f.slice(8) === "01" && f.slice(0, 7) === to.slice(0, 7) && to === lastDayOfMonth(f)) key = f.slice(0, 7);
  else key = (f || "처음") + "~" + (to || "오늘");
  return { from: f, to: to, key, label: (f || "처음") + " ~ " + (to || "오늘") };
}
// 기간 내 일별/월별 매출(GMV) 버킷 — 45일 초과면 월 단위
function settleTrend(mb, mq, from, to) {
  const gmvOn = {};
  const addD = (d, v) => { if (d) gmvOn[d] = (gmvOn[d] || 0) + v; };
  mb.forEach((b) => { if (b.status === "confirmed" && b.paid !== false) addD(b.date, b.total || 0); });
  mq.forEach((q) => { if (q.status === "accepted" && q.paid) addD(q.date || (window.REQUESTS.find(q.requestId) || {}).date, +q.price || 0); });
  const keys = Object.keys(gmvOn).sort();
  let lo = from || keys[0], hi = to || keys[keys.length - 1];
  if (!lo || !hi) return { data: [], daily: true };
  const days = Math.round((new Date(hi) - new Date(lo)) / 86400000) + 1;
  if (days <= 0) return { data: [], daily: true };
  if (days <= 45) {
    const out = [];
    for (let i = 0; i < days; i++) { const d = new Date(new Date(lo).getTime() + i * 86400000); const ds = OPS.dateStr(d); out.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, v: gmvOn[ds] || 0 }); }
    return { data: out, daily: true };
  }
  const mon = {}; keys.forEach((k) => { const m = k.slice(0, 7); mon[m] = (mon[m] || 0) + gmvOn[k]; });
  return { data: Object.keys(mon).sort().map((m) => ({ label: `${+m.slice(5)}월`, v: mon[m] })), daily: false };
}
// 회원별 이용 상세(대관·패키지·맞춤 견적) — 기간·구분·업체명·금액
function memberDetail(id) {
  const rows = [];
  bookings().filter((b) => b.guestId === id && b.status === "confirmed" && b.paid !== false).forEach((b) => rows.push({ date: b.date, kind: b.pkg ? "패키지" : "호스트", name: b.spaceName, amt: b.total || 0 }));
  const reqBy = {}; window.REQUESTS.list().forEach((r) => (reqBy[r.id] = r));
  quotes().filter((q) => q.status === "accepted" && q.paid).forEach((q) => { const r = reqBy[q.requestId]; if (r && r.memberId === id) rows.push({ date: q.date || (r.date || "-"), kind: "맞춤업체", name: q.vendorName || userMap()[q.vendorId] || q.vendorId, amt: +q.price || 0 }); });
  return rows.sort((a, b) => ((a.date || "") < (b.date || "") ? 1 : -1));
}
function renderSettle() {
  const rng = settleRange(); period = rng.key; // 정산주기 식별자 갱신
  const inR = (d) => (!rng.from || (d || "") >= rng.from) && (!rng.to || (d || "") <= rng.to);
  const mb = bookings().filter((b) => inR(b.date));
  const mq = quotes().filter((q) => inR(q.date || (window.REQUESTS.find(q.requestId) || {}).date || ""));
  const trend = settleTrend(mb, mq, rng.from, rng.to);
  const set = OPS.settlement(mb, mq, userMap()), t = set.totals;
  const provs = Object.values(set.byProvider).sort((a, b) => b.provider - a.provider);
  // 회원별 누적 결제액(대관·패키지 + 맞춤 견적 결제 합산)
  const memMap = {};
  const addM = (uid, name, amt) => { const m = memMap[uid] || (memMap[uid] = { id: uid, name: name || uid, spent: 0, count: 0 }); m.spent += amt; m.count++; };
  bookings().filter((b) => b.status === "confirmed" && b.paid !== false).forEach((b) => addM(b.guestId, b.guestName, b.total || 0));
  const reqBy0 = {}; window.REQUESTS.list().forEach((r) => (reqBy0[r.id] = r));
  quotes().filter((q) => q.status === "accepted" && q.paid).forEach((q) => { const r = reqBy0[q.requestId]; if (r) addM(r.memberId, r.memberName, +q.price || 0); });
  const mem = Object.values(memMap).sort((a, b) => b.spent - a.spent).slice(0, 10);
  const setPresets = [["month", "이번 달"], ["7d", "최근 7일"], ["30d", "최근 30일"], ["all", "전체"]];
  // PG 자동 분리정산 상태: 정산 예정(scheduled) / 정산 완료(settled)
  const pgStatus = (p) => (p.scheduled > 0 ? "scheduled" : "settled");
  const provsS = applySort(provs, "set", { name: (p) => p.name || "", role: (p) => p.role || "", count: (p) => p.count || 0, gross: (p) => p.gross || 0, wylie: (p) => p.wylie || 0, provider: (p) => p.provider || 0, status: (p) => pgStatus(p) });
  const memS = applySort(mem, "mem", { name: (m) => m.name || "", count: (m) => m.count || 0, spent: (m) => m.spent || 0 });
  const stc = { all: provs.length, scheduled: provs.filter((p) => pgStatus(p) === "scheduled").length, settled: provs.filter((p) => pgStatus(p) === "settled").length };
  let provF = setStatusF === "all" ? provsS : provsS.filter((p) => pgStatus(p) === setStatusF);
  const setq = _sq("set"); if (setq) provF = provF.filter((p) => _hit(setq, p.name, roleKo(p.role)));
  const roleKo = (r) => r === "host" ? "호스트" : r === "vendor" ? "파트너" : "패키지";
  const sttKo = (p) => pgStatus(p) === "settled" ? "정산완료" : "정산예정";
  _xls = {
    provsRows: [["공급자", "유형", "건수", "거래액(원)", "와일리수수료(원)", "정산금(원)", "정산완료(원)", "정산예정(원)", "정산상태"]].concat(provF.map((p) => [p.name, roleKo(p.role), p.count, p.gross, p.wylie, p.provider, p.settled || 0, p.scheduled || 0, sttKo(p)])),
    memRows: [["순위", "회원", "아이디", "예약건수", "누적결제액(원)"]].concat(memS.map((m, i) => [i + 1, m.name, m.id, m.count, m.spent])),
    label: rng.key,
  };
  _xls2.settlerev = { name: `정산매출_거래내역_${rng.key}.csv`, rows: [["일시", "구분", "공급자/공간", "고객", "금액(원)", "상태"]].concat(
    mb.filter((b) => b.status === "confirmed" && b.paid !== false).map((b) => [b.date || "", b.pkg ? "패키지" : "호스트(공간)", b.spaceName || "", b.guestName || b.guestId || "", b.total || 0, "결제완료"])
      .concat(mq.filter((q) => q.status === "accepted" && q.paid).map((q) => [q.date || "", "파트너", userMap()[q.vendorId] || q.vendorName || q.vendorId, "", +q.price || 0, "결제완료"]))) };
  const stTabs = [["all", "전체"], ["scheduled", "정산 예정"], ["settled", "정산 완료"]];
  $("#adSettle").innerHTML = `
    <div class="ad-period">
      <div class="ad-period__presets">${setPresets.map(([v, l]) => `<button class="chip chip--sm${setPreset === v ? " is-active" : ""}" data-setrange="${v}">${l}</button>`).join("")}</div>
      <div class="ad-period__range">
        <input type="date" id="setFrom" value="${rng.from || ""}" max="${rng.to || ""}" aria-label="시작일" />
        <span class="ad-period__tilde">~</span>
        <input type="date" id="setTo" value="${rng.to || ""}" min="${rng.from || ""}" aria-label="종료일" />
        <span class="ad-period__lbl">${rng.label} · 거래 <b>${t.count}</b>건</span>
      </div>
    </div>
    <div class="ad-kpis">
      <div class="ad-kpi ad-kpi--money"><span class="ad-kpi__ic">${ico("card", 20)}</span><b>${won(t.gmv)}<em>원</em></b><span class="ad-kpi__l">거래액(GMV) · ${rng.label}${tip("고객이 실제 결제한 총액 합계입니다. 서비스료·VAT가 포함된 금액이며, 쿠폰·포인트 할인이 적용된 최종 결제액 기준입니다.")}</span></div>
      <div class="ad-kpi ad-kpi--money hl"><span class="ad-kpi__ic">${ico("shield", 20)}</span><b>${won(t.wylie)}<em>원</em></b><span class="ad-kpi__l">와일리 수수료(매출)${tip("거래액(GMV) − 호스트 정산 − 파트너 정산 − 패키지 공급가 = 와일리 매출. 호스트·파트너·패키지 일괄 5% 수수료이며(회원 서비스료 0%), VAT 포함 금액입니다.")}</span></div>
      <div class="ad-kpi ad-kpi--money"><span class="ad-kpi__ic">${ico("home", 20)}</span><b>${won(t.host)}<em>원</em></b><span class="ad-kpi__l">호스트 정산${tip("공간 대관료(회원 서비스료 0%)에서 호스트 수수료 5%를 차감한 실정산액입니다.")}</span></div>
      <div class="ad-kpi ad-kpi--money"><span class="ad-kpi__ic">${ico("briefcase", 20)}</span><b>${won(t.vendor)}<em>원</em></b><span class="ad-kpi__l">파트너 정산${tip("파트너 견적(낙찰) 금액에서 파트너 수수료 5%를 차감한 실정산액입니다.")}</span></div>
      <div class="ad-kpi ad-kpi--money ad-kpi--mkt"><span class="ad-kpi__ic">${ico("ticket", 20)}</span><b>-${won(t.marketing)}<em>원</em></b><span class="ad-kpi__l">쿠폰 마케팅비${tip("플랫폼(와일리) 부담 쿠폰의 할인액 합계입니다. 공급자에게는 정상가 기준으로 정산되고, 이 금액만큼 와일리 수취분(수수료 매출)에서 차감됩니다. 공급자 부담 쿠폰은 포함되지 않습니다.")}</span></div>
    </div>
    <h3 class="ad-h3">${ico("stats", 18)} ${trend.daily ? "일별" : "월별"} 매출 추이 <span class="ad-h3__s">${rng.label} · GMV</span></h3>
    <div class="ad-chart">${trend.data.length ? bars(trend.data, "원") : `<p class="ad-hint" style="padding:20px 0">해당 기간 거래가 없습니다.</p>`}</div>
    <div class="ad-note ad-note--pg">${ico("shield", 16)}<div class="ad-note__tx"><b>PG사 자동 분리정산</b> — 고객 결제 시 PG가 와일리 수수료와 공급자 정산금을 분리해 정산주기에 따라 <b>각 계좌로 자동 입금</b>합니다. 운영자의 수동 지급·세금계산서 발행 절차는 없습니다.<span class="ad-note__s">이용일 경과 건은 정산 완료, 이용 전 건은 정산 예정으로 표시됩니다.</span></div></div>
    <div class="ad-secbar">
      <h3 class="ad-h3" style="margin:0">${ico("wallet", 18)} 공급자별 자동 분리정산 <span class="ad-h3__s">정산주기 ${rng.label}</span></h3>
      <div class="ad-secbar__act">
        <div class="ad-segtabs">${stTabs.map(([v, l]) => `<button class="ad-seg${setStatusF === v ? " is-active" : ""}" data-setstatus="${v}">${l} <b>${stc[v] || 0}</b></button>`).join("")}</div>
        <button class="btn btn--soft btn--xs" data-xls2="settlerev">${ico("upload", 13)} 매출 거래내역</button>
        <button class="btn btn--soft btn--xs" data-xls="settle">${ico("upload", 13)} 공급자 정산</button>
      </div>
    </div>
    ${searchBar("set", "공급자명 · 유형 검색")}
    <div class="ad-table ad-table--x">${sortHead("set", "ad-tr--set", [{ key: "name", label: "공급자" }, { key: "role", label: "유형" }, { key: "count", label: "건수" }, { key: "gross", label: "거래액" }, { key: "wylie", label: "와일리 수수료" }, { key: "provider", label: "정산금" }, { key: "status", label: "정산상태" }])}
    ${provF.length ? provF.map((p) => {
      const settled = pgStatus(p) === "settled";
      const stBadge = settled ? `<span class="ad-st ad-st--ok">정산 완료</span>` : `<span class="ad-st ad-st--req">정산 예정</span>`;
      const parts = []; if (p.settled > 0) parts.push(`완료 ${won(p.settled)}`); if (p.scheduled > 0) parts.push(`예정 ${won(p.scheduled)}`);
      const subAmt = parts.length ? `<span class="ad-st__sub">${parts.join(" · ")}원</span>` : "";
      // 와일리 수수료(플랫폼 이용료) 국세청 자동발급 세금계산서 조회 — 정산금 아래에 배치
      const taxLink = p.role === "pkg" ? "" : `<button class="ad-linkbtn ad-linkbtn--tax" data-taxview="${p.id}">${ico("doc", 12)} 국세청 승인 조회</button>`;
      return `<div class="ad-tr ad-tr--set" data-prow="${p.id}"><span class="ad-tr__id"><b>${p.name}</b></span><span class="ad-set-role"><span class="ad-role ad-role--${p.role === "pkg" ? "admin" : p.role}">${p.role === "host" ? "호스트" : p.role === "vendor" ? "파트너" : "패키지"}</span></span><span data-label="건수"><button class="ad-linkbtn" data-payoutdetail="${p.id}" data-prole="${p.role}">${p.count}건 ${ico("list", 13)}</button></span><span data-label="거래액">${won(p.gross)}원</span><span data-label="와일리 수수료">${won(p.wylie)}원${p.role !== "pkg" ? feeBadge(p.role, p.id) : ""}</span><span class="ad-set-pay" data-label="정산금"><b>${won(p.provider)}원</b>${taxLink}</span><span class="ad-st__wrap" data-label="정산상태">${stBadge}${subAmt}</span></div>`;
    }).join("") : `<div class="mp-empty">해당 상태의 정산 건이 없습니다.</div>`}</div>

    ${(function () {
      const deps = window.DEPOSITS ? window.DEPOSITS.list() : [];
      if (!deps.length) return "";
      let held = 0, ref = 0, ded = 0;
      deps.forEach((d) => { const st = window.DEPOSITS.statusOf(d, todayStr); if (st.k === "held") held += d.amount; else { ref += st.refund; if (st.k === "deducted") ded += d.deduct; } });
      return `<div class="ad-secbar" style="margin-top:26px"><h3 class="ad-h3" style="margin:0">${ico("shield", 18)} 청소 보증금 <span class="ad-h3__s">예수금 · 매출·GMV·정산에 미포함 · 이용 후 환불</span></h3></div>
      <div class="ad-kpis">
        <div class="ad-kpi"><span class="ad-kpi__ic">${ico("shield", 20)}</span><b>${won(held)}<em>원</em></b><span class="ad-kpi__l">예치 중 (환불 예정)</span></div>
        <div class="ad-kpi"><span class="ad-kpi__ic">${ico("refund", 20)}</span><b>${won(ref)}<em>원</em></b><span class="ad-kpi__l">환불 완료</span></div>
        <div class="ad-kpi"><span class="ad-kpi__ic">${ico("alert", 20)}</span><b>${won(ded)}<em>원</em></b><span class="ad-kpi__l">파손 차감</span></div>
      </div>
      <div class="ad-deps">${deps.map((d) => { const st = window.DEPOSITS.statusOf(d, todayStr); return `<div class="ad-dep"><span class="ad-dep__nm"><b>${d.spaceName}</b><em>${window.PRIVACY ? window.PRIVACY.name(d.guestName) : d.guestName} · ${d.date}</em></span><span class="ad-dep__amt">${won(d.amount)}원</span><span class="ad-dep__st ad-dep__st--${st.k}">${st.label}</span><span class="ad-dep__act">${st.k === "held" ? `<button class="btn btn--soft btn--xs" data-depded="${d.id}">파손 차감</button>` : (st.k === "deducted" ? `차감 ${won(d.deduct)} · 환불 ${won(st.refund)}원` : "")}</span></div>`; }).join("")}</div>
      <p class="ad-hint">💡 보증금은 <b>이용료와 별도로 카드 결제</b>되는 예수금이라 매출·수수료·정산에 포함되지 않습니다. 이용일이 지나면 자동 환불로 표시되며, 파손 시 차감 처리할 수 있어요.</p>`;
    })()}

    <div class="ad-secbar" style="margin-top:26px">
      <h3 class="ad-h3" style="margin:0">${ico("user", 18)} 회원별 매출 TOP 10 <span class="ad-h3__s">회원 클릭 시 이용 내역</span></h3>
      <button class="btn btn--soft btn--xs" data-xls="members">${ico("upload", 13)} 엑셀 다운로드</button>
    </div>
    <div class="ad-table">${sortHead("mem", "ad-tr--mem", [{ key: "name", label: "회원" }, { key: "count", label: "예약" }, { key: "spent", label: "누적 결제액" }])}
    ${memS.length ? memS.map((m, idx) => {
      const open = memOpen.has(m.id);
      const det = open ? memberDetail(m.id) : null;
      const kindTag = (k) => `<span class="ad-mtag ad-mtag--${k === "호스트" ? "host" : k === "맞춤업체" ? "vendor" : "pkg"}">${k}</span>`;
      return `<div class="ad-tr ad-tr--mem ad-tr--click${open ? " is-open" : ""}" data-memexp="${m.id}"><span class="ad-tr__id"><span class="ad-mem__rk">${idx + 1}</span><b>${window.PRIVACY ? window.PRIVACY.name(m.name) : m.name}</b><em>${m.id}</em></span><span>${m.count}건</span><span class="ad-mem__amt"><b>${won(m.spent)}원</b><i class="ad-mem__chev">${ico("chevron", 14)}</i></span></div>${open ? `<div class="ad-memdet">${det.length ? `<div class="ad-memdet__row ad-memdet__row--h"><span>#</span><span>이용일</span><span>구분</span><span>업체·공간명</span><span>금액</span></div>` + det.map((d, i) => `<div class="ad-memdet__row"><span class="ad-memdet__n">${i + 1}</span><span>${d.date}</span><span>${kindTag(d.kind)}</span><span class="ad-memdet__nm">${(d.name || "").replace(/</g, "&lt;")}</span><span class="ad-memdet__amt"><b>${won(d.amt)}원</b></span></div>`).join("") : `<div class="ad-memdet__empty">이용 내역이 없습니다.</div>`}</div>` : ""}`;
    }).join("") : `<div class="mp-empty">데이터가 없습니다.</div>`}</div>`;
}
// 현재 기간의 공급자 목록 재계산(일괄처리·전체선택용)
function settleProviders() {
  const rng = settleRange(); period = rng.key;
  const inR = (d) => (!rng.from || (d || "") >= rng.from) && (!rng.to || (d || "") <= rng.to);
  const mb = bookings().filter((b) => inR(b.date));
  const mq = quotes().filter((q) => inR(q.date || (window.REQUESTS.find(q.requestId) || {}).date || ""));
  const set = OPS.settlement(mb, mq, userMap());
  return { rng, provs: Object.values(set.byProvider) };
}
// 수수료율 이력 편집기 — 적용 시작일 기반(결제일 기준 정산, 과거 불변)
function feeBadge(kind, id) { const FR = window.FEERATES; const n = FR.history(id).length; if (n > 1) return ` <em class="ad-set-rate ad-set-rate--mix" title="적용 시작일 기반 · 거래별 요율 상이(결제일 기준 합산)">혼합</em>`; return ` <em class="ad-set-rate"${FR.isCustom(id) ? ' title="개별 수수료율"' : ""}>${FR.pctOf(kind, id)}%${FR.isCustom(id) ? "★" : ""}</em>`; }
function _feeAfterChange(kind) { try { if (kind === "pkg") renderPkgAdmin(); else { renderSettle(); renderUsers(); } if (typeof renderFees === "function") renderFees(); } catch (e) {} }
function openFeeEditor(id, kind, name) {
  const FR = window.FEERATES; if (!FR) return;
  const hist = FR.history(id);
  const cur = FR.pctOn(kind, id, todayStr);
  modalCard.dataset.feeid = id; modalCard.dataset.feekind = kind; modalCard.dataset.feename = name || id;
  const rows = hist.length
    ? hist.map((h, i) => `<div class="fee-rule"><span class="fee-rule__from">${h.from ? h.from + " 부터" : "초기부터"}</span><b class="fee-rule__pct">${h.pct}%</b><button type="button" class="btn btn--ghost btn--xs" data-feedel="${i}">삭제</button></div>`).join("")
    : `<p class="ad-hint" style="margin:0 0 4px">등록된 요율 이력이 없어요. 기본율 <b>${FR.DEF[kind]}%</b> 적용 중.</p>`;
  modal.hidden = false; modalCard.classList.remove("modal__card--wide");
  modalCard.innerHTML = `<div class="modal__head"><b>수수료율 관리 · ${name || ""}</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="mp__sub" style="margin-bottom:12px">현재 적용 요율 <b style="color:var(--accent)">${cur}%</b> · 기본율 ${FR.DEF[kind]}%</p>
    <div class="fee-rules">${rows}</div>
    <div class="fee-add">
      <div class="fee-add__f"><label>적용 시작일</label><input type="date" id="feeFrom" value="${todayStr}" /></div>
      <div class="fee-add__f"><label>요율(%)</label><input type="number" id="feePct" min="0" max="50" step="0.1" placeholder="${FR.DEF[kind]}" /></div>
      <button type="button" class="btn btn--accent btn--sm" id="feeAddBtn">규칙 추가</button>
    </div>
    <p class="ad-hint">입력한 <b>적용 시작일 이후 거래(결제일 기준)</b>부터 이 요율이 적용되고, 이전 거래는 <b>당시 요율로 그대로 유지</b>됩니다. 같은 시작일을 다시 넣으면 교체돼요.</p>`;
}

// 수수료율 관리 탭 — 공급자·패키지별 현재 요율 목록(정렬·검색·행 클릭 편집)
function renderFees() {
  const el = $("#adFees"); if (!el) return;
  const FR = window.FEERATES;
  const set = OPS.settlement(bookings(), quotes(), userMap());
  const rows = [];
  usersAll().filter((u) => u.role === "host" || u.role === "vendor").forEach((u) => {
    const p = set.byProvider[u.userId];
    rows.push({ id: u.userId, kind: u.role, name: u.nick || u.name, rate: FR.pctOf(u.role, u.userId), hist: FR.history(u.userId).length, custom: FR.isCustom(u.userId), count: p ? p.count : 0 });
  });
  (typeof PACKAGES !== "undefined" ? PACKAGES : []).forEach((pk) => {
    const id = "pkg:" + pk.id;
    rows.push({ id: id, kind: "pkg", name: pk.title, rate: FR.pctOf("pkg", id), hist: FR.history(id).length, custom: FR.isCustom(id), count: 0 });
  });
  const kindKo = (k) => (k === "host" ? "호스트" : k === "vendor" ? "파트너" : "패키지");
  const q = _sq("fee");
  let list = q ? rows.filter((r) => _hit(q, r.name, kindKo(r.kind))) : rows;
  list = applySort(list, "fee", { name: (r) => r.name, kind: (r) => r.kind, rate: (r) => r.rate, hist: (r) => r.hist, count: (r) => r.count });
  if (!sortState.fee) list = list.slice().sort((a, b) => (b.rate - a.rate) || (b.count - a.count)); // 기본: 요율 높은순
  const custN = rows.filter((r) => r.custom).length, mixN = rows.filter((r) => r.hist > 1).length;
  el.innerHTML = `
    <h3 class="ad-h3">${ico("card", 18)} 수수료율 관리 <span class="ad-h3__s">공급자·패키지 ${rows.length} · 개별설정 ${custN} · 혼합 ${mixN} — 열 제목 클릭으로 오름/내림차순</span></h3>
    ${searchBar("fee", "공급자명 · 유형 검색")}
    <div class="ad-table ad-table--x">${sortHead("fee", "ad-tr--fee", [{ key: "name", label: "공급자" }, { key: "kind", label: "유형" }, { key: "rate", label: "현재 수수료율" }, { key: "hist", label: "요율 이력" }, { key: "count", label: "정산 건수" }, { label: "관리" }])}
    ${list.length ? list.map((r) => `<div class="ad-tr ad-tr--fee ad-tr--click" data-feeeditor="${r.id}" data-feekind="${r.kind}" data-feename="${(r.name || "").replace(/"/g, "&quot;")}">
      <span class="ad-tr__id"><b>${r.name}</b></span>
      <span data-label="유형"><span class="ad-role ad-role--${r.kind === "pkg" ? "admin" : r.kind}">${kindKo(r.kind)}</span></span>
      <span data-label="현재 수수료율"><b class="ad-fee-rate${r.hist > 1 ? " is-mix" : ""}">${r.hist > 1 ? "혼합 · 현재 " + r.rate + "%" : r.rate + "%"}</b> <em class="ad-fee-tag ad-fee-tag--${r.custom ? "cust" : "def"}">${r.custom ? "개별" : "기본"}</em></span>
      <span data-label="요율 이력">${r.hist}건</span>
      <span data-label="정산 건수">${r.count}건</span>
      <span data-label="관리"><span class="ad-linkbtn">${ico("edit", 12)} 편집</span></span>
    </div>`).join("") : `<div class="mp-empty">해당 공급자가 없습니다.</div>`}</div>
    <p class="ad-hint">💡 요율 변경은 <b>적용 시작일</b> 기준이라 이전 결제 건은 당시 요율로 유지됩니다(과거 불변). 행을 클릭해 요율 이력을 편집하세요.</p>`;
}

// 국세청 자동발급 세금계산서 조회 (와일리 플랫폼 수수료분) — 데모: 모의 승인번호
function openTaxView(pid) {
  const { rng, provs } = settleProviders();
  const p = provs.find((x) => x.id === pid); if (!p) return;
  // 국세청 e세로 전자세금계산서 승인번호 형식(모의): YYYYMMDD-8자리-8자리
  const seed = (pid + rng.key).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd = (n, len) => String((seed * n) % Math.pow(10, len)).padStart(len, "0");
  const approvNo = `${rng.key.replace("-", "")}01-${rnd(7, 8)}-${rnd(13, 8)}`;
  modal.hidden = false; modalCard.className = "modal__card modal__card--narrow";
  modalCard.innerHTML = `<div class="modal__head"><b>전자세금계산서 · 국세청 승인</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="ad-hint" style="margin:-2px 0 14px">와일리 <b>플랫폼 이용료(수수료)</b>에 대해 결제 시 <b>국세청 e세로</b>로 전자세금계산서가 자동 발급됩니다. 별도 수기 발행이 없습니다.</p>
    <div class="ad-taxbox">
      <div class="ad-taxbox__row"><span>공급받는 자</span><b>${p.name} (${p.role === "host" ? "호스트" : "파트너"})</b></div>
      <div class="ad-taxbox__row"><span>공급가액(수수료)</span><b>${won(Math.round(p.wylie / 1.1))}원</b></div>
      <div class="ad-taxbox__row"><span>부가세(10%)</span><b>${won(p.wylie - Math.round(p.wylie / 1.1))}원</b></div>
      <div class="ad-taxbox__row ad-taxbox__row--tot"><span>합계</span><b>${won(p.wylie)}원</b></div>
      <div class="ad-taxbox__row"><span>발급 상태</span><b class="ad-st ad-st--ok">국세청 승인 완료</b></div>
      <div class="ad-taxbox__row"><span>승인번호</span><b class="ad-taxbox__no">${approvNo}</b></div>
    </div>
    <a class="btn btn--soft btn--block" href="https://www.hometax.go.kr" target="_blank" rel="noopener" style="margin-top:14px">${ico("link", 14)} 국세청 홈택스에서 조회</a>`;
}
function exportXls(which) {
  if (!_xls.provsRows) renderSettle();
  if (which === "settle") { downloadCSV(`정산_공급자별_${_xls.label}.csv`, _xls.provsRows); toast(`공급자 정산 ${_xls.provsRows.length - 1}건을 내려받았어요`); }
  else { downloadCSV(`회원매출_TOP_${_xls.label}.csv`, _xls.memRows); toast(`회원 매출 ${_xls.memRows.length - 1}건을 내려받았어요`); }
}
// 공급자 정산 상세 — 완료된 예약/견적 내역 + 금액
function openPayoutDetail(id, role) {
  const name = userMap()[id] || id;
  let rows = [], gross = 0, provider = 0, wylie = 0;
  const pctOn = (k, fid, d) => (window.FEERATES ? window.FEERATES.pctOn(k, fid, d) : "");
  if (role === "host") {
    bookings().filter((b) => b.hostId === id && b.status === "confirmed" && b.paid !== false && !b.pkg).sort((a, b) => (a.date < b.date ? 1 : -1)).forEach((b) => { const pd = OPS.payDateOf(b); const sp = OPS.split("host", b.total, OPS.rateFor("host", id, pd)); gross += sp.gross; provider += sp.provider; wylie += sp.wylie; rows.push({ date: b.date, name: b.spaceName, guest: b.guestName, gross: sp.gross, payout: sp.provider, pct: pctOn("host", id, pd), done: b.date < todayStr }); });
  } else if (role === "vendor") {
    quotes().filter((q) => q.vendorId === id && q.status === "accepted" && q.paid).sort((a, b) => ((a.date || "") < (b.date || "") ? 1 : -1)).forEach((q) => { const pd = OPS.payDateOf(q); const sp = OPS.split("vendor", +q.price || 0, OPS.rateFor("vendor", id, pd)); gross += sp.gross; provider += sp.provider; wylie += sp.wylie; rows.push({ date: q.date || "-", name: (window.reqCatById ? reqCatById(q.cat).label : q.cat) + " 견적", guest: "", gross: sp.gross, payout: sp.provider, pct: pctOn("vendor", id, pd), done: (q.date || "") < todayStr }); });
  } else {
    bookings().filter((b) => b.pkg && b.status === "confirmed" && b.paid !== false).sort((a, b) => (a.date < b.date ? 1 : -1)).forEach((b) => { const pd = OPS.payDateOf(b); const sp = OPS.split("pkg", b.total, OPS.rateFor("pkg", "pkg:" + b.pkgId, pd)); gross += sp.gross; provider += sp.provider; wylie += sp.wylie; rows.push({ date: b.date, name: b.spaceName, guest: b.guestName, gross: sp.gross, payout: sp.provider, pct: pctOn("pkg", "pkg:" + b.pkgId, pd), done: b.date < todayStr }); });
  }
  const doneN = rows.filter((r) => r.done).length;
  const roleKo2 = role === "host" ? "호스트" : role === "vendor" ? "파트너" : "패키지";
  _payoutXls = { name: `정산명세서_${name}_${period}.csv`, rows: [["공급자", "유형", "이용일", "항목", "고객", "거래액(원)", "적용요율(%)", "정산금(원)", "정산상태"]].concat(rows.map((r) => [name, roleKo2, r.date, r.name, r.guest || "", r.gross, r.pct, r.payout, r.done ? "정산완료" : "정산예정"])) };
  modal.hidden = false;
  modalCard.classList.add("modal__card--wide");
  modalCard.innerHTML = `<div class="modal__head"><b>${ico(role === "host" ? "home" : role === "vendor" ? "briefcase" : "gift", 16)} ${name} 정산 내역</b><button class="btn btn--soft btn--xs" data-payoutxls="1" style="margin-left:auto;margin-right:8px">${ico("upload", 13)} 정산명세서</button><button class="modal__x" data-mclose>✕</button></div>
    <div class="ad-pdsum"><span>완료 <b>${doneN}</b>/${rows.length}건</span><span>거래액 <b>${won(gross)}원</b></span><span>수수료 <b>${won(wylie)}원</b></span><span class="ad-pdsum__pay">정산금 <b>${won(provider)}원</b></span></div>
    <div class="ad-pdtable">
      <div class="ad-pdrow ad-pdrow--h"><span>이용일</span><span>${role === "vendor" ? "견적" : "공간/고객"}</span><span>거래액</span><span>정산금</span><span>상태</span></div>
      ${rows.length ? rows.map((r) => `<div class="ad-pdrow"><span>${r.date}</span><span class="ad-pdrow__nm">${r.name}${r.guest ? ` <em>· ${r.guest}</em>` : ""}</span><span>${won(r.gross)}원</span><span><b>${won(r.payout)}원</b>${r.pct !== "" ? ` <em class="ad-pdrate">${r.pct}%</em>` : ""}</span><span>${r.done ? `<span class="ad-st ad-st--ok">완료</span>` : `<span class="ad-st ad-st--pend">예정</span>`}</span></div>`).join("") : `<div class="mp-empty">내역이 없습니다.</div>`}
    </div>
    <p class="modal__note">‘완료’는 이용일이 지난 건, ‘예정’은 다가오는 확정 건입니다.</p>`;
}

// ======================= 환불·주문 관리 =======================
// 결제(주문) 1건 = 함께 결제한 항목 묶음 = 승인번호 1개. 항목별 부분 환불 + 정산 회수(클로백) 지원.
let ordF = "all";
const _catLabel = (c) => (window.reqCatById ? reqCatById(c).label : c);
function collectOrders() {
  const um = userMap();
  const reqBy = {}; window.REQUESTS.list().forEach((r) => (reqBy[r.id] = r));
  const orders = [];
  // 1) 견적 결제 — 주문(orderId) 단위 그룹
  const qs = quotes().filter((q) => q.status === "accepted" && (q.paid || q.refunded));
  const grp = {}; qs.forEach((q) => { const k = q.orderId || ("q:" + q.id); (grp[k] = grp[k] || []).push(q); });
  Object.keys(grp).forEach((k) => {
    const g = grp[k], r = reqBy[g[0].requestId] || {};
    const total = g[0].orderTotal || g.reduce((a, x) => a + (+x.price || 0), 0);
    const paidTotal = g.reduce((a, x) => a + (x.paid ? (+x.price || 0) : 0), 0);
    const date = r.date || g[0].date || "";
    const ts = g[0].paidAt || g[0].ts || 0;
    orders.push({
      type: "quote", key: k, id: k, date, ts,
      customer: r.memberName || um[r.memberId] || "회원",
      title: g.map((x) => _catLabel(x.cat)).join(" · "),
      providers: g.map((x) => x.cat === "space" ? (x.spaceName || "공간") : (x.vendorName || um[x.vendorId] || x.vendorId)),
      total, paidTotal, refunded: g.every((x) => x.refunded && !x.paid),
      approval: window.OPS ? OPS.payInfo({ id: k, date, total, ts }).approvalNo : "",
    });
  });
  // 2) 예약 결제(공간·패키지) — 견적에서 온 건(fromQuote)은 위 주문에 포함되므로 제외
  bookings().filter((b) => (b.paid !== false || b.status === "cancelled") && !b.fromQuote && (b.paid || b.status === "cancelled")).forEach((b) => {
    const total = +b.total || 0, refunded = b.status === "cancelled";
    orders.push({
      type: "booking", key: b.id, id: b.id, date: b.date || "", ts: b.ts || 0,
      customer: b.guestName || b.guestId || "회원",
      title: b.pkg ? "📦 패키지" : "공간 대관",
      providers: [b.spaceName || "공간"],
      total, paidTotal: refunded ? (total - ((b.refund && b.refund.amount) || total)) : total, refunded,
      approval: window.OPS ? OPS.payInfo({ id: b.orderId || b.id, date: b.date, total: b.orderTotal || total, ts: b.paidAt || b.ts }).approvalNo : "",
    });
  });
  return orders.sort((a, b) => (b.ts || 0) - (a.ts || 0));
}
const _ordStatus = (o) => o.refunded ? "refunded" : (o.paidTotal < o.total ? "partial" : "paid");
function renderOrders() {
  const el = $("#adOrders"); if (!el) return;
  const orders = collectOrders();
  const cnt = { all: orders.length, paid: 0, partial: 0, refunded: 0 };
  let paidSum = 0, refundSum = 0;
  orders.forEach((o) => { cnt[_ordStatus(o)]++; paidSum += o.paidTotal; refundSum += (o.total - o.paidTotal); });
  const tabs = [["all", "전체"], ["paid", "결제완료"], ["partial", "부분환불"], ["refunded", "환불완료"]];
  let list = ordF === "all" ? orders : orders.filter((o) => _ordStatus(o) === ordF);
  const oq = _sq("ord"); if (oq) list = list.filter((o) => _hit(oq, o.customer, o.title, o.approval, o.date, (o.providers || []).join(" ")));
  const stBadge = (o) => { const s = _ordStatus(o); return s === "refunded" ? `<span class="ad-st ad-st--rej">환불완료</span>` : s === "partial" ? `<span class="ad-st ad-st--pend">부분환불</span>` : `<span class="ad-st ad-st--ok">결제완료</span>`; };
  el.innerHTML = `
    <div class="ad-kpis">
      <div class="ad-kpi"><span class="ad-kpi__ic">${ico("cal", 20)}</span><b>${orders.length}<em>건</em></b><span class="ad-kpi__l">전체 주문(결제 회차)</span></div>
      <div class="ad-kpi ad-kpi--money"><span class="ad-kpi__ic">${ico("card", 20)}</span><b>${won(paidSum)}<em>원</em></b><span class="ad-kpi__l">유효 결제액</span></div>
      <div class="ad-kpi ad-kpi--mkt"><span class="ad-kpi__ic">${ico("refund", 20)}</span><b>${won(refundSum)}<em>원</em></b><span class="ad-kpi__l">환불액 · ${cnt.partial + cnt.refunded}건</span></div>
    </div>
    <div class="ad-note ad-note--pg">${ico("shield", 16)}<div class="ad-note__tx"><b>결제 1회 = 주문 1건 = 승인번호 1개</b> — 함께 결제한 항목은 하나의 주문(승인번호)으로 묶입니다. 나눠 결제하면 각 회차가 별도 주문이 되며, <b>항목별 부분 환불</b>과 이용일 경과 건의 <b>정산 회수(클로백)</b>를 지원합니다.</div></div>
    <div class="ad-segtabs" style="margin-bottom:12px">${tabs.map(([v, l]) => `<button class="ad-seg${ordF === v ? " is-active" : ""}" data-ordf="${v}">${l} <b>${cnt[v] || 0}</b></button>`).join("")}</div>
    ${searchBar("ord", "고객 · 항목 · 승인번호 검색")}
    <div class="ad-table ad-table--x">
      <div class="ad-tr ad-tr--h ad-tr--ord"><span>일시</span><span>주문 · 승인번호</span><span>고객</span><span>항목</span><span>금액</span><span>상태</span><span>처리</span></div>
      ${list.length ? list.map((o) => {
        const prov = (o.providers || []); const provTxt = prov.slice(0, 2).join(", ") + (prov.length > 2 ? ` 외 ${prov.length - 2}` : "");
        const act = o.refunded ? `<span class="ad-refund-done">환불완료</span>` : (o.type === "quote" ? `<button class="btn btn--xs ad-del" data-orderopen="${o.key}">환불</button>` : `<button class="btn btn--xs ad-del" data-refund="${o.id}">환불</button>`);
        return `<div class="ad-tr ad-tr--ord"><span data-label="일시">${o.date || "-"}</span><span class="ad-tr__id" data-label="주문"><b>${o.type === "quote" ? "견적 결제" : o.title}</b><em>승인 ${o.approval}</em></span><span data-label="고객">${window.PRIVACY ? window.PRIVACY.name(o.customer) : o.customer}</span><span class="ad-ord__it" data-label="항목">${o.title}<i>${provTxt}</i></span><span data-label="금액">${won(o.total)}원${o.paidTotal < o.total && o.paidTotal > 0 ? `<em class="ad-ord__pr">유효 ${won(o.paidTotal)}원</em>` : ""}</span><span data-label="상태">${stBadge(o)}</span><span class="ad-tr__act" data-label="처리">${act}</span></div>`;
      }).join("") : `<div class="mp-empty">해당 주문이 없습니다.</div>`}
    </div>`;
}
// 견적 취소 종류(공간/부대서비스)에 따른 정책 kind
const _qCancelKind = (q) => (q.cat === "space" ? "space" : "vendor");
// 견적 결제 1건 취소(DB 반영만) — 이용일까지 남은 일수별 환불율 자동 적용, 위약금은 정산 유지
function _refundQuoteRec(q) {
  const r = window.REQUESTS.find(q.requestId) || {};
  const c = OPS.cancelCalc(_qCancelKind(q), +q.price || 0, r.date || q.date, todayStr);
  window.QUOTES.update(q.id, { paid: false, refunded: true, refundAmt: c.refund, penalty: c.penalty, refundRate: c.rate, refundDays: c.days, refundTs: Date.now() });
  const bk = bookings().find((b) => b.fromQuote === q.id);
  if (bk) window.BOOKINGS.update(bk.id, { status: "cancelled", paid: false, refund: { amount: c.refund, penalty: c.penalty, rate: c.rate, days: c.days, kind: "policy", ts: Date.now() } });
  if (window.NOTIF) window.NOTIF.add({ forUser: q.vendorId, title: "결제 취소·환불", sub: `${_catLabel(q.cat)} · 환불 ${won(c.refund)}원${c.penalty ? ` · 위약금 ${won(c.penalty)}원(정산 유지)` : ""}`, link: "mypage.html?tab=vquote" });
  return c;
}
function _recalcReqPaid(reqId) { const rest = window.QUOTES.forReq(reqId).filter((x) => x.status === "accepted"); window.REQUESTS.update(reqId, { paid: rest.length > 0 && rest.every((x) => x.paid) }); }
function refundQuote(qid) {
  const q = quotes().find((x) => x.id === qid); if (!q || !q.paid) { toast("환불할 결제가 아니에요"); return; }
  const r = window.REQUESTS.find(q.requestId) || {}; const kind = _qCancelKind(q);
  const c = OPS.cancelCalc(kind, +q.price || 0, r.date || q.date, todayStr);
  if (!confirm(`${_catLabel(q.cat)} 취소 — ${OPS.cancelTierLabel(kind, c.days)}\n결제 ${won(+q.price || 0)}원 → 환불 ${won(c.refund)}원 · 위약금 ${won(c.penalty)}원(공급자 정산 유지)\n\n진행할까요?`)) return;
  _refundQuoteRec(q); _recalcReqPaid(q.requestId);
  if (window.AUDIT) window.AUDIT.log("edit", "quote:" + qid, "견적 취소 환불 " + won(c.refund) + "원 · 위약금 " + won(c.penalty));
  if (modalCard.querySelector("[data-orderrefund]") || modalCard.querySelector("[data-qrefund]")) openOrderRefund(q.orderId || ("q:" + q.id));
  renderAll(); toast(`환불 ${won(c.refund)}원 처리${c.penalty ? ` · 위약금 ${won(c.penalty)}원 정산 유지` : ""}`);
}
function refundOrder(key) {
  const g = quotes().filter((q) => (q.orderId || ("q:" + q.id)) === key && q.status === "accepted" && q.paid);
  if (!g.length) { toast("환불할 결제가 없어요"); return; }
  const r = window.REQUESTS.find(g[0].requestId) || {};
  const calc = g.map((q) => OPS.cancelCalc(_qCancelKind(q), +q.price || 0, r.date || q.date, todayStr));
  const refundSum = calc.reduce((a, c) => a + c.refund, 0), penSum = calc.reduce((a, c) => a + c.penalty, 0);
  if (!confirm(`이 주문의 결제 ${g.length}건을 취소 정책대로 환불할까요?\n총 결제 ${won(g.reduce((a, x) => a + (+x.price || 0), 0))}원 → 환불 ${won(refundSum)}원 · 위약금 ${won(penSum)}원(정산 유지)`)) return;
  g.forEach((q) => _refundQuoteRec(q)); _recalcReqPaid(g[0].requestId);
  if (window.AUDIT) window.AUDIT.log("edit", "order:" + key, "주문 취소 환불 " + won(refundSum) + "원 · 위약금 " + won(penSum));
  closeModal(); renderAll(); toast(`주문 환불 ${won(refundSum)}원 처리${penSum ? ` · 위약금 ${won(penSum)}원 정산 유지` : ""}`);
}
function openOrderRefund(key) {
  const g = quotes().filter((q) => (q.orderId || ("q:" + q.id)) === key && q.status === "accepted");
  if (!g.length) return;
  const r = window.REQUESTS.find(g[0].requestId) || {}; const um = userMap();
  const total = g[0].orderTotal || g.reduce((a, x) => a + (+x.price || 0), 0);
  const approval = window.OPS ? OPS.payInfo({ id: key, date: r.date, total, ts: g[0].paidAt }).approvalNo : "";
  const paidG = g.filter((q) => q.paid);
  const refundSum = paidG.reduce((a, x) => a + OPS.cancelCalc(_qCancelKind(x), +x.price || 0, r.date || x.date, todayStr).refund, 0);
  modal.hidden = false; modalCard.classList.add("modal__card--wide");
  modalCard.innerHTML = `<div class="modal__head"><b>${ico("refund", 16)} 주문 취소·환불 · 승인 ${approval}</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="share__sub">${r.memberName || "회원"} · ${r.region || ""} · 이용일 ${r.date || "-"}</p>
    <div class="ad-pdtable">
      <div class="ad-pdrow ad-pdrow--ord ad-pdrow--h"><span>항목</span><span>공급자 · 취소 구간</span><span>결제</span><span>환불</span><span>위약금</span><span>처리</span></div>
      ${g.map((q) => { const kind = _qCancelKind(q); const c = OPS.cancelCalc(kind, +q.price || 0, r.date || q.date, todayStr); return `<div class="ad-pdrow ad-pdrow--ord"><span>${_catLabel(q.cat)}</span><span class="ad-pdrow__nm">${q.cat === "space" ? (q.spaceName || "공간") : (q.vendorName || um[q.vendorId] || q.vendorId)}<em>${OPS.cancelTierLabel(kind, c.days)}</em></span><span>${won(+q.price || 0)}원</span><span class="ad-pdrow__rf">${won(q.refunded ? (q.refundAmt || 0) : c.refund)}원</span><span class="ad-pdrow__pen">${won(q.refunded ? (q.penalty || 0) : c.penalty)}원</span><span>${q.refunded ? `<span class="ad-st ad-st--rej">환불완료</span>` : `<button class="btn btn--xs ad-del" data-qrefund="${q.id}">환불</button>`}</span></div>`; }).join("")}
    </div>
    ${paidG.length ? `<button class="btn btn--accent btn--block" data-orderrefund="${key}" style="margin-top:12px">정책대로 전액 취소 (환불 ${won(refundSum)}원)</button>` : `<p class="modal__note">모든 항목이 환불되었습니다.</p>`}
    <p class="modal__note">이용일까지 남은 기간에 따라 환불율이 자동 적용됩니다. 공간: <b>${OPS.cancelPolicyText("space")}</b> / 부대서비스: <b>${OPS.cancelPolicyText("vendor")}</b>. 위약금은 공급자에게 정산되고 환불액만 고객에게 반환됩니다.</p>`;
}

// ======================= 견적 요청 관리 =======================
let rfpF = "all";
function rfpStatus(r) {
  const qs = window.QUOTES.forReq(r.id);
  if (r.blinded) return { key: "blind", label: "블라인드", cls: "sus", bids: qs.length };
  if (qs.some((q) => q.paid)) return { key: "paid", label: "결제완료", cls: "ok", bids: qs.length };
  if (qs.some((q) => q.status === "accepted")) return { key: "selected", label: "선정완료", cls: "ok", bids: qs.length };
  if (qs.length) return { key: "bidding", label: "입찰중", cls: "pend", bids: qs.length };
  return { key: "open", label: "대기", cls: "", bids: 0 };
}
function renderRfp() {
  const reqs = window.REQUESTS.list().slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const stats = reqs.map(rfpStatus);
  const cnt = { all: reqs.length, bidding: 0, selected: 0, paid: 0, open: 0, blind: 0 };
  stats.forEach((s) => { cnt[s.key] = (cnt[s.key] || 0) + 1; });
  const totalBids = stats.reduce((a, s) => a + s.bids, 0);
  const avgComp = reqs.length ? (totalBids / reqs.length).toFixed(1) : 0;
  const chips = [["all", "전체"], ["open", "대기"], ["bidding", "입찰중"], ["selected", "선정완료"], ["paid", "결제완료"], ["blind", "블라인드"]];
  let list = reqs.map((r, i) => ({ r, s: stats[i] }));
  if (rfpF !== "all") list = list.filter((x) => x.s.key === rfpF);
  // 대표 제시가(정렬용): 선정가 우선, 없으면 최저 입찰가
  list.forEach((x) => { const qs = window.QUOTES.forReq(x.r.id); const prices = qs.map((q) => +q.price || 0).filter((n) => n > 0); const sel = qs.find((q) => q.paid) || qs.find((q) => q.status === "accepted"); x.amt = sel ? (+sel.price || 0) : (prices.length ? Math.min(...prices) : 0); });
  list = applySort(list, "rfp", { member: (x) => x.r.memberName || x.r.memberId || "", date: (x) => x.r.date || "", cats: (x) => (x.r.cats || []).join(","), bids: (x) => x.s.bids || 0, amt: (x) => x.amt || 0, status: (x) => x.s.label || "" });
  const rq = _sq("rfp"); if (rq) list = list.filter((x) => _hit(rq, x.r.memberName, x.r.memberId, x.r.region, x.r.date, (x.r.cats || []).map((c) => window.reqCatById ? reqCatById(c).label : c).join(" ")));
  _xls2.req = { name: "견적요청_모니터링.csv", rows: [["요청자", "요청일", "이용일", "지역", "인원", "카테고리", "경쟁률(입찰수)", "대표제시가(원)", "상태"]].concat(list.map((x) => [x.r.memberName || x.r.memberId || "", new Date(x.r.ts || Date.now()).toLocaleDateString("ko-KR"), x.r.date || "", x.r.region || "", x.r.capacity || "", (x.r.cats || []).map((c) => window.reqCatById ? reqCatById(c).label : c).join(" / "), x.s.bids || 0, x.amt || 0, x.s.label || ""])) };
  $("#adRfp").innerHTML = `
    <div class="ad-kpis">
      <div class="ad-kpi"><span class="ad-kpi__ic">${ico("doc", 20)}</span><b>${won(reqs.length)}</b><span class="ad-kpi__l">견적 요청서</span></div>
      <div class="ad-kpi"><span class="ad-kpi__ic">${ico("wallet", 20)}</span><b>${won(cnt.bidding || 0)}</b><span class="ad-kpi__l">입찰 진행중</span></div>
      <div class="ad-kpi"><span class="ad-kpi__ic">${ico("check", 20)}</span><b>${won(cnt.paid || 0)}</b><span class="ad-kpi__l">결제 완료</span></div>
      <div class="ad-kpi"><span class="ad-kpi__ic">${ico("trend", 20)}</span><b>${avgComp}</b><span class="ad-kpi__l">평균 경쟁률(입찰/건)</span></div>
    </div>
    <h3 class="ad-h3">${ico("doc", 18)} 견적 요청 모니터링 <span class="ad-h3__s">경쟁률·매칭·결제 상태 · 허위/스팸 블라인드</span><button class="btn btn--soft btn--xs" data-xls2="req" style="margin-left:auto">${ico("upload", 13)} 엑셀 다운로드</button></h3>
    <div class="ad-filters">${chips.map(([v, l]) => `<button class="chip${rfpF === v ? " is-active" : ""}" data-rfpf="${v}">${l} <b>${cnt[v] || 0}</b></button>`).join("")}</div>
    ${searchBar("rfp", "요청자 · 지역 · 카테고리 · 이용일 검색")}
    <div class="ad-table" style="margin-top:14px">${sortHead("rfp", "ad-tr--rfp", [{ key: "member", label: "요청자" }, { key: "date", label: "이용일/지역" }, { key: "cats", label: "카테고리" }, { key: "bids", label: "경쟁률" }, { key: "amt", label: "제시가(파트너)" }, { key: "status", label: "상태" }, { label: "관리" }])}
    ${list.length ? list.map(({ r, s }) => {
      const cats = (r.cats || []).map((c) => (window.reqCatById ? reqCatById(c).label : c)).join(", ");
      const qs = window.QUOTES.forReq(r.id);
      const prices = qs.map((q) => +q.price || 0).filter((x) => x > 0);
      const sel = qs.find((q) => q.paid) || qs.find((q) => q.status === "accepted");
      let amtCell;
      if (sel) amtCell = `<b>${won(sel.price)}원</b><em>${sel.paid ? "결제·선정가" : "선정가"}</em>`;
      else if (prices.length) amtCell = prices.length > 1 ? `${won(Math.min(...prices))}~${won(Math.max(...prices))}원<em>입찰 ${prices.length}건</em>` : `${won(prices[0])}원<em>입찰 1건</em>`;
      else amtCell = `<span class="ad-rfp__none">견적 대기</span>`;
      return `<div class="ad-tr ad-tr--rfp${r.blinded ? " is-hidden" : ""}"><span class="ad-tr__id"><b>${r.memberName ? (window.PRIVACY ? window.PRIVACY.name(r.memberName) : r.memberName) : r.memberId}</b><em>${new Date(r.ts || Date.now()).toLocaleDateString("ko-KR")}</em></span><span>${r.date || "-"}<br><em style="color:var(--faint)">${r.region || ""} · ${r.capacity || "-"}인</em></span><span class="ad-rfp__cats">${cats || "-"}</span><span><button class="ad-linkbtn" data-rfpdetail="${r.id}">${s.bids}곳 ${ico("list", 13)}</button></span><span class="ad-rfp__amt">${amtCell}</span><span><span class="ad-st ad-st--${s.cls || "none"}">${s.label}</span></span><span class="ad-tr__act"><button class="btn btn--soft btn--xs" data-rfpblind="${r.id}">${r.blinded ? "블라인드 해제" : "블라인드"}</button><button class="btn btn--xs ad-del" data-rfpdel="${r.id}">삭제</button></span></div>`;
    }).join("") : `<div class="mp-empty">해당 견적 요청이 없습니다.</div>`}</div>`;
}
function openRfpDetail(id) {
  const r = window.REQUESTS.find(id); if (!r) return;
  const qs = window.QUOTES.forReq(id);
  const byCat = {}; qs.forEach((q) => { (byCat[q.cat] = byCat[q.cat] || []).push(q); });
  modal.hidden = false; modalCard.classList.add("modal__card--wide");
  modalCard.innerHTML = `<div class="modal__head"><b>${ico("doc", 16)} 견적 요청 상세</b><button class="modal__x" data-mclose>✕</button></div>
    <div class="ad-info__grid ad-appr__grid">
      <div><span>요청자</span>${r.memberName || r.memberId}</div>
      <div><span>이용일</span>${r.date || "-"}</div>
      <div><span>지역/인원</span>${r.region || "-"} · ${r.capacity || "-"}인</div>
      <div><span>예산</span>${r.budget ? won(r.budget) + "원" : "제한 없음"}</div>
      <div><span>연락처</span>${r.memberPhone ? (window.PRIVACY ? window.PRIVACY.phone(r.memberPhone) : r.memberPhone) : "-"}</div>
      <div><span>카테고리</span>${(r.cats || []).map((c) => (window.reqCatById ? reqCatById(c).label : c)).join(", ") || "-"}</div>
      ${r.detail ? `<div class="ad-appr__intro"><span>요청사항</span>${(r.detail || "").replace(/</g, "&lt;")}</div>` : ""}
    </div>
    <div class="ad-info__sec">${ico("wallet", 14)} 입찰 현황 · 총 ${qs.length}건 (경쟁률)</div>
    ${Object.keys(byCat).length ? Object.keys(byCat).map((c) => `<div class="ad-rfp__catblk"><div class="ad-rfp__catt">${window.reqCatById ? reqCatById(c).label : c} · ${byCat[c].length}곳 입찰</div>${byCat[c].sort((a, b) => (+a.price || 0) - (+b.price || 0)).map((q) => `<div class="ad-rfp__bid"><span>${(userMap()[q.vendorId] || q.vendorName || q.vendorId)}</span><b>${won(q.price)}원</b><span class="ad-st ad-st--${q.paid ? "ok" : q.status === "accepted" ? "ok" : "pend"}">${q.paid ? "결제완료" : q.status === "accepted" ? "선정" : "입찰"}</span></div>`).join("")}</div>`).join("") : `<p class="mp-empty">아직 입찰(견적 제출)이 없습니다.</p>`}`;
}

// ======================= CS·운영 =======================
function renderCS() {
  const notices = window.NOTICES.list();
  const inqs = window.INQUIRY.all();
  const revs = window.REVIEWS.all();
  _xls2.inq = { name: "1대1문의_내역.csv", rows: [["일시", "회원", "유형", "문의내용", "답변", "상태"]].concat(inqs.map((q) => [fmtDate(q.ts), userMap()[q.userId] || q.userId, q.category || "", (q.text || q.message || "").replace(/\s+/g, " "), (q.answer || "").replace(/\s+/g, " "), q.status === "answered" ? "답변완료" : "미답변"])) };
  $("#adCS").innerHTML = `
    <h3 class="ad-h3">${ico("megaphone", 18)} 공지사항 <span class="ad-h3__s">홈 상단에 실시간 노출</span></h3>
    <div class="ad-notice-form"><input type="text" id="ntTitle" class="ad-search" placeholder="공지 제목" style="flex:1" /><label class="ad-ntpush"><input type="checkbox" id="ntPush" /> 회원 알림 발송</label><button class="btn btn--accent btn--sm" id="ntAdd">등록</button></div>
    <div class="ad-notices">${notices.length ? notices.map((n) => `<div class="ad-notice"><div><b>${n.title}</b><span>${fmtDate(n.ts)}${n.hidden ? " · 숨김" : ""}</span></div><div class="ad-tr__act"><button class="btn btn--soft btn--xs" data-nthide="${n.id}">${n.hidden ? "노출" : "숨김"}</button><button class="btn btn--xs ad-del" data-ntdel="${n.id}">삭제</button></div></div>`).join("") : `<p class="ad-hint">등록된 공지가 없습니다.</p>`}</div>

    <h3 class="ad-h3" style="margin-top:24px;display:flex;align-items:center">${ico("chat", 18)} 1:1 문의 <span class="ad-h3__s">${inqs.filter((q) => q.status !== "answered").length}건 미답변</span><button class="btn btn--soft btn--xs" data-xls2="inq" style="margin-left:auto">${ico("upload", 13)} 엑셀 다운로드</button></h3>
    ${searchBar("inq", "회원 · 문의내용 · 답변 검색")}
    ${(function () { const iq = _sq("inq"); const inqList = iq ? inqs.filter((q) => _hit(iq, userMap()[q.userId] || q.userId, q.text || q.message, q.answer, q.category)) : inqs; return `<div class="ad-inqs">${inqList.length ? inqList.map((q) => `<div class="ad-inq"><div class="ad-inq__top"><b>${(userMap()[q.userId] || q.userId)}</b>${q.category ? `<span class="ad-st ad-st--info">${q.category}</span>` : ""}<span>${fmtDate(q.ts)}</span>${q.status === "answered" ? `<span class="ad-st ad-st--ok">답변완료</span>` : `<span class="ad-st ad-st--pend">미답변</span>`}</div><p class="ad-inq__q">${(q.text || q.message || "").replace(/</g, "&lt;")}</p>${q.answer ? `<p class="ad-inq__a">↳ ${q.answer}</p>` : `<div class="ad-inq__form"><input type="text" data-ansinput="${q.id}" class="ad-search" placeholder="답변 입력" style="flex:1" /><button class="btn btn--accent btn--xs" data-answer="${q.id}">답변</button></div>`}</div>`).join("") : `<p class="ad-hint">${iq ? "검색 결과가 없습니다." : "접수된 문의가 없습니다."}</p>`}</div>`; })()}

    <h3 class="ad-h3" style="margin-top:24px">${ico("star", 18)} 리뷰 모니터링 <span class="ad-h3__s">공간 후기 ${revs.length}건 · 악성 리뷰 제재</span></h3>
    <div class="ad-revs">${revs.length ? revs.map((r) => { const sp = spacesAll().find((s) => String(s.id) === String(r.spaceId)); return `<div class="ad-rev ${r.hidden ? "is-hidden" : ""}"><div class="ad-rev__top"><b>${r.name || "익명"}</b><span>${"★".repeat(r.rating || 0)} · ${sp ? sp.name : "공간#" + r.spaceId}</span>${r.hidden ? `<span class="ad-st ad-st--sus">숨김</span>` : ""}</div><p class="ad-rev__txt">${(r.text || "").replace(/</g, "&lt;")}</p>${r.photos && r.photos.length ? `<div class="ad-rev__ph">${r.photos.map((p) => `<img src="${p}" alt="" />`).join("")}</div>` : ""}<div class="ad-tr__act"><button class="btn btn--soft btn--xs" data-revhide="${r.id}">${r.hidden ? "노출" : "숨김(블라인드)"}</button><button class="btn btn--xs ad-del" data-revdel="${r.id}">삭제</button></div></div>`; }).join("") : `<p class="ad-hint">등록된 후기가 없습니다.</p>`}</div>

    `;
  const nt = $("#ntAdd"); if (nt) nt.addEventListener("click", () => {
    const v = $("#ntTitle").value.trim(); if (!v) return;
    window.NOTICES.add({ title: v });
    const push = $("#ntPush");
    if (push && push.checked && window.NOTIF) {
      let n = 0; usersAll().forEach((u) => { if (u.role !== "admin") { window.NOTIF.add({ forUser: u.userId, title: "공지사항 📢", sub: v, link: "index.html" }); n++; } });
      if (window.AUDIT) window.AUDIT.log("edit", "notice", "공지 등록 + 알림 발송 " + n + "명");
      toast(`공지를 등록하고 회원 ${n}명에게 알림을 보냈어요`);
    } else toast("공지를 등록했어요");
    renderCS();
  });
}

// ======================= 회원 관리 =======================
let roleF = "all", q = "";
function renderRoleFilter() {
  const us = usersAll();
  const opts = [["all", "전체", us.length], ["guest", "회원", us.filter((u) => u.role === "guest").length], ["host", "호스트", us.filter((u) => u.role === "host").length], ["vendor", "파트너", us.filter((u) => u.role === "vendor").length], ["admin", "관리자", us.filter((u) => u.role === "admin").length]];
  $("#adRoleFilter").innerHTML = opts.map(([v, l, n]) => `<button class="chip${roleF === v ? " is-active" : ""}" data-role="${v}">${l} <b>${n}</b></button>`).join("");
}
function renderUsers() {
  renderRoleFilter();
  const spentMap = OPS.byMember(bookings());
  const setAll = OPS.settlement(bookings(), quotes(), userMap());
  const revNum = (u) => u.role === "guest" ? (spentMap[u.userId] ? spentMap[u.userId].spent : 0) : (setAll.byProvider[u.userId] ? setAll.byProvider[u.userId].provider : 0);
  const stRank = (u) => u.suspended ? 5 : { pending: 1, rejected: 2, approved: 3 }[bizStatus(u)] || 4;
  let list = usersAll();
  if (roleF !== "all") list = list.filter((u) => u.role === roleF);
  if (q) { const s = q.toLowerCase(); list = list.filter((u) => (u.userId + (u.nick || "") + (u.name || "") + (u.email || "")).toLowerCase().includes(s)); }
  list = applySort(list, "usr", { role: (u) => ROLE_LABEL[u.role] || u.role, name: (u) => u.nick || u.name || u.userId, rev: (u) => revNum(u), status: (u) => stRank(u) });
  $("#adUsers").innerHTML = `<div class="ad-table">${sortHead("usr", "ad-tr--u", [{ key: "role", label: "유형" }, { key: "name", label: "아이디/이름" }, { key: "rev", label: "매출" }, { key: "status", label: "상태" }, { label: "관리" }])}
    ${list.length ? list.map((u) => {
    const st = bizStatus(u);
    const stTag = u.suspended ? `<span class="ad-st ad-st--sus">정지</span>` : st === "pending" ? `<span class="ad-st ad-st--pend">승인대기</span>` : st === "rejected" ? `<span class="ad-st ad-st--rej">반려</span>` : st === "approved" ? `<span class="ad-st ad-st--ok">승인</span>` : `<span class="ad-st">-</span>`;
    const rev = u.role === "guest" ? (spentMap[u.userId] ? won(spentMap[u.userId].spent) + "원" : "-") : providerRevenue(u.userId);
    return `<div class="ad-tr ad-tr--u"><span class="ad-u-role"><span class="ad-role ad-role--${u.role}">${ROLE_LABEL[u.role]}</span></span><span class="ad-tr__id"><b>${u.nick || u.name}</b><em>${u.userId}</em></span><span class="ad-tr__rev" data-label="누적 결제">${rev}</span><span data-label="상태">${stTag}</span><span class="ad-tr__act"><button class="btn btn--soft btn--xs" data-info="${u.userId}">정보</button>${u.role === "admin" ? `<span class="ad-lock">🛡️ 변경 불가</span>` : `${st === "pending" ? `<button class="btn btn--accent btn--xs" data-approve="${u.userId}">승인</button>` : ""}<select class="ad-rolesel" data-rolechg="${u.userId}">${["guest", "host", "vendor"].map((r) => `<option value="${r}"${u.role === r ? " selected" : ""}>${ROLE_LABEL[r]}</option>`).join("")}</select><button class="btn btn--soft btn--xs" data-suspend="${u.userId}">${u.suspended ? "해제" : "정지"}</button><button class="btn btn--xs ad-del" data-del="${u.userId}">삭제</button>`}</span></div>`;
  }).join("") : `<div class="mp-empty">조건에 맞는 계정이 없습니다.</div>`}</div>`;
}
function providerRevenue(uid) { const set = OPS.settlement(bookings(), quotes(), userMap()); const p = set.byProvider[uid]; return p ? won(p.provider) + "원" : "-"; }
// 회원/사업자 상세 정보 모달
function openUserInfo(uid) {
  const u = usersAll().find((x) => x.userId === uid); if (!u) return;
  const b = u.biz || {};
  const st = bizStatus(u);
  const stTxt = u.suspended ? "정지" : st === "pending" ? "승인 대기" : st === "rejected" ? "반려" : st === "approved" ? "승인 완료" : "정상";
  const row = (k, v) => `<div><span>${k}</span>${v || "-"}</div>`;
  let body = "", stats = "";
  if (u.role === "guest") {
    const m = OPS.byMember(bookings())[uid];
    const pt = window.POINTS ? window.POINTS.balance(uid) : 0;
    body = row("이름", window.PRIVACY ? window.PRIVACY.name(u.nick || u.name) : (u.nick || u.name)) + row("아이디", u.userId) + row("이메일", window.PRIVACY ? window.PRIVACY.email(u.email) : u.email) + row("연락처", window.PRIVACY ? window.PRIVACY.phone(u.phone) : u.phone) + row("가입 상태", stTxt);
    stats = row("누적 결제액", m ? `<b>${won(m.spent)}원</b>` : "0원") + row("예약 건수", (m ? m.count : 0) + "건") + row("보유 포인트", `<b>${won(pt)}P</b>`);
  } else {
    const cats = (u.serviceCats || []).map((c) => (window.reqCatById ? reqCatById(c).label : c)).join(", ");
    const set = OPS.settlement(bookings(), quotes(), userMap()); const p = set.byProvider[uid];
    const bkN = u.role === "host" ? bookings().filter((x) => x.hostId === uid && x.status === "confirmed").length : quotes().filter((q) => q.vendorId === uid && q.status === "accepted").length;
    body =
      row("사업자명(상호)", u.nick || u.name) +
      row("대표자", (window.PRIVACY ? window.PRIVACY.name(b.owner || u.owner) : (b.owner || u.owner))) +
      row("사업자등록번호", (window.PRIVACY ? window.PRIVACY.bizno(b.bizNo || u.bizNo) : (b.bizNo || u.bizNo))) +
      row("개업일자", b.open || u.openDate) +
      row("연락처", (window.PRIVACY ? window.PRIVACY.phone(b.phone || u.phone) : (b.phone || u.phone))) +
      row("이메일", (window.PRIVACY ? window.PRIVACY.email(u.email) : u.email)) +
      row("사업장 주소", b.addr || u.addr) +
      row("활동 지역", u.region) +
      (u.role === "vendor" ? row("취급 카테고리", cats) : row("보유 공간", spacesAll().filter((s) => s.ownerId === uid).length + "곳")) +
      row("정산 계좌", (b.bank || u.bank) ? `${b.bank || u.bank} ${window.PRIVACY ? window.PRIVACY.acct(b.account || u.account) : (b.account || u.account || "")}` : "-") +
      row("한 줄 소개", u.intro) +
      row("가입 상태", stTxt);
    stats = row("누적 정산액", p ? `<b>${won(p.provider)}원</b>` : "0원") + row("거래액(GMV)", p ? won(p.gross) + "원" : "0원") + row(u.role === "host" ? "확정 예약" : "수주 견적", bkN + "건") + row("수수료", p ? won(p.wylie) + "원" : "0원");
  }
  const hasDocs = b.docs && Object.keys(b.docs).length;
  modal.hidden = false;
  modalCard.innerHTML = `<div class="modal__head"><b><span class="ad-role ad-role--${u.role}">${ROLE_LABEL[u.role]}</span> ${u.nick || u.name} 정보</b><button class="modal__x" data-mclose>✕</button></div>
    <div class="ad-info__grid ad-appr__grid">${body}</div>
    <div class="ad-info__sec">📊 매출·정산 요약</div>
    <div class="ad-info__grid ad-appr__grid">${stats}</div>
    ${(u.role === "host" || u.role === "vendor") ? `
    <div class="ad-info__sec">${ico("card", 14)} 수수료율</div>
    <div class="ad-feerate">
      <span class="ad-feerate__cur">현재 <b>${window.FEERATES.pctOf(u.role, u.userId)}%</b> <em>${window.FEERATES.isCustom(u.userId) ? `요율 이력 ${window.FEERATES.history(u.userId).length}건` : `기본(${window.FEERATES.DEF[u.role]}%)`}</em></span>
      <button class="btn btn--accent btn--sm" data-feeeditor="${u.userId}" data-feekind="${u.role}" data-feename="${(u.nick || u.name || "").replace(/"/g, "&quot;")}" style="margin-left:auto">요율 관리 (적용 시작일)</button>
    </div>` : ""}
    ${hasDocs ? `<button class="btn btn--soft btn--sm" data-docs="${u.userId}" style="margin-top:14px">📄 제출 서류 보기 (${docsCount(u)}건)</button>` : ""}
    ${st === "pending" ? `<button class="btn btn--accent btn--sm" data-approve="${u.userId}" style="margin-top:10px;margin-left:6px">✔ 사업자 승인</button>` : ""}`;
}
$("#adSearch").addEventListener("input", (e) => { q = e.target.value.trim(); renderUsers(); });
$("#adRoleFilter").addEventListener("click", (e) => { const b = e.target.closest("[data-role]"); if (b) { roleF = b.dataset.role; renderUsers(); } });

// ======================= 일괄 등록 =======================
function renderBulk() {
  $("#adBulk").innerHTML = `<div class="ad-bulk"><h3 class="ad-bulk__t">계정 일괄 등록</h3><p class="ad-bulk__d">한 줄에 <b>역할,아이디,이름,이메일,비밀번호</b> 순. (비밀번호 생략 시 <code>1234</code>)<br />역할: guest·host·vendor</p>
    <textarea id="bulkText" rows="7" placeholder="host,seoulstay,서울스테이,stay@demo.kr,1234
vendor,snappro,스냅프로,snap@demo.kr
guest,minji,김민지,minji@demo.kr"></textarea>
    <div class="ad-bulk__row"><label class="filt__chk"><input type="checkbox" id="bulkApproved" checked /> 사업자 즉시 승인</label><button class="btn btn--accent" id="bulkGo">일괄 등록</button></div>
    <p class="ad-bulk__res" id="bulkRes"></p></div>`;
  $("#bulkGo").addEventListener("click", doBulk);
}
function doBulk() {
  const lines = $("#bulkText").value.split(/\n/).map((l) => l.trim()).filter(Boolean), approved = $("#bulkApproved").checked, list = usersAll(); let ok = 0, skip = 0;
  lines.forEach((line) => {
    const [role, userId, name, email, pw] = line.split(",").map((x) => (x || "").trim());
    if (!role || !userId || !["guest", "host", "vendor"].includes(role) || list.some((u) => u.userId === userId)) { skip++; return; }
    const u = { userId, pwHash: window.AUTH.hashPw(pw || "1234"), nick: name || userId, name: name || userId, email: email || (userId + "@demo.kr"), role };
    if (role === "host" || role === "vendor") { u.biz = { status: approved ? "approved" : "pending", ts: Date.now() }; u.region = "서울"; }
    if (role === "vendor") u.serviceCats = ["camera"];
    list.push(u); ok++;
  });
  saveUsers(list); $("#bulkRes").innerHTML = `✅ ${ok}건 등록${skip ? ` · ⚠️ ${skip}건 건너뜀` : ""}`;
  if (ok) { $("#bulkText").value = ""; toast(`${ok}건 등록 완료`); }
}

// ======================= 모의 데이터 생성 (5~7월 · 328명 · 종합) =======================
const MOCK_SPACE_KEY = "gi_spaces";
// 목 공간 풀(카테고리·가격·이미지)
const MOCK_SP = [
  { cat: "event", nm: ["프라임 이벤트홀", "그랜드 파티홀", "리버뷰 홀"], price: [45000, 60000, 55000], img: "1515169067868-5387ec356754" },
  { cat: "party", nm: ["무드 파티룸", "루프탑 파티라운지", "빈티지 파티룸"], price: [28000, 35000, 30000], img: "1505373877841-8d25f7d46678" },
  { cat: "meeting", nm: ["프리미엄 회의실", "브릭 세미나룸", "글라스 미팅룸"], price: [18000, 25000, 22000], img: "1497366754035-f200968a6e72" },
  { cat: "studio", nm: ["화이트 스튜디오", "라이브 방송룸", "감성 촬영 스튜디오"], price: [35000, 40000, 38000], img: "1519710164239-da123dc03ef4" },
  { cat: "cafe", nm: ["우드 공유주방", "베이킹 스튜디오", "쿠킹 클래스룸"], price: [26000, 30000, 28000], img: "1571624436279-b272aff752b5" },
  { cat: "office", nm: ["코워킹 오피스", "부티크 사무공간", "라운지 오피스"], price: [15000, 20000, 18000], img: "1560448204-e02f11c3d0e2" },
];
function seedComprehensive(mini) {
  const rnd = OPS.rng((Date.now() & 0x7fffff) || 1), pick = (a) => a[Math.floor(rnd() * a.length)];
  const seed = (Date.now() & 0x7fffff) || 1;
  const GU = OPS.GU, DONG = ["역삼동", "서교동", "성수동", "서초동", "잠실동", "이태원동", "여의도동", "혜화동", "자양동", "화곡동"];
  const HOSTNM = ["연남하우스", "한강뷰라운지", "성수팩토리", "홍대스튜디오", "여의도홀", "잠실파티움", "이태원루프탑", "역삼워크스페이스"];
  const us = usersAll();
  const ensure = (u) => { const i = us.findIndex((x) => x.userId === u.userId); if (i >= 0) us[i] = Object.assign({}, us[i], u); else us.push(u); };
  const nHost = mini ? 3 : 8, nVend = mini ? 6 : 20, nMem = mini ? 40 : 328;

  // 1) 목 호스트 + 목 공간
  const mockHosts = [];
  for (let i = 0; i < nHost; i++) {
    const id = "mh" + OPS.pad(i + 1), nick = HOSTNM[i % HOSTNM.length] + (i >= HOSTNM.length ? (i + 1) : "");
    ensure({ userId: id, pw: "1234", nick, name: nick, email: id + "@demo.kr", role: "host", region: "서울", phone: "02-" + OPS.pad(300 + i * 37) + "-" + OPS.pad(1000 + i * 123), addr: "서울 " + GU[i % GU.length] + " " + DONG[i % DONG.length] + " " + (10 + i) + "-" + (1 + i), owner: OPS.NAMES[i % OPS.NAMES.length], bizNo: `${210 + i}-45-${10000 + i * 137}`, bank: "카카오뱅크", account: `3333-01-${100000 + i * 777}`, openDate: "2021-0" + (1 + i % 9) + "-15", biz: { status: "approved", ts: Date.now() - 120 * 86400000 }, _mock: true });
    mockHosts.push(id);
  }
  // 목 공간(gi_spaces) — 기존 _mock 공간 제거 후 재생성
  let sp = []; try { sp = JSON.parse(localStorage.getItem(MOCK_SPACE_KEY) || "[]"); } catch (e) {}
  sp = sp.filter((s) => !s._mock);
  let sid = 900100;
  mockHosts.forEach((hid, hi) => {
    const ncnt = 2 + Math.floor(rnd() * 2);
    for (let k = 0; k < ncnt; k++) {
      const grp = pick(MOCK_SP), j = Math.floor(rnd() * grp.nm.length);
      const dong = DONG[(hi + k) % DONG.length];
      sp.push({ id: sid++, name: dong.replace("동", "") + " " + grp.nm[j], cat: grp.cat, region: "서울 " + GU[(hi + k) % GU.length] + " " + dong, price: grp.price[j], capacity: 6 + Math.floor(rnd() * 40), rating: (43 + Math.floor(rnd() * 7)) / 10, reviews: 20 + Math.floor(rnd() * 260), now: true, ownerId: hid, img: grp.img, g: ["#5b7f8c", "#87a7b2"], tags: ["와이파이", "주차 가능", "냉난방"], _mock: true });
    }
  });
  localStorage.setItem(MOCK_SPACE_KEY, JSON.stringify(sp));

  // 2) 목 파트너
  const VCATS = ["camera", "catering", "office", "cleaning", "repair", "interior", "banner", "projector", "goods", "photo"];
  const VNM = { camera: "픽스렌탈", catering: "테이블마스터", office: "렌트오피스", cleaning: "클린업", repair: "픽스잇", interior: "데코샵", banner: "사인프로", projector: "빔하우스", goods: "굿즈팜", photo: "스냅랩" };
  for (let i = 0; i < nVend; i++) {
    const cat = VCATS[i % VCATS.length], id = "mv" + OPS.pad(i + 1), nick = VNM[cat] + (i + 1);
    ensure({ userId: id, pw: "1234", nick, name: nick, email: id + "@demo.kr", role: "vendor", serviceCats: [cat], region: "서울", phone: "010-" + OPS.pad(4000 + i * 53) + "-" + OPS.pad(1000 + i * 211), addr: "서울 " + GU[i % GU.length] + " " + DONG[i % DONG.length], owner: OPS.NAMES[(i + 5) % OPS.NAMES.length], bizNo: `${310 + i}-22-${20000 + i * 191}`, bank: "토스뱅크", account: `100-${1000 + i}-${200000 + i * 331}`, openDate: "2022-0" + (1 + i % 9) + "-10", intro: "행사에 필요한 서비스를 제공하는 파트너입니다.", biz: { status: "approved", ts: Date.now() - 90 * 86400000 }, _mock: true });
  }

  // 3) 328명 회원
  const members = OPS.genMembers(nMem, 7);
  members.forEach((m) => ensure(m));

  // 4) 대기 중 실제 사업자 승인
  us.forEach((u) => { if (u.biz && u.biz.status === "pending") { u.biz.status = "approved"; u.biz.approvedTs = Date.now(); } });
  saveUsers(us);

  // 5) 종합 데이터 생성
  const spaces = spacesAll().filter((s) => !s.blinded && !s.rejected);
  const vendors = usersAll().filter((u) => u.role === "vendor" && (!u.biz || (u.biz.status || "approved") === "approved"));
  const pkgs = (typeof PACKAGES !== "undefined" ? PACKAGES : []);
  const data = OPS.genAll({ spaces, pkgs, vendors, members, nBook: mini ? 40 : 240, nReq: mini ? 30 : 140, nPkg: mini ? 10 : 42, nChat: mini ? 15 : 60, nInq: mini ? 10 : 24 }, seed);

  // 6) 스토어 기록 (_mock 교체)
  window.BOOKINGS.save(window.BOOKINGS.list().filter((b) => !b._mock).concat(data.bookings));
  window.QUOTES.save(window.QUOTES.list().filter((q) => !q._mock).concat(data.quotes));
  window.REQUESTS.save(window.REQUESTS.list().filter((r) => !r._mock).concat(data.requests));
  window.INQUIRY.save(window.INQUIRY.all().filter((q) => !q._mock).concat(data.inquiries));
  window.POINTS.save(window.POINTS.all().filter((p) => !p._mock).concat(data.points));
  // 채팅(회원↔호스트/파트너) — 목 스레드(mb/mp) 교체
  try {
    const chatAll = window.CHAT.all(); Object.keys(chatAll).forEach((k) => { if (/^m[bp]/.test(k)) delete chatAll[k]; });
    Object.assign(chatAll, data.chat); localStorage.setItem(window.CHAT.KEY, JSON.stringify(chatAll));
    const cm = window.CHATMETA.all(); Object.keys(cm).forEach((k) => { if (/^m[bp]/.test(k)) delete cm[k]; });
    Object.keys(data.chatmeta).forEach((k) => (cm[k] = data.chatmeta[k])); localStorage.setItem(window.CHATMETA.KEY, JSON.stringify(cm));
  } catch (e) {}

  // 7) 플랫폼 쿠폰(없으면 시드)
  if (!window.PCOUPONS.list().some((c) => c._mock)) {
    [{ code: "WELCOME10", discType: "percent", value: 10, scope: "all", bearer: "platform", minAmount: 30000, maxUses: 500, expires: "2026-08-31" },
    { code: "SPACE5000", discType: "amount", value: 5000, scope: "space", bearer: "provider", minAmount: 50000, maxUses: 300, expires: "2026-08-31" },
    { code: "PKG20", discType: "percent", value: 20, scope: "package", bearer: "platform", minAmount: 100000, maxUses: 200, expires: "2026-07-31" },
    { code: "PARTNER15", discType: "percent", value: 15, scope: "vendor", bearer: "provider", minAmount: 50000, maxUses: 150, expires: "2026-08-31" }].forEach((c) => {
      const l = window.PCOUPONS.list(); l.unshift(Object.assign({ id: window.uid("pc"), ts: Date.now(), used: Math.floor(rnd() * 80), active: true, _mock: true }, c)); window.PCOUPONS.save(l);
    });
  }

  // 8) PG 자동 분리정산 — 정산 상태는 이용일 경과 여부로 자동 산정(별도 시드 불필요)

  // 9) 수수료율: 전 공급자(호스트·업체·패키지) 일괄 5% — 개별 커스텀 요율 초기화(기본율 5% 적용)
  if (window.FEERATES) {
    try { localStorage.removeItem(window.FEERATES.KEY); } catch (e) {}
  }

  return { data, spaces: spaces.length, vendors: vendors.length, members: members.length };
}
$("#adSeed").addEventListener("click", () => {
  if (!confirm("실데이터 세트를 생성합니다.\n· 회원 328명 (5~7월)\n· 목 호스트 8 · 파트너 20 + 목 공간\n· 공간예약 240 · 견적/맞춤요청 140 · 패키지 42\n· 파트너 입찰·선정·결제 · 채팅 60 · 1:1 문의 24\n· 포인트/쿠폰 · PG 자동 분리정산 적용\n대기 사업자는 모두 자동 승인됩니다. 진행할까요?")) return;
  const started = Date.now();
  const r = seedComprehensive(false);
  const set = OPS.settlement(window.BOOKINGS.list(), quotes(), userMap());
  renderAll();
  toast(`실데이터 생성 완료 · 회원 ${r.members}명 · 거래 ${set.totals.count}건 · GMV ${won(set.totals.gmv)}원 (${Date.now() - started}ms)`);
});
$("#adReset").addEventListener("click", () => {
  if (!confirm("모의 데이터(회원·예약·견적·요청·문의·포인트·쿠폰·채팅·목 공간)를 모두 초기화할까요? 실제 데이터는 유지됩니다.")) return;
  window.BOOKINGS.save(window.BOOKINGS.list().filter((b) => !b._mock));
  window.QUOTES.save(window.QUOTES.list().filter((q) => !q._mock));
  window.REQUESTS.save(window.REQUESTS.list().filter((r) => !r._mock));
  window.INQUIRY.save(window.INQUIRY.all().filter((q) => !q._mock));
  window.POINTS.save(window.POINTS.all().filter((p) => !p._mock));
  window.PCOUPONS.save(window.PCOUPONS.list().filter((c) => !c._mock));
  saveUsers(usersAll().filter((u) => !u._mock));
  try { let sp = JSON.parse(localStorage.getItem(MOCK_SPACE_KEY) || "[]"); localStorage.setItem(MOCK_SPACE_KEY, JSON.stringify(sp.filter((s) => !s._mock))); } catch (e) {}
  try { const c = window.CHAT.all(); Object.keys(c).forEach((k) => { if (/^m[bp]/.test(k)) delete c[k]; }); localStorage.setItem(window.CHAT.KEY, JSON.stringify(c)); } catch (e) {}
  try { const cm = window.CHATMETA.all(); Object.keys(cm).forEach((k) => { if (/^m[bp]/.test(k)) delete cm[k]; }); localStorage.setItem(window.CHATMETA.KEY, JSON.stringify(cm)); } catch (e) {}
  try { localStorage.removeItem("gi_payouts"); } catch (e) {}
  renderAll();
  toast("모의 데이터·정산 금액을 초기화했어요");
});

// ======================= 통계·분석 =======================
// 금액 축약(막대 위 라벨용): 억/만 단위
function wonShort(n) {
  n = +n || 0; if (n === 0) return "0";
  if (n >= 100000000) { const v = n / 100000000; return (v >= 10 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, "")) + "억"; }
  if (n >= 10000) return Math.round(n / 10000).toLocaleString("ko-KR") + "만";
  return n.toLocaleString("ko-KR");
}
// 매출 추이 막대 — 마우스오버/터치 시 금액 툴팁
(function chartTip() {
  let tip = null;
  const ensure = () => { if (!tip) { tip = document.createElement("div"); tip.className = "chart-tip"; tip.hidden = true; document.body.appendChild(tip); } return tip; };
  const show = (r, x, y) => { const t = ensure(); t.innerHTML = `<b>${r.getAttribute("data-lbl")}</b>${r.getAttribute("data-amt")}`; t.hidden = false; t.style.left = Math.max(8, Math.min(window.innerWidth - t.offsetWidth - 8, x + 14)) + "px"; t.style.top = Math.max(8, y - t.offsetHeight - 12) + "px"; };
  const hide = () => { if (tip) tip.hidden = true; };
  document.addEventListener("pointermove", (e) => { const r = e.target.closest && e.target.closest(".ad-chart rect[data-amt]"); if (r) show(r, e.clientX, e.clientY); else hide(); });
  document.addEventListener("pointerdown", (e) => { const r = e.target.closest && e.target.closest(".ad-chart rect[data-amt]"); if (r) { const b = r.getBoundingClientRect(); show(r, b.left + b.width / 2, b.top); } else hide(); });
  document.addEventListener("scroll", hide, true);
})();
function bars(data, unit) {
  const w = 640, h = 184, padB = 22, padT = 20, n = data.length || 1;
  const max = Math.max(1, ...data.map((d) => d.v));
  const gap = (w) / n, bw = gap * 0.58;
  const showV = n <= 16;            // 막대 위 금액(개수 적을 때만)
  const xStep = n <= 16 ? 1 : Math.ceil(n / 12); // x축 라벨 솎기
  const body = data.map((d, i) => {
    const bh = Math.round((h - padB - padT) * (d.v / max)), x = gap * i + (gap - bw) / 2, y = h - padB - bh;
    const cx = (x + bw / 2).toFixed(1);
    const vlabel = (showV && d.v > 0) ? `<text x="${cx}" y="${(y - 5).toFixed(1)}" text-anchor="middle" class="chart-v">${wonShort(d.v)}</text>` : "";
    const xlabel = (i % xStep === 0) ? `<text x="${cx}" y="${h - 7}" text-anchor="middle" class="chart-x">${d.label}</text>` : "";
    return `<rect x="${x.toFixed(1)}" y="${y}" width="${bw.toFixed(1)}" height="${Math.max(1, bh)}" rx="3" fill="var(--accent)" opacity="${0.55 + 0.45 * (d.v / max)}" data-lbl="${d.label}" data-amt="${won(d.v)}${unit || ""}"><title>${d.label}: ${won(d.v)}${unit || ""}</title></rect>${vlabel}${xlabel}`;
  }).join("");
  return `<svg viewBox="0 0 ${w} ${h}" class="chart" role="img" aria-label="막대 차트">${body}</svg>`;
}
function renderStats() {
  const bk = bookings();
  const mon = OPS.monthly(bk, 6), day = OPS.daily(bk, 14), top = OPS.topSpaces(bk, 8), fn = OPS.funnel(bk);
  const tags = window.STATLOG.all().tags, tagArr = Object.keys(tags).map((k) => ({ k, n: tags[k] })).sort((a, b) => b.n - a.n).slice(0, 10);
  const views = window.STATLOG.all().views;
  const monMax = Math.max(...mon.map((m) => m.gmv), 0);
  $("#adStats").innerHTML = `
    <div class="ad-kpis">
      <div class="ad-kpi"><span class="ad-kpi__ic">${ico("trend", 20)}</span><b>${fn.convRate}<em>%</em></b><span class="ad-kpi__l">예약 전환율(확정/전체)</span></div>
      <div class="ad-kpi"><span class="ad-kpi__ic">${ico("door", 20)}</span><b>${fn.cancelRate}<em>%</em></b><span class="ad-kpi__l">취소·이탈률</span></div>
      <div class="ad-kpi"><span class="ad-kpi__ic">${ico("cal", 20)}</span><b>${won(fn.confirmed)}</b><span class="ad-kpi__l">확정 예약</span></div>
      <div class="ad-kpi"><span class="ad-kpi__ic">${ico("card", 20)}</span><b>${won(mon.reduce((a, m) => a + m.gmv, 0))}</b><span class="ad-kpi__l">최근 6개월 GMV</span></div>
    </div>
    <h3 class="ad-h3">${ico("stats", 18)} 월별 매출 추이 <span class="ad-h3__s">최근 6개월 · GMV</span></h3>
    <div class="ad-chart">${bars(mon.map((m) => ({ label: m.label, v: m.gmv })), "원")}</div>
    <h3 class="ad-h3">${ico("cal", 18)} 일별 매출 추이 <span class="ad-h3__s">최근 14일</span></h3>
    <div class="ad-chart">${bars(day.map((d) => ({ label: d.label, v: d.gmv })), "원")}</div>
    <div class="ad-2col">
      <div><h3 class="ad-h3">${ico("trend", 18)} 인기 공간 TOP <span class="ad-h3__s">예약 건수</span></h3>
        <div class="ad-rank">${top.length ? top.map((s, i) => `<div class="ad-rankrow"><span class="ad-rank__n">${i + 1}</span><b>${s.name}</b><span class="ad-rank__v">${s.count}건 · ${won(s.gmv)}원</span></div>`).join("") : `<p class="ad-hint">데이터 없음 — 모의 데이터를 생성하세요.</p>`}</div></div>
      <div><h3 class="ad-h3">${ico("hash", 18)} 인기 검색 해시태그 <span class="ad-h3__s">태그 필터 클릭수</span></h3>
        <div class="ad-rank">${tagArr.length ? tagArr.map((t, i) => `<div class="ad-rankrow"><span class="ad-rank__n">${i + 1}</span><b>#${t.k}</b><span class="ad-rank__v">${t.n}회</span></div>`).join("") : `<p class="ad-hint">아직 태그 검색 기록이 없어요. 검색 페이지에서 태그 칩을 눌러보세요.</p>`}</div></div>
    </div>`;
}

// ======================= 쿠폰·포인트 =======================
const SCOPE_LABEL = { all: "전체", package: "패키지", space: "공간 대관", vendor: "파트너 서비스", signup: "신규가입" };
const CREATE_SCOPES = [["all", "전체"], ["package", "패키지 기획전 전용"], ["space", "공간 대관 전용"], ["vendor", "파트너 서비스 전용"]];
const BEARER_LABEL = { platform: "플랫폼(와일리)", provider: "공급자" };
function renderCoupons() {
  const cps = applySort(window.PCOUPONS.list(), "cp", { title: (c) => c.title || "", code: (c) => c.code || "", scope: (c) => SCOPE_LABEL[c.scope] || c.scope || "", bearer: (c) => c.bearer || "platform", value: (c) => +c.value || 0, used: (c) => c.used || 0, status: (c) => c.active ? 1 : 0 });
  const pts = window.POINTS.all().slice(0, 30);
  $("#adCoupons").innerHTML = `
    <h3 class="ad-h3">${ico("ticket", 18)} 플랫폼 쿠폰 <span class="ad-h3__s">적용 대상·비용 부담 주체 지정 · 정산 시 마케팅비 자동 반영</span></h3>
    <div class="ad-cform">
      <input type="text" id="cpTitle" class="ad-inp" placeholder="쿠폰명 (예: 신규가입 10%)" />
      <input type="text" id="cpCode" class="ad-inp" placeholder="코드 (예: WELCOME10)" />
      <select id="cpScope" class="ad-inp" title="적용 대상">${CREATE_SCOPES.map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select>
      <select id="cpBearer" class="ad-inp" title="비용 부담 주체"><option value="platform">플랫폼(와일리) 부담</option><option value="provider">공급자 부담</option></select>
      <select id="cpType" class="ad-inp"><option value="pct">% 할인</option><option value="amount">정액(원)</option></select>
      <input type="number" id="cpVal" class="ad-inp ad-inp--sm" placeholder="값" />
      <input type="number" id="cpMin" class="ad-inp ad-inp--sm" placeholder="최소결제" />
      <input type="number" id="cpMax" class="ad-inp ad-inp--sm" placeholder="발행수량" />
      <input type="date" id="cpExp" class="ad-inp ad-inp--sm" />
      <button class="btn btn--accent btn--sm" id="cpAdd">발행</button>
    </div>
    <p class="ad-hint" style="margin:-4px 0 12px">${ico("shield", 13)} <b>플랫폼 부담</b> = 할인액을 와일리 마케팅비로 처리, 공급자는 <b>정상가</b> 기준 정산 · <b>공급자 부담</b> = 할인된 <b>최종 결제금액</b> 기준 정산</p>
    <div class="ad-table">${sortHead("cp", "ad-tr--cp", [{ key: "title", label: "쿠폰" }, { key: "code", label: "코드" }, { key: "scope", label: "적용 대상" }, { key: "bearer", label: "비용 부담" }, { key: "value", label: "혜택" }, { key: "used", label: "사용/한도" }, { key: "status", label: "상태" }, { label: "관리" }])}
    ${cps.length ? cps.map((c) => { const bearer = c.bearer || "platform"; const bBadge = `<span class="ad-bearer ad-bearer--${bearer}">${bearer === "platform" ? "와일리" : "공급자"}</span>`; return `<div class="ad-tr ad-tr--cp"><span class="ad-tr__id"><b>${c.title || "-"}</b></span><span><code>${c.code}</code></span><span><span class="ad-scope">${SCOPE_LABEL[c.scope] || c.scope}</span></span><span>${bBadge}</span><span>${c.discType === "amount" ? won(c.value) + "원" : c.value + "%"}</span><span>${c.used || 0}/${c.maxUses || "∞"}</span><span><span class="ad-st ${c.active ? "ad-st--ok" : "ad-st--sus"}">${c.active ? "활성" : "중지"}${c.expires ? " ·~" + c.expires.slice(5) : ""}</span></span><span class="ad-tr__act"><button class="btn btn--soft btn--xs" data-cptoggle="${c.id}">${c.active ? "중지" : "활성"}</button><button class="btn btn--xs ad-del" data-cpdel="${c.id}">삭제</button></span></div>`; }).join("") : `<div class="mp-empty">발행된 플랫폼 쿠폰이 없습니다.</div>`}</div>

    <h3 class="ad-h3" style="margin-top:26px">${ico("star", 18)} 포인트 적립·소멸 <span class="ad-h3__s">유저 대상 지급/소멸 제어</span></h3>
    <div class="ad-cform"><input type="text" id="ptUser" class="ad-inp" placeholder="회원 아이디 (예: m01)" /><input type="number" id="ptDelta" class="ad-inp ad-inp--sm" placeholder="포인트(+/-)" /><input type="text" id="ptReason" class="ad-inp" placeholder="사유 (예: 이벤트 지급)" /><input type="date" id="ptExp" class="ad-inp ad-inp--sm" /><button class="btn btn--accent btn--sm" id="ptAdd">적립/차감</button></div>
    <div class="ad-table"><div class="ad-tr ad-tr--h ad-tr--pt"><span>회원</span><span>포인트</span><span>사유</span><span>만료</span><span>관리</span></div>
    ${pts.length ? pts.map((e) => `<div class="ad-tr ad-tr--pt ${e.expired ? "is-hidden" : ""}"><span class="ad-tr__id"><b>${(userMap()[e.userId] || e.userId)}</b><em>${e.userId}</em></span><span class="${e.delta >= 0 ? "ad-pt-pos" : "ad-pt-neg"}">${e.delta >= 0 ? "+" : ""}${won(e.delta)}P</span><span>${e.reason || "-"}</span><span>${e.expires || "-"}${e.expired ? " · 소멸" : ""}</span><span class="ad-tr__act">${!e.expired ? `<button class="btn btn--xs ad-del" data-ptexp="${e.id}">소멸</button>` : "-"}</span></div>`).join("") : `<div class="mp-empty">포인트 내역이 없습니다.</div>`}</div>`;
  const ca = $("#cpAdd"); if (ca) ca.addEventListener("click", () => {
    const title = $("#cpTitle").value.trim(), code = $("#cpCode").value.trim().toUpperCase(), value = +$("#cpVal").value;
    if (!code || !value) { toast("코드와 값을 입력해 주세요"); return; }
    window.PCOUPONS.add({ title, code, scope: $("#cpScope").value, bearer: $("#cpBearer").value, discType: $("#cpType").value, value, minAmount: +$("#cpMin").value || 0, maxUses: +$("#cpMax").value || 0, expires: $("#cpExp").value || "" });
    toast("쿠폰을 발행했어요"); renderCoupons();
  });
  const pa = $("#ptAdd"); if (pa) pa.addEventListener("click", () => {
    const uid = $("#ptUser").value.trim(), delta = +$("#ptDelta").value;
    if (!uid || !delta) { toast("회원 아이디와 포인트를 입력해 주세요"); return; }
    window.POINTS.add(uid, delta, $("#ptReason").value.trim(), $("#ptExp").value || ""); toast("포인트를 반영했어요"); renderCoupons();
  });
}

// ======================= 시스템 설정 =======================
const PERM_LABEL = { ops: "운영", finance: "재무", cs: "CS", system: "시스템" };
// ======================= 관리자 접근 로그 (비밀번호 잠금) =======================
let auditUnlocked = false;
function renderAudit() {
  const wrap = $("#adAudit"); if (!wrap) return;
  if (!auditUnlocked) {
    wrap.innerHTML = `<div class="ad-lockbox">
      <div class="ad-lockbox__ic">${ico("lock", 26)}</div>
      <h3 class="ad-h3" style="margin:0 0 4px">관리자 접근 로그 · 잠금</h3>
      <p class="ad-hint" style="margin:0 0 14px">개인정보 조회·수정·다운로드 기록입니다. 열람하려면 비밀번호를 입력하세요.</p>
      <div class="ad-lockbox__row"><input type="password" id="auditPw" class="ad-inp" placeholder="비밀번호" autocomplete="off" inputmode="numeric" /><button class="btn btn--accent btn--sm" id="auditGo">열람</button></div>
      <p class="hf-err" id="auditErr" hidden>비밀번호가 올바르지 않습니다.</p>
    </div>`;
    const go = () => { const v = ($("#auditPw").value || "").trim(); if (v === "0810") { auditUnlocked = true; if (window.AUDIT) window.AUDIT.log("view", "audit", "관리자 접근 로그 열람"); renderAudit(); } else { const e = $("#auditErr"); if (e) e.hidden = false; } };
    const b = $("#auditGo"); if (b) b.addEventListener("click", go);
    const inp = $("#auditPw"); if (inp) inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
    return;
  }
  const logs = (window.AUDIT ? window.AUDIT.all() : []).slice(0, 200);
  const A = { view: ["조회", "view"], edit: ["수정", "edit"], approve: ["승인", "edit"], export: ["다운로드", "export"], purge: ["파기", "edit"] };
  wrap.innerHTML = `<h3 class="ad-h3" style="display:flex;align-items:center">${ico("shield", 18)} 관리자 접근 로그 <span class="ad-h3__s">개인정보 조회·수정·다운로드 기록 · 서버는 IP 포함 최소 1년 보관</span><button class="btn btn--soft btn--xs" id="auditLock" style="margin-left:auto">${ico("lock", 13)} 잠그기</button></h3>
    <div class="ad-audit"><div class="ad-audit__row ad-audit__row--h"><span>작업자 · 유형</span><span>작업 내용</span><span>일시</span></div>${logs.length ? logs.map((x) => { const a = A[x.action] || [x.action, "view"]; return `<div class="ad-audit__row"><span class="ad-audit__act"><b>${x.actor}</b> <span class="ad-audit__tag ad-audit__tag--${a[1]}">${a[0]}</span></span><span>${(x.detail || x.target || "").replace(/</g, "&lt;")}</span><span class="ad-audit__t">${fmtDate(x.ts)}</span></div>`; }).join("") : `<div class="ad-audit__row"><span style="grid-column:1/-1;color:var(--faint)">기록된 접근 로그가 없습니다.</span></div>`}</div>
    <p class="ad-hint" style="margin-top:8px">· 데모: 브라우저에 최근 기록만 저장됩니다. 실서비스는 작업자·IP·일시·내용을 서버 DB에 <b>최소 1년</b> 보관해야 합니다.</p>`;
  const lk = $("#auditLock"); if (lk) lk.addEventListener("click", () => { auditUnlocked = false; renderAudit(); });
}
// ======================= 이용 약관 관리 =======================
// 서버(KV) 약관 로드 완료 시, 약관 탭이 열려 있으면 최신본으로 갱신
if (window.LEGAL) window.LEGAL.onload = function () { const a = document.querySelector("#adTabs .mp-tab.is-active"); if (a && a.dataset.tab === "legal") renderLegal(); };
function renderLegal() {
  const L = window.LEGAL;
  $("#adLegal").innerHTML = `
    <h3 class="ad-h3">${ico("doc", 18)} 약관·정책 관리 <span class="ad-h3__s">이용약관·개인정보·마케팅 — 저장 즉시 회원가입 화면에 실시간 반영</span></h3>
    ${L.ORDER.map((k) => { const d = L.get(k), custom = L.isCustom(k); return `
      <div class="ad-legal" data-legalk="${k}">
        <button type="button" class="ad-legal__top" data-legaltoggle><b>${L.LABEL[k]}</b>${custom ? `<span class="ad-st ad-st--info">수정됨</span>` : `<span class="ad-st">기본값</span>`}<span class="ad-legal__chev">${ico("arrow", 15)}</span></button>
        <div class="ad-legal__body" hidden>
          <div class="ad-legal__row"><input type="text" class="ad-inp" data-lt placeholder="제목" value="${(d.title || "").replace(/"/g, "&quot;")}" /><input type="text" class="ad-inp ad-inp--sm" data-lu placeholder="시행일" value="${(d.updated || "").replace(/"/g, "&quot;")}" /></div>
          <textarea class="ad-legal__ta" data-lh rows="9" spellcheck="false">${(d.html || "").replace(/&/g, "&amp;").replace(/</g, "&lt;")}</textarea>
          <div class="ad-legal__act"><button class="btn btn--soft btn--xs" data-legalpreview="${k}">${ico("search", 13)} 미리보기</button><button class="btn btn--ghost btn--xs" data-legalreset="${k}">기본값 복원</button><button class="btn btn--accent btn--sm" data-legalsave="${k}">저장</button></div>
        </div>
      </div>`; }).join("")}
    <p class="ad-hint">${ico("shield", 13)} HTML 태그(&lt;h4&gt;, &lt;ol&gt;·&lt;li&gt;, &lt;b&gt; 등)를 사용할 수 있어요. 저장하면 회원가입 화면의 <b>[자세히 보기]</b> 모달에 즉시 반영됩니다.</p>`;
}
function openLegalPreview(title, html) {
  modal.hidden = false; modalCard.className = "modal__card modal__card--wide";
  modalCard.innerHTML = `<div class="modal__head"><b>미리보기 · ${title || ""}</b><button class="modal__x" data-mclose>✕</button></div><div class="terms-body">${html}</div>`;
}
function renderSettings() {
  const cfg = window.SITECFG.get();
  const admins = usersAll().filter((u) => u.role === "admin");
  $("#adSettings").innerHTML = `
    <h3 class="ad-h3">${ico("doc", 18)} 서비스 정책 <span class="ad-h3__s">공간 상세·결제 화면에 표시되는 짧은 환불 규정 문구</span></h3>
    <p class="ad-hint" style="margin:-4px 0 10px">${ico("doc", 13)} 이용약관·개인정보·마케팅·취소환불 <b>전문</b>은 좌측 <b>[이용 약관]</b> 탭에서 편집하세요. 여기서는 상세/결제 화면에 노출되는 <b>한 줄 환불 요약</b>만 관리합니다.</p>
    <div class="ad-cfg"><label class="ad-cfg__l">취소·환불 요약 문구</label><textarea id="cfgRefund" rows="2">${(cfg.refund || "").replace(/</g, "&lt;")}</textarea></div>
    <button class="btn btn--accent btn--sm" id="cfgSave">저장</button>

    <h3 class="ad-h3" style="margin-top:26px">${ico("shield", 18)} 관리자 계정·권한 <span class="ad-h3__s">운영·재무·CS 등 접근 권한 분리</span></h3>
    <div class="ad-table"><div class="ad-tr ad-tr--h ad-tr--adm"><span>관리자</span><span>접근 권한</span><span>관리</span></div>
    ${admins.map((u) => { const master = u.userId === "admin"; const perms = master ? ["ops", "finance", "cs", "system"] : (u.perms || []); return `<div class="ad-tr ad-tr--adm"><span class="ad-tr__id"><b>${u.nick || u.name}</b><em>${u.userId}</em></span><span>${master ? "<b>전체(마스터)</b>" : perms.map((p) => PERM_LABEL[p]).join(", ") || "-"}</span><span class="ad-tr__act">${master ? `<span class="ad-lock">🛡️ 마스터</span>` : `<button class="btn btn--soft btn--xs" data-permedit="${u.userId}">권한 편집</button><button class="btn btn--xs ad-del" data-admdel="${u.userId}">삭제</button>`}</span></div>`; }).join("")}</div>
    <div class="ad-cform" style="margin-top:12px"><input type="text" id="admId" class="ad-inp ad-inp--sm" placeholder="아이디" /><input type="text" id="admName" class="ad-inp ad-inp--sm" placeholder="이름" /><input type="text" id="admPw" class="ad-inp ad-inp--sm" placeholder="비밀번호" />${["ops", "finance", "cs", "system"].map((p) => `<label class="filt__chk"><input type="checkbox" class="admperm" value="${p}" ${p === "ops" ? "checked" : ""}/> ${PERM_LABEL[p]}</label>`).join("")}<button class="btn btn--accent btn--sm" id="admAdd">운영자 추가</button></div>`;
  $("#cfgSave").addEventListener("click", () => { window.SITECFG.set({ refund: $("#cfgRefund").value }); toast("저장했어요 — 공간 상세·결제 화면에 반영됩니다"); });
  $("#admAdd").addEventListener("click", () => {
    const id = $("#admId").value.trim(), name = $("#admName").value.trim(), pw = $("#admPw").value.trim();
    const perms = [...document.querySelectorAll(".admperm:checked")].map((x) => x.value);
    if (!id || !name) { toast("아이디·이름을 입력해 주세요"); return; }
    const l = usersAll(); if (l.some((u) => u.userId === id)) { toast("이미 있는 아이디예요"); return; }
    l.push({ userId: id, name, nick: name, pwHash: window.AUTH.hashPw(pw || "admin1234"), email: id + "@wylie.co.kr", role: "admin", perms }); saveUsers(l);
    toast("운영자를 추가했어요"); renderSettings();
  });
}
function editPerms(uid) {
  const u = usersAll().find((x) => x.userId === uid); if (!u) return;
  const cur = u.perms || [];
  modal.hidden = false;
  modalCard.innerHTML = `<div class="modal__head"><b>${u.nick || u.name} · 접근 권한</b><button class="modal__x" data-mclose>✕</button></div>
    <div class="ad-permlist">${["ops", "finance", "cs", "system"].map((p) => `<label class="filt__chk"><input type="checkbox" class="permedit" value="${p}" ${cur.includes(p) ? "checked" : ""}/> ${PERM_LABEL[p]} 관리</label>`).join("")}</div>
    <button class="btn btn--accent btn--block" data-permsave="${uid}" style="margin-top:14px">권한 저장</button>`;
}

// ======================= 공통 액션 =======================
// 정렬 헤더 클릭 → 해당 표만 재렌더
Object.assign(SORT_RERENDER, { bk: renderBookings, rfp: renderRfp, ord: renderOrders, set: renderSettle, mem: renderSettle, usr: renderUsers, prod: renderProducts, cp: renderCoupons, fee: renderFees });
document.addEventListener("click", (e) => {
  const so = e.target.closest("[data-sort]"); if (so) { const parts = so.dataset.sort.split("|"); toggleSort(parts[0], parts[1]); const fn = SORT_RERENDER[parts[0]]; if (fn) fn(); return; }
  const goto = e.target.closest("[data-goto]"); if (goto) { if (goto.dataset.uf) roleF = goto.dataset.uf; const t = $(`#adTabs [data-tab="${goto.dataset.goto}"]`); if (t) t.click(); return; }
  const pd = e.target.closest("[data-payoutdetail]"); if (pd) { openPayoutDetail(pd.dataset.payoutdetail, pd.dataset.prole); return; }
  const ap = e.target.closest("[data-approve]"); if (ap) { setStatus(ap.dataset.approve, "approved", "승인 완료 — 사업자 계정이 활성화됐어요"); return; }
  const rj = e.target.closest("[data-reject]"); if (rj) { if (confirm("반려할까요?")) setStatus(rj.dataset.reject, "rejected", "반려 처리했어요"); return; }
  const inf = e.target.closest("[data-info]"); if (inf) { if (window.AUDIT) window.AUDIT.log("view", "user:" + inf.dataset.info, "회원/사업자 정보 조회"); openUserInfo(inf.dataset.info); return; }
  const dc = e.target.closest("[data-docs]"); if (dc) { viewDocs(dc.dataset.docs); return; }
  const fed = e.target.closest("[data-feeeditor]"); if (fed) { openFeeEditor(fed.dataset.feeeditor, fed.dataset.feekind, fed.dataset.feename || fed.dataset.feeeditor); return; }
  const fadd = e.target.closest("#feeAddBtn"); if (fadd) { const id = modalCard.dataset.feeid, kind = modalCard.dataset.feekind; const fromEl = document.getElementById("feeFrom"), pctEl = document.getElementById("feePct"); const pct = pctEl ? pctEl.value.trim() : ""; if (pct === "" || isNaN(+pct)) { toast("요율(%)을 입력하세요"); return; } window.FEERATES.addRule(id, fromEl ? fromEl.value : "", pct); if (window.AUDIT) window.AUDIT.log("edit", "fee:" + id, "요율 규칙 " + (fromEl && fromEl.value ? fromEl.value + " 부터 " : "") + pct + "%"); openFeeEditor(id, kind, modalCard.dataset.feename || id); _feeAfterChange(kind); toast("요율 규칙을 추가했어요 — 결제일 기준으로 정산에 반영됩니다"); return; }
  const fdel = e.target.closest("[data-feedel]"); if (fdel) { const id = modalCard.dataset.feeid, kind = modalCard.dataset.feekind; window.FEERATES.removeRule(id, +fdel.dataset.feedel); openFeeEditor(id, kind, modalCard.dataset.feename || id); _feeAfterChange(kind); toast("요율 규칙을 삭제했어요"); return; }
  const sp = e.target.closest("[data-suspend]"); if (sp) { const l = usersAll(), u = l.find((x) => x.userId === sp.dataset.suspend); if (u) { u.suspended = !u.suspended; saveUsers(l); renderUsers(); toast(u.suspended ? "정지했어요" : "해제했어요"); } return; }
  const dl = e.target.closest("[data-del]"); if (dl) { if (confirm("이 계정을 삭제할까요? (탈퇴 후 카카오로 다시 로그인하면 재가입됩니다)")) { saveUsers(usersAll().filter((x) => x.userId !== dl.dataset.del)); renderAll(); toast("삭제했어요"); } return; }
  // 상품
  const bl = e.target.closest("[data-blind]"); if (bl) { const f = window.SPACEFLAGS.get(bl.dataset.blind); window.SPACEFLAGS.set(bl.dataset.blind, { blinded: !f.blinded }); renderProducts(); toast(!f.blinded ? "블라인드 처리했어요 (목록에서 숨김)" : "블라인드를 해제했어요"); return; }
  const rs = e.target.closest("[data-reject-sp]"); if (rs) { const f = window.SPACEFLAGS.get(rs.dataset.rejectSp); window.SPACEFLAGS.set(rs.dataset.rejectSp, { rejected: !f.rejected }); renderProducts(); toast(!f.rejected ? "반려 처리했어요" : "반려를 해제했어요"); return; }
  const po = e.target.closest("[data-pkgorder]"); if (po) { const [id, dir] = po.dataset.pkgorder.split("|"); const f = window.PKGFLAGS.get(id); window.PKGFLAGS.set(id, { order: (f.order || 0) + (+dir) }); renderPkgAdmin(); toast("진열 순서를 변경했어요"); return; }
  const ph = e.target.closest("[data-pkghide]"); if (ph) { const f = window.PKGFLAGS.get(ph.dataset.pkghide); window.PKGFLAGS.set(ph.dataset.pkghide, { hidden: !f.hidden }); renderPkgAdmin(); toast("패키지 노출 상태를 변경했어요"); return; }
  // 견적 요청
  const rff = e.target.closest("[data-rfpf]"); if (rff) { rfpF = rff.dataset.rfpf; renderRfp(); return; }
  const rfd = e.target.closest("[data-rfpdetail]"); if (rfd) { openRfpDetail(rfd.dataset.rfpdetail); return; }
  const rfb = e.target.closest("[data-rfpblind]"); if (rfb) { const r = window.REQUESTS.find(rfb.dataset.rfpblind); window.REQUESTS.update(rfb.dataset.rfpblind, { blinded: !(r && r.blinded) }); renderRfp(); toast(r && r.blinded ? "블라인드를 해제했어요" : "허위/스팸으로 블라인드 처리했어요"); return; }
  const rfdel = e.target.closest("[data-rfpdel]"); if (rfdel) { if (confirm("이 견적 요청을 삭제할까요? 관련 입찰도 함께 정리됩니다.")) { window.REQUESTS.save(window.REQUESTS.list().filter((x) => x.id !== rfdel.dataset.rfpdel)); window.QUOTES.save(window.QUOTES.list().filter((q) => q.requestId !== rfdel.dataset.rfpdel)); renderRfp(); toast("견적 요청을 삭제했어요"); } return; }
  // 예약/환불
  const bf = e.target.closest("[data-bkf]"); if (bf) { bkFilter = bf.dataset.bkf; renderBookings(); return; }
  const bkr = e.target.closest("[data-bkrange]"); if (bkr) {
    bkPreset = bkr.dataset.bkrange;
    if (bkPreset === "all") { bkFrom = ""; bkTo = ""; }
    else if (bkPreset === "month") { bkFrom = todayStr.slice(0, 8) + "01"; bkTo = todayStr; }
    else if (bkPreset === "7d") { bkFrom = bkShiftDay(-6); bkTo = todayStr; }
    else if (bkPreset === "30d") { bkFrom = bkShiftDay(-29); bkTo = todayStr; }
    renderBookings(); return;
  }
  const rf = e.target.closest("[data-refund]"); if (rf) { refundModal(rf.dataset.refund); return; }
  const rh = e.target.closest("[data-refundhalf]"); if (rh) { closeModal(); refund(rh.dataset.refundhalf, "half"); return; }
  const rfp = e.target.closest("[data-refundpolicy]"); if (rfp) { closeModal(); refund(rfp.dataset.refundpolicy, "policy"); return; }
  const rfu = e.target.closest("[data-refundfull]"); if (rfu) { closeModal(); refund(rfu.dataset.refundfull, "full"); return; }
  // 환불·주문
  const of = e.target.closest("[data-ordf]"); if (of) { ordF = of.dataset.ordf; renderOrders(); return; }
  const oo = e.target.closest("[data-orderopen]"); if (oo) { openOrderRefund(oo.dataset.orderopen); return; }
  const qrf = e.target.closest("[data-qrefund]"); if (qrf) { refundQuote(qrf.dataset.qrefund); return; }
  const orf = e.target.closest("[data-orderrefund]"); if (orf) { refundOrder(orf.dataset.orderrefund); return; }
  const pxl = e.target.closest("[data-payoutxls]"); if (pxl) { if (_payoutXls && _payoutXls.rows) { if (window.AUDIT) window.AUDIT.log("export", "payout", _payoutXls.name); downloadCSV(_payoutXls.name, _payoutXls.rows); toast(`정산명세서 ${Math.max(0, _payoutXls.rows.length - 1)}건을 내려받았어요`); } else toast("내려받을 명세가 없어요"); return; }
  // 정산 (PG 자동 분리정산 — 수동 지급/취소 없음)
  const mex = e.target.closest("[data-memexp]"); if (mex) { const id = mex.dataset.memexp; if (memOpen.has(id)) memOpen.delete(id); else { memOpen.add(id); if (window.AUDIT) window.AUDIT.log("view", "member:" + id, "회원 상세·이용내역 조회"); } renderSettle(); return; }
  const setr = e.target.closest("[data-setrange]"); if (setr) { setPreset = setr.dataset.setrange; const rr = settleRange(); setFrom = rr.from; setTo = rr.to; renderSettle(); return; }
  const sst = e.target.closest("[data-setstatus]"); if (sst) { setStatusF = sst.dataset.setstatus; renderSettle(); return; }
  const dpd = e.target.closest("[data-depded]"); if (dpd) { const d = window.DEPOSITS.find(dpd.dataset.depded); if (d) { const v = prompt(`파손·미정리 차감액을 입력하세요 (보증금 ${won(d.amount)}원 이내, 나머지는 환불)`, "0"); if (v != null) { const amt = Math.max(0, Math.min(d.amount, parseInt(String(v).replace(/[^0-9]/g, ""), 10) || 0)); window.DEPOSITS.update(d.id, { deduct: amt }); if (window.AUDIT) window.AUDIT.log("edit", "deposit:" + d.id, "보증금 차감 " + amt + "원"); renderSettle(); toast(amt > 0 ? `${won(amt)}원 차감 처리 · 나머지 환불` : "차감 없이 전액 환불 처리"); } } return; }
  const xls = e.target.closest("[data-xls]"); if (xls) { if (window.AUDIT) window.AUDIT.log("export", xls.dataset.xls, (xls.dataset.xls === "members" ? "회원 매출" : "공급자 정산") + " 엑셀 다운로드"); exportXls(xls.dataset.xls); return; }
  const x2 = e.target.closest("[data-xls2]"); if (x2) { const k = x2.dataset.xls2, d = _xls2[k]; if (d && d.rows) { if (window.AUDIT) window.AUDIT.log("export", k, d.name + " 다운로드"); downloadCSV(d.name, d.rows); toast(`${Math.max(0, d.rows.length - 1)}건을 내려받았어요`); } else toast("내려받을 데이터가 없어요"); return; }
  const txv = e.target.closest("[data-taxview]"); if (txv) { openTaxView(txv.dataset.taxview); return; }
  // CS
  const ans = e.target.closest("[data-answer]"); if (ans) { const inp = document.querySelector(`[data-ansinput="${ans.dataset.answer}"]`); const v = inp ? inp.value.trim() : ""; if (!v) { toast("답변을 입력해 주세요"); return; } const q0 = window.INQUIRY.all().find((x) => x.id === ans.dataset.answer); window.INQUIRY.update(ans.dataset.answer, { answer: v, status: "answered", answeredTs: Date.now() }); if (q0 && window.NOTIF) window.NOTIF.add({ forUser: q0.userId, title: "1:1 문의 답변 도착 💬", sub: v.slice(0, 30), link: "mypage.html" }); renderCS(); toast("답변을 등록했어요 — 문의자에게 알림이 전송됐어요"); return; }
  const nh = e.target.closest("[data-nthide]"); if (nh) { const n = window.NOTICES.list().find((x) => x.id === nh.dataset.nthide); window.NOTICES.update(nh.dataset.nthide, { hidden: !(n && n.hidden) }); renderCS(); toast("공지 상태를 변경했어요"); return; }
  const nd = e.target.closest("[data-ntdel]"); if (nd) { window.NOTICES.remove(nd.dataset.ntdel); renderCS(); toast("공지를 삭제했어요"); return; }
  const rvh = e.target.closest("[data-revhide]"); if (rvh) { const r = window.REVIEWS.all().find((x) => x.id === rvh.dataset.revhide); window.REVIEWS.update(rvh.dataset.revhide, { hidden: !(r && r.hidden) }); renderCS(); toast("리뷰를 블라인드 처리했어요"); return; }
  const rvd = e.target.closest("[data-revdel]"); if (rvd) { if (confirm("이 리뷰를 삭제할까요?")) { window.REVIEWS.save(window.REVIEWS.all().filter((x) => x.id !== rvd.dataset.revdel)); renderCS(); toast("리뷰를 삭제했어요"); } return; }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "bkFrom") { bkFrom = e.target.value; bkPreset = "custom"; renderBookings(); return; }
  if (e.target.id === "bkTo") { bkTo = e.target.value; bkPreset = "custom"; renderBookings(); return; }
  if (e.target.id === "setFrom") { setFrom = e.target.value; setPreset = "custom"; renderSettle(); return; }
  if (e.target.id === "setTo") { setTo = e.target.value; setPreset = "custom"; renderSettle(); return; }
  const rc = e.target.closest("[data-rolechg]"); if (!rc) return;
  const l = usersAll(), u = l.find((x) => x.userId === rc.dataset.rolechg); if (!u) return;
  u.role = rc.value;
  if ((u.role === "host" || u.role === "vendor") && !u.biz) u.biz = { status: "approved", ts: Date.now() };
  if (u.role === "vendor" && !u.serviceCats) u.serviceCats = ["camera"];
  saveUsers(l); renderAll(); toast(`역할을 ${ROLE_LABEL[u.role]}(으)로 변경했어요`);
});

// ======================= 렌더 라우팅 =======================
function renderPanel(tab) {
  if (tab === "dash") renderDash();
  else if (tab === "stats") renderStats();
  else if (tab === "approve") renderApprove();
  else if (tab === "products") renderProducts();
  else if (tab === "pkgadmin") renderPkgAdmin();
  else if (tab === "bookings") renderBookings();
  else if (tab === "rfp") renderRfp();
  else if (tab === "orders") renderOrders();
  else if (tab === "settle") renderSettle();
  else if (tab === "coupons") renderCoupons();
  else if (tab === "fees") renderFees();
  else if (tab === "cs") renderCS();
  else if (tab === "audit") renderAudit();
  else if (tab === "legal") renderLegal();
  else if (tab === "settings") renderSettings();
  else if (tab === "users") renderUsers();
  else if (tab === "bulk") { if (!$("#bulkGo")) renderBulk(); }
}
function renderAll() {
  badge();
  const active = $("#adTabs .mp-tab.is-active");
  renderPanel(active ? active.dataset.tab : "dash");
  // 대시보드 배지/카운트는 항상 최신화
  if (!$('.mp-panel[data-panel="dash"]').hidden) renderDash();
}
// 실시간 자동 갱신 (live.js 유입 + 크로스탭 + 주기 폴링) — 변경 있을 때만, 입력/모달 중엔 건너뜀
let _liveSig = "";
window.refreshLive = function () {
  const sig = [window.BOOKINGS.list().length, quotes().length, window.REQUESTS.list().length, window.INQUIRY.all().length, pendingUsers().length].join("|");
  if (sig === _liveSig) return; // 변경 없음
  const ae = document.activeElement;
  if (ae && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName)) return; // 입력 중 → 나중에
  if (typeof modal !== "undefined" && modal && !modal.hidden) return;
  _liveSig = sig; renderAll();
};
_liveSig = [window.BOOKINGS.list().length, quotes().length, window.REQUESTS.list().length, window.INQUIRY.all().length, pendingUsers().length].join("|");
setInterval(() => { if (window.refreshLive) window.refreshLive(); }, 20000);
window.addEventListener("storage", (e) => { if (/^gi_/.test(e.key || "") && window.refreshLive) window.refreshLive(); });
// 쿠폰·포인트·권한 액션
document.addEventListener("click", (e) => {
  const ct = e.target.closest("[data-cptoggle]"); if (ct) { const c = window.PCOUPONS.list().find((x) => x.id === ct.dataset.cptoggle); window.PCOUPONS.update(ct.dataset.cptoggle, { active: !(c && c.active) }); renderCoupons(); toast("쿠폰 상태를 변경했어요"); return; }
  const cd = e.target.closest("[data-cpdel]"); if (cd) { if (confirm("쿠폰을 삭제할까요?")) { window.PCOUPONS.remove(cd.dataset.cpdel); renderCoupons(); toast("쿠폰을 삭제했어요"); } return; }
  const pe = e.target.closest("[data-ptexp]"); if (pe) { window.POINTS.expire(pe.dataset.ptexp); renderCoupons(); toast("포인트를 소멸 처리했어요"); return; }
  // 이용 약관 관리
  const lgs = e.target.closest("[data-legalsave]"); if (lgs) { const box = lgs.closest("[data-legalk]"), k = box.dataset.legalk; window.LEGAL.set(k, { title: box.querySelector("[data-lt]").value, updated: box.querySelector("[data-lu]").value, html: box.querySelector("[data-lh]").value }); if (window.AUDIT) window.AUDIT.log("edit", "legal:" + k, window.LEGAL.LABEL[k] + " 수정"); renderLegal(); toast("약관을 저장했어요 — 회원가입 화면에 실시간 반영됩니다"); return; }
  const lgr = e.target.closest("[data-legalreset]"); if (lgr) { if (confirm("이 약관을 기본값으로 되돌릴까요? 수정 내용이 사라집니다.")) { window.LEGAL.reset(lgr.dataset.legalreset); renderLegal(); toast("기본값으로 복원했어요"); } return; }
  const lgp = e.target.closest("[data-legalpreview]"); if (lgp) { const box = lgp.closest("[data-legalk]"); openLegalPreview(box.querySelector("[data-lt]").value, box.querySelector("[data-lh]").value); return; }
  const lgt = e.target.closest("[data-legaltoggle]"); if (lgt) { const box = lgt.closest("[data-legalk]"), body = box.querySelector(".ad-legal__body"); if (body) { const open = body.hasAttribute("hidden"); if (open) { body.removeAttribute("hidden"); lgt.classList.add("is-open"); } else { body.setAttribute("hidden", ""); lgt.classList.remove("is-open"); } } return; }
  const ped = e.target.closest("[data-permedit]"); if (ped) { editPerms(ped.dataset.permedit); return; }
  const ps = e.target.closest("[data-permsave]"); if (ps) { const perms = [...document.querySelectorAll(".permedit:checked")].map((x) => x.value); const l = usersAll(), u = l.find((x) => x.userId === ps.dataset.permsave); if (u) { u.perms = perms; saveUsers(l); } closeModal(); renderSettings(); toast("권한을 저장했어요"); return; }
  const ad = e.target.closest("[data-admdel]"); if (ad) { if (confirm("이 운영자 계정을 삭제할까요?")) { saveUsers(usersAll().filter((x) => x.userId !== ad.dataset.admdel)); renderSettings(); toast("운영자를 삭제했어요"); } return; }
});

// 권한 게이팅 — 접근 가능한 탭만 노출
(function gate() {
  const a = window.AUTH.get(); const u = usersAll().find((x) => x.userId === (a && a.userId));
  const all = ["ops", "finance", "cs", "system"];
  const perms = (!u || u.userId === "admin" || !u.perms || !u.perms.length) ? all : u.perms;
  if (perms.length === all.length) return; // 마스터/전체권한
  let firstAllowed = null;
  $("#adTabs").querySelectorAll(".mp-tab").forEach((t) => { const p = t.dataset.perm; if (p && perms.indexOf(p) < 0) t.style.display = "none"; else if (!firstAllowed) firstAllowed = t; });
  const active = $("#adTabs .mp-tab.is-active");
  if (active && active.style.display === "none" && firstAllowed) firstAllowed.click();
})();

// 보관기간 경과 데이터 자동 파기 스윕 (데모 — 실서비스는 서버 배치/cron)
if (window.RETENTION) { const purged = window.RETENTION.sweep(); if (purged && window.AUDIT) window.AUDIT.log("purge", "retention", `보관기간(5년) 경과 예약 ${purged}건 개인정보 파기`); }

// 관리자 자동 로그아웃 — 30분간 무조작 시 세션 만료 (보안)
(function idleLogout() {
  const LIMIT = 30 * 60 * 1000; let t = null;
  function out() { if (window.AUDIT) window.AUDIT.log("logout", "session", "30분 무조작 자동 로그아웃"); try { window.AUTH.logout(); } catch (e) {} alert("보안을 위해 30분간 활동이 없어 자동 로그아웃되었습니다.\n다시 로그인해 주세요."); location.href = "login.html"; }
  function reset() { clearTimeout(t); t = setTimeout(out, LIMIT); }
  ["click", "keydown", "mousemove", "scroll", "touchstart", "input"].forEach(function (ev) { document.addEventListener(ev, reset, { passive: true }); });
  reset();
})();

badge(); renderDash(); renderBulk();

// 알림·링크에서 특정 탭으로 진입 (?tab=settle&period=YYYY-MM&prov=id)
(function initTab() {
  const params = new URLSearchParams(location.search);
  const t = params.get("tab");
  if (!t) return;
  const period = params.get("period"), prov = params.get("prov");
  // 정산 링크: 해당 월로 미리 세팅
  if (t === "settle" && period && /^\d{4}-\d{2}$/.test(period)) {
    setPreset = "custom"; setFrom = period + "-01"; setTo = lastDayOfMonth(period + "-01"); setStatusF = "all";
  }
  const btn = $(`#adTabs [data-tab="${t}"]`);
  if (btn && btn.style.display !== "none") { setMenu(false); btn.click(); }
  // 해당 업체 행으로 스크롤 + 하이라이트
  if (t === "settle" && prov) {
    let tries = 0;
    const go = () => {
      const row = document.querySelector(`[data-prow="${prov}"]`);
      if (row) { row.scrollIntoView({ behavior: "smooth", block: "center" }); row.classList.add("ad-flash"); setTimeout(() => row.classList.remove("ad-flash"), 2600); }
      else if (tries++ < 10) setTimeout(go, 90);
    };
    setTimeout(go, 160);
  }
})();

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });

// 툴팁(?) 말풍선이 화면/컨테이너 밖으로 잘리지 않도록 좌우 위치 자동 보정
(function adTipClamp() {
  function place(e) {
    const t = e.target.closest && e.target.closest(".ad-tip"); if (!t) return;
    const bub = t.querySelector(".ad-tip__bub"); if (!bub) return;
    bub.style.transform = "translateX(-50%)"; bub.style.setProperty("--tipShift", "0px"); // 리셋 후 측정
    requestAnimationFrame(() => {
      const cont = t.closest(".ad-kpis") || t.closest(".mp") || document.body;
      const cr = cont.getBoundingClientRect();
      const left = Math.max(cr.left + 6, 6), right = Math.min(cr.right - 6, window.innerWidth - 6);
      const r = bub.getBoundingClientRect();
      let shift = 0;
      if (r.left < left) shift = left - r.left;
      else if (r.right > right) shift = right - r.right;
      if (shift) { shift = Math.round(shift); bub.style.transform = `translateX(calc(-50% + ${shift}px))`; bub.style.setProperty("--tipShift", shift + "px"); }
    });
  }
  document.addEventListener("mouseover", place);
  document.addEventListener("focusin", place);
})();
