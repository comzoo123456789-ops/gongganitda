// ============================================================
// 공간잇다 — 인증 + 찜 + 예약 + 알림 + 후기 + 채팅 + 로고/헤더 주입
// ⚠️ 데모용 localStorage (실서비스는 서버 인증·DB 필요)
// ============================================================
// 비밀번호 해시 (데모 — 평문 저장 방지용. ⚠️ 실서비스는 서버 bcrypt/Argon2 필수)
function _hashPw(pw) {
  const s = "gi$salt$" + String(pw == null ? "" : pw);
  let h1 = 0x811c9dc5, h2 = 0x1234abcd >>> 0;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul((h2 + c) ^ (c << 3), 2654435761) >>> 0; }
  return "h1$" + h1.toString(36) + h2.toString(36);
}
window.AUTH = (function () {
  const SK = "gi_auth", UK = "gi_users";
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { return JSON.parse(d); } };
  let us = read(UK, "[]");
  if (!us.length) {
    us = [
      { userId: "guest", pwHash: _hashPw("1234"), nick: "손님", name: "손님", email: "guest@demo.kr", role: "guest" },
      { userId: "host", pwHash: _hashPw("1234"), nick: "사장", name: "사장", email: "host@demo.kr", role: "host" },
    ];
  }
  if (!us.some((u) => u.role === "vendor")) {
    us.push({ userId: "vendor", pwHash: _hashPw("1234"), nick: "와일리장비", name: "와일리장비", email: "vendor@demo.kr", role: "vendor", serviceCats: ["camera", "catering", "office"], region: "서울" });
  }
  // 마스터(관리자) 계정 — 통합 관리·가입 승인
  if (!us.some((u) => u.role === "admin")) {
    us.push({ userId: "admin", pwHash: _hashPw("admin1234"), nick: "관리자", name: "관리자", email: "admin@wylie.co.kr", role: "admin" });
  }
  localStorage.setItem(UK, JSON.stringify(us));
  return {
    hashPw: _hashPw,
    // 비밀번호 검증 (해시 우선, 레거시 평문 fallback + 자동 마이그레이션)
    checkPw: function (user, pw) {
      if (!user) return false;
      if (user.pwHash) return user.pwHash === _hashPw(pw);
      if (typeof user.pw === "string") { if (user.pw === pw) { try { const l = read(UK, "[]"); const i = l.findIndex((x) => x.userId === user.userId); if (i >= 0) { l[i].pwHash = _hashPw(pw); delete l[i].pw; localStorage.setItem(UK, JSON.stringify(l)); } } catch (e) {} return true; } }
      return false;
    },
    users: () => read(UK, "[]"),
    saveUsers: (u) => localStorage.setItem(UK, JSON.stringify(u)),
    get: () => read(SK, "null"),
    set: (a) => localStorage.setItem(SK, JSON.stringify(a)),
    logout: () => localStorage.removeItem(SK),
    // 소셜 로그인(카카오 등) — provider+id로 회원을 찾거나 새로 만들고 세션 설정
    // 소셜 계정 조회(생성·로그인 안 함) — 기존 회원 여부 판별용
    socialFind: function (provider, sid) { const uid = provider + "_" + sid; return read(UK, "[]").find((x) => x.userId === uid) || null; },
    socialUpsert: function (provider, sid, nick, extra) {
      const uid = provider + "_" + sid;
      const list = read(UK, "[]");
      let u = list.find((x) => x.userId === uid);
      if (!u) {
        u = Object.assign({ userId: uid, nick: nick || "회원", name: nick || "회원", email: "", role: "guest", provider: provider, social: true, ts: Date.now() }, extra || {});
        list.push(u); localStorage.setItem(UK, JSON.stringify(list));
      } else {
        let changed = false;
        if (nick && u.nick !== nick) { u.nick = nick; if (!u.name || u.name === "회원") u.name = nick; changed = true; }
        if (extra && extra.photo && u.photo !== extra.photo) { u.photo = extra.photo; changed = true; }
        if (changed) { const i = list.findIndex((x) => x.userId === uid); list[i] = u; localStorage.setItem(UK, JSON.stringify(list)); }
      }
      this.set(u);
      return u;
    },
    roleWord: (r) => (r === "host" ? "호스트" : r === "vendor" ? "파트너" : r === "admin" ? "관리자" : "회원"),
    displayName: function (a) { a = a || this.get(); if (!a) return ""; const w = this.roleWord(a.role); const n = a.name || ""; return (n === w || n.endsWith(w)) ? n : `${n} ${w}`; },
  };
})();

window.FAV = {
  KEY: "gi_liked",
  list: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  has: function (id) { return this.list().includes(+id); },
  toggle: function (id) { id = +id; let l = this.list(); if (l.includes(id)) l = l.filter((x) => x !== id); else l.push(id); localStorage.setItem(this.KEY, JSON.stringify(l)); return l.includes(id); },
};

window.BOOKINGS = {
  KEY: "gi_bookings",
  list: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save: function (l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  add: function (b) { const l = this.list(); l.unshift(b); this.save(l); },
  find: function (id) { return this.list().find((b) => b.id === id); },
  update: function (id, patch) { const l = this.list(); const i = l.findIndex((b) => b.id === id); if (i >= 0) { l[i] = Object.assign({}, l[i], patch); this.save(l); } },
};

// 청소 보증금 (예수금) — 이용료와 별도로 카드 결제, 이용 후 환불. 매출·정산에는 포함되지 않음.
window.DEPOSITS = {
  KEY: "gi_deposits",
  list: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save: function (l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  add: function (d) { const l = this.list(); l.unshift(d); this.save(l); },
  find: function (id) { return this.list().find((x) => x.id === id); },
  byBooking: function (bid) { return this.list().find((x) => String(x.bookingId) === String(bid)); },
  update: function (id, patch) { const l = this.list(); const i = l.findIndex((x) => x.id === id); if (i >= 0) { l[i] = Object.assign({}, l[i], patch); this.save(l); } },
  // 상태: 차감 있으면 '차감 후 환불', 이용일 경과면 '환불 완료', 아니면 '예치 중'
  statusOf: function (d, today) {
    if (!d) return { k: "none", label: "-", refund: 0 };
    if (d.refunded === false && d.cancelled) return { k: "held", label: "예치 중", refund: d.amount };
    if (d.deduct > 0) return { k: "deducted", label: "차감 후 환불", refund: Math.max(0, d.amount - d.deduct) };
    if (d.date && today && d.date < today) return { k: "refunded", label: "환불 완료", refund: d.amount };
    return { k: "held", label: "예치 중 · 이용 후 환불", refund: d.amount };
  },
};

window.NOTIF = {
  KEY: "gi_notifs",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save: function (l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  list: function (user) { return this.all().filter((n) => n.forUser === user); },
  unread: function (user) { return this.list(user).filter((n) => !n.read).length; },
  add: function (n) { const l = this.all(); l.unshift(Object.assign({ id: Date.now() + "" + Math.floor(Math.random() * 1000), read: false, ts: Date.now() }, n)); this.save(l); if (window.refreshBell) window.refreshBell(); },
  markRead: function (user) { const l = this.all(); l.forEach((n) => { if (n.forUser === user) n.read = true; }); this.save(l); },
  clear: function (user) { this.save(this.all().filter((n) => n.forUser !== user)); },
};

window.REVIEWS = {
  KEY: "gi_reviews",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save: function (l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  list: function (spaceId) { return this.all().filter((r) => r.spaceId === spaceId); },
  add: function (r) { const l = this.all(); l.unshift(Object.assign({ id: (window.uid ? window.uid("rev") : "rev" + Date.now()), ts: Date.now() }, r)); this.save(l); },
  update: function (id, patch) { const l = this.all(); const i = l.findIndex((x) => x.id === id); if (i >= 0) { l[i] = Object.assign({}, l[i], patch); this.save(l); } },
};

// 채팅 스레드 메타(예약/견적 없이 시작하는 문의용 — 공간 1:1 문의 등)
window.CHATMETA = {
  KEY: "gi_chatmeta",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "{}"); } catch (e) { return {}; } },
  get: function (id) { return this.all()[id] || null; },
  set: function (id, obj) { const a = this.all(); a[id] = obj; localStorage.setItem(this.KEY, JSON.stringify(a)); },
};
window.CHAT = {
  KEY: "gi_chat", RKEY: "gi_chatread",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "{}"); } catch (e) { return {}; } },
  get: function (bid) { return this.all()[bid] || []; },
  send: function (bid, msg) { const a = this.all(); (a[bid] = a[bid] || []).push(Object.assign({ ts: Date.now() }, msg)); localStorage.setItem(this.KEY, JSON.stringify(a)); },
  reads: function () { try { return JSON.parse(localStorage.getItem(this.RKEY) || "{}"); } catch (e) { return {}; } },
  lastRead: function (user, bid) { const r = this.reads(); return (r[user] && r[user][bid]) || 0; },
  markRead: function (user, bid) { const r = this.reads(); (r[user] = r[user] || {})[bid] = Date.now(); localStorage.setItem(this.RKEY, JSON.stringify(r)); },
  unread: function (user, bid) { const lr = this.lastRead(user, bid); return this.get(bid).filter((m) => m.from !== user && m.ts > lr).length; },
};

// 할인 (반짝할인 + 쿠폰) — 호스트가 룸별로 설정
function _today() { const d = new Date(), p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }
window.DISCOUNT = {
  KEY: "gi_discounts",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "{}"); } catch (e) { return {}; } },
  get: function (sid) { return this.all()[sid] || {}; },
  set: function (sid, obj) { const a = this.all(); a[sid] = obj; localStorage.setItem(this.KEY, JSON.stringify(a)); },
  _active: function (d) { if (!d || !d.pct) return 0; const t = _today(); if (d.from && t < d.from) return 0; if (d.to && t > d.to) return 0; return +d.pct; },
  flashPct: function (sid) { return this._active(this.get(sid).flash); },
  coupon: function (sid) { return this.get(sid).coupon || null; },
  couponPct: function (sid, code) { const c = this.get(sid).coupon; if (!c || !c.pct || !code) return 0; if (code.trim().toUpperCase() !== (c.code || "").toUpperCase()) return 0; const t = _today(); if (c.from && t < c.from) return 0; if (c.to && t > c.to) return 0; return +c.pct; },
};
// 반짝할인 반영 가격
window.priceOf = function (s) { const pct = window.DISCOUNT.flashPct(s.id); return { pct, orig: s.price, price: pct ? Math.round(s.price * (100 - pct) / 100 / 100) * 100 : s.price }; };

// 가용성 차단(호스트가 특정 날짜를 예약 불가로)
window.BLOCKS = {
  KEY: "gi_blocks",
  SKEY: "gi_blockslots", // 시간대 단위 차단 {sid:{date:[hour,...]}}
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "{}"); } catch (e) { return {}; } },
  get: function (sid) { return this.all()[sid] || []; },
  has: function (sid, date) { return this.get(sid).indexOf(date) >= 0; },
  toggle: function (sid, date) { const a = this.all(); const l = a[sid] || []; const i = l.indexOf(date); if (i >= 0) l.splice(i, 1); else l.push(date); a[sid] = l; localStorage.setItem(this.KEY, JSON.stringify(a)); return l.indexOf(date) >= 0; },
  // ---- 시간대 단위 차단 ----
  allSlots: function () { try { return JSON.parse(localStorage.getItem(this.SKEY) || "{}"); } catch (e) { return {}; } },
  getSlots: function (sid, date) { const m = this.allSlots()[sid] || {}; return m[date] || []; },
  hasSlot: function (sid, date, h) { return this.getSlots(sid, date).indexOf(h) >= 0; },
  slotCount: function (sid, date) { return this.getSlots(sid, date).length; },
  toggleSlot: function (sid, date, h) { const a = this.allSlots(); const m = a[sid] || {}; const l = m[date] || []; const i = l.indexOf(h); if (i >= 0) l.splice(i, 1); else l.push(h); if (l.length) m[date] = l.sort((x, y) => x - y); else delete m[date]; a[sid] = m; localStorage.setItem(this.SKEY, JSON.stringify(a)); return l.indexOf(h) >= 0; },
  clearSlots: function (sid, date) { const a = this.allSlots(); const m = a[sid] || {}; delete m[date]; a[sid] = m; localStorage.setItem(this.SKEY, JSON.stringify(a)); },
};

// B-1: 맞춤업체 현장 진행 상태 (확정 견적 건별) — 준비→세팅→진행→회수
window.JOBSTAGE = {
  KEY: "gi_jobstage",
  STAGES: ["준비 중", "배송·세팅 완료", "행사 진행 중", "회수·마감"],
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "{}"); } catch (e) { return {}; } },
  get: function (qid) { const v = this.all()[qid]; return typeof v === "number" ? v : 0; },
  set: function (qid, stage) { const a = this.all(); a[qid] = Math.max(0, Math.min(this.STAGES.length - 1, stage)); localStorage.setItem(this.KEY, JSON.stringify(a)); return a[qid]; },
  label: function (qid) { return this.STAGES[this.get(qid)]; },
};

// 예약 설정(자동수락·최소/최대시간·청소버퍼)
window.SETTINGS = {
  KEY: "gi_settings",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "{}"); } catch (e) { return {}; } },
  get: function (sid) { return Object.assign({ autoAccept: false, minH: 1, maxH: 8, buffer: 0, autoMsg: "" }, this.all()[sid] || {}); },
  set: function (sid, obj) { const a = this.all(); a[sid] = obj; localStorage.setItem(this.KEY, JSON.stringify(a)); },
};

// 공급자·패키지별 수수료율(%) — "적용 시작일" 기반 이력으로 관리
//  키: 계정 userId(호스트·업체) 또는 "pkg:"+패키지id
//  값: [{ from: "YYYY-MM-DD"|""(초기), pct: N }, ...]  · 거래는 결제일에 유효했던 요율로 계산(과거 불변)
window.FEERATES = {
  KEY: "gi_feerates",
  DEF: { host: 5, vendor: 5, pkg: 5 },
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "{}"); } catch (e) { return {}; } },
  save: function (m) { localStorage.setItem(this.KEY, JSON.stringify(m)); },
  _today: function () { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; },
  // 정렬된 이력(오름차순) — 구버전 숫자값도 단일 규칙으로 호환
  history: function (id) { const h = this.all()[id]; if (typeof h === "number") return [{ from: "", pct: h }]; if (!Array.isArray(h)) return []; return h.slice().sort(function (a, b) { return String(a.from || "").localeCompare(String(b.from || "")); }); },
  // 특정 날짜(결제일)에 유효했던 요율(%)
  pctOn: function (kind, id, dateStr) { const h = this.history(id); let pick = null; for (var i = 0; i < h.length; i++) { var f = h[i].from || ""; if (f === "" || f <= dateStr) pick = h[i]; } return pick ? +pick.pct : (this.DEF[kind] != null ? this.DEF[kind] : 8); },
  // 현재(오늘) 유효 요율
  pctOf: function (kind, id) { return this.pctOn(kind, id, this._today()); },
  isCustom: function (id) { return this.history(id).length > 0; },
  // 규칙 추가/교체(같은 시작일이면 교체)
  addRule: function (id, from, pct) { if (pct == null || pct === "" || isNaN(+pct)) return; const m = this.all(); const h = Array.isArray(m[id]) ? m[id] : (typeof m[id] === "number" ? [{ from: "", pct: m[id] }] : []); const f = from || ""; const rule = { from: f, pct: Math.max(0, Math.min(50, +pct)) }; const i = h.findIndex(function (r) { return (r.from || "") === f; }); if (i >= 0) h[i] = rule; else h.push(rule); m[id] = h; this.save(m); },
  removeRule: function (id, idx) { const sorted = this.history(id); if (idx < 0 || idx >= sorted.length) return; const target = sorted[idx]; const m = this.all(); const raw = Array.isArray(m[id]) ? m[id] : (typeof m[id] === "number" ? [{ from: "", pct: m[id] }] : []); const j = raw.findIndex(function (r) { return (r.from || "") === (target.from || "") && +r.pct === +target.pct; }); if (j >= 0) raw.splice(j, 1); if (!raw.length) delete m[id]; else m[id] = raw; this.save(m); },
  clear: function (id) { const m = this.all(); delete m[id]; this.save(m); },
};

// 정산 계산(플랫폼 수수료 일괄 5% · 회원 서비스료 0%)
window.HOST_FEE = 0.05;
window.VENDOR_FEE = 0.05;
window.CUSTOMER_FEE = 0;
window.PKG_FEE = 0.05;
window.settleOf = function (b) { const sub = Math.round(b.total / (1 + window.CUSTOMER_FEE)); return Math.round(sub * (1 - window.HOST_FEE)); };
// 3자 분할: 1건(예약/견적/패키지)을 고객결제·공급자수익·와일리수수료로 분해
window.txnSplit = function (kind, gross) {
  gross = +gross || 0;
  if (kind === "host") { const base = Math.round(gross / (1 + window.CUSTOMER_FEE)); const provider = Math.round(base * (1 - window.HOST_FEE)); return { gross, provider, wylie: gross - provider, kind }; }
  if (kind === "vendor") { const provider = Math.round(gross * (1 - window.VENDOR_FEE)); return { gross, provider, wylie: gross - provider, kind }; }
  if (kind === "pkg") { const wylie = Math.round(gross * window.PKG_FEE); return { gross, provider: gross - wylie, wylie, kind }; }
  return { gross, provider: gross, wylie: 0, kind };
};

// 공지사항
window.NOTICES = {
  KEY: "gi_notices",
  list: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save: function (l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  active: function () { return this.list().filter((n) => !n.hidden); },
  add: function (n) { const l = this.list(); l.unshift(Object.assign({ id: window.uid("no"), ts: Date.now() }, n)); this.save(l); },
  update: function (id, patch) { const l = this.list(); const i = l.findIndex((n) => n.id === id); if (i >= 0) { l[i] = Object.assign({}, l[i], patch); this.save(l); } },
  remove: function (id) { this.save(this.list().filter((n) => n.id !== id)); },
};
// 공간·장비 게시물 상태(블라인드/반려)
window.SPACEFLAGS = {
  KEY: "gi_spaceflags",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "{}"); } catch (e) { return {}; } },
  get: function (id) { return this.all()[id] || {}; },
  set: function (id, patch) { const a = this.all(); a[id] = Object.assign({}, a[id], patch); localStorage.setItem(this.KEY, JSON.stringify(a)); },
};
// [정산] PG사 자동 분리정산 방식으로 전환 — 수동 지급 신청/승인(PAYOUTS) 로직 제거됨.
//  정산 상태(정산 예정/완료)는 거래의 이용일 경과 여부로 OPS.settlement에서 자동 산정한다.
//  실서버 연동 시: 결제 승인 이벤트 → PG 분리정산 API 호출 → 정산주기에 각 계좌 자동 입금(로그 테이블 기록).
// 정산 계좌 은행 목록
window.BANKS = ["국민", "신한", "우리", "하나", "농협", "기업(IBK)", "SC제일", "카카오뱅크", "케이뱅크", "토스뱅크", "새마을금고", "우체국", "신협", "수협", "부산", "대구", "경남", "광주", "전북", "제주", "산업(KDB)", "씨티"];
// 계좌 실명조회 — 데모용 모의 검증. 실서버: PG 계좌 실명조회 API 호출로 대체.
//  예금주명이 사업자 정보(대표자명/상호)와 일치하는지 확인.
window.PGVERIFY = {
  norm: function (s) { return String(s || "").replace(/\s|\(주\)|㈜|주식회사/g, "").toLowerCase(); },
  check: function (bank, account, holder, candidates) {
    if (!bank) return { ok: false, msg: "은행을 선택해 주세요." };
    if (!/^\d{8,16}$/.test(String(account || "").replace(/\D/g, ""))) return { ok: false, msg: "계좌번호를 숫자 8~16자리로 입력해 주세요." };
    const h = this.norm(holder);
    if (!h) return { ok: false, msg: "예금주명을 입력해 주세요." };
    const ok = (candidates || []).filter(Boolean).some((c) => this.norm(c) === h);
    return ok
      ? { ok: true, msg: "실명확인 완료 · 예금주명이 사업자 정보와 일치합니다." }
      : { ok: false, msg: "예금주명이 사업자 정보와 일치하지 않아요. 대표자명 또는 상호와 동일하게 입력해 주세요." };
  },
};
// 약관 문서(이용약관·개인정보·마케팅) — 관리자에서 편집 시 localStorage로 오버라이드, 없으면 기본값
window.LEGAL = {
  KEY: "gi_legal",
  ORDER: ["guest", "partner", "privacy", "marketing", "refund", "order", "pg", "efin", "lbs", "ops", "cctv"],
  LABEL: { guest: "서비스 이용약관", partner: "파트너(입점) 이용약관", privacy: "개인정보 처리방침", marketing: "마케팅 정보 수신 동의", refund: "취소·환불 정책", order: "주문·결제 조건 확인", pg: "제3자 제공·PG 결제대행 위탁", efin: "전자금융거래 이용약관", lbs: "위치기반서비스 이용약관", ops: "운영정책", cctv: "영상정보처리기기(CCTV) 운영·고지" },
  DEFAULTS: {
    guest: {
      title: "일반 회원(게스트) 서비스 이용약관", updated: "시행일: 2026-01-01",
      html: `
      <h4>제1조 (목적)</h4>
      <p>본 약관은 '공간잇다'(이하 '회사')가 제공하는 공간 예약, 맞춤 부대서비스 중개 및 관련 제반 서비스(이하 '서비스')의 이용과 관련하여 회사와 일반 회원(이하 '게스트') 간의 권리, 의무, 책임사항 및 면책조건을 규정함을 목적으로 합니다.</p>
      <h4>제2조 (용어의 정의)</h4>
      <ol>
        <li>"게스트"란 본 약관에 동의하고 회사가 제공하는 플랫폼을 통해 공간을 검색·예약하거나 견적을 요청하여 이용하는 일반 회원을 말합니다.</li>
        <li>"파트너"란 플랫폼에 <b>공간(호스트)</b> 또는 <b>부대서비스(맞춤업체)</b>를 등록하여 게스트에게 제공하는 사업자 또는 개인 회원을 통칭합니다.</li>
        <li>"중개 서비스"란 회사가 게스트와 파트너 간의 거래(공간 대관 및 부대서비스)가 원활히 이루어지도록 온라인 플랫폼을 제공하는 행위를 말합니다.</li>
      </ol>
      <h4>제3조 (약관의 효력 및 변경)</h4>
      <ol>
        <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
        <li>회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 약관 변경 시 적용일자 7일 전(중요 변경은 30일 전)부터 공지합니다.</li>
      </ol>
      <h4>제4조 (회원가입 및 계정 관리)</h4>
      <ol>
        <li>이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의함으로써 회원가입을 신청합니다.</li>
        <li>게스트는 자신의 아이디 및 비밀번호 관리 책임을 부담하며, 제3자에게 양도·대여할 수 없습니다. 계정 도용으로 발생한 불이익에 대해 회사는 책임을 지지 않습니다.</li>
        <li>게스트는 언제든지 마이페이지를 통해 탈퇴를 요청할 수 있으며, 회사는 지체 없이 이를 처리합니다.</li>
      </ol>
      <h4>제5조 (서비스의 변경 및 중단)</h4>
      <p>회사는 시스템 보수점검, 교체, 통신 두절, 천재지변 등 불가항력적인 사유가 발생한 경우 서비스 제공을 일시적으로 중단할 수 있으며, 이로 인하여 발생한 손해에 대해 책임을 지지 않습니다.</p>
      <h4>제6조 (게시물의 저작권 및 관리)</h4>
      <ol>
        <li>게스트가 서비스 내에 작성한 이용 후기, 사진 등 게시물의 저작권은 작성자 본인에게 귀속됩니다. 단, 회사는 서비스 운영 및 프로모션 목적으로 이를 무상 활용할 수 있습니다.</li>
        <li>타인의 권리를 침해하거나 관계 법령에 위반되는 게시물은 사전 통지 없이 삭제되거나 노출이 제한될 수 있습니다.</li>
      </ol>
      <h4>제7조 (통신판매중개자로서의 면책)</h4>
      <ol>
        <li>회사는 게스트와 파트너 간의 거래를 위한 플랫폼을 제공하는 <b>통신판매중개자</b>이며, 거래의 당사자가 아닙니다.</li>
        <li>파트너가 등록한 공간·부대서비스 정보, 품질, 시설의 안전성 및 현장 사고에 대한 1차적·최종적 책임은 해당 파트너에게 있습니다. <b>다만, 회사의 고의 또는 중대한 과실로 인하여 발생한 손해에 대해서는 그러하지 아니합니다.</b></li>
      </ol>
      <h4>제8조 (예약, 결제 및 환불 규정의 위임)</h4>
      <p>예약 성립, 결제, 취소 및 환불, 보증금 정산에 관한 세부 규정은 회사의 <b>[주문·결제 조건 확인]</b> 및 <b>[취소·환불 정책]</b>에 따르며, 해당 정책은 본 약관과 동일한 효력을 가집니다.</p>
      <h4>제9조 (분쟁 해결 및 관할 법원)</h4>
      <ol>
        <li>회사와 게스트 간에 발생한 분쟁에 관한 소송은 <b>제소 당시 게스트의 주소</b>를 관할하는 지방법원의 전속관할로 합니다. 다만, 게스트의 주소가 분명하지 않은 경우에는 <b>민사소송법</b>에 따른 관할 법원에 제기합니다.</li>
        <li>본 약관의 해석 및 분쟁에 대해서는 대한민국 법률을 적용합니다.</li>
      </ol>`,
    },
    privacy: {
      title: "개인정보 처리방침", updated: "시행일: 2026-01-01",
      html: `
      <h4>제1조 (수집하는 개인정보 항목)</h4>
      <ol>
        <li>필수: 닉네임, 아이디, 비밀번호, 이메일</li>
        <li>서비스 이용 과정에서 생성·수집되는 정보: 예약·견적 내역, 결제 정보, 연락처(휴대폰 번호), 접속 기록</li>
      </ol>
      <h4>제2조 (수집·이용 목적)</h4>
      <ol>
        <li>회원 식별 및 본인 확인, 서비스 부정 이용 방지</li>
        <li>공간 예약·견적 중개, 결제 및 정산, 거래 이행에 필요한 정보 전달</li>
        <li>고객 문의 대응, 공지 및 서비스 개선</li>
      </ol>
      <h4>제3조 (개인정보의 제3자 제공)</h4>
      <p>회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 <b>예약·견적이 성사된 경우</b>, 거래 이행에 필요한 최소한의 범위(예약자 이름·연락처 등) 내에서 해당 <b>파트너(호스트·맞춤업체)</b>에게 정보가 제공될 수 있습니다.</p>
      <h4>제4조 (보유 및 이용 기간)</h4>
      <p>이용자의 개인정보는 회원 탈퇴 시까지 보유·이용하며, 탈퇴 시 지체 없이 파기합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
      <h4>제5조 (이용자의 권리)</h4>
      <p>이용자는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요청할 수 있으며, 회사는 관계 법령에 따라 지체 없이 조치합니다.</p>
      <h4>제6조 (개인정보 보호책임자)</h4>
      <p>개인정보 관련 문의는 고객센터(마이페이지 &gt; 1:1 채팅)를 통해 접수하실 수 있습니다.</p>
      <p class="terms-demo">※ 본 방침은 데모용 예시로, 실제 서비스 적용 시 관계 법령에 맞게 보완되어야 합니다.</p>`,
    },
    marketing: {
      title: "마케팅 정보 수신 동의 (상세)", updated: "시행일: 2026-01-01",
      html: `
      <h4>제1조 (수집 및 이용 목적)</h4>
      <ol>
        <li><b>이벤트 및 혜택 정보 안내</b> — 공간 대관 및 맞춤 파트너 서비스(장비 렌탈, 케이터링, 행사 스태프 등) 관련 신규 할인 쿠폰·프로모션·기획전 소식 전달</li>
        <li><b>맞춤형 추천</b> — 회원님의 이용 내역 및 관심사를 기반으로 한 맞춤 공간·패키지 추천 정보 제공</li>
        <li><b>서비스 관련 정보</b> — 신규 기능 출시, 이벤트 당첨 안내 및 마케팅 목적의 설문조사</li>
      </ol>
      <h4>제2조 (수집하는 개인정보 항목)</h4>
      <p>이메일 주소, 휴대전화 번호, 서비스 이용 기록, 관심 공간/카테고리 정보</p>
      <h4>제3조 (수신 채널 및 발송 시간)</h4>
      <p>수신 채널은 <b>문자(SMS/알림톡)·이메일·앱 푸시</b>이며, 야간(21시~익일 08시)에는 광고성 정보를 발송하지 않습니다(단, 수신자가 야간 수신에 별도 동의한 경우 예외).</p>
      <h4>제4조 (보유 및 이용 기간)</h4>
      <p>회원 탈퇴 시 또는 수신동의 철회 시까지 (단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관)</p>
      <h4>제5조 (동의 거부권 및 불이익 안내)</h4>
      <p>귀하는 마케팅 정보 수신 동의를 거부할 권리가 있습니다. 본 동의는 <b>선택 사항</b>이므로 동의하지 않으셔도 '공간잇다'의 기본 회원가입 및 공간 예약·견적 서비스 이용에는 아무런 제한이 없습니다. 다만, 회원 전용 할인 쿠폰 및 이벤트 혜택 안내가 제한될 수 있습니다.</p>`,
    },
    partner: {
      title: "파트너(호스트·맞춤업체) 입점 이용약관", updated: "시행일: 2026-01-01",
      html: `
      <h4>제1조 (목적)</h4>
      <p>본 약관은 '공간잇다'(이하 '회사')가 운영하는 플랫폼에 <b>공간(호스트)</b> 또는 <b>부대서비스(맞춤업체)</b>를 등록·판매하는 파트너와 회사 간의 권리·의무 및 책임사항을 규정합니다.</p>
      <h4>제2조 (파트너의 자격 및 의무)</h4>
      <ol>
        <li>파트너는 사업자 정보 및 정산 계좌 정보를 정확하게 제공해야 하며, 정산 계좌는 PG사 실명조회로 검증됩니다.</li>
        <li>등록하는 공간·서비스의 정보(위치·수용 인원·가격·사진·구성)는 사실과 일치해야 하며, 관계 법령 및 안전 기준을 준수해야 합니다.</li>
        <li>예약·견적 성사 후 게스트에게 약속한 공간·서비스를 성실히 제공할 책임이 있습니다.</li>
      </ol>
      <h4>제3조 (수수료 및 정산)</h4>
      <ol>
        <li>회사는 거래 성사 시 플랫폼 이용료(수수료)를 공제합니다. 수수료율은 <b>호스트·맞춤업체·패키지 일괄 5%</b>를 기준으로 하며, 세부 요율은 별도 고지될 수 있습니다. 회원(구매자)에게는 별도 서비스 수수료를 부과하지 않습니다.</li>
        <li>정산은 <b>PG사 자동 분리정산</b> 방식으로, 서비스 이용일 경과 후 정산주기에 맞춰 파트너 계좌로 자동 입금됩니다. 회사는 정산 대금을 직접 보유하지 않습니다.</li>
        <li>플랫폼 이용료(수수료)에 대한 전자세금계산서는 국세청(e세로)을 통해 자동 발급되며, 파트너는 마이페이지 정산 화면에서 승인번호를 조회할 수 있습니다.</li>
      </ol>
      <h4>제4조 (취소·환불 및 책임)</h4>
      <ol>
        <li>파트너는 각 상세 페이지에 <b>환불 정책</b>을 명시해야 하며, 파트너의 귀책사유(이용 불가·정보 불일치·서비스 미이행 등)로 예약이 취소되는 경우 게스트에게 전액 환불되고 해당 비용은 파트너가 부담합니다.</li>
        <li>제공하는 공간·부대서비스의 품질·시설 상태·안전성 및 정보의 정확성에 대한 1차적 책임은 파트너에게 있습니다.</li>
      </ol>
      <h4>제5조 (금지 행위)</h4>
      <p>허위·과장 정보 등록, 플랫폼 외부로의 직거래 유도, 타인 명의·계좌 이용, 관계 법령 위반 행위를 금지합니다.</p>
      <h4>제6조 (이용 제한 및 계약 해지)</h4>
      <p>파트너가 본 약관 또는 관계 법령을 위반하는 경우, 회사는 사전 통지 후(긴급 시 사후 통지) 등록 제한·노출 중지·이용 정지 또는 계약 해지 조치를 할 수 있습니다.</p>
      <p class="terms-demo">※ 본 약관은 데모용 예시로, 실제 서비스 적용 시 관계 법령 및 개별 계약에 맞게 보완되어야 합니다.</p>`,
    },
    refund: {
      title: "취소·환불 정책", updated: "시행일: 2026-01-01",
      html: `
      <h4>제1조 (기본 환불 규정 · 이용일까지 남은 기간별)</h4>
      <p><b>공간 대관</b> — 이용 <b>7일 전까지 100%</b>, <b>5~6일 전 70%</b>, <b>3~4일 전 50%</b>, <b>1~2일 전 30%</b>, <b>당일·노쇼 0%</b> 환불.</p>
      <p><b>부대서비스</b>(케이터링·촬영·렌탈 등) — 준비 리드타임이 길어 별도 적용: 이용 <b>7일 전까지 100%</b>, <b>3~6일 전 50%</b>, <b>2일 이내 0%</b> 환불.</p>
      <p>환불 시 위약금(취소 수수료)은 공급자에게 정산되고, 환불액만 고객 결제수단으로 반환됩니다.</p>
      <h4>제2조 (공간·서비스별 정책 우선)</h4>
      <p>파트너가 해당 상세 페이지에 별도의 환불 정책을 명시한 경우, 그 개별 정책이 기본 규정에 우선하여 적용됩니다. 예약 전 각 상세 페이지의 환불 정책을 확인해 주세요.</p>
      <h4>제3조 (파트너 귀책 취소)</h4>
      <p>공간 이용 불가, 등록 정보와의 불일치, 부대서비스 미이행 등 <b>파트너의 귀책사유</b>로 예약이 취소되는 경우, 게스트는 결제 금액 <b>전액</b>을 환불받습니다.</p>
      <h4>제4조 (노쇼 및 미이용)</h4>
      <p>예약 후 <b>사전 취소 없이</b> 이용하지 않은 경우(노쇼)에는 환불되지 않습니다. 이용 시작 시간이 지난 뒤의 취소·환불도 원칙적으로 불가합니다.</p>
      <h4>제5조 (천재지변·불가항력)</h4>
      <p>천재지변, 감염병·정부 조치 등 <b>당사자의 책임 없는 불가항력</b>으로 이용이 불가능한 경우, 게스트와 파트너는 상호 협의하여 <b>전액 환불 또는 일정 변경</b>으로 처리할 수 있습니다.</p>
      <h4>제6조 (환불 처리 방법 및 기간)</h4>
      <p>승인된 환불은 결제대행사(PG)를 통해 <b>원 결제수단으로 처리</b>되며, 카드사·PG 정책에 따라 <b>영업일 기준 3~7일</b>이 소요될 수 있습니다. 해당 거래의 분리정산도 함께 취소됩니다.</p>
      <h4>제7조 (청소 보증금)</h4>
      <p>청소 보증금이 설정된 공간은 이용 후 파손·미정리 등 문제가 없으면 전액 환불되며, 손해가 발생한 경우 그 범위 내에서 차감 후 환불될 수 있습니다.</p>
      <p class="terms-demo">※ 본 정책은 데모용 예시로, 실제 서비스 적용 시 전자상거래법·소비자분쟁해결기준 등 관계 법령에 맞게 보완되어야 합니다.</p>`,
    },
    order: {
      title: "주문 내용 및 결제 조건 확인", updated: "시행일: 2026-01-01",
      html: `
      <h4>제1조 (주문 내용 확인)</h4>
      <p>이용자는 결제 진행 전 주문 상품(공간 대관·부대서비스·패키지)의 <b>구성·이용일시·인원·수량</b> 및 <b>최종 결제금액</b>을 확인하였으며, 그 내용에 동의하고 결제를 진행합니다.</p>
      <h4>제2조 (결제 금액의 구성)</h4>
      <p>최종 결제금액은 대관료·부대서비스 비용에 <b>부가세(VAT 포함)</b>가 반영된 금액이며(회원 서비스 수수료 0%), 적용 가능한 <b>쿠폰·포인트 할인</b>이 반영된 최종 금액입니다.</p>
      <h4>제3조 (결제 확정 및 이행)</h4>
      <p>결제가 완료되면 해당 예약·견적이 <b>확정</b>되며, 확정된 항목은 파트너(호스트·맞춤업체)가 이행합니다. 항목별 <b>부분 결제</b> 시 결제한 항목만 확정·진행됩니다.</p>
      <h4>제4조 (청약 철회 및 취소)</h4>
      <p>결제 후 취소·환불은 <b>'취소·환불 정책'</b> 및 각 상세 페이지에 표시된 파트너의 개별 환불 정책을 따릅니다.</p>
      <h4>제5조 (거래 정보의 확인·보관)</h4>
      <p>결제·거래 내역은 관계 법령에 따라 보관되며, 이용자는 마이페이지의 예약·결제 내역에서 언제든지 확인할 수 있습니다.</p>
      <p class="terms-demo">※ 본 약관은 데모용 예시로, 실제 서비스 적용 시 전자상거래법 등 관계 법령에 맞게 보완되어야 합니다.</p>`,
    },
    pg: {
      title: "개인정보 제3자 제공 · 결제대행(PG) 위탁 동의", updated: "시행일: 2026-01-01",
      html: `
      <h4>제1조 (개인정보 제3자 제공)</h4>
      <p>예약·견적 이행을 위해 예약자 <b>이름·연락처</b>가 <b>파트너(호스트·맞춤업체)</b>에게 제공됩니다.</p>
      <ol>
        <li>제공받는 자: 예약·견적한 공간의 호스트 또는 부대서비스 파트너</li>
        <li>제공 항목: 이름(닉네임), 휴대폰 번호</li>
        <li>제공 목적: 예약·견적 이행, 현장 이용 안내 및 연락</li>
        <li>보유·이용 기간: 거래 완료 후 관계 법령에 따른 보관기간 또는 동의 철회 시까지</li>
      </ol>
      <h4>제2조 (결제대행(PG) 서비스 및 결제정보 처리위탁)</h4>
      <p>결제는 <b>결제대행사(PG)</b>를 통해 처리되며, 결제 대금은 PG사의 <b>자동 분리정산</b>으로 와일리 수수료와 파트너 정산금이 각 계좌로 분리 입금됩니다.</p>
      <ol>
        <li>수탁자: 결제대행사(PG)</li>
        <li>위탁 업무: 결제 처리, 자동 분리정산, 정산 계좌 실명확인</li>
        <li>위탁 항목: 결제수단 정보, 결제·정산에 필요한 최소 정보</li>
        <li>보유·이용 기간: 위탁 목적 달성 시까지(관계 법령에 따른 보관 포함)</li>
      </ol>
      <p class="terms-demo">본 항목은 결제 진행을 위한 필수 동의입니다. 동의를 거부하실 수 있으나, 거부 시 결제가 제한됩니다. (데모 — 실제 적용 시 PG사 약관·법령에 맞게 보완)</p>`,
    },
    efin: {
      title: "전자금융거래 이용약관", updated: "시행일: 2026-01-01",
      html: `
      <h4>제1조 (목적)</h4>
      <p>본 약관은 '공간잇다'(이하 '회사')가 제공하는 서비스에서 이용자가 전자적 방법으로 결제·정산 등 전자금융거래를 이용함에 있어 회사와 이용자 간의 권리·의무 및 절차를 정함을 목적으로 합니다.</p>
      <h4>제2조 (용어의 정의)</h4>
      <ol>
        <li>"전자금융거래"란 이용자가 전자적 장치를 통해 비대면·자동화된 방식으로 결제·송금 등을 이용하는 거래를 말합니다.</li>
        <li>"접근매체"란 거래 지시 또는 이용자·거래 내용의 진실성·정확성을 확인하기 위해 사용되는 카드·인증정보 등을 말합니다.</li>
        <li>"결제대행사(PG)"란 「전자금융거래법」상 등록된 전자금융업자로서 회사를 대신해 결제·정산을 처리하는 사업자를 말합니다.</li>
      </ol>
      <h4>제3조 (결제대행사를 통한 거래)</h4>
      <p>서비스 내 모든 결제·정산은 회사가 위탁한 <b>결제대행사(PG)</b>를 통해 처리됩니다. 회사는 결제 대금을 직접 수취·보유하지 않으며, PG사의 <b>자동 분리정산</b>을 통해 플랫폼 수수료와 공급자(파트너) 정산금이 각 계좌로 분리 입금됩니다.</p>
      <h4>제4조 (거래내용의 확인)</h4>
      <p>이용자는 마이페이지의 예약·결제 내역에서 전자금융거래 내용을 확인할 수 있으며, 회사는 관계 법령에 따라 거래기록을 보존합니다.</p>
      <h4>제5조 (오류의 정정)</h4>
      <p>이용자는 전자금융거래에 오류가 있음을 안 때에는 회사(또는 PG사)에 정정을 요구할 수 있으며, 회사는 즉시 원인을 조사하여 관계 법령이 정한 기간 내에 처리 결과를 통지합니다.</p>
      <h4>제6조 (회사·이용자의 책임)</h4>
      <ol>
        <li>접근매체의 위조·변조로 발생한 사고 등 관계 법령상 회사(또는 PG사)의 책임 사유가 있는 경우 그에 따라 배상합니다.</li>
        <li>이용자의 고의·중과실(접근매체 노출·대여·양도 등)로 발생한 손해는 이용자가 부담할 수 있습니다.</li>
      </ol>
      <h4>제7조 (분쟁처리 및 분쟁조정)</h4>
      <p>이용자는 고객센터(마이페이지 &gt; 1:1 채팅)를 통해 전자금융거래 관련 이의를 제기할 수 있으며, 분쟁이 원만히 해결되지 않는 경우 금융감독원·한국소비자원 등 분쟁조정기구에 조정을 신청할 수 있습니다.</p>
      <p class="terms-demo">※ 본 약관은 데모용 예시로, 실제 서비스 적용 시 「전자금융거래법」 및 PG사 약관에 맞게 보완되어야 합니다.</p>`,
    },
    lbs: {
      title: "위치기반서비스 이용약관", updated: "시행일: 2026-01-01",
      html: `
      <h4>제1조 (목적)</h4>
      <p>본 약관은 '공간잇다'(이하 '회사')가 제공하는 위치기반서비스와 관련하여 회사와 개인위치정보주체(이용자) 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
      <h4>제2조 (서비스 내용)</h4>
      <p>회사는 이용자의 단말기 위치를 이용하여 다음의 서비스를 제공합니다.</p>
      <ol>
        <li>내 주변 공간 검색 및 거리순 정렬</li>
        <li>지도 기반 공간 탐색</li>
      </ol>
      <h4>제3조 (위치정보의 이용·보유)</h4>
      <p>회사는 '내 주변 찾기' 등 이용자가 <b>직접 요청한 경우에 한하여</b> 단말기 위치를 <b>일시적으로 이용</b>하며, 해당 위치정보를 <b>서버에 저장·보유하지 않습니다.</b> 위치정보는 정렬·표시 목적 달성 즉시 파기됩니다.</p>
      <h4>제4조 (개인위치정보주체의 권리)</h4>
      <ol>
        <li>이용자는 위치정보 이용에 대한 동의를 언제든지 철회할 수 있으며, 기기(브라우저)의 위치 권한 설정으로 즉시 중지할 수 있습니다.</li>
        <li>이용자는 위치정보 이용·제공 사실 확인자료의 열람·고지를 요구할 수 있고, 오류가 있는 경우 정정을 요구할 수 있습니다.</li>
      </ol>
      <h4>제5조 (법정대리인의 권리)</h4>
      <p>회사는 만 14세 미만 아동의 위치정보를 이용·제공하고자 하는 경우 법정대리인의 동의를 받으며, 법정대리인은 위 제4조의 권리를 행사할 수 있습니다.</p>
      <h4>제6조 (손해배상 및 면책)</h4>
      <p>회사가 「위치정보의 보호 및 이용 등에 관한 법률」을 위반하여 이용자에게 손해를 발생하게 한 경우 이용자는 손해배상을 청구할 수 있습니다. 다만 천재지변, 이용자의 고의·과실, 기기·통신 환경으로 인한 위치 오차 등에 대하여는 책임을 지지 않습니다.</p>
      <h4>제7조 (위치정보 관리책임자 및 분쟁조정)</h4>
      <p>위치정보 관리책임자: <b>문병훈</b> (문의: wylie@wylie.co.kr). 위치정보 관련 분쟁은 협의로 해결하며, 협의가 어려운 경우 방송통신위원회·개인정보분쟁조정위원회 등에 조정을 신청할 수 있습니다.</p>
      <p class="terms-demo">※ 본 약관은 데모용 예시로, 실제 서비스 적용 시 「위치정보법」에 따른 사업자 신고 및 약관 신고 절차와 함께 보완되어야 합니다.</p>`,
    },
    ops: {
      title: "운영정책", updated: "시행일: 2026-01-01",
      html: `
      <h4>제1조 (목적)</h4>
      <p>본 정책은 '공간잇다'의 건전한 이용 환경 조성을 위해 이용자·파트너가 준수해야 할 사항과 위반 시 제재 기준을 정합니다.</p>
      <h4>제2조 (금지 행위)</h4>
      <ol>
        <li>허위·중복·반복 예약 또는 상습적 취소로 거래 질서를 해치는 행위</li>
        <li>채팅·연락처를 통해 <b>플랫폼 외부 직거래</b>를 유도하거나 결제를 우회하는 행위</li>
        <li>욕설·비방·성희롱·차별 등 타인에게 불쾌감을 주는 행위</li>
        <li><b>허위 후기</b>·대가성 후기 작성 및 경쟁 방해 목적의 악의적 후기</li>
        <li>타인의 명의·결제수단 도용, 시스템 부정 이용</li>
      </ol>
      <h4>제3조 (후기·게시물 관리)</h4>
      <p>후기는 실제 이용자에 한해 작성하며, 회사는 법령·본 정책을 위반한 게시물을 <b>비공개 또는 삭제</b>할 수 있습니다. 게시물의 권리와 책임은 작성자에게 있으며, 회사는 서비스 소개·홍보 범위 내에서 이를 노출·활용할 수 있습니다.</p>
      <h4>제4조 (이용 제한 및 제재)</h4>
      <p>위반 정도에 따라 <b>경고 → 게시물 제한 → 예약·입점 제한 → 일시 정지 → 이용계약 해지</b>의 단계적 조치를 취하며, 중대하거나 반복되는 위반은 즉시 조치할 수 있습니다.</p>
      <h4>제5조 (신고 및 이의제기)</h4>
      <p>이용자·파트너는 마이페이지 <b>1:1 채팅(고객센터)</b>를 통해 위반 행위를 신고하거나 제재에 대해 이의를 제기할 수 있습니다.</p>
      <p class="terms-demo">※ 본 정책은 데모용 예시로, 실제 서비스 적용 시 관계 법령·개별 약관과 함께 보완되어야 합니다.</p>`,
    },
    cctv: {
      title: "영상정보처리기기(CCTV) 운영·고지 정책", updated: "시행일: 2026-01-01",
      html: `
      <h4>제1조 (목적)</h4>
      <p>본 정책은 등록 공간 내 영상정보처리기기(CCTV 등)의 설치·운영 및 이용자 고지에 관한 사항을 정합니다.</p>
      <h4>제2조 (호스트의 고지 의무)</h4>
      <p>공간 내에 CCTV가 설치된 경우, 호스트는 <b>공간 상세 페이지에 설치 여부·촬영 범위·목적</b>을 명확히 고지해야 합니다. <b>화장실·탈의실·개별 룸 등 사생활 침해 우려가 큰 공간</b>에는 설치할 수 없습니다.</p>
      <h4>제3조 (촬영정보의 이용·보관)</h4>
      <p>촬영된 영상정보는 <b>안전·도난·분쟁 예방 등 고지된 목적 범위</b> 내에서만 이용하며, 최소한의 기간 보관 후 파기합니다. 목적 외 이용 및 제3자 제공을 금지합니다.</p>
      <h4>제4조 (이용자의 권리)</h4>
      <p>이용자는 자신이 촬영된 영상정보에 대해 「개인정보보호법」에 따라 열람을 요청할 수 있으며, 호스트·회사는 정당한 요청에 따라 조치합니다.</p>
      <h4>제5조 (미고지·위반 시 조치)</h4>
      <p>CCTV 설치를 고지하지 않거나 부적정하게 운영하는 경우, 회사는 해당 공간의 <b>노출 제한·이용 제한</b> 등 필요한 조치를 할 수 있습니다.</p>
      <p class="terms-demo">※ 본 정책은 데모용 예시로, 실제 서비스 적용 시 「개인정보보호법」상 영상정보처리기기 규정에 맞게 보완되어야 합니다.</p>`,
    },
  },
  // 서버(KV) 저장 — 모든 기기 공통. _remote는 서버 문서 캐시, 실패 시 로컬 폴백.
  _remote: {},
  loaded: false,
  onload: null,
  loadRemote: function () {
    const self = this;
    return fetch("/api/legal", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      self._remote = j || {}; self.loaded = true;
      try { localStorage.setItem(self.KEY, JSON.stringify(self._remote)); } catch (e) {}
      if (typeof self.onload === "function") self.onload();
    }).catch(function () {
      try { self._remote = JSON.parse(localStorage.getItem(self.KEY) || "{}"); } catch (e) { self._remote = {}; }
      self.loaded = true; if (typeof self.onload === "function") self.onload();
    });
  },
  get: function (key) { return this._remote[key] || this.DEFAULTS[key] || { title: "", updated: "", html: "" }; },
  isCustom: function (key) { return !!this._remote[key]; },
  set: function (key, doc) { this._remote[key] = doc; try { localStorage.setItem(this.KEY, JSON.stringify(this._remote)); } catch (e) {} return fetch("/api/legal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: key, doc: doc }) }); },
  reset: function (key) { delete this._remote[key]; try { localStorage.setItem(this.KEY, JSON.stringify(this._remote)); } catch (e) {} return fetch("/api/legal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: key, reset: true }) }); },
};
window.LEGAL.loadRemote();
// 패키지 노출 상태(숨김/정렬/관리자 생성)
window.PKGFLAGS = {
  KEY: "gi_pkgflags",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "{}"); } catch (e) { return {}; } },
  get: function (id) { return this.all()[id] || {}; },
  set: function (id, patch) { const a = this.all(); a[id] = Object.assign({}, a[id], patch); localStorage.setItem(this.KEY, JSON.stringify(a)); },
};
const _td = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
// 와일리(플랫폼) 전용 쿠폰 — 호스트 쿠폰(DISCOUNT)과 비용주체 분리
window.PCOUPONS = {
  KEY: "gi_pcoupons",
  list: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save: function (l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  add: function (c) { const l = this.list(); l.unshift(Object.assign({ id: window.uid("pc"), ts: Date.now(), used: 0, active: true, bearer: "platform" }, c)); this.save(l); },
  update: function (id, patch) { const l = this.list(); const i = l.findIndex((c) => c.id === id); if (i >= 0) { l[i] = Object.assign({}, l[i], patch); this.save(l); } },
  remove: function (id) { this.save(this.list().filter((c) => c.id !== id)); },
  find: function (code) { if (!code) return null; return this.list().find((c) => c.active && (c.code || "").toUpperCase() === code.trim().toUpperCase()) || null; },
  // ctx: { scope:"space"|"package", amount }
  validate: function (code, ctx) {
    const c = this.find(code); if (!c) return { ok: false, msg: "유효하지 않은 쿠폰이에요" };
    if (c.expires && _td() > c.expires) return { ok: false, msg: "기간이 지난 쿠폰이에요" };
    if (c.maxUses && c.used >= c.maxUses) return { ok: false, msg: "쿠폰이 모두 소진됐어요" };
    if (c.scope && c.scope !== "all" && ctx && c.scope !== ctx.scope && !(c.scope === "signup")) return { ok: false, msg: "이 상품에는 사용할 수 없는 쿠폰이에요" };
    if (c.minAmount && ctx && (ctx.amount || 0) < c.minAmount) return { ok: false, msg: `${c.minAmount.toLocaleString()}원 이상 결제 시 사용 가능해요` };
    const amt = ctx ? (ctx.amount || 0) : 0;
    const off = c.discType === "amount" ? Math.min(c.value, amt) : Math.round(amt * c.value / 100);
    return { ok: true, coupon: c, off, label: c.discType === "amount" ? `${(+c.value).toLocaleString()}원 할인` : `${c.value}% 할인` };
  },
  redeem: function (id) { const l = this.list(); const i = l.findIndex((c) => c.id === id); if (i >= 0) { l[i].used = (l[i].used || 0) + 1; this.save(l); } },
};

// ============================================================
// 쿠폰 통합 (호스트 공간전용 쿠폰 + 플랫폼 프로모션 코드) — 검증·할인계산
//  ctx: { hours, amount }   (amount = 할인 적용 대상 금액, 보통 대관료 소계)
//  ⚠️ 프론트 검증은 UX용. 서버도 동일 규칙(공간 매핑·최소조건·기간·소진) 검증 필수
// ============================================================
window.COUPON = {
  hostCoupon: function (spaceId) { const c = (window.DISCOUNT.get(spaceId) || {}).coupon; return (c && c.code) ? c : null; },
  _inPeriod: function (c) { const t = _today(); if (c.from && t < c.from) return false; if (c.to && t > c.to) return false; return true; },
  label: function (c) { const t = c.discType === "amount"; const v = +(c.value != null ? c.value : c.pct) || 0; return t ? `${v.toLocaleString()}원 할인` : `${v}% 할인`; },
  // 호스트 쿠폰(공간 전용) 검증·할인액
  _hostEval: function (c, ctx) {
    if (!this._inPeriod(c)) return { ok: false, msg: "쿠폰 사용 기간이 아니에요" };
    const amt = (ctx && ctx.amount) || 0, hrs = (ctx && ctx.hours) || 0;
    if (c.minHours && hrs < c.minHours) return { ok: false, msg: `최소 ${c.minHours}시간 이상 예약 시 사용 가능해요` };
    if (c.minAmount && amt < c.minAmount) return { ok: false, msg: `${(+c.minAmount).toLocaleString()}원 이상 결제 시 사용 가능해요` };
    const v = +(c.value != null ? c.value : c.pct) || 0;
    const off = c.discType === "amount" ? Math.min(v, amt) : Math.round(amt * v / 100);
    return { ok: true, off: off, label: this.label(c), source: "host" };
  },
  // 이 공간에 사용 가능한 보유 쿠폰 목록 (드롭다운용)
  listFor: function (spaceId) {
    const out = [], hc = this.hostCoupon(spaceId);
    if (hc && this._inPeriod(hc)) out.push({ source: "host", code: hc.code, label: "이 공간 전용 · " + this.label(hc) });
    (window.PCOUPONS ? window.PCOUPONS.list() : []).filter((c) => c.active && (!c.expires || c.expires >= _today()) && (!c.maxUses || (c.used || 0) < c.maxUses) && (!c.scope || c.scope === "all" || c.scope === "space")).forEach((c) => {
      out.push({ source: "platform", code: c.code, label: "플랫폼 · " + this.label(c) });
    });
    return out;
  },
  // 통합 검증 (공간 매핑 + 최소조건 + 기간 + 소진)
  validate: function (spaceId, code, ctx) {
    code = (code || "").trim(); if (!code) return { ok: false, msg: "쿠폰 코드를 입력하세요" };
    const hc = this.hostCoupon(spaceId);
    if (hc && (hc.code || "").toUpperCase() === code.toUpperCase()) return this._hostEval(hc, ctx);
    if (window.PCOUPONS) { const res = window.PCOUPONS.validate(code, { scope: "space", amount: (ctx && ctx.amount) || 0 }); if (res.ok) return { ok: true, off: res.off, label: res.label, source: "platform", coupon: res.coupon }; if (window.PCOUPONS.find(code)) return { ok: false, msg: res.msg }; }
    return { ok: false, msg: "이 공간에 사용할 수 없거나 유효하지 않은 쿠폰이에요" };
  },
};
// 유저 포인트 적립·소멸 원장
window.POINTS = {
  KEY: "gi_points",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save: function (l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  ledger: function (userId) { return this.all().filter((e) => e.userId === userId); },
  add: function (userId, delta, reason, expires) { const l = this.all(); l.unshift({ id: window.uid("pt"), userId, delta: +delta, reason: reason || "", expires: expires || "", ts: Date.now() }); this.save(l); },
  expire: function (id) { const l = this.all(); const i = l.findIndex((e) => e.id === id); if (i >= 0) { l[i].expired = true; this.save(l); } },
  balance: function (userId) { const t = _td(); return this.ledger(userId).filter((e) => !e.expired && (!e.expires || e.expires >= t)).reduce((a, e) => a + (+e.delta || 0), 0); },
};
// 사이트 정책 텍스트(약관·환불규정)
window.SITECFG = {
  KEY: "gi_sitecfg",
  DEF: { terms: "본 서비스는 공간 대관 및 부대서비스 중개 플랫폼입니다. 회원은 예약·결제 시 본 약관에 동의한 것으로 간주됩니다. (데모)", refund: "공간: 7일 전 100%·5~6일 70%·3~4일 50%·1~2일 30%·당일 0% / 부대서비스: 7일 전 100%·3~6일 50%·2일 이내 0% (위약금은 공급자 정산)" },
  get: function () { try { return Object.assign({}, this.DEF, JSON.parse(localStorage.getItem(this.KEY) || "{}")); } catch (e) { return Object.assign({}, this.DEF); } },
  set: function (patch) { localStorage.setItem(this.KEY, JSON.stringify(Object.assign({}, this.get(), patch))); },
};
// 통계 로그(태그 검색·공간 조회수)
window.STATLOG = {
  KEY: "gi_statlog",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || '{"tags":{},"views":{}}'); } catch (e) { return { tags: {}, views: {} }; } },
  tag: function (t) { const a = this.all(); a.tags[t] = (a.tags[t] || 0) + 1; localStorage.setItem(this.KEY, JSON.stringify(a)); },
  view: function (id) { const a = this.all(); a.views[id] = (a.views[id] || 0) + 1; localStorage.setItem(this.KEY, JSON.stringify(a)); },
};

// 견적 요청 파트너·공간 후기(신뢰 지표) — 이용 완료 후 회원이 평가
window.VREVIEWS = {
  KEY: "gi_vreviews",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save: function (l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  add: function (r) { const l = this.all(); l.unshift(Object.assign({ ts: Date.now() }, r)); this.save(l); },
  forVendor: function (vid) { return this.all().filter((x) => x.vendorId === vid); },
  scoreOf: function (vid) { const rs = this.forVendor(vid); return rs.length ? rs.reduce((a, x) => a + x.rating, 0) / rs.length : null; },
  countOf: function (vid) { return this.forVendor(vid).length; },
  ratedQuote: function (quoteId, userId) { return this.all().some((x) => x.quoteId === quoteId && x.userId === userId); },
};

// 양방향 매너 점수 (호스트 → 게스트)
window.MANNER = {
  KEY: "gi_manner",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  add: function (r) { const l = this.all(); l.unshift(Object.assign({ ts: Date.now() }, r)); localStorage.setItem(this.KEY, JSON.stringify(l)); },
  scoreOf: function (guestId) { const rs = this.all().filter((x) => x.guestId === guestId); return rs.length ? rs.reduce((a, x) => a + x.score, 0) / rs.length : null; },
  rated: function (bookingId, hostId) { return this.all().some((x) => x.bookingId === bookingId && x.hostId === hostId); },
};

// 고유 ID 생성기 (같은 밀리초 다중 생성 시 충돌 방지)
window.uid = function (p) { return (p || "") + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); };
// 사용자 역할 조회 + 채팅 허용 규칙: 회원↔호스트, 회원↔파트너만 (공급자끼리 금지)
window.roleOf = function (uid) { const u = (window.AUTH.users() || []).find((x) => x.userId === uid); return u ? (u.role || "guest") : "guest"; };
window.chatAllowed = function (uidA, uidB) { const ra = window.roleOf(uidA), rb = window.roleOf(uidB); return ra === "guest" || rb === "guest" || ra === "admin" || rb === "admin" || uidA === "admin" || uidB === "admin"; };
// 견적 요청 — 견적요청(RFP)
window.REQUESTS = {
  KEY: "gi_requests",
  list: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save: function (l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  mine: function (userId) { return this.list().filter((r) => r.memberId === userId); },
  find: function (id) { return this.list().find((r) => r.id === id); },
  add: function (r) { const l = this.list(); l.unshift(Object.assign({ id: window.uid("r"), ts: Date.now(), status: "open" }, r)); this.save(l); },
  update: function (id, patch) { const l = this.list(); const i = l.findIndex((r) => r.id === id); if (i >= 0) { l[i] = Object.assign({}, l[i], patch); this.save(l); } },
};
// 견적 요청 — 견적(입찰)
window.QUOTES = {
  KEY: "gi_quotes",
  list: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save: function (l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  forReq: function (rid) { return this.list().filter((q) => q.requestId === rid); },
  byVendor: function (vid) { return this.list().filter((q) => q.vendorId === vid); },
  add: function (q) { const l = this.list(); l.unshift(Object.assign({ id: window.uid("q"), ts: Date.now(), status: "sent" }, q)); this.save(l); },
  update: function (id, patch) { const l = this.list(); const i = l.findIndex((q) => q.id === id); if (i >= 0) { l[i] = Object.assign({}, l[i], patch); this.save(l); } },
};
// 기존 데이터 마이그레이션 — 중복/누락 견적 ID를 고유화 (과거 Date.now 충돌 복구)
(function fixQuoteIds() {
  try {
    const l = window.QUOTES.list(); const seen = new Set(); let changed = false;
    l.forEach((q) => { if (!q.id || seen.has(q.id)) { q.id = window.uid("q"); changed = true; } seen.add(q.id); });
    if (changed) window.QUOTES.save(l);
  } catch (e) {}
})();

// N빵 대관 (더치페이)
window.SPLIT = {
  KEY: "gi_splits",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "{}"); } catch (e) { return {}; } },
  get: function (bid) { return this.all()[bid] || null; },
  set: function (bid, obj) { const a = this.all(); a[bid] = obj; localStorage.setItem(this.KEY, JSON.stringify(a)); },
};

// 번개 특가 데모 시드(할인이 하나도 없을 때만)
(function seedFlash() {
  try {
    if (Object.keys(window.DISCOUNT.all()).length) return;
    const p = (n) => String(n).padStart(2, "0");
    const toS = (function () { const x = new Date(Date.now() + 30 * 86400000); return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`; })();
    const from = _today();
    window.DISCOUNT.set(2, { flash: { pct: 20, from, to: toS } });
    window.DISCOUNT.set(8, { flash: { pct: 35, from, to: toS } });
  } catch (e) {}
})();

// 데모 계정 시드 — 파트너 8곳(카테고리별 2) + 호스트 3곳 (실제풍 상호)
(function seedDemoAccounts() {
  try {
    const users = window.AUTH.users();
    const byId = (id) => users.find((u) => u.userId === id);
    // 파트너는 단일 카테고리 전문 — 카테고리별 4곳
    const VCAT = {
      camera: ["렌탈메이트", "스튜디오포유", "픽셀렌탈", "라이트기어"],
      catering: ["미담케이터링", "그린테이블", "델리셔스케이터링", "한상차림"],
      office: ["오피스원", "퍼니처렌트", "오에이렌탈", "데스크플러스"],
      cleaning: ["클린마스터", "스위퍼스", "깔끔한하루", "청소연구소"],
      repair: ["핸디픽스", "집수리명가", "올리페어", "튼튼보수"],
      interior: ["데코라인", "공간디자인", "인테리어핏", "스타일러스"],
      banner: ["광고나라", "배너프로", "사인모아", "현수막공장"],
      projector: ["빔렌탈", "AV솔루션", "스크린원", "프로젝터그루"],
      goods: ["굿즈메이커", "판촉나라", "기프트랩", "노벨티샵"],
      photo: ["스냅바이", "모먼트필름", "행사스냅단", "포토그래퍼스"],
    };
    let vi = 0; const VENDORS = [];
    Object.keys(VCAT).forEach((cat) => VCAT[cat].forEach((nick) => { vi++; VENDORS.push(["vendor" + vi, nick, cat]); }));
    // 카테고리별 취급 아이템·소개·대표사진(더미)
    const UP = (x) => `https://images.unsplash.com/photo-${x}?w=640&h=420&fit=crop&q=70`;
    const VITEMS = {
      camera: ["소니 A7M4 바디", "24-70mm F2.8 렌즈", "LED 조명 3구 키트", "DJI 짐벌 RS3", "삼각대·모니터"],
      catering: ["샌드위치 도시락", "프리미엄 뷔페(1인)", "핑거푸드 플래터", "커피·음료 바", "디저트 세트"],
      office: ["1인 사무 책상", "메쉬 오피스 체어", "복합기(프린트·스캔)", "이동식 화이트보드", "파티션"],
      cleaning: ["행사 전 청소", "행사 후 청소", "특수 바닥 청소", "폐기물 수거", "정기 청소 계약"],
      repair: ["전기·조명 보수", "도배·페인트", "누수·설비 수리", "문·창호 수리", "간단 목공"],
      interior: ["부스 시공", "포토존 데코", "바닥·벽면 시공", "가구 배치", "조명 연출"],
      banner: ["실사 현수막", "엑스배너 거치대", "포멕스 사인", "무대 배경 현수막", "안내 사인물"],
      projector: ["빔프로젝터(5000안시)", "100인치 스크린", "음향 스피커 세트", "무선 마이크", "송출 콘솔"],
      goods: ["에코백 제작", "텀블러 각인", "볼펜·노트 세트", "뱃지·스티커", "맞춤 굿즈 패키지"],
      photo: ["행사 스냅 촬영(2시간)", "행사 풀 영상 촬영", "현장 즉석 인화", "드론 항공 촬영", "사진+영상 패키지"],
    };
    const VINTRO = {
      camera: "소니 A7M4 2대·캐논 R6 Mark II 1대, 24-70mm F2.8·70-200mm F2.8 렌즈, 어퓨처 600D 조명 3대, DJI RS3 짐벌 2대 보유. 사진작가 동행·당일 대여 가능합니다.",
      catering: "핑거푸드·뷔페·도시락 3~200인 대응. 라마르조코 커피머신 2대와 음료바 운영, 비건·알레르기 대응 메뉴 제공. 현장 세팅·회수까지 포함합니다.",
      office: "1인 사무책상 40개·메쉬 오피스체어 60개, 신도리코 복합기 3대, 이동식 화이트보드 8개, 파티션 20개 보유. 당일 배송·설치·회수.",
      cleaning: "행사 전·후 청소 전담팀 운영. 업소용 청소장비 6세트·폐기물 수거 차량 2대 보유, 80~500㎡ 규모 당일 처리 가능합니다.",
      repair: "전기·조명·설비·도배 전문. 사다리차·전동공구 풀세트 보유, 긴급 출동 2시간 내 대응. 콘센트 증설·누수 보수까지.",
      interior: "부스·포토존·벽면 시공. 목공 자재·파스텔 데코 소품 상시 보유, 2m~10m 규모 맞춤 제작. 시안 3종 무료 제공합니다.",
      banner: "실사 현수막·엑스배너·포멕스 사인 당일 제작. 대형 출력기 2대(최대 3.2m 폭) 보유, 로고 파일 반영·현장 설치 포함.",
      projector: "5000안시 빔프로젝터 4대·100인치 스크린 3개, JBL 스피커 세트 2조·무선마이크 8채널 보유. 송출 콘솔·현장 엔지니어 지원.",
      goods: "에코백·텀블러·볼펜·뱃지 맞춤 제작. 로고 각인·인쇄 설비 보유, 최소 30개부터 3일 내 납품 가능합니다.",
      photo: "행사 스냅·영상 전문 작가 4인. 소니 A7S3 2대·드론(Mavic 3) 1대 보유, 2시간 촬영 시 보정본 50장·당일 하이라이트 제공.",
    };
    // 카테고리별 4장씩 — 파트너마다 다른 대표 이미지
    const VPH = {
      camera: [UP("1502920917128-1aa500764cbd"), UP("1519638831568-d9897f54ed69"), UP("1510127034890-ba27508e9f1c"), UP("1516035069371-29a1b244cc32")],
      catering: [UP("1555244162-803834f70033"), UP("1414235077428-338989a2e8c0"), UP("1467003909585-2f8a72700288"), UP("1504674900247-0877df9cc836")],
      office: [UP("1497366216548-37526070297c"), UP("1524758631624-e2822e304c36"), UP("1497366811353-6870744d04b2"), UP("1521737604893-d14cc237f11d")],
      cleaning: [UP("1581578731548-c64695cc6952"), UP("1585421514738-01798e348b17"), UP("1527515637462-cff94eecc1ac"), UP("1563453392212-326f5e854473")],
      repair: [UP("1581092160562-40aa08e78837"), UP("1504148455328-c376907d081c"), UP("1572981779307-38b8cabb2407"), UP("1530124566582-a618bc2615dc")],
      interior: [UP("1618221195710-dd6b41faaea6"), UP("1618219908412-a29a1bb7b86e"), UP("1567016376408-0226e4d0c1ea"), UP("1493809842364-78817add7ffb")],
      banner: [UP("1561070791-2526d30994b5"), UP("1588412079929-790b9f593d8e"), UP("1607083206968-13611e3d76db"), UP("1558403194-611308249627")],
      projector: [UP("1517604931442-7e0c8ed2963c"), UP("1505373877841-8d25f7d46678"), UP("1478720568477-152d9b164e26"), UP("1524712245354-2c4e5e7121c0")],
      goods: [UP("1513885535751-8b9238bd345a"), UP("1556905055-8f358a7a47b2"), UP("1607083206325-caf1edba7a0f"), UP("1600180758890-6b94519a8ba6")],
      photo: [UP("1554048612-b6a482bc67e5"), UP("1452587925148-ce544e77e70d"), UP("1519741497674-611481863552"), UP("1516035069371-29a1b244cc32")],
    };
    const GU = ["강남구", "마포구", "성동구", "서초구", "송파구", "용산구", "영등포구", "종로구", "광진구", "강서구"];
    const DONG = ["역삼동", "서교동", "성수동", "서초동", "잠실동", "이태원동", "여의도동", "혜화동", "자양동", "화곡동"];
    const OWNERS = ["김성호", "이재훈", "박지영", "최민수", "정다은", "강현우", "조수빈", "윤태경", "임소연", "한지민", "오세라", "서동민", "신유나", "권재원", "황보람", "안준석", "송미강", "전다위", "홍서진", "고은별", "문재하", "배성우", "백지환", "유선호", "남지웅", "심가율", "노해든", "하준영", "곽서율", "성지안", "차민재", "구도윤", "표하린", "석우진", "천예서", "탁현서", "명지호", "선우진", "제갈윤", "여도경"];
    const BANKS = ["국민은행", "신한은행", "우리은행", "하나은행", "카카오뱅크", "농협은행", "기업은행", "토스뱅크"];
    const bizNoGen = (n) => `${String(101 + (n * 37) % 899)}-${String(10 + (n * 13) % 89).padStart(2, "0")}-${String(10000 + (n * 7919) % 89999)}`;
    const acctGen = (n) => `${String(100 + (n * 17) % 899)}-${String(1000 + (n * 131) % 8999).padStart(4, "0")}-${String(100000 + (n * 6997) % 899999)}`;
    const bizFill = (u, idx) => {
      if (!u.owner) u.owner = OWNERS[idx % OWNERS.length];
      if (!u.bizNo) u.bizNo = bizNoGen(idx + 3);
      if (!u.bank) u.bank = BANKS[idx % BANKS.length];
      if (!u.account) u.account = acctGen(idx + 5);
      if (!u.openDate) u.openDate = `20${18 + (idx % 7)}-${String(1 + (idx % 12)).padStart(2, "0")}-${String(1 + (idx % 27)).padStart(2, "0")}`;
      u.biz = Object.assign({ status: "approved", ts: Date.now() }, u.biz || {}, { owner: u.owner, bizNo: u.bizNo, addr: u.addr, phone: u.phone, bank: u.bank, account: u.account, open: u.openDate });
    };
    VENDORS.forEach(([id, nick, cat], idx) => {
      let u = byId(id);
      if (!u) { u = { userId: id, pw: "1234", email: id + "@demo.com" }; users.push(u); }
      u.role = "vendor";
      if (!u.serviceCats || u.serviceCats.length !== 1) u.serviceCats = [cat];
      const c = u.serviceCats[0];
      if (!u.nick) u.nick = nick; u.name = u.nick;
      if (!u.addr) u.addr = "서울 " + GU[idx % GU.length] + " " + DONG[idx % DONG.length] + " " + (10 + idx % 80) + "-" + (1 + idx % 20);
      if (!u.phone) u.phone = "010-" + String(3000 + (idx * 131) % 6000).padStart(4, "0") + "-" + String(1000 + (idx * 277) % 9000).padStart(4, "0");
      if (!u.intro || u._introV !== 2) { u.intro = VINTRO[c] || "행사에 필요한 서비스를 제공합니다."; u._introV = 2; }
      if (!u.items) u.items = (VITEMS[c] || []).slice();
      // 파트너마다 다른 대표 이미지(카테고리 내 4장 중 1장) — 데모 시드 갱신
      const pool = VPH[c] || []; const pic = pool[idx % pool.length] || pool[0];
      if (pic && (!u.photos || !u.photos.length || u._demoImg !== (c + (idx % 4)))) { u.photos = [pic]; u._demoImg = c + (idx % 4); }
      if (!u.region) u.region = "서울";
      bizFill(u, idx);
    });
    [["host1", "와일리스페이스"], ["host2", "성수라운지"], ["host3", "강남스테이"]].forEach(([id, nick], hi) => {
      let u = byId(id);
      if (u) { u.role = "host"; if (!u.nick || /^호스트/.test(u.nick) || /^데모/.test(u.nick)) { u.nick = nick; u.name = nick; } }
      else { u = { userId: id, pw: "1234", nick, name: nick, email: id + "@demo.com", role: "host" }; users.push(u); }
      if (!u.phone) u.phone = "02-" + String(300 + hi * 111).padStart(4, "0") + "-" + String(1000 + hi * 2345).padStart(4, "0");
      if (!u.addr) u.addr = "서울 " + GU[hi] + " " + DONG[hi] + " " + (100 + hi * 11) + "-" + (1 + hi);
      if (!u.region) u.region = "서울";
      bizFill(u, hi + 20);
    });
    window.AUTH.saveUsers(users);
    // 이전 데모 공간(900001) 정리 — 기존 등록 대관을 호스트에 배정하는 방식으로 대체
    try {
      let sp = JSON.parse(localStorage.getItem("gi_spaces") || "[]");
      const cleaned = sp.filter((s) => s.id !== 900001);
      if (cleaned.length !== sp.length) localStorage.setItem("gi_spaces", JSON.stringify(cleaned));
    } catch (e3) {}
  } catch (e) {}
})();

// 데모 파트너 후기 시드 — 파트너별 10~30개 (없는 파트너만)
(function seedVendorReviews() {
  try {
    const NAMES = ["김도현", "이서연", "박준영", "최유진", "정민석", "한지우", "오세훈", "윤아라", "장은우", "서지민", "문가온", "배시현", "노하람", "임재이"];
    const TXT = [
      "요청한 시간에 정확히 맞춰 도착했어요. 프로페셔널합니다.",
      "품질이 기대 이상이었어요. 다음에도 이용할게요.",
      "가격 대비 만족도가 높습니다. 강력 추천해요.",
      "문의부터 진행까지 소통이 빠르고 친절했어요.",
      "현장 세팅까지 깔끔하게 마무리해주셨습니다.",
      "급한 요청이었는데도 유연하게 대응해주셨어요.",
      "사진보다 실물이 훨씬 좋았습니다.",
      "꼼꼼하고 믿음이 가는 파트너예요.",
      "구성·재고가 다양해서 선택폭이 넓었어요.",
      "행사 후 정리·회수까지 신경 써주셔서 감사했습니다.",
      "예산에 맞춰 견적을 잘 조정해주셨어요.",
      "재이용 의사 100%입니다. 감사합니다!",
    ];
    const RSEQ = [5, 5, 4, 5, 4, 5, 5, 3, 4, 5, 5, 4, 5, 4, 5, 5, 4, 5, 3, 5, 5, 4, 5, 5, 4, 5, 4, 5, 5, 4];
    const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
    const vids = window.AUTH.users().filter((u) => u.role === "vendor" && /^vendor\d+$/.test(u.userId)).map((u) => u.userId);
    let pool = window.VREVIEWS.all();
    let changed = false;
    vids.forEach((vid) => {
      if (pool.some((r) => r.vendorId === vid)) return; // 이미 후기 있으면 skip
      const h = hash(vid); const n = 10 + (h % 21); // 10~30
      for (let i = 0; i < n; i++) { const seed = hash(vid + "#" + i); pool.push({ vendorId: vid, userId: "u" + (seed % 99999), name: NAMES[seed % NAMES.length], rating: RSEQ[(h + i) % RSEQ.length], text: TXT[seed % TXT.length], ts: Date.now() - i * 86400000 - (seed % 86400000) }); }
      changed = true;
    });
    if (changed) window.VREVIEWS.save(pool);
  } catch (e) {}
})();

// 1:1 문의
window.INQUIRY = {
  KEY: "gi_inquiries",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save: function (l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  list: function (user) { return this.all().filter((q) => q.userId === user); },
  add: function (q) { const l = this.all(); l.unshift(Object.assign({ id: "q" + Date.now(), ts: Date.now(), status: "received" }, q)); localStorage.setItem(this.KEY, JSON.stringify(l)); },
  update: function (id, patch) { const l = this.all(); const i = l.findIndex((q) => q.id === id); if (i >= 0) { l[i] = Object.assign({}, l[i], patch); this.save(l); } },
};

// ============================================================
// 개인정보 보호 (데모)  ⚠️ 실제 at-rest 암호화 · 서버 cron · IP 로깅은 백엔드 필수
//   - 마스킹은 "표시 보호"일 뿐, 실제 저장 암호화는 서버(DB)에서 수행해야 함
// ============================================================
window.PRIVACY = {
  phone: function (v) { const d = String(v || "").replace(/\D/g, ""); if (!d) return "-"; if (d.length < 7) return d[0] + "***"; return d.slice(0, 3) + "-****-" + d.slice(-4); },
  name: function (v) { v = String(v || ""); if (!v) return "-"; if (v.length <= 1) return v; if (v.length === 2) return v[0] + "*"; return v[0] + "*".repeat(v.length - 2) + v.slice(-1); },
  acct: function (v) { v = String(v || "").replace(/\s/g, ""); if (!v) return "-"; return v.length > 6 ? v.slice(0, 3) + "*".repeat(v.length - 6) + v.slice(-3) : "****"; },
  rrn: function (v) { const d = String(v || "").replace(/\D/g, ""); if (!d) return "-"; return d.slice(0, 6) + "-*******"; },
  birth: function (v) { v = String(v || ""); return v ? (v.slice(0, 4) + "-**-**") : "-"; },
  bizno: function (v) { const d = String(v || "").replace(/[^0-9]/g, ""); return d.length >= 5 ? d.slice(0, 3) + "-" + d.slice(3, 5) + "-*****" : (v ? "*****" : "-"); },
  email: function (v) { v = String(v || ""); const i = v.indexOf("@"); if (i < 1) return v ? "***" : "-"; const id = v.slice(0, i), dom = v.slice(i); return (id.length <= 2 ? id[0] + "*" : id.slice(0, 2) + "*".repeat(Math.max(1, id.length - 2))) + dom; },
};
// 제3자 제공 동의 기록 (예약자 정보가 호스트·파트너에게 전달됨에 대한 동의)
window.CONSENT = {
  KEY: "gi_consent",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  record: function (userId, scope, target) { const l = this.all(); l.unshift({ id: "cs" + Date.now(), userId: userId || "-", scope: scope || "3rdparty", target: target || "", agreed: true, ts: Date.now() }); localStorage.setItem(this.KEY, JSON.stringify(l.slice(0, 1000))); },
};
// 관리자 접근/조회/다운로드 로그 (감사) — 서버는 작업자·IP·일시·내용 + 최소 1년 보관
window.AUDIT = {
  KEY: "gi_audit",
  all: function () { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  log: function (action, target, detail) {
    const a = window.AUTH && window.AUTH.get(); if (!a || a.role !== "admin") return;
    const l = this.all();
    l.unshift({ id: "au" + Date.now() + Math.floor(Math.random() * 1000), actor: a.userId, role: a.role, action: action, target: target || "", detail: detail || "", ip: "(server)", ts: Date.now() });
    localStorage.setItem(this.KEY, JSON.stringify(l.slice(0, 500)));
  },
  clear: function () { localStorage.removeItem(this.KEY); },
};
// 보관기간 · 자동 파기 (데모 스윕) — 실서비스는 서버 배치(cron)가 강제
window.RETENTION = {
  ORDER_DAYS: 365 * 5, AUDIT_DAYS: 365, // 전자상거래 결제·예약 5년 / 접속로그 1년
  sweep: function () {
    let n = 0;
    try {
      const cut = Date.now() - this.ORDER_DAYS * 86400000, bl = window.BOOKINGS.list();
      bl.forEach(function (b) { if ((b.ts || 0) < cut && !b._anon) { b.guestName = "(파기)"; b.guestPhone = ""; b.detail = ""; b._anon = true; n++; } });
      if (n) window.BOOKINGS.save(bl);
      const ac = Date.now() - this.AUDIT_DAYS * 86400000, au = window.AUDIT.all(), kept = au.filter(function (x) { return (x.ts || 0) >= ac; });
      if (kept.length !== au.length) localStorage.setItem(window.AUDIT.KEY, JSON.stringify(kept));
    } catch (e) {}
    return n;
  },
};
// 회원 탈퇴: 개인정보 파기/익명화 (거래기록은 보관의무로 익명화만)
// 비밀번호 복잡도: 영문+숫자+특수문자 조합 8자 이상 (프론트 검사 — 서버도 동일 검증 필요)
window.PWCHECK = function (pw) { return typeof pw === "string" && pw.length >= 8 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw); };
window.PW_RULE = "영문·숫자·특수문자를 모두 포함해 8자 이상";
window.PRIVACY.purgeUser = function (userId) {
  const users = window.AUTH.users().map(function (u) {
    return u.userId === userId
      ? { userId: u.userId, role: u.role, nick: "(탈퇴회원)", name: "(탈퇴회원)", email: "", phone: "", addr: "", owner: "", bizNo: "", bank: "", account: "", birth: "", _withdrawn: true, withdrawnAt: Date.now() }
      : u;
  });
  window.AUTH.saveUsers(users);
  try { const bl = window.BOOKINGS.list(); let c = false; bl.forEach(function (b) { if (b.guestId === userId) { b.guestName = "(탈퇴회원)"; b.guestPhone = ""; c = true; } }); if (c) window.BOOKINGS.save(bl); } catch (e) {}
  try { const rl = window.REQUESTS.list(); let c = false; rl.forEach(function (r) { if (r.memberId === userId) { r.memberName = "(탈퇴회원)"; r.memberPhone = ""; c = true; } }); if (c) window.REQUESTS.save(rl); } catch (e) {}
};

// 제3자 제공 동의 상세 모달 (예약/결제/견적 폼의 '자세히'에서 호출)
window.showConsentDetail = function () {
  let m = document.getElementById("consentDetailModal");
  if (!m) {
    m = document.createElement("div"); m.id = "consentDetailModal"; m.className = "gmodal"; m.hidden = true;
    document.body.appendChild(m);
    m.addEventListener("click", function (e) { if (e.target.closest("[data-cdx]")) m.hidden = true; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") m.hidden = true; });
  }
  const rows = [
    ["제공받는 자", "예약·견적한 <b>공간의 호스트</b> 또는 <b>부대서비스 파트너</b>"],
    ["제공 항목", "이름(닉네임), 휴대폰 번호"],
    ["제공 목적", "예약·견적 이행, 현장 이용 안내 및 연락"],
    ["보유·이용 기간", "거래 완료 후 관계 법령(전자상거래법)에 따른 보관기간(<b>5년</b>) 또는 동의 철회 시까지"],
  ];
  m.innerHTML = '<div class="gmodal__bd" data-cdx></div>'
    + '<div class="gmodal__card terms-card">'
    + '<button class="gmodal__x" data-cdx aria-label="닫기">✕</button>'
    + '<div class="terms-head"><span class="section__kicker">PRIVACY</span><h3 class="terms-title">개인정보 제3자 제공 동의</h3></div>'
    + '<div class="terms-body"><table class="consent-tb">' + rows.map(function (r) { return '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>'; }).join("") + '</table>'
    + '<p class="terms-demo">동의를 거부하실 권리가 있으며, 거부 시 예약·견적 진행이 제한될 수 있습니다. 자세한 내용은 개인정보 처리방침을 따릅니다.</p></div>'
    + '<button type="button" class="btn btn--accent btn--block" data-cdx style="margin-top:16px">확인</button></div>';
  m.hidden = false;
};
document.addEventListener("click", function (e) { if (e.target.closest("[data-consent-detail]")) { e.preventDefault(); window.showConsentDetail(); } });
// 공용 약관 뷰어 — 어느 페이지든 [data-legal="guest|partner|privacy|marketing|refund"]로 모달 표시
window.openLegal = function (kind) {
  const t = window.LEGAL ? window.LEGAL.get(kind) : null; if (!t || !t.html) return;
  let m = document.getElementById("legalModal");
  if (!m) {
    m = document.createElement("div"); m.id = "legalModal"; m.className = "gmodal"; m.hidden = true; document.body.appendChild(m);
    m.addEventListener("click", function (e) { if (e.target.closest("[data-lgx]")) m.hidden = true; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") m.hidden = true; });
  }
  m.innerHTML = '<div class="gmodal__bd" data-lgx></div><div class="gmodal__card terms-card">'
    + '<button class="gmodal__x" data-lgx aria-label="닫기">✕</button>'
    + '<div class="terms-head"><span class="section__kicker">TERMS</span><h3 class="terms-title">' + t.title + '</h3><span class="terms-updated">' + (t.updated || "") + '</span></div>'
    + '<div class="terms-body">' + t.html + '</div>'
    + '<button type="button" class="btn btn--accent btn--block" data-lgx style="margin-top:18px">확인</button></div>';
  m.hidden = false;
};
document.addEventListener("click", function (e) { const b = e.target.closest("[data-legal]"); if (b) { e.preventDefault(); e.stopPropagation(); window.openLegal(b.dataset.legal); } });
// 회사(사업자) 정보 — 전자상거래법 표시의무
window.COMPANY = {
  name: "(주)와일리", ceo: "박수인", bizNo: "211-88-56742",
  addr: "서울특별시 강남구 학동로 336 메이트리빌딩 7층",
  tel: "02-545-3477", email: "wylie@wylie.co.kr",
  privacyOfficer: "문병훈", hosting: "AWS",
  broker: "공간잇다는 통신판매중개자로서 통신판매의 당사자가 아니며, 파트너가 등록한 상품 정보 및 거래에 대해 책임을 지지 않습니다.",
};
// 모든 페이지 푸터에 약관 링크 바 + 사업자 정보 고지 주입
function _injectFooterLegal() {
  const links = [["guest", "이용약관"], ["privacy", "개인정보 처리방침"], ["efin", "전자금융거래 이용약관"], ["lbs", "위치기반서비스 이용약관"], ["ops", "운영정책"], ["refund", "취소·환불 정책"]];
  const C = window.COMPANY;
  document.querySelectorAll(".footer").forEach(function (f) {
    if (f.querySelector(".footer__legal")) return;
    const copy = f.querySelector(".footer__copy");
    const bar = document.createElement("div");
    bar.className = "footer__legal";
    bar.innerHTML = links.map(function (l) { return '<a href="#" data-legal="' + l[0] + '"' + (l[0] === "privacy" ? ' class="is-strong"' : "") + ">" + l[1] + "</a>"; }).join('<span class="footer__legal-sep">·</span>');
    const biz = document.createElement("div");
    biz.className = "footer__biz";
    biz.innerHTML = '<p class="footer__biz-row"><b>' + C.name + '</b> · 대표 ' + C.ceo + ' · 사업자등록번호 ' + C.bizNo + ' · ' + C.addr + ' · 대표전화 ' + C.tel + ' · ' + C.email + ' · 개인정보보호책임자 ' + C.privacyOfficer + ' · 호스팅 ' + C.hosting + '</p>'
      + '<p class="footer__biz-broker">' + C.broker + '</p>';
    if (copy) { copy.parentNode.insertBefore(bar, copy); copy.parentNode.insertBefore(biz, copy); }
    else { f.appendChild(bar); f.appendChild(biz); }
  });
}
if (document.readyState !== "loading") _injectFooterLegal(); else document.addEventListener("DOMContentLoaded", _injectFooterLegal);

// ---------- 로고/아이콘 ----------
const GI_SYMBOL = '<svg class="logo__mark" width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 6 C21 6 12 14.5 12 25 C12 36 22 42 32 54 C42 42 52 36 52 25 C52 14.5 43 6 32 6 Z" stroke="#211E1A" stroke-width="5" stroke-linejoin="round"/><circle cx="28" cy="24" r="4.6" fill="#4C93B8"/><circle cx="36" cy="24" r="4.6" fill="#D97852"/></svg>';
const BELL_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>';
window.timeago = function (ts) { const s = (Date.now() - ts) / 1000; if (s < 60) return "방금"; if (s < 3600) return Math.floor(s / 60) + "분 전"; if (s < 86400) return Math.floor(s / 3600) + "시간 전"; return Math.floor(s / 86400) + "일 전"; };

// ---------- 헤더/로고/알림 주입 + 가드 ----------
(function initUI() {
  function refreshBell() {
    const a = window.AUTH.get(); if (!a) return;
    const n = window.NOTIF.unread(a.userId);
    document.querySelectorAll(".bell__badge").forEach((b) => { b.textContent = n; b.hidden = n === 0; });
  }
  window.refreshBell = refreshBell;

  function apply() {
    document.querySelectorAll(".logo").forEach((l) => { l.innerHTML = GI_SYMBOL + '<span class="logo__wm">공간<em>잇다</em></span>'; });
    if (!document.querySelector('link[rel="icon"]')) {
      const link = document.createElement("link"); link.rel = "icon"; link.type = "image/svg+xml";
      link.href = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M32 6 C21 6 12 14.5 12 25 C12 36 22 42 32 54 C42 42 52 36 52 25 C52 14.5 43 6 32 6 Z" stroke="#211E1A" stroke-width="5" stroke-linejoin="round"/><circle cx="28" cy="24" r="4.6" fill="#4C93B8"/><circle cx="36" cy="24" r="4.6" fill="#D97852"/></svg>');
      document.head.appendChild(link);
    }

    const a = window.AUTH.get();

    // 찜한 공간에 반짝할인이 뜨면 알림(기기·유저별 1회)
    try {
      if (a && window.FAV) {
        const key = a.userId;
        const alerted = JSON.parse(localStorage.getItem("gi_favalert") || "{}"); alerted[key] = alerted[key] || {};
        const mine = (function () { try { return JSON.parse(localStorage.getItem("gi_spaces") || "[]"); } catch (e) { return []; } })();
        const pool = (typeof SPACES !== "undefined" ? SPACES : []).concat(mine);
        window.FAV.list().forEach((id) => {
          const pct = window.DISCOUNT.flashPct(id);
          const sp = pool.find((s) => s.id === id);
          if (pct && sp && !alerted[key][id]) { window.NOTIF.add({ forUser: a.userId, title: sp.name, sub: `⚡ 찜한 공간 반짝할인 ${pct}%`, link: "space.html?id=" + id }); alerted[key][id] = 1; }
          if (!pct && alerted[key][id]) delete alerted[key][id];
        });
        localStorage.setItem("gi_favalert", JSON.stringify(alerted));
      }
    } catch (e) {}

    // 예약 리마인더 — 이용 D-1(내일)·당일 예약을 유저별 1회 알림 (게스트=이용 예정, 호스트=예약 있음)
    try {
      if (a && window.BOOKINGS) {
        const p2 = (n) => String(n).padStart(2, "0");
        const d0 = new Date(); d0.setHours(0, 0, 0, 0);
        const ymd = (dt) => `${dt.getFullYear()}-${p2(dt.getMonth() + 1)}-${p2(dt.getDate())}`;
        const today = ymd(d0), tmr = ymd(new Date(d0.getTime() + 86400000));
        let seen = {}; try { seen = JSON.parse(localStorage.getItem("gi_notifseen") || "{}"); } catch (e2) {}
        window.BOOKINGS.list().forEach((b) => {
          if (b.status === "cancelled" || b.status === "declined") return;
          if (b.date !== today && b.date !== tmr) return;
          const asGuest = b.guestId === a.userId, asHost = b.hostId === a.userId;
          if (!asGuest && !asHost) return;
          const role = asGuest ? "g" : "h";
          const key = "rm:" + b.id + ":" + (b.date === today ? "d0" : "d1") + ":" + role;
          if (seen[key]) return;
          const when = b.date === today ? "오늘" : "내일";
          const t = (b.start != null) ? ` ${p2(b.start)}:00` : "";
          window.NOTIF.add({
            forUser: a.userId, title: b.spaceName || "예약",
            sub: asGuest ? `📅 ${when}${t} 이용 예정이에요` : `📅 ${when}${t} 예약이 있어요`,
            link: asGuest ? "mypage.html?tab=book" : "mypage.html?tab=reqs",
          });
          seen[key] = 1;
        });
        localStorage.setItem("gi_notifseen", JSON.stringify(seen));
      }
    } catch (e) {}

    // 입점(사업자) 내비 — 비로그인: 사업자 등록, 호스트: 공간 등록, 파트너: 파트너 정보, 회원(guest): 숨김
    document.querySelectorAll(".js-host-nav").forEach((e) => {
      if (a && a.role === "host") { e.textContent = "내 공간 관리"; e.setAttribute("href", "mypage.html?tab=mine"); e.style.display = "inline"; }
      else if (a && (a.role === "vendor" || a.role === "guest" || a.role === "admin")) { e.style.display = "none"; } // 파트너·회원·관리자: 숨김(마이페이지에서 관리)
      else { e.textContent = "사업자 등록"; e.setAttribute("href", "business.html"); e.style.display = "inline"; } // 비로그인
    });
    // 파트너 전용 내비
    document.querySelectorAll(".js-vendor").forEach((e) => { e.style.display = (a && a.role === "vendor") ? "" : "none"; });

    document.querySelectorAll("[data-authbox]").forEach((box) => {
      if (a) {
        const S = (p) => `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
        const RICO = {
          admin: S('<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/>'),
          host: S('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>'),
          vendor: S('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
          guest: S('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
        };
        const tag = `<span class="auth-name__ic">${RICO[a.role] || RICO.guest}</span>`;
        const un = window.NOTIF.unread(a.userId);
        const homeLink = a.role === "admin"
          ? `<a href="admin.html" class="header__link">관리자 콘솔</a>`
          : `<a href="mypage.html" class="header__link">마이페이지</a>`;
        box.innerHTML =
          `<div class="bell-wrap">
             <button class="bell" data-bell aria-label="알림">${BELL_SVG}<span class="bell__badge"${un ? "" : " hidden"}>${un}</span></button>
             <div class="bell-dd" data-belldd hidden></div>
           </div>
           ${homeLink}
           <span class="auth-name">${tag}${window.AUTH.displayName(a)}</span>
           <a href="#" class="header__link" data-logout>로그아웃</a>`;
        wireBell(box, a);
      } else {
        box.innerHTML = `<a href="login.html" class="header__link">로그인</a><a href="signup.html" class="btn btn--primary btn--sm">회원가입</a>`;
      }
    });

    // 모바일 전용 알림 벨 — 햄버거 버튼 옆(밖)에 노출 (드롭다운 안에 갇히지 않도록)
    document.querySelectorAll(".header__inner").forEach((inner) => {
      const hmenu = inner.querySelector("#hmenu");
      let mbell = inner.querySelector(".bell-wrap--m");
      if (a && hmenu) {
        if (!mbell) {
          const un = window.NOTIF.unread(a.userId);
          mbell = document.createElement("div");
          mbell.className = "bell-wrap bell-wrap--m";
          mbell.innerHTML = `<button class="bell" data-bell aria-label="알림">${BELL_SVG}<span class="bell__badge"${un ? "" : " hidden"}>${un}</span></button><div class="bell-dd" data-belldd hidden></div>`;
          inner.insertBefore(mbell, hmenu);
          wireBell(mbell, a);
        }
      } else if (mbell) { mbell.remove(); }
    });

    const lo = document.querySelector("[data-logout]");
    if (lo) lo.addEventListener("click", (e) => { e.preventDefault(); window.AUTH.logout(); location.href = "index.html"; });

    // 접근 가드
    const req = document.body.getAttribute("data-require");
    if (req === "auth" && !a) location.href = "login.html";
    if (req === "host" && (!a || a.role !== "host")) { alert("호스트 회원 전용입니다."); location.href = a ? "index.html" : "login.html"; }
    if (req === "vendor" && (!a || a.role !== "vendor")) { alert("파트너 회원 전용입니다."); location.href = a ? "index.html" : "login.html"; }
    if (req === "admin" && (!a || a.role !== "admin")) { alert("관리자 전용 페이지입니다."); location.href = a ? "index.html" : "login.html"; }

    // 실시간 배지(다른 탭에서 알림 변화 시)
    window.addEventListener("storage", (e) => { if (e.key === window.NOTIF.KEY) refreshBell(); });

    // 상시 채팅 위젯 (우하단 말풍선)
    if (a) initChatWidget(a);
    // ?chat=<threadId> 딥링크로 특정 채팅 열기 (알림 클릭 등)
    if (a) { const cp = new URLSearchParams(location.search).get("chat"); if (cp && window.openChatWidget) setTimeout(() => window.openChatWidget(cp), 300); }
    // 모바일 하단 내비
    initBottomNav(a);
  }

  // ---------- 모바일 하단 내비게이션 ----------
  function initBottomNav(a) {
    if (document.getElementById("mnav")) return;
    const path = (location.pathname.split("/").pop() || "index.html");
    const isHome = path === "" || path === "index.html";
    const rfpActive = path === "request.html" || path === "direct.html" || (path === "mypage.html" && /tab=rfp/.test(location.search));
    const items = [
      ["index.html", "home", "홈", isHome],
      ["search.html", "search", "공간", path === "search.html" || path === "space.html"],
      [a ? "mypage.html?tab=rfp" : "request.html", "doc", "견적함", rfpActive],
      [a ? "mypage.html" : "login.html", "user", a ? "마이" : "로그인", path === "mypage.html" && !/tab=rfp/.test(location.search)],
    ];
    const nav = document.createElement("nav");
    nav.id = "mnav"; nav.className = "mnav";
    nav.innerHTML = items.map(([href, ic, label, active]) => `<a href="${href}" class="mnav__i${active ? " is-active" : ""}"><span class="mnav__ic">${iconSVG(ic, 22)}</span><span>${label}</span></a>`).join("");
    document.body.appendChild(nav);
  }

  // ---------- 플로팅 채팅 위젯 ----------
  function initChatWidget(a) {
    if (document.getElementById("cw")) return;
    const me = a.userId;
    const CHAT_SVG = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.4 9 9 0 0 1-3.8-.8L3 20.5l1.4-4.2A8.38 8.38 0 0 1 3.6 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z"/></svg>';
    const wrap = document.createElement("div");
    wrap.id = "cw"; wrap.className = "cw";
    wrap.innerHTML = `<div class="cw__panel" id="cwPanel" hidden></div><button class="cw__bubble" id="cwBubble" aria-label="채팅">${CHAT_SVG}<span class="cw__badge" id="cwBadge" hidden></span><span class="cw__min" id="cwMin" role="button" aria-label="채팅 숨기기" title="채팅 숨기기">✕</span></button><button class="cw__handle" id="cwHandle" aria-label="채팅 열기" title="채팅 열기" hidden>${CHAT_SVG}<span class="cw__hdot" id="cwHdot" hidden></span></button>`;
    document.body.appendChild(wrap);
    const bubble = wrap.querySelector("#cwBubble"), panel = wrap.querySelector("#cwPanel"), badge = wrap.querySelector("#cwBadge");
    const handle = wrap.querySelector("#cwHandle"), minBtn = wrap.querySelector("#cwMin"), hdot = wrap.querySelector("#cwHdot");
    let openId = null, prevUnread = -1;
    // 접기/펼치기 (모바일에서 방해되지 않게 숨길 수 있음)
    function setCollapsed(v) {
      wrap.classList.toggle("cw--collapsed", v);
      handle.hidden = !v;
      if (v) panel.hidden = true;
      try { localStorage.setItem("gi_cw_hidden", v ? "1" : "0"); } catch (e) {}
    }
    function threads() {
      const map = {};
      const add = (id, title, hostId, guestId, relevant) => {
        if (hostId !== me && guestId !== me) return;
        if (!window.chatAllowed(hostId, guestId)) return; // 공급자끼리(호스트-파트너 등) 채팅 금지
        const msgs = window.CHAT.get(id);
        if (!msgs.length && !relevant) return;
        map[id] = { id, title, hostId, guestId, ts: msgs.length ? msgs[msgs.length - 1].ts : 0, last: msgs.length ? msgs[msgs.length - 1].text : "", unread: window.CHAT.unread(me, id) };
      };
      window.BOOKINGS.list().forEach((b) => add(b.id, b.spaceName || "예약", b.hostId, b.guestId, b.status !== "cancelled" && b.status !== "declined"));
      window.QUOTES.list().forEach((q) => { const r = window.REQUESTS.find(q.requestId); if (!r) return; const title = q.cat === "space" ? (q.spaceName || "공간") : (q.vendorName || "파트너"); add("q:" + q.id, title, q.vendorId, r.memberId, true); });
      const cm = window.CHATMETA.all(); Object.keys(cm).forEach((id) => { const m = cm[id]; add(id, m.title || "문의", m.hostId, m.guestId, true); });
      // 관리자 실시간 상담: 회원·호스트·파트너는 '고객센터', 관리자는 위 CHATMETA로 모든 상담을 봄
      if (window.roleOf(me) !== "admin" && me !== "admin") add("admin:" + me, "🎧 고객센터 (관리자)", "admin", me, true);
      return Object.values(map).sort((x, y) => y.ts - x.ts);
    }
    function refreshBadge() {
      const n = threads().reduce((s, t) => s + t.unread, 0);
      badge.textContent = n; badge.hidden = n === 0; bubble.classList.toggle("cw--alert", n > 0);
      if (hdot) hdot.hidden = n === 0;
      if (prevUnread >= 0 && n > prevUnread) {
        const el = wrap.classList.contains("cw--collapsed") ? handle : bubble;
        el.classList.remove("cw--shake"); void el.offsetWidth; el.classList.add("cw--shake");
        setTimeout(() => el.classList.remove("cw--shake"), 1400);
      }
      prevUnread = n;
    }
    function drawList() {
      const ts = threads();
      panel.innerHTML = `<div class="cw__head"><b>💬 채팅</b><button class="cw__x" data-cwx>✕</button></div>
        <div class="cw__body">${ts.length ? ts.map((t) => `<button class="cw__thread" data-t="${t.id}"><div class="cw__thtop"><b>${t.title}</b>${t.unread ? `<span class="cw__un">${t.unread}</span>` : ""}</div><span class="cw__last">${t.last || "대화를 시작해보세요"}</span></button>`).join("") : `<div class="cw__empty">진행 중인 대화가 없어요.<br />견적·예약의 <b>채팅</b> 버튼으로 대화를 시작하면 여기에 모여요.</div>`}</div>`;
    }
    function drawThread(t) {
      window.CHAT.markRead(me, t.id); refreshBadge();
      const msgs = window.CHAT.get(t.id);
      panel.innerHTML = `<div class="cw__head"><button class="cw__back" data-cwback>‹</button><b>${t.title}</b><button class="cw__x" data-cwx>✕</button></div>
        <div class="cw__msgs" id="cwMsgs">${msgs.length ? msgs.map((m) => `<div class="cw__msg ${m.from === me ? "mine" : ""}"><span>${m.text}</span><time>${window.timeago(m.ts)}</time></div>`).join("") : `<div class="cw__empty">첫 메시지를 보내보세요</div>`}</div>
        <form class="cw__form" data-cwform><input type="text" id="cwText" placeholder="메시지 입력" autocomplete="off" /><button class="btn btn--accent btn--sm" type="submit">전송</button></form>`;
      const box = panel.querySelector("#cwMsgs"); box.scrollTop = box.scrollHeight;
    }
    function openPanel() { if (wrap.classList.contains("cw--collapsed")) setCollapsed(false); panel.hidden = false; const t = openId && threads().find((x) => x.id === openId); t ? drawThread(t) : (openId = null, drawList()); }
    bubble.addEventListener("click", () => { if (panel.hidden) openPanel(); else panel.hidden = true; });
    minBtn.addEventListener("click", (e) => { e.stopPropagation(); setCollapsed(true); });
    handle.addEventListener("click", () => setCollapsed(false));
    // 접힘 상태 복원
    try { setCollapsed(localStorage.getItem("gi_cw_hidden") === "1"); } catch (e) {}
    panel.addEventListener("click", (e) => {
      if (e.target.closest("[data-cwx]")) { panel.hidden = true; return; }
      if (e.target.closest("[data-cwback]")) { openId = null; drawList(); return; }
      const th = e.target.closest("[data-t]"); if (th) { openId = th.dataset.t; const t = threads().find((x) => x.id === openId); if (t) drawThread(t); }
    });
    panel.addEventListener("submit", (e) => {
      if (!e.target.closest("[data-cwform]")) return;
      e.preventDefault();
      const t = threads().find((x) => x.id === openId); if (!t) return;
      const other = me === t.hostId ? t.guestId : t.hostId;
      if (!window.chatAllowed(me, other)) return; // 공급자끼리 전송 금지
      const inp = panel.querySelector("#cwText"), v = inp.value.trim(); if (!v) return;
      const isAdminChat = t.id.indexOf("admin:") === 0;
      window.CHAT.send(t.id, { from: me, name: a.name, text: v });
      // 관리자 상담 스레드 메타 생성/유지 — 관리자 화면에 '사용자명(역할)'으로 표시
      if (isAdminChat && !window.CHATMETA.get(t.id)) {
        const uid2 = t.guestId, uu = window.AUTH.users().find((u) => u.userId === uid2), rw = ({ guest: "회원", host: "호스트", vendor: "파트너" })[window.roleOf(uid2)] || "회원";
        window.CHATMETA.set(t.id, { title: `${window.PRIVACY ? window.PRIVACY.name((uu && (uu.nick || uu.name)) || uid2) : ((uu && (uu.nick || uu.name)) || uid2)} · ${rw}`, hostId: "admin", guestId: uid2 });
      }
      window.NOTIF.add({ forUser: other, title: isAdminChat ? "🎧 고객센터 문의" : t.title, sub: "💬 새 메시지", link: isAdminChat && other === "admin" ? "admin.html?tab=cs" : "mypage.html" });
      drawThread(t);
      // 데모 자동 응답 — 관리자 상담은 실제 관리자가 답하므로 자동응답 제외
      if (other && other !== me && !isAdminChat) {
        const REPLY = ["안녕하세요! 문의 감사합니다. 확인 후 바로 안내드릴게요.", "네, 해당 일정 가능합니다 😊 상세 조율 도와드릴게요.", "말씀하신 내용 반영해서 준비하겠습니다!", "추가로 필요하신 부분 있으면 편하게 말씀해 주세요."];
        const otherU = window.AUTH.users().find((u) => u.userId === other);
        const mineCnt = window.CHAT.get(t.id).filter((m) => m.from === me).length;
        setTimeout(() => {
          window.CHAT.send(t.id, { from: other, name: (otherU && otherU.nick) || t.title, text: REPLY[(mineCnt - 1) % REPLY.length] });
          window.NOTIF.add({ forUser: me, title: t.title, sub: "💬 답장이 도착했어요", link: "mypage.html" });
          refreshBadge();
          if (!panel.hidden && openId === t.id) { const t2 = threads().find((x) => x.id === t.id); if (t2) drawThread(t2); }
        }, 1200);
      }
    });
    window.addEventListener("storage", (e) => { if (e.key === window.CHAT.KEY) { refreshBadge(); if (!panel.hidden) openPanel(); } });
    refreshBadge();
    // 외부에서 특정 스레드 열기 (?chat= 등)
    window.openChatWidget = function (id) { openId = id; openPanel(); };
  }

  function wireBell(box, a) {
    const bell = box.querySelector("[data-bell]"), dd = box.querySelector("[data-belldd]");
    if (!bell) return;
    function drawDD() {
      const items = window.NOTIF.list(a.userId).slice(0, 20);
      dd.innerHTML = `<div class="bell-dd__t"><span>알림</span>${items.length ? `<span class="bell-dd__act"><button type="button" data-bellread>모두 읽음</button><button type="button" data-bellclear>모두 삭제</button></span>` : ""}</div>` + (items.length
        ? items.map((n) => `<a class="bell-item ${n.read ? "" : "is-unread"}" href="${n.link || "#"}">${n.title ? `<b class="bell-item__t">${n.title}</b><span class="bell-item__s">${n.sub || ""}</span>` : `<span class="bell-item__txt">${n.text || ""}</span>`}<time>${window.timeago(n.ts)}</time></a>`).join("")
        : `<div class="bell-empty">알림이 없어요</div>`);
    }
    bell.addEventListener("click", (e) => {
      e.stopPropagation();
      if (dd.hasAttribute("hidden")) {
        drawDD(); dd.removeAttribute("hidden");
        // 벨을 열어 확인 → 읽음 처리(뱃지 제거). 강조 표시는 이번 목록엔 유지되고 다음 열람부터 읽음으로 보임
        if (window.NOTIF.unread(a.userId) > 0) { window.NOTIF.markRead(a.userId); refreshBell(); }
      } else dd.setAttribute("hidden", "");
    });
    dd.addEventListener("click", (e) => {
      const rd = e.target.closest("[data-bellread]"), cl = e.target.closest("[data-bellclear]");
      if (rd) { e.stopPropagation(); e.preventDefault(); window.NOTIF.markRead(a.userId); refreshBell(); drawDD(); return; }
      if (cl) { e.stopPropagation(); e.preventDefault(); window.NOTIF.clear(a.userId); refreshBell(); drawDD(); return; }
    });
    document.addEventListener("click", () => dd.setAttribute("hidden", ""));
  }

  if (document.readyState !== "loading") apply();
  else document.addEventListener("DOMContentLoaded", apply);
})();
