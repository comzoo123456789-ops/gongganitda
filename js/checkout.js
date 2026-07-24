// ============================================================
// 공간잇다 — 결제 페이지 (건바이건·부분 결제 지원)
// ============================================================
const $ = (s) => document.querySelector(s);
const won = (n) => (+n || 0).toLocaleString("ko-KR");
let _toastT; function toast(m) { const t = document.getElementById("toast"); if (!t) return; t.textContent = m; t.hidden = false; clearTimeout(_toastT); _toastT = setTimeout(() => (t.hidden = true), 2400); }
const auth = window.AUTH.get();
const rid = new URLSearchParams(location.search).get("req");
const r = window.REQUESTS.find(rid);

function stepBar(cur) {
  const L = ["요청", "견적", "확정", "결제", "이용"];
  return `<div class="steps steps--lg">${L.map((l, i) => `<div class="step${i < cur ? " is-done" : ""}${i === cur ? " is-cur" : ""}"><span class="step__dot">${i < cur ? "✓" : i + 1}</span><span class="step__l">${l}</span></div>`).join("")}</div>`;
}
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });

if (!r || r.memberId !== auth.userId) {
  $("#coMain").innerHTML = `<div class="checkout__wrap"><p class="mp-empty">결제할 요청을 찾을 수 없어요. <a href="mypage.html?tab=rfp" style="color:var(--accent);font-weight:700">마이페이지로</a></p></div>`;
} else {
  render();
}

// D-Day 환불 정책 타임라인 (공간 대관 표준 5구간) — 결제 전 직관적 시각화
function refundTimeline(dateStr) {
  const days = window.OPS ? window.OPS.daysBefore(dateStr, window.OPS.dateStr(new Date())) : 99;
  const tiers = [{ d: "D-7↑", pct: 100 }, { d: "D-5~6", pct: 70 }, { d: "D-3~4", pct: 50 }, { d: "D-1~2", pct: 30 }, { d: "당일", pct: 0 }];
  const idx = days >= 7 ? 0 : days >= 5 ? 1 : days >= 3 ? 2 : days >= 1 ? 3 : 4;
  const cur = tiers[idx];
  return `<div class="co-refund">
    <div class="co-refund__h">${iconSVG("shield", 13)} 취소 시 환불 정책 <span>${days > 0 ? "이용 D-" + days : "이용 당일"}</span></div>
    <div class="co-refund__tl">${tiers.map((t, i) => `<div class="co-refund__step${i === idx ? " is-now" : ""}${i < idx ? " is-past" : ""}"><b>${t.pct}%</b><span>${t.d}</span></div>`).join("")}</div>
    <p class="co-refund__now">지금 취소하면 <b>${cur.pct}% 환불</b>${cur.pct < 100 ? ` · 위약금 ${100 - cur.pct}%` : ""} <a href="#" data-legal="refund">정책 전문</a></p>
  </div>`;
}
function accItems() {
  return window.QUOTES.forReq(r.id).filter((q) => q.status === "accepted").map((q) => ({ id: q.id, cat: q.cat, label: reqCatById(q.cat).label, name: q.cat === "space" ? (q.spaceName || "공간") : q.vendorName, price: +q.price || 0, paid: !!q.paid, vendorId: q.vendorId }));
}

function render() {
  const items = accItems();
  const allPaid = items.length > 0 && items.every((x) => x.paid);
  const unpaid = items.filter((x) => !x.paid);

  if (!items.length) {
    $("#coMain").innerHTML = `<div class="checkout__wrap">${stepBar(2)}<p class="mp-empty">아직 확정한 견적이 없어요. 견적을 선택·확정한 뒤 결제할 수 있어요. <a href="mypage.html?tab=rfp" style="color:var(--accent);font-weight:700">돌아가기</a></p></div>`;
    return;
  }
  if (allPaid) {
    $("#coMain").innerHTML = `<div class="checkout__wrap">${stepBar(4)}<div class="co-done"><div class="co-done__ic">✓</div><h1>모든 항목 결제 완료</h1><p>이용일 ${r.date}에 맞춰 파트너가 준비합니다.</p><a href="mypage.html?tab=rfp" class="btn btn--accent btn--lg">마이페이지로</a></div></div>`;
    return;
  }

  $("#coMain").innerHTML = `<div class="checkout__wrap">
    ${stepBar(3)}
    <h1 class="checkout__title">결제</h1>
    <p class="checkout__sub">${r.directVendorId ? iconSVG("target", 14) + " " + (r.directVendorName || "파트너") + " 직접 견적" : iconSVG("wrench", 14) + " 견적 요청 확정 견적"} · ${r.region} · ${r.date}</p>
    <p class="co-help">${iconSVG("light", 14)} 항목별로 골라서 <b>부분 결제</b>할 수 있어요. 필요한 것만 먼저 결제하세요.</p>
    <div class="co-grid">
      <section class="co-order">
        <h2 class="co-h">확정 항목 <span class="co-cnt">${items.filter((x) => x.paid).length}/${items.length} 결제됨</span></h2>
        ${items.map((x) => `<label class="co-item ${x.paid ? "is-paid" : ""}">
          <input type="checkbox" class="co-check" value="${x.id}" ${x.paid ? "checked disabled" : "checked"} />
          <span class="co-item__box"></span>
          <div class="co-item__info"><b>${x.label}</b><span>${x.name}</span></div>
          <em class="co-item__price">${won(x.price)}원${x.paid ? ` <b class="co-paid">결제완료</b>` : ""}</em>
        </label>`).join("")}
      </section>
      <aside class="co-pay">
        <h2 class="co-h">결제</h2>
        <div class="co-receipt" id="coItemized"></div>
        <div class="co-sum">
          <div class="co-sum__row"><span>선택 항목 합계</span><span id="coSub">0원</span></div>
          <div class="co-sum__row"><span>서비스 수수료 <em style="color:#059669;font-style:normal">무료</em></span><span id="coFee">0원</span></div>
          <div class="co-sum__total"><span>결제금액</span><b id="coTotal">0원</b></div>
        </div>
        ${refundTimeline(r.date)}
        <label class="co-method"><input type="radio" name="pm" value="card" checked /><span>${iconSVG("card", 15)} 신용/체크카드</span></label>
        <label class="co-method"><input type="radio" name="pm" value="kakao" /><span>${iconSVG("chat", 15)} 카카오페이</span></label>
        <div class="co-agree" id="coAgree">
          <label class="co-agree__all"><input type="checkbox" id="agAll" /><span><b>전체 동의</b></span></label>
          <label class="co-agree__it"><input type="checkbox" class="ag-req" id="agRefund" /><span><b>[필수]</b> 취소 및 환불 규정 동의 <a href="#" data-legal="refund">자세히 보기</a></span></label>
          <label class="co-agree__it"><input type="checkbox" class="ag-req" id="agOrder" /><span><b>[필수]</b> 주문 내용 및 결제 조건 확인 동의 <a href="#" data-legal="order">자세히 보기</a></span></label>
          <label class="co-agree__it"><input type="checkbox" class="ag-req" id="agPii" /><span><b>[필수]</b> 개인정보 제3자 제공 및 PG 결제대행 위탁 동의 <a href="#" data-legal="pg">자세히 보기</a></span></label>
          <p class="co-broker">${iconSVG("shield", 13)} '공간잇다'는 <b>통신판매중개자</b>로서 거래 당사자가 아니며, 상품·서비스에 대한 책임은 판매자(파트너)에게 있습니다.</p>
        </div>
        <button class="btn btn--accent btn--lg btn--block" id="coPay" style="margin-top:10px">결제하기</button>
        <p class="co-note">데모 결제 — 실제로 청구되지 않습니다. 결제한 항목만 확정 진행됩니다.</p>
      </aside>
    </div>
  </div>`;

  const reqEls = () => [...document.querySelectorAll(".ag-req")];
  const consentOk = () => reqEls().every((c) => c.checked);
  const recalc = () => {
    const checked = [...document.querySelectorAll(".co-check:not(:disabled):checked")];
    const chosen = checked.map((el) => items.find((x) => x.id === el.value)).filter(Boolean);
    const sub = chosen.reduce((a, it) => a + it.price, 0);
    const fee = Math.round(sub * (window.CUSTOMER_FEE || 0));
    // 투명 통합 세부 영수증 — 결제는 1회, 항목별 내역 공개
    const box = $("#coItemized");
    if (box) box.innerHTML = chosen.length
      ? `<div class="co-receipt__h">${iconSVG("doc", 13)} 결제 상세 내역</div>${chosen.map((it) => `<div class="co-receipt__row"><span>${it.label} · <em>${it.name}</em></span><b>${won(it.price)}원</b></div>`).join("")}${chosen.length > 1 ? `<div class="co-receipt__sum">${chosen.length}개 항목 합계 <b>${won(sub)}원</b></div>` : ""}`
      : `<p class="co-receipt__empty">결제할 항목을 선택하세요.</p>`;
    $("#coSub").textContent = won(sub) + "원";
    $("#coFee").textContent = won(fee) + "원";
    $("#coTotal").textContent = won(sub + fee) + "원";
    const ok = consentOk();
    $("#coPay").textContent = !checked.length ? "항목을 선택하세요" : (!ok ? "필수 약관에 동의해 주세요" : `${won(sub + fee)}원 결제하기 (${checked.length}건)`);
    $("#coPay").disabled = checked.length === 0 || !ok;
    return checked;
  };
  document.querySelectorAll(".co-check").forEach((c) => c.addEventListener("change", recalc));
  // 전체 동의 ↔ 개별 필수 동의 연동
  const agAll = $("#agAll");
  if (agAll) agAll.addEventListener("change", () => { reqEls().forEach((c) => (c.checked = agAll.checked)); recalc(); });
  reqEls().forEach((c) => c.addEventListener("change", () => { if (agAll) agAll.checked = consentOk(); recalc(); }));
  // 약관 자세히 보기는 [data-legal] 전역 핸들러(auth.js)가 처리 — 환불(refund)·제3자/PG(pg)
  recalc();

  $("#coPay").addEventListener("click", () => {
    const checked = [...document.querySelectorAll(".co-check:not(:disabled):checked")];
    if (!checked.length) return;
    if (!consentOk()) { toast("필수 약관에 모두 동의해 주세요"); return; }
    if (window.CONSENT) window.CONSENT.record(r.memberId, "3rdparty:booking", "요청 " + r.id);
    // 이번에 함께 결제하는 항목 = 하나의 주문(결제 1회 = 승인번호 1개)
    const orderId = "od" + Date.now();
    const paidAt = Date.now();
    const orderTotal = checked.reduce((sum, el) => { const it = items.find((x) => x.id === el.value); return sum + (it ? it.price : 0); }, 0);
    checked.forEach((el) => {
      const it = items.find((x) => x.id === el.value);
      window.QUOTES.update(el.value, { paid: true, paidAt, orderId, orderTotal, piiConsent: { agreed: true, ts: paidAt } });
      // 공간 견적이면 연동된 예약(fromQuote)도 결제완료로 패치 (같은 주문에 귀속)
      if (it.cat === "space") { const bk = window.BOOKINGS.list().find((b) => b.fromQuote === el.value); if (bk) window.BOOKINGS.update(bk.id, { paid: true, status: "confirmed", orderId, orderTotal, paidAt }); }
      window.NOTIF.add({ forUser: it.vendorId, title: "결제가 완료됐어요", sub: `${it.label} · ${won(it.price)}원 · 이용일 ${r.date}`, link: it.cat === "space" ? "mypage.html?tab=reqs" : "mypage.html?tab=vquote" });
    });
    // 모든 확정 항목이 결제되면 요청도 완료 표시
    const after = window.QUOTES.forReq(r.id).filter((q) => q.status === "accepted");
    if (after.length && after.every((q) => q.paid)) window.REQUESTS.update(r.id, { paid: true, paidAt: Date.now() });
    render(); // 남은 미결제 항목이 있으면 이어서 결제 가능
  });
}
