// ============================================================
// 공간잇다 — 운영 데이터 엔진 (모의 예약 생성 + 3자 분할 정산)
//   브라우저(window.OPS)와 Node(require) 양쪽에서 동일 로직 사용 → 검증 일치
// ============================================================
(function (root) {
  const OPS = {};
  const HOST_FEE = 0.05, VENDOR_FEE = 0.05, CUSTOMER_FEE = 0, PKG_FEE = 0.05;
  OPS.fees = { HOST_FEE, VENDOR_FEE, CUSTOMER_FEE, PKG_FEE };

  // 거래의 결제일(정산 요율 기준일) — paidAt > ts > date 순
  OPS.payDateOf = function (rec) {
    if (!rec) return "";
    if (rec.paidAt) return OPS.dateStr(new Date(rec.paidAt));
    if (rec.ts) return OPS.dateStr(new Date(rec.ts));
    return rec.date || "";
  };
  // 공급자·패키지별 수수료율(분수) — dateStr(결제일) 주면 그 시점 유효 요율, 없으면 현재 요율
  OPS.rateFor = function (kind, id, dateStr) {
    var FR = (typeof window !== "undefined") && window.FEERATES;
    if (FR) return (dateStr ? FR.pctOn(kind, id, dateStr) : FR.pctOf(kind, id)) / 100;
    return kind === "host" ? HOST_FEE : kind === "vendor" ? VENDOR_FEE : kind === "pkg" ? PKG_FEE : 0;
  };
  // 1건 분해: 고객결제(gross) → 공급자수익(provider) + 와일리수수료(wylie)
  //  rate(분수) 지정 시 그 요율로, 미지정 시 기본율로 계산
  OPS.split = function (kind, gross, rate) {
    gross = +gross || 0;
    if (kind === "host") { const fee = rate != null ? rate : HOST_FEE; const base = Math.round(gross / (1 + CUSTOMER_FEE)); const p = Math.round(base * (1 - fee)); return { gross, provider: p, wylie: gross - p, kind }; }
    if (kind === "vendor") { const fee = rate != null ? rate : VENDOR_FEE; const p = Math.round(gross * (1 - fee)); return { gross, provider: p, wylie: gross - p, kind }; }
    if (kind === "pkg") { const fee = rate != null ? rate : PKG_FEE; const w = Math.round(gross * fee); return { gross, provider: gross - w, wylie: w, kind }; }
    return { gross, provider: gross, wylie: 0, kind };
  };

  // ── 취소 수수료 정책 — 이용일까지 남은 일수(D-day)별 환불율 ──
  //  공간(space): 표준 5구간 / 부대서비스(vendor): 별도(리드타임 커서 더 엄격)
  //  각 구간 {d: 최소 남은일수, refund: 환불율}. 위에서부터 매칭(내림차순).
  OPS.CANCEL_POLICY = {
    space:  [{ d: 7, refund: 1.0 }, { d: 5, refund: 0.7 }, { d: 3, refund: 0.5 }, { d: 1, refund: 0.3 }, { d: -Infinity, refund: 0 }],
    vendor: [{ d: 7, refund: 1.0 }, { d: 3, refund: 0.5 }, { d: -Infinity, refund: 0 }],
  };
  OPS.cancelKind = function (kind) { return kind === "vendor" ? "vendor" : "space"; }; // host/pkg/space → space
  OPS.daysBefore = function (useDate, today) {
    if (!useDate) return 0;
    const t0 = new Date((today || OPS.dateStr(new Date())) + "T00:00:00");
    const t1 = new Date(useDate + "T00:00:00");
    return Math.round((t1 - t0) / 86400000);
  };
  OPS.refundRate = function (kind, days) {
    const pol = OPS.CANCEL_POLICY[OPS.cancelKind(kind)];
    for (let i = 0; i < pol.length; i++) { if (days >= pol[i].d) return pol[i].refund; }
    return 0;
  };
  // 취소 계산: 환불액·위약금·환불율·D-day
  OPS.cancelCalc = function (kind, price, useDate, today) {
    price = +price || 0;
    const days = OPS.daysBefore(useDate, today);
    const rate = OPS.refundRate(kind, days);
    const refund = Math.round(price * rate);
    return { days, rate, refund, penalty: price - refund, price };
  };
  OPS.cancelTierLabel = function (kind, days) {
    const rate = OPS.refundRate(kind, days);
    const when = days <= 0 ? "당일·이용 후" : "이용 " + days + "일 전";
    return when + " → 환불 " + Math.round(rate * 100) + "% · 위약금 " + Math.round((1 - rate) * 100) + "%";
  };
  // 정책 요약(약관·안내 노출용)
  OPS.cancelPolicyText = function (kind) {
    const pol = OPS.CANCEL_POLICY[OPS.cancelKind(kind)];
    const parts = [];
    for (let i = 0; i < pol.length; i++) {
      const cur = pol[i], pct = Math.round(cur.refund * 100);
      if (cur.d === -Infinity) parts.push("당일·노쇼 " + pct + "%");
      else { const hi = i === 0 ? null : OPS.CANCEL_POLICY[OPS.cancelKind(kind)][i - 1].d - 1; parts.push(hi != null ? cur.d + "~" + hi + "일 전 " + pct + "%" : cur.d + "일 전까지 " + pct + "%"); }
    }
    return parts.join(" · ");
  };

  // 시드 기반 난수(xorshift) — 동일 시드 → 동일 결과(검증 재현성)
  OPS.rng = function (seed) { let s = (seed >>> 0) || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
  OPS.NAMES = ["김민준", "이서연", "박도윤", "최지우", "정하준", "강서아", "조은우", "윤지호", "임하윤", "한도현", "오수아", "서준서", "신예은", "권시우", "황유나", "안지안", "송채원", "전예준", "홍서준", "고나윤", "문건우", "배지민", "백서현", "유주원", "남기범", "심다은", "노윤서", "하지훈", "곽민서", "성지아", "김하은", "이준영", "박서진", "최윤아", "정민재", "강태현", "조예린", "윤도경", "임채윤", "한소율", "오지환", "서다인", "신우진", "권나은", "황현우", "안서우", "송지후", "전하율", "홍채은", "고준혁", "문가은", "배준호", "백지원", "유하진", "남지수", "심재원", "노아름", "하은결", "곽지오", "성민경"];
  OPS.pad = (n) => String(n).padStart(2, "0");
  OPS.dateStr = (d) => `${d.getFullYear()}-${OPS.pad(d.getMonth() + 1)}-${OPS.pad(d.getDate())}`;

  // 결제 상세(카드사·승인번호·일시·공급가액/VAT·국세청 승인번호) — 예약 정보로 결정론적 생성
  //  저장 없이 모든 기존/신규 예약에 일관되게 부여됨 (영수증·국세청 조회 공용)
  OPS.CARDS = ["신한카드", "삼성카드", "현대카드", "KB국민카드", "롯데카드", "BC카드", "우리카드", "하나카드", "NH농협카드", "카카오뱅크"];
  OPS.payInfo = function (b) {
    if (!b) return null;
    const total = +b.total || +b.price || 0;
    const key = String(b.id || "x") + "|" + (b.date || "") + "|" + total;
    let h = 2166136261; for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = (h * 16777619) >>> 0; }
    const supply = Math.round(total / 1.1), vat = total - supply;
    const card = OPS.CARDS[h % OPS.CARDS.length];
    const bin = 4000 + (h % 6000), last = 1000 + ((h >>> 3) % 9000);
    const cardNo = String(bin) + "-****-****-" + String(last);
    const approvalNo = String(10000000 + (h % 90000000)); // 8자리 카드 승인번호
    const inst = (total >= 100000 && h % 3 === 0) ? (h % 2 ? "3개월" : "6개월") : "일시불";
    // 결제 승인 일시: ts 있으면 사용, 없으면 이용일 오전~오후 임의
    let dt = b.paidAt ? new Date(b.paidAt) : (b.ts ? new Date(b.ts) : (b.date ? new Date(b.date + "T00:00:00") : new Date()));
    if (!b.paidAt && !b.ts && b.date) dt = new Date(b.date + "T" + OPS.pad(9 + (h % 11)) + ":" + OPS.pad(h % 60) + ":" + OPS.pad((h >>> 5) % 60));
    const dd = OPS.dateStr(dt) + " " + OPS.pad(dt.getHours()) + ":" + OPS.pad(dt.getMinutes()) + ":" + OPS.pad(dt.getSeconds());
    // 국세청 e세로 전자세금계산서 승인번호: YYYYMMDD-8자리-8자리
    const ymd = (b.date || OPS.dateStr(dt)).replace(/-/g, "");
    const taxNo = ymd + "-" + String(10000000 + ((h >>> 7) % 90000000)) + "-" + String(10000000 + ((h >>> 11) % 90000000));
    return { method: "신용카드", card: card, cardNo: cardNo, approvalNo: approvalNo, approvedAt: dd, installment: inst, total: total, supply: supply, vat: vat, taxNo: taxNo };
  };

  OPS.genMembers = function (n, seed) {
    const out = [];
    for (let i = 0; i < n; i++) { const nm = OPS.NAMES[i % OPS.NAMES.length]; out.push({ userId: "m" + OPS.pad(i + 1), name: nm, nick: nm, role: "guest", email: `user${i + 1}@demo.kr`, pw: "1234", _mock: true }); }
    return out;
  };

  OPS.genBookings = function (spaces, members, n, seed) {
    const r = OPS.rng(seed || 42), pick = (a) => a[Math.floor(r() * a.length)];
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const out = [];
    for (let i = 0; i < n; i++) {
      const s = pick(spaces), m = pick(members);
      const off = Math.floor(r() * 90) - 60; // -60 ~ +29일
      const d = new Date(now.getTime() + off * 86400000);
      const start = 9 + Math.floor(r() * 10), hours = 1 + Math.floor(r() * 5);
      const cap = Math.max(2, Math.min(s.capacity || 10, 20)), guests = 1 + Math.floor(r() * cap);
      const unit = s.price || 20000, total = Math.round(unit * hours * (1 + CUSTOMER_FEE));
      let status = "confirmed", paid = true; const rr = r();
      if (off < 0) { if (rr < 0.12) { status = "cancelled"; paid = false; } else status = "confirmed"; }
      else if (off < 7) { status = rr < 0.15 ? "requested" : "confirmed"; }
      else { status = rr < 0.5 ? "requested" : "confirmed"; }
      out.push({ id: "mb" + i + "_" + (seed || 42), spaceId: s.id, spaceName: s.name, hostId: s.ownerId || "host", guestId: m.userId, guestName: m.name, guestPhone: "010-" + OPS.pad(1000 + Math.floor(r() * 8999)) + "-" + OPS.pad(1000 + Math.floor(r() * 8999)), price: unit, date: OPS.dateStr(d), start, hours, guests, total, status, paid, ts: d.getTime() - Math.floor(r() * 5 * 86400000), _mock: true });
    }
    return out;
  };

  OPS.genPackages = function (pkgs, members, n, seed) {
    const r = OPS.rng(seed || 99), pick = (a) => a[Math.floor(r() * a.length)];
    const now = new Date(); now.setHours(0, 0, 0, 0); const out = [];
    for (let i = 0; i < n; i++) {
      const p = pick(pkgs), m = pick(members), off = Math.floor(r() * 70) - 45, d = new Date(now.getTime() + off * 86400000);
      out.push({ id: "mp" + i + "_" + (seed || 99), pkg: true, pkgId: p.id, spaceName: p.title, hostId: "wylie", guestId: m.userId, guestName: m.name, price: p.price, date: OPS.dateStr(d), start: null, hours: null, guests: p.cap, total: p.price, status: off < 0 ? "confirmed" : (r() < 0.4 ? "requested" : "confirmed"), paid: true, ts: d.getTime(), _mock: true });
    }
    return out;
  };

  // 파트너 견적(vendor) 모의 생성 — 금액은 1만원 단위 랜덤 배수
  OPS.genQuotes = function (vendors, members, n, seed) {
    const r = OPS.rng(seed || 123), pick = (a) => a[Math.floor(r() * a.length)];
    const now = new Date(); now.setHours(0, 0, 0, 0); const out = [];
    if (!vendors || !vendors.length) return out;
    for (let i = 0; i < n; i++) {
      const v = pick(vendors), m = pick(members);
      const cat = (v.serviceCats && v.serviceCats[0]) || "camera";
      const price = (3 + Math.floor(r() * 28)) * 10000; // 3만~30만, 1만원 랜덤 배수
      const off = Math.floor(r() * 80) - 50, d = new Date(now.getTime() + off * 86400000);
      out.push({ id: "mq" + i + "_" + (seed || 123), requestId: "mock" + i, vendorId: v.userId, vendorName: v.nick || v.name, cat, price, status: "accepted", paid: true, date: OPS.dateStr(d), ts: d.getTime(), _mock: true });
    }
    return out;
  };
  // 정산 집계 — 예약(host/pkg) + 견적(vendor accepted+paid)
  // PG 자동 분리정산 모델: 결제 시 PG가 수수료/공급자 정산금을 분리, 서비스 이용일 경과 후
  //  정산주기에 맞춰 공급자 계좌로 자동 입금(정산 완료). 이용 전 건은 정산 예정.
  // 쿠폰 부담주체별 분리정산 계산
  //  · 공급자 부담(provider): 할인된 최종 결제금액 기준으로 수수료·정산 (기본)
  //  · 플랫폼(와일리) 부담(platform): 공급자에게는 할인 전 정상가 기준 정산금 지급,
  //    할인액은 와일리 마케팅비로 차감(플랫폼 수취분에서 빠짐)
  OPS.splitCoupon = function (kind, paid, off, bearer, rate) {
    off = +off || 0;
    if (bearer === "platform" && off > 0) {
      const eff = paid + off;                  // 할인 전 정상가
      const sp = OPS.split(kind, eff, rate);   // 공급자 정산 = 정상가 기준
      return { gross: eff, provider: sp.provider, wylie: paid - sp.provider, marketing: off, kind };
    }
    const sp = OPS.split(kind, paid, rate);
    return { gross: sp.gross, provider: sp.provider, wylie: sp.wylie, marketing: 0, kind };
  };
  OPS.settlement = function (bookings, quotes, userMap) {
    const TODAY = OPS.dateStr(new Date());
    const totals = { gmv: 0, wylie: 0, host: 0, vendor: 0, pkg: 0, count: 0, settled: 0, scheduled: 0, marketing: 0 };
    const byProvider = {};
    const add = (id, role, name, sp, date) => {
      const b = byProvider[id] || (byProvider[id] = { id, role, name: name || id, gross: 0, provider: 0, wylie: 0, count: 0, settled: 0, scheduled: 0, marketing: 0 });
      b.gross += sp.gross; b.provider += sp.provider; b.wylie += sp.wylie; b.marketing += (sp.marketing || 0); b.count++;
      const done = (date || "") && date < TODAY; // 이용일 경과 → PG 자동정산 완료
      if (done) { b.settled += sp.provider; totals.settled += sp.provider; }
      else { b.scheduled += sp.provider; totals.scheduled += sp.provider; }
    };
    (bookings || []).forEach((b) => {
      // 취소건은 위약금(취소 수수료)만 매출로 유지 — 환불액은 정산 제외
      let coupon = true, effGross;
      if (b.status === "cancelled") { effGross = (b.refund && b.refund.penalty) || 0; coupon = false; }
      else if (b.status === "confirmed" && b.paid !== false) { effGross = b.total; }
      else return;
      if (!effGross) return;
      const kind = b.pkg ? "pkg" : "host";
      const payDate = OPS.payDateOf(b); // 결제일 기준 요율(과거 불변)
      const rate = kind === "pkg" ? OPS.rateFor("pkg", "pkg:" + b.pkgId, payDate) : OPS.rateFor("host", b.hostId, payDate);
      const sp = coupon ? OPS.splitCoupon(kind, b.total, b.couponOff, b.couponBearer, rate) : Object.assign({ marketing: 0 }, OPS.split(kind, effGross, rate));
      totals.gmv += effGross; totals.wylie += sp.wylie; totals.marketing += (sp.marketing || 0); totals.count++;
      if (kind === "pkg") { totals.pkg += sp.provider; add("wylie-pkg", "pkg", "와일리 기획전", sp, b.date); }
      else { totals.host += sp.provider; add(b.hostId, "host", (userMap && userMap[b.hostId]) || b.hostId, sp, b.date); }
    });
    (quotes || []).forEach((q) => {
      if (q.cat === "space") return; /* 공간 견적은 BOOKINGS(fromQuote)로 이미 집계 — 이중집계 방지 */
      // 취소(환불)건은 위약금만 매출로 유지
      let coupon = true, effGross;
      if (q.refunded) { effGross = +q.penalty || 0; coupon = false; }
      else if (q.status === "accepted" && q.paid) { effGross = +q.price || 0; }
      else return;
      if (!effGross) return;
      const rate = OPS.rateFor("vendor", q.vendorId, OPS.payDateOf(q));
      const sp = coupon ? OPS.splitCoupon("vendor", +q.price || 0, q.couponOff, q.couponBearer, rate) : Object.assign({ marketing: 0 }, OPS.split("vendor", effGross, rate));
      totals.gmv += effGross; totals.wylie += sp.wylie; totals.vendor += sp.provider; totals.marketing += (sp.marketing || 0); totals.count++;
      add(q.vendorId, "vendor", (userMap && userMap[q.vendorId]) || q.vendorId, sp, q.date);
    });
    return { totals, byProvider };
  };

  // 회원별 매출(고객 결제 총액)
  OPS.byMember = function (bookings) { const m = {}; (bookings || []).forEach((b) => { if (b.status !== "confirmed" || b.paid === false) return; const x = m[b.guestId] || (m[b.guestId] = { id: b.guestId, name: b.guestName, spent: 0, count: 0 }); x.spent += b.total; x.count++; }); return m; };

  // 월별 매출(최근 nMonths) — {label, gmv}
  OPS.monthly = function (bookings, nMonths) {
    nMonths = nMonths || 6; const now = new Date(); const buckets = [];
    for (let i = nMonths - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); buckets.push({ key: `${d.getFullYear()}-${OPS.pad(d.getMonth() + 1)}`, label: `${d.getMonth() + 1}월`, gmv: 0, count: 0 }); }
    const idx = {}; buckets.forEach((b, i) => (idx[b.key] = i));
    (bookings || []).forEach((b) => { if (b.status !== "confirmed" || b.paid === false) return; const k = (b.date || "").slice(0, 7); if (k in idx) { buckets[idx[k]].gmv += b.total; buckets[idx[k]].count++; } });
    return buckets;
  };
  // 일별 매출(최근 nDays)
  OPS.daily = function (bookings, nDays) {
    nDays = nDays || 14; const now = new Date(); now.setHours(0, 0, 0, 0); const buckets = [];
    for (let i = nDays - 1; i >= 0; i--) { const d = new Date(now.getTime() - i * 86400000); buckets.push({ key: OPS.dateStr(d), label: `${d.getMonth() + 1}/${d.getDate()}`, gmv: 0, count: 0 }); }
    const idx = {}; buckets.forEach((b, i) => (idx[b.key] = i));
    (bookings || []).forEach((b) => { if (b.status !== "confirmed" || b.paid === false) return; if (b.date in idx) { buckets[idx[b.date]].gmv += b.total; buckets[idx[b.date]].count++; } });
    return buckets;
  };
  // 인기 공간(예약 건수)
  OPS.topSpaces = function (bookings, k) { const m = {}; (bookings || []).forEach((b) => { if (b.pkg || b.status === "cancelled") return; const x = m[b.spaceId] || (m[b.spaceId] = { id: b.spaceId, name: b.spaceName, count: 0, gmv: 0 }); x.count++; x.gmv += b.total; }); return Object.values(m).sort((a, b) => b.count - a.count).slice(0, k || 8); };
  // 예약 전환 퍼널 (요청→확정, 취소율)
  OPS.funnel = function (bookings) {
    const all = (bookings || []).length;
    const confirmed = (bookings || []).filter((b) => b.status === "confirmed").length;
    const requested = (bookings || []).filter((b) => b.status === "requested").length;
    const cancelled = (bookings || []).filter((b) => b.status === "cancelled").length;
    return { all, confirmed, requested, cancelled, convRate: all ? Math.round(confirmed / all * 100) : 0, cancelRate: all ? Math.round(cancelled / all * 100) : 0 };
  };

  // ============================================================
  // 대규모 실데이터 생성 (5~7월 · 회원/예약/견적/맞춤/패키지/채팅/문의/정산)
  // ============================================================
  OPS.WIN = { start: Date.UTC(2026, 4, 1), end: Date.UTC(2026, 6, 31), today: Date.UTC(2026, 6, 16) };
  OPS.randDate = function (r) { const t = OPS.WIN.start + Math.floor(r() * (OPS.WIN.end - OPS.WIN.start)); const d = new Date(t); d.setHours(0, 0, 0, 0); return d; };
  OPS.GU = ["강남구", "서초구", "마포구", "성동구", "송파구", "용산구", "영등포구", "종로구", "광진구", "강서구"];
  OPS.EVENT = [
    "회사 워크숍을 진행합니다. 빔프로젝터와 다과가 필요해요.",
    "브라이덜 샤워 파티예요. 포토존 데코와 디저트 케이터링 부탁드려요.",
    "제품 촬영용 호리존 스튜디오와 조명 장비가 필요합니다.",
    "동호회 정기 모임 30명, 음향과 케이터링 문의드려요.",
    "브랜드 팝업스토어 오픈 행사입니다. 사인물과 현장 스냅 촬영 원해요.",
    "연말 송년회 40명, 루프탑 공간과 음향·조명 준비 부탁해요.",
    "세미나 강의 40인, 마이크·스크린·중식 도시락 필요합니다.",
    "유튜브 라이브 촬영이라 방송 장비와 조용한 공간을 찾습니다.",
    "돌잔치 가족 모임, 아기 의자와 케이터링·데코 문의해요.",
    "기업 신제품 발표회, 무대 현수막과 행사 기록 촬영 일괄 부탁드립니다.",
    "소규모 강연회 20명, 접이식 의자와 음향 마이크가 필요합니다.",
    "생일 파티룸 대관과 풍선 데코, 케이크 포함 견적 원해요.",
    "촬영 스튜디오 반나절 대관, 배경지와 조명 스탠드 렌탈합니다.",
    "동아리 발표회 무대 세팅과 빔프로젝터, 간단 다과 부탁드려요.",
    "웨딩 촬영 스냅작가와 소품, 2시간 촬영 문의드립니다.",
  ];
  OPS.CATNOTE = {
    space: "18시부터 3시간 이용 희망, 주차 가능 여부 알려주세요.",
    camera: "카메라 2대 + 조명 1세트, 사진작가 포함 여부 회신 부탁해요.",
    photo: "행사 2시간 스냅 촬영, 보정본 50장·당일 하이라이트 원해요.",
    catering: "성인 인분수 맞춰 뷔페, 알레르기 대응 가능한지 궁금합니다.",
    office: "접이식 테이블 5개·의자 30개 1일 대여합니다.",
    cleaning: "행사 후 청소 80㎡, 폐기물 수거 포함 견적 주세요.",
    repair: "조명 2개 교체·콘센트 점검 필요합니다.",
    interior: "포토존 2m 벽면 데코, 파스텔 톤으로 시공 부탁해요.",
    banner: "현수막 3x1m 2장 + 엑스배너 2개, 로고 파일 반영해주세요.",
    projector: "5000안시 빔 1대 + 100인치 스크린 + 음향 세트 필요해요.",
    goods: "기념 텀블러 50개 로고 각인, 행사 종료 후 증정용입니다.",
  };
  OPS.CHAT_M = ["안녕하세요, 예약 관련 문의드려요.", "혹시 주차 가능한가요?", "이용 시간 연장도 되나요?", "현장에 기본 준비물이 있을까요?", "입금 완료했습니다, 확인 부탁드려요.", "네 감사합니다, 잘 부탁드립니다!", "당일 몇 시부터 입장 가능할까요?", "추가 인원 2명 더 가능한가요?"];
  OPS.CHAT_P = ["안녕하세요! 문의 감사합니다 😊", "네, 주차는 3대까지 가능합니다.", "시간 연장은 시간당 추가요금이 있어요.", "기본 세팅은 모두 준비되어 있습니다.", "입금 확인했습니다, 예약 확정해드릴게요.", "네, 당일 현장에서 뵙겠습니다!", "입장은 예약 30분 전부터 가능합니다.", "추가 인원 가능합니다, 인당 소액 추가돼요."];
  OPS.INQ = [
    { s: "정산은 언제 지급되나요?", t: "이용 완료 후 정산금이 지급되기까지 며칠 걸리는지 궁금합니다." },
    { s: "세금계산서 발행 문의", t: "사업자 대상 세금계산서 발행이 가능한지 알고 싶어요." },
    { s: "결제일 변경 가능할까요?", t: "예약 결제일을 다음 주로 변경할 수 있을까요?" },
    { s: "정산 계좌 변경 요청", t: "등록한 정산 계좌를 새 계좌로 바꾸고 싶습니다. 절차 안내 부탁드려요." },
    { s: "이용 시간 연장 방법", t: "현장에서 이용 시간을 1시간 연장하려면 어떻게 하나요?" },
    { s: "취소·환불 규정 문의", t: "예약 취소 시 환불 규정이 어떻게 되는지 확인하고 싶어요." },
    { s: "부가세 포함 여부", t: "화면에 표시된 금액이 부가세 포함 금액인가요?" },
    { s: "현장 카드결제 가능 여부", t: "온라인 결제 외에 현장 카드 결제도 가능한가요?" },
    { s: "플랫폼 수수료율 문의", t: "정산 시 플랫폼 수수료율이 몇 %인지 알려주세요." },
    { s: "지급 지연 문의", t: "지난달 이용 건 정산이 아직 입금되지 않았습니다. 확인 부탁드려요." },
    { s: "입·퇴실 안내 요청", t: "입실/퇴실 방법과 준비물 안내 부탁드립니다." },
    { s: "정산 명세서 요청", t: "이번 달 정산 명세서를 이메일로 받아볼 수 있을까요?" },
  ];
  OPS.INQ_ANS = "안녕하세요, 공간잇다 운영팀입니다. 문의 주셔서 감사합니다. 확인 후 순차 처리되며, 정산은 이용 완료 후 영업일 3~5일 내 등록 계좌로 지급됩니다. 추가 문의는 언제든 남겨주세요!";

  // 회원 328명 등 대량 생성 — 이름 중복은 지역/번호로 구분
  OPS.genMembers = function (n, seed) {
    const r = OPS.rng(seed || 7), out = [];
    for (let i = 0; i < n; i++) { const nm = OPS.NAMES[i % OPS.NAMES.length]; out.push({ userId: "m" + OPS.pad(i + 1), name: nm, nick: nm, role: "guest", email: `user${i + 1}@demo.kr`, pw: "1234", phone: "010-" + OPS.pad(1000 + Math.floor(r() * 8999)) + "-" + OPS.pad(1000 + Math.floor(r() * 8999)), _mock: true }); }
    return out;
  };

  // 종합 데이터셋
  OPS.genAll = function (ctx, seed) {
    seed = seed || (Date.now() & 0x7fffff) || 1;
    const r = OPS.rng(seed), pick = (a) => a[Math.floor(r() * a.length)];
    const spaces = (ctx.spaces || []).filter((s) => !s.blinded && !s.rejected);
    const pkgs = ctx.pkgs || [], vendors = ctx.vendors || [], members = ctx.members || [];
    const today = OPS.WIN.today;
    const statusFor = (dt) => { const past = dt.getTime() < today; if (past) return r() < 0.1 ? "cancelled" : "confirmed"; return r() < 0.35 ? "requested" : "confirmed"; };
    const bookings = [], requests = [], quotes = [], chat = {}, chatmeta = {}, inquiries = [], points = [], out = { bookings, requests, quotes, chat, chatmeta, inquiries, points };
    let bc = 0, rc = 0, qc = 0;

    // 1) 공간 예약 (host) — 회원이 직접 예약한 것처럼 detail 포함
    const nBook = ctx.nBook || 240;
    for (let i = 0; i < nBook; i++) {
      const s = pick(spaces), m = pick(members); if (!s || !m) break;
      const d = OPS.randDate(r), start = 9 + Math.floor(r() * 10), hours = 1 + Math.floor(r() * 5);
      const cap = Math.max(2, Math.min(s.capacity || 10, 30)), guests = 1 + Math.floor(r() * cap);
      const unit = s.price || 20000, total = Math.round(unit * hours * (1 + CUSTOMER_FEE));
      const status = statusFor(d), paid = status !== "cancelled";
      const id = "mb" + (bc++) + "_" + seed;
      bookings.push({ id, spaceId: s.id, spaceName: s.name, hostId: s.ownerId || "host", guestId: m.userId, guestName: m.name, guestPhone: m.phone, detail: pick(OPS.EVENT), price: unit, date: OPS.dateStr(d), start, hours, guests, total, status, paid, ts: d.getTime() - Math.floor(r() * 6 * 86400000), _mock: true });
    }
    // 2) 견적/맞춤 요청 (회원 작성) + 파트너 입찰
    const nReq = ctx.nReq || 140;
    for (let i = 0; i < nReq; i++) {
      const m = pick(members); if (!m) break;
      const d = OPS.randDate(r);
      const wantSpace = r() < 0.5;
      const svcPool = vendors.length ? [...new Set(vendors.map((v) => (v.serviceCats || [])[0]).filter(Boolean))] : ["camera", "catering"];
      const nCat = 1 + Math.floor(r() * 2);
      const svcCats = []; for (let k = 0; k < nCat; k++) { const c = pick(svcPool); if (c && !svcCats.includes(c)) svcCats.push(c); }
      const cats = (wantSpace ? ["space"] : []).concat(svcCats); if (!cats.length) cats.push("catering");
      const direct = r() < 0.3 && vendors.length; // 맞춤(업체 직접) 요청
      const dv = direct ? pick(vendors) : null;
      const catNotes = {}; cats.forEach((c) => { if (r() < 0.7) catNotes[c] = OPS.CATNOTE[c] || "세부 요청사항입니다."; });
      const rid = "mr" + (rc++) + "_" + seed;
      const budgetFlex = r() < 0.2;
      const req = { id: rid, memberId: m.userId, memberName: m.name, memberPhone: m.phone, date: OPS.dateStr(d), region: "서울", capacity: 5 + Math.floor(r() * 60), parking: Math.floor(r() * 6), cats: direct ? (dv.serviceCats || ["camera"]) : cats, detail: pick(OPS.EVENT), catNotes, budget: budgetFlex ? 0 : (2 + Math.floor(r() * 18)) * 100000, budgetFlex, deadline: OPS.dateStr(d), status: "open", ts: d.getTime() - Math.floor(r() * 8 * 86400000), _mock: true };
      if (direct) req.directVendorId = dv.userId;
      requests.push(req);
      // 입찰: 관련 파트너 여러 곳
      const bidCats = req.cats.filter((c) => c !== "space");
      bidCats.forEach((c) => {
        const cand = vendors.filter((v) => (v.serviceCats || []).includes(c));
        const nBid = direct ? 1 : Math.min(cand.length, 1 + Math.floor(r() * 4));
        const chosen = []; for (let k = 0; k < nBid; k++) { const v = direct ? dv : pick(cand); if (v && chosen.indexOf(v.userId) < 0) chosen.push(v.userId); }
        chosen.forEach((vid, idx2) => {
          const v = vendors.find((x) => x.userId === vid); if (!v) return;
          const price = (3 + Math.floor(r() * 28)) * 10000;
          const accepted = idx2 === 0 && r() < 0.55; // 최저가/첫 입찰 일부 선정
          const paid = accepted && r() < 0.85;
          quotes.push({ id: "mq" + (qc++) + "_" + seed, requestId: rid, vendorId: v.userId, vendorName: v.nick || v.name, cat: c, price, status: accepted ? "accepted" : "sent", paid, date: req.date, ts: req.ts + 86400000 + Math.floor(r() * 3 * 86400000), _mock: true });
        });
      });
    }
    // 3) 패키지 구매
    const nPkg = ctx.nPkg || 40;
    for (let i = 0; i < nPkg && pkgs.length; i++) {
      const p = pick(pkgs), m = pick(members), d = OPS.randDate(r), status = statusFor(d);
      bookings.push({ id: "mp" + i + "_" + seed, pkg: true, pkgId: p.id, spaceName: p.title, hostId: "wylie", guestId: m.userId, guestName: m.name, guestPhone: m.phone, detail: pick(OPS.EVENT), price: p.price, date: OPS.dateStr(d), start: null, hours: null, guests: p.cap, total: p.price, status, paid: status !== "cancelled", ts: d.getTime(), _mock: true });
    }
    // 4) 채팅 (회원↔호스트/파트너) — 확정 예약 일부
    const chatBk = bookings.filter((b) => b.status === "confirmed" && !b.pkg).slice(0, ctx.nChat || 60);
    chatBk.forEach((b) => {
      const msgs = []; const turns = 2 + Math.floor(r() * 3);
      let t0 = b.ts;
      for (let k = 0; k < turns; k++) {
        t0 += 3600000 + Math.floor(r() * 6 * 3600000);
        msgs.push({ from: b.guestId, text: OPS.CHAT_M[(k * 2) % OPS.CHAT_M.length], ts: t0 });
        t0 += 1800000 + Math.floor(r() * 3 * 3600000);
        msgs.push({ from: b.hostId, text: OPS.CHAT_P[(k * 2) % OPS.CHAT_P.length], ts: t0 });
      }
      chat[b.id] = msgs;
      chatmeta[b.id] = { title: b.spaceName, hostId: b.hostId, guestId: b.guestId };
    });
    // 5) 1:1 문의 (회원·파트너 → 관리자), 일부 답변완료
    const askers = members.slice(0, 12).concat(vendors.slice(0, 10));
    (ctx.nInq ? OPS.INQ.concat(OPS.INQ).slice(0, ctx.nInq) : OPS.INQ).forEach((q, i) => {
      const u = askers[i % askers.length]; if (!u) return;
      const answered = r() < 0.55;
      const ts = OPS.WIN.today - Math.floor(r() * 40 * 86400000);
      inquiries.push({ id: "miq" + i + "_" + seed, userId: u.userId, name: u.nick || u.name, subject: q.s, text: q.t, status: answered ? "answered" : "received", answer: answered ? OPS.INQ_ANS : "", ts, answeredTs: answered ? ts + 86400000 : 0, _mock: true });
    });
    // 6) 포인트 (신규가입 + 이용 적립)
    members.forEach((m, i) => { points.push({ id: "mpt" + i + "_" + seed, userId: m.userId, delta: 3000, reason: "신규가입 축하 포인트", expires: "", ts: OPS.WIN.today - Math.floor(r() * 60 * 86400000), _mock: true }); });
    OPS.byMember(bookings) && Object.values(OPS.byMember(bookings)).slice(0, 60).forEach((mm, i) => { points.push({ id: "mpu" + i + "_" + seed, userId: mm.id, delta: Math.round(mm.spent * 0.01 / 100) * 100, reason: "이용 적립(1%)", expires: "", ts: OPS.WIN.today - Math.floor(r() * 30 * 86400000), _mock: true }); });

    return out;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = OPS; else root.OPS = OPS;
})(typeof window !== "undefined" ? window : globalThis);
