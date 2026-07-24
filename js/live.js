// ============================================================
// 공간잇다 — 실시간 데이터 유입 시뮬레이터 (백엔드 없이 A플랜)
//  · 30분마다 소액 실데이터 1건 유입 (예약·견적요청·1:1문의·사업자 신청/승인)
//  · 방문 시 마지막 tick 이후 지난 시간만큼 30분 단위로 백필(catch-up)
//  · 생성 데이터는 _mock+_live 플래그 → 관리자 초기화로 정리
// ============================================================
(function () {
  if (!window.BOOKINGS || !window.REQUESTS) return;
  var KEY = "gi_livetick", STEP = 30 * 60 * 1000, MAXBF = 48, FIRST = 12; // 최초 방문 시 최근 6시간분 채움
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var dstr = function (t) { var d = new Date(t); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var rnd = Math.random, pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
  var uid = function (p) { return (p || "") + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
  var phone = function () { return "010-" + pad(1000 + Math.floor(rnd() * 8999)) + "-" + pad(1000 + Math.floor(rnd() * 8999)); };

  var O = window.OPS || {};
  var NAMES = O.NAMES || ["김민준", "이서연", "박도윤", "최지우", "정하준", "강서아", "조은우", "윤지호", "임하윤", "한도현", "오수아", "서준서", "신예은", "권시우", "황유나"];
  var EVENTS = O.EVENT || ["소규모 팀 워크숍 다과·빔프로젝터 필요해요.", "생일 파티룸 대관과 풍선 데코 문의해요.", "제품 촬영용 스튜디오와 조명 대여합니다.", "동호회 모임 20명, 음향·케이터링 문의드려요.", "스터디 모임 공간과 화이트보드가 필요합니다."];
  var CATNOTE = O.CATNOTE || {};
  var INQ = O.INQ || [{ s: "결제일 변경 문의", t: "예약 결제일을 변경할 수 있을까요?" }, { s: "이용 시간 연장", t: "현장에서 1시간 연장 가능한가요?" }, { s: "정산일 문의", t: "이용 완료 후 PG 자동정산은 며칠 뒤 입금되나요?" }, { s: "주차 문의", t: "주차 가능 대수가 궁금합니다." }, { s: "환불 규정", t: "취소 시 환불 규정이 어떻게 되나요?" }];
  var GU = O.GU || ["강남구", "서초구", "마포구", "성동구", "송파구", "용산구", "영등포구", "광진구"];
  var SVCS = ["camera", "catering", "office", "cleaning", "repair", "interior", "banner", "projector", "goods", "photo"];
  var svcLabel = function (c) { return (window.reqCatById ? reqCatById(c).label : c); };
  var BIZ_HOST = ["스테이", "라운지", "스튜디오", "파티움", "워크스페이스", "하우스", "팩토리", "플레이스"];
  var BANKS = ["국민은행", "신한은행", "우리은행", "카카오뱅크", "토스뱅크", "농협은행"];

  function cheapSpace() {
    var all = (typeof getAllSpaces === "function" ? getAllSpaces() : []).filter(function (s) { return !s.blinded && !s.rejected && !s.hidden; });
    if (!all.length) return null;
    var cheap = all.filter(function (s) { return (s.price || 0) <= 22000; });
    return pick(cheap.length ? cheap : all);
  }
  // ── 소액 공간 예약 ──
  function addBooking(ts) {
    var s = cheapSpace(); if (!s) return null;
    var hrs = 1 + Math.floor(rnd() * 2), unit = s.price || 15000, total = Math.round(unit * hrs * (1 + (window.CUSTOMER_FEE || 0))), nm = pick(NAMES);
    window.BOOKINGS.add({ id: uid("lv"), spaceId: s.id, spaceName: s.name, hostId: s.ownerId || "host", guestId: uid("g"), guestName: nm, guestPhone: phone(), price: unit, date: dstr(ts), start: 10 + Math.floor(rnd() * 9), hours: hrs, guests: 1 + Math.floor(rnd() * 4), total: total, status: "confirmed", paid: true, ts: ts, _mock: true, _live: true });
    return "🗓️ " + nm + "님 · " + s.name + " 예약 (" + total.toLocaleString() + "원)";
  }
  // ── 견적 요청 (+ 소액 입찰 1건) ──
  function addRequest(ts) {
    var nm = pick(NAMES), cat = pick(SVCS), gu = pick(GU);
    var rid = uid("lvr");
    var notes = {}; if (CATNOTE[cat]) notes[cat] = CATNOTE[cat];
    var r = { id: rid, memberId: uid("m"), memberName: nm, memberPhone: phone(), date: dstr(ts + (2 + Math.floor(rnd() * 12)) * 86400000), region: "서울 " + gu, capacity: 5 + Math.floor(rnd() * 25), cats: [cat], detail: pick(EVENTS), catNotes: notes, budget: (2 + Math.floor(rnd() * 8)) * 10000, status: "open", ts: ts, _mock: true, _live: true };
    var list = window.REQUESTS.list(); list.unshift(r); window.REQUESTS.save(list);
    // 관련 파트너 소액 입찰
    var vendors = window.AUTH.users().filter(function (u) { return u.role === "vendor" && (u.serviceCats || []).indexOf(cat) >= 0; });
    if (vendors.length && rnd() < 0.6) {
      var v = pick(vendors), price = (2 + Math.floor(rnd() * 10)) * 10000;
      var ql = window.QUOTES.list(); ql.unshift({ id: uid("lvq"), requestId: rid, vendorId: v.userId, vendorName: v.nick || v.name, cat: cat, price: price, status: "sent", paid: false, date: r.date, ts: ts + 60000, _mock: true, _live: true }); window.QUOTES.save(ql);
    }
    return "📝 " + nm + "님 · " + svcLabel(cat) + " 견적 요청";
  }
  // ── 1:1 문의 ──
  function addInquiry(ts) {
    var nm = pick(NAMES), q = pick(INQ);
    var list = window.INQUIRY.all(); list.unshift({ id: uid("lviq"), userId: uid("u"), name: nm, subject: q.s, text: q.t, status: "received", answer: "", ts: ts, _mock: true, _live: true }); window.INQUIRY.save(list);
    return "💬 " + nm + "님 1:1 문의 · " + q.s;
  }
  // ── 사업자 등록 신청 (승인 대기) ──
  function addBiz(ts) {
    var isHost = rnd() < 0.5, gu = pick(GU), nm = pick(NAMES);
    var cat = pick(SVCS);
    var nick = isHost ? (gu.replace("구", "") + pick(BIZ_HOST)) : (svcLabel(cat) + "전문 " + (10 + Math.floor(rnd() * 89)));
    var u = { userId: uid("lvb"), pw: "1234", nick: nick, name: nick, email: uid("") + "@demo.kr", role: isHost ? "host" : "vendor", region: "서울", phone: phone(), addr: "서울 " + gu + " " + (10 + Math.floor(rnd() * 80)) + "-" + (1 + Math.floor(rnd() * 20)), owner: nm, bizNo: (100 + Math.floor(rnd() * 800)) + "-" + pad(10 + Math.floor(rnd() * 89)) + "-" + (10000 + Math.floor(rnd() * 89999)), bank: pick(BANKS), account: (100 + Math.floor(rnd() * 800)) + "-" + (1000 + Math.floor(rnd() * 8999)) + "-" + (100000 + Math.floor(rnd() * 899999)), biz: { status: "pending", ts: ts }, _mock: true, _live: true };
    if (!isHost) u.serviceCats = [cat];
    var us = window.AUTH.users(); us.push(u); window.AUTH.saveUsers(us);
    return "🏢 새 사업자 등록 신청 · " + nick + " (" + (isHost ? "호스트" : "파트너") + ")";
  }
  // ── 대기 중 사업자 승인 처리 (라이브 신청분 우선) ──
  function approveOne(silent) {
    var us = window.AUTH.users();
    var p = us.filter(function (u) { return u._live && u.biz && u.biz.status === "pending"; });
    if (!p.length) return null;
    var u = p[0]; u.biz.status = "approved"; u.biz.approvedTs = Date.now(); window.AUTH.saveUsers(us);
    return "✅ " + (u.nick || u.name) + " 사업자 승인 완료";
  }
  function genOne(ts) {
    var r = rnd();
    if (r < 0.38) return addBooking(ts);
    if (r < 0.60) return addRequest(ts);
    if (r < 0.75) return addInquiry(ts);
    if (r < 0.90) return addBiz(ts);
    return approveOne() || addBooking(ts);
  }

  // ── _live 레코드 상한 유지(용량 보호) — 최신만 남기고 정리 ──
  function capLive(store, isList, cap) {
    try {
      var all = isList ? store.list() : store.all();
      var live = all.filter(function (x) { return x._live; });
      if (live.length <= cap) return;
      var keep = {}; live.slice(0, cap).forEach(function (x) { keep[x.id] = 1; }); // add()는 최신을 앞에 unshift
      var next = all.filter(function (x) { return !x._live || keep[x.id]; });
      isList ? store.save(next) : store.save(next);
    } catch (e) {}
  }
  function prune() {
    capLive(window.BOOKINGS, true, 80);
    capLive(window.REQUESTS, true, 50);
    capLive(window.QUOTES, true, 80);
    capLive(window.INQUIRY, false, 40);
    try {
      var us = window.AUTH.users(), lu = us.filter(function (u) { return u._live; });
      if (lu.length > 30) { var keepU = {}; lu.slice(-30).forEach(function (u) { keepU[u.userId] = 1; }); window.AUTH.saveUsers(us.filter(function (u) { return !u._live || keepU[u.userId]; })); }
    } catch (e) {}
  }

  // ── 백필(catch-up) ──
  try { prune(); } catch (e) {} // 기존 누적분 먼저 정리(용량 회복)
  try {
    var now = Date.now(), last = +localStorage.getItem(KEY) || 0, t;
    if (!last) { t = now - FIRST * STEP; for (var i = 0; i < FIRST; i++) { t += STEP; genOne(t); if (rnd() < 0.3) approveOne(); } localStorage.setItem(KEY, String(now)); }
    else { var n = Math.floor((now - last) / STEP); if (n > 0) { n = Math.min(n, MAXBF); t = last; for (var j = 0; j < n; j++) { t += STEP; genOne(t); if (rnd() < 0.3) approveOne(); } localStorage.setItem(KEY, String(t)); } }
    prune();
  } catch (e) {}
  if (window.refreshLive) window.refreshLive();

  // ── 실시간 유입 (30분마다) ──
  setInterval(function () {
    try {
      var msg = genOne(Date.now());
      if (rnd() < 0.3) approveOne();
      localStorage.setItem(KEY, String(Date.now()));
      prune();
      if (window.refreshLive) window.refreshLive();
      if (msg) liveToast(msg);
    } catch (e) {}
  }, STEP);

  // ── 라이브 토스트 ──
  function liveToast(msg) {
    var el = document.getElementById("liveToast");
    if (!el) { el = document.createElement("div"); el.id = "liveToast"; el.className = "live-toast"; document.body.appendChild(el); }
    el.innerHTML = '<span class="live-toast__dot"></span>' + msg;
    el.classList.add("show");
    clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove("show"); }, 5000);
  }
  window.liveToast = liveToast;
})();
