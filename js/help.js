// ============================================================
// 공간잇다 — 이용 안내 (이용 방법 · 예약 안내 · FAQ + 1:1 문의)
// ============================================================
const $ = (s) => document.querySelector(s);
const ic = (typeof iconSVG === "function") ? iconSVG : () => "";
let toastT; function toast(m) { const t = $("#toast"); if (!t) return; t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2600); }

// ---------- 이용 방법 ----------
function guideHTML() {
  const paths = [
    ["pin", "공간 바로 예약", "마음에 드는 공간을 찾아 날짜·시간·인원을 고르고 바로 예약해요. 자동 수락 공간은 결제 즉시 확정됩니다.", "search.html", "공간 찾기"],
    ["doc", "통합 견적 요청", "필요한 것(공간 + 촬영·케이터링·렌탈 등)을 한 번에 등록하면, 여러 파트너가 견적을 보내와 경쟁해요. 카테고리별로 비교하고 고르기만 하면 끝.", "request.html", "견적 요청하기"],
    ["studio", "맞춤 업체 직접 견적", "원하는 파트너를 직접 골라 1:1로 견적을 요청해요. 업체의 대여 품목·후기·시작가를 보고 결정할 수 있어요.", "vendors.html", "맞춤 업체 보기"],
    ["goods", "패키지 예약", "공간 + 장비 + 케이터링이 미리 묶인 기획전 상품을 한 번에 예약해요. 준비가 처음이라면 가장 간편해요.", "packages.html", "패키지 둘러보기"],
  ];
  const steps = [
    ["1", "탐색하거나 요청하기", "공간을 직접 찾거나, 필요한 것을 한 번에 견적 요청해요."],
    ["2", "비교하고 선택하기", "가격·후기·제안을 비교해 마음에 드는 곳만 골라요."],
    ["3", "결제하고 이용하기", "선택한 것만 결제하면 끝. 이용일에 맞춰 준비됩니다."],
  ];
  return `
  <section class="help-sec">
    <div class="help-intro">
      <h2 class="help-h2">공간 대관부터 장비 렌탈까지, 한 번에</h2>
      <p class="help-lead">공간잇다는 <b>공간 대관</b>과 <b>촬영·케이터링·렌탈 등 부대서비스</b>를 한 곳에서 찾고 비교·예약하는 원스톱 마켓플레이스예요. 여러 곳에 전화 돌릴 필요 없이, 요청 한 번이면 파트너들이 견적을 보내옵니다.</p>
    </div>

    <h3 class="help-h3">이용 경로 4가지</h3>
    <div class="hway-grid">
      ${paths.map((p) => `<div class="hway"><span class="hway__ic">${ic(p[0], 22)}</span><b class="hway__t">${p[1]}</b><p class="hway__d">${p[2]}</p><a class="hway__cta" href="${p[3]}">${p[4]} →</a></div>`).join("")}
    </div>

    <h3 class="help-h3">이렇게 진행돼요</h3>
    <div class="hstep-grid">
      ${steps.map((s) => `<div class="hstep"><span class="hstep__n">${s[0]}</span><b>${s[1]}</b><span class="hstep__d">${s[2]}</span></div>`).join("")}
    </div>

    <div class="help-note">
      <b>${ic("user", 16)} 처음이신가요?</b>
      <p>회원가입만 하면 바로 이용할 수 있고, <b>가입 축하 포인트 3,000P</b>를 드려요. 공간·서비스 탐색은 로그인 없이도 가능하지만, 예약·견적 요청·채팅은 <b>일반 회원(게스트) 로그인</b> 후 이용할 수 있어요.</p>
      <div class="help-note__cta"><a class="btn btn--accent btn--sm" href="signup.html">회원가입</a><a class="btn btn--outline btn--sm" href="login.html">로그인</a></div>
    </div>
  </section>`;
}

// ---------- 예약 안내 ----------
function bookingHTML() {
  const A = [
    ["공간을 찾아요", "‘공간 찾기’에서 지역·유형·인원·가격으로 필터링하거나 키워드로 검색해요."],
    ["날짜·시간·인원을 골라요", "공간 상세 페이지에서 이용 날짜와 시간대, 인원을 선택하면 예상 금액이 계산돼요."],
    ["‘예약 진행’을 눌러요", "예약 진행 페이지로 이동해 연락처를 입력해요."],
    ["부대서비스도 함께 (선택)", "촬영·케이터링·렌탈 등이 필요하면 같은 화면에서 체크해 견적도 함께 요청할 수 있어요."],
    ["결제하고 확정", "자동 수락 공간은 결제 즉시 확정 + 호스트 이용 안내가 도착해요. 그 외에는 호스트 승인 후 확정됩니다."],
  ];
  const B = [
    ["‘견적 요청’ 페이지로", "기본 정보(이용 날짜·지역·인원·예산)를 입력해요."],
    ["필요한 것을 선택", "공간 대관 여부 + 부대서비스 카테고리를 고르고, 카테고리별로 <b>필요한 품목을 체크</b>하고 요청사항을 적어요."],
    ["요청 전송", "요청을 본 여러 파트너가 견적서를 보내옵니다. 기다리기만 하면 견적이 쌓여요."],
    ["비교하고 선택", "마이페이지 <b>‘견적 요청’ 탭</b>에서 카테고리별 최저가·평균가·후기를 비교하고 마음에 드는 곳만 선택해요."],
    ["결제", "선택한 항목만 결제하면 끝. 원활한 준비를 위해 <b>이용 3일 전까지</b> 선정·결제를 권장해요."],
  ];
  return `
  <section class="help-sec">
    <h3 class="help-h3">A. 공간 바로 예약</h3>
    <ol class="hflow">${A.map((s, i) => `<li><span class="hflow__n">${i + 1}</span><div><b>${s[0]}</b><p>${s[1]}</p></div></li>`).join("")}</ol>

    <h3 class="help-h3">B. 통합 견적 요청</h3>
    <ol class="hflow">${B.map((s, i) => `<li><span class="hflow__n">${i + 1}</span><div><b>${s[0]}</b><p>${s[1]}</p></div></li>`).join("")}</ol>

    <h3 class="help-h3">C. 맞춤 업체에 직접 견적</h3>
    <p class="help-p">‘맞춤 업체’에서 업체의 대여 품목·후기·시작가를 보고, 마음에 드는 파트너의 <b>‘견적 요청하기’</b>로 이용 날짜·필요 품목·요청사항을 바로 보낼 수 있어요.</p>

    <div class="help-cards">
      <div class="help-card"><b>${ic("bolt", 16)} 자동 수락 vs 승인 대기</b><p><b>자동 수락</b> 공간은 결제하면 바로 확정되고, 호스트가 미리 등록해 둔 이용 안내(출입 방법·주차 등)가 채팅·알림으로 전달돼요. 그 외 공간은 <b>호스트 승인</b> 후 확정됩니다.</p></div>
      <div class="help-card"><b>${ic("won", 16)} 결제 · 수수료</b><p>회원(게스트)에게는 <b>별도 서비스 수수료가 없어요(0%)</b> — 표시 금액이 곧 결제 금액입니다. 결제 화면에서 쿠폰 코드를 입력하면 할인이 적용됩니다. (공급자 정산 수수료: 호스트·파트너·패키지 <b>일괄 5%</b>)</p></div>
      <div class="help-card"><b>${ic("clock", 16)} 취소 · 환불</b><p>기본 규정은 <b>이용 3일 전까지 100% 환불, 1~2일 전 50%, 당일 환불 불가</b>예요. 단, 공간·서비스별로 파트너가 정한 환불 정책이 우선하며 각 상세 페이지에 표기됩니다. <a href="#" data-legal="refund" style="color:var(--accent);font-weight:600">취소·환불 정책 전문 →</a></p></div>
      <div class="help-card"><b>${ic("home", 16)} 청소 보증금</b><p>일부 공간은 청소 보증금이 있어요. 예약 확정 후 안내되는 호스트 계좌로 입금하며, <b>파손·미정리가 없으면 이용 후 환불</b>됩니다.</p></div>
      <div class="help-card"><b>${ic("doc", 16)} 실시간 채팅</b><p>예약·견적 건마다 호스트·파트너와 <b>1:1 실시간 채팅</b>으로 세부 사항(도착·셋팅·수량 등)을 조율할 수 있어요. 우측 하단 말풍선에서 확인하세요.</p></div>
      <div class="help-card"><b>${ic("star", 16)} 포인트 · 쿠폰 · 후기</b><p>가입 시 3,000P 적립, 보유 쿠폰은 마이페이지에서 확인하고 결제 시 코드로 사용해요. 이용 후 남긴 후기는 다른 회원에게 큰 도움이 됩니다.</p></div>
    </div>
  </section>`;
}

// ---------- FAQ ----------
const FAQ_CATS = ["전체", "예약·결제", "견적 요청", "맞춤 업체", "취소·환불", "회원·포인트", "호스트·파트너"];
const FAQS = [
  ["예약·결제", "예약은 어떻게 확정되나요?", "‘자동 수락’으로 설정된 공간은 결제하는 즉시 확정되고, 그렇지 않은 공간은 호스트가 요청을 확인해 수락하면 확정됩니다. 확정되면 알림으로 안내드려요."],
  ["예약·결제", "결제 금액에 수수료가 포함되나요?", "회원(게스트)에게는 별도 서비스 수수료가 없습니다(0%). 표시되는 총 결제금액이 실제 결제 금액이며, 숨은 비용은 없어요."],
  ["예약·결제", "부대서비스(촬영·케이터링 등)도 함께 예약할 수 있나요?", "네. 공간 예약을 진행하면서 같은 화면에서 필요한 부대서비스를 체크하면 파트너들에게 견적 요청이 함께 전송됩니다. 공간과 서비스를 따로 알아볼 필요가 없어요."],
  ["견적 요청", "견적 요청과 바로 예약은 뭐가 다른가요?", "‘바로 예약’은 특정 공간을 날짜·시간을 정해 즉시 예약하는 방식이고, ‘견적 요청’은 필요한 것을 한 번에 등록해 여러 파트너의 견적을 받아 비교·선택하는 방식이에요. 최저가로 준비하고 싶다면 견적 요청을 추천해요."],
  ["견적 요청", "견적은 얼마나 기다려야 하나요?", "요청을 등록하면 조건에 맞는 파트너들에게 알림이 가고, 순차적으로 견적서가 도착합니다. 마이페이지 ‘견적 요청’ 탭에서 실시간으로 쌓이는 견적을 확인할 수 있어요. 원활한 준비를 위해 이용 3일 전까지 선정·결제를 권장합니다."],
  ["견적 요청", "받은 견적은 어디서 비교하나요?", "마이페이지 ‘견적 요청’ 탭에서 카테고리별로 최저가·평균가·후기를 한눈에 비교하고, 마음에 드는 곳만 선택해 결제할 수 있어요. 선택하지 않은 견적은 결제되지 않습니다."],
  ["맞춤 업체", "맞춤 업체는 어떻게 이용하나요?", "‘맞춤 업체’에서 카테고리·지역으로 파트너를 찾고, 업체 상세에서 대여 품목·후기·대여 시작가를 확인한 뒤 ‘견적 요청하기’로 직접 견적을 요청하거나 1:1 문의로 대화를 시작할 수 있어요."],
  ["맞춤 업체", "업체와 직접 연락할 수 있나요?", "네. 업체 상세의 ‘1:1 문의’로 채팅을 시작하면 파트너와 실시간으로 대화하며 품목·수량·일정을 조율할 수 있어요. (연락처는 회원에게만 공개됩니다.)"],
  ["취소·환불", "예약을 취소하면 환불은 어떻게 되나요?", "기본 규정은 이용 3일 전까지 100%, 1~2일 전 50%, 당일 환불 불가입니다. 다만 공간·서비스별로 호스트/파트너가 정한 환불 정책이 우선 적용되며, 각 상세 페이지에서 확인할 수 있어요."],
  ["취소·환불", "청소 보증금은 언제 돌려받나요?", "보증금이 있는 공간은 예약 확정 후 안내되는 호스트 계좌로 입금하고, 이용 후 파손·미정리 등 문제가 없으면 환불받습니다. 자세한 조건은 호스트와 채팅으로 확인해 주세요."],
  ["회원·포인트", "회원가입 혜택이 있나요?", "가입하면 축하 포인트 3,000P를 드려요. 포인트와 보유 쿠폰은 마이페이지에서 확인할 수 있고, 결제 화면에서 사용할 수 있어요."],
  ["회원·포인트", "쿠폰은 어떻게 사용하나요?", "마이페이지 상단에서 보유 쿠폰 코드를 확인하고, 공간/패키지 결제 화면의 쿠폰 입력란에 코드를 넣으면 할인이 적용됩니다."],
  ["회원·포인트", "예약·견적 내역은 어디서 보나요?", "마이페이지의 ‘예약 내역’·‘견적 요청’ 탭에서 진행 상황을 확인하고, 채팅으로 후속 조율을 할 수 있어요."],
  ["호스트·파트너", "공간을 빌려주거나 서비스를 제공하려면?", "상단 ‘사업자 등록’에서 사업자 정보를 등록하면 호스트(공간)·파트너(부대서비스)로 활동할 수 있어요. 승인 후 공간 등록, 견적 입찰, 정산까지 마이페이지에서 관리합니다."],
  ["호스트·파트너", "정산은 어떻게 이뤄지나요?", "이용이 완료된 건에 대해 플랫폼 수수료(호스트·파트너·패키지 일괄 5%)를 제외한 금액을 정산받아요. 마이페이지 ‘정산’ 탭에서 정산 예정액과 지급 상태, 계좌 정보를 관리할 수 있어요."],
];

function faqHTML() {
  const chips = FAQ_CATS.map((c, i) => `<button type="button" class="faq-chip${i === 0 ? " is-on" : ""}" data-faqcat="${c}">${c}</button>`).join("");
  const items = FAQS.map((f) => `<details class="faq-item" data-cat="${f[0]}"><summary><span class="faq-q">Q. ${f[1]}</span><span class="faq-cat">${f[0]}</span></summary><div class="faq-a">${f[2]}</div></details>`).join("");
  const inqCats = ["예약·결제", "견적 요청", "맞춤 업체", "취소·환불", "회원·포인트", "호스트·파트너", "기타"];
  return `
  <section class="help-sec">
    <div class="faq-chips" id="faqChips">${chips}</div>
    <div class="faq-list" id="faqList">${items}</div>

    <div class="hinq" id="hinq">
      <div class="hinq__head"><b>${ic("doc", 18)} 원하는 답이 없나요? 1:1 문의하기</b><p>궁금한 점을 남겨주시면 관리자가 확인 후 답변을 드려요. 답변은 알림과 마이페이지에서 확인할 수 있어요.</p></div>
      <div class="hinq__form" id="hinqForm">
        <label class="hinq__f"><span>문의 유형 *</span>
          <select id="hinqCat">${inqCats.map((c) => `<option value="${c}">${c}</option>`).join("")}</select>
        </label>
        <label class="hinq__f"><span>제목 <em>(선택)</em></span><input type="text" id="hinqSubject" maxlength="50" placeholder="예: 견적 선정 후 결제가 안 돼요" /></label>
        <label class="hinq__f"><span>문의 내용 *</span><textarea id="hinqText" rows="4" placeholder="문의하실 내용을 자세히 적어주세요. (예약번호·공간명 등을 함께 적으면 더 빠르게 도와드릴 수 있어요)"></textarea></label>
        <p class="hinq__err" id="hinqErr" hidden></p>
        <button type="button" class="btn btn--accent btn--block" id="hinqSend">문의 보내기 →</button>
        <p class="hinq__hint">로그인 후 이용할 수 있어요. 접수된 문의는 <a href="mypage.html">마이페이지</a>에서 확인할 수 있어요.</p>
      </div>
    </div>
  </section>`;
}

// ---------- 호스트·파트너 가이드 ----------
function hostHTML() {
  const hostSteps = [
    ["사업자 등록", "상단 <b>‘사업자 등록’</b>에서 사업자 정보를 등록하면 호스트(공간)·파트너(부대서비스)로 활동할 수 있어요. 관리자 승인 후 모든 기능이 열립니다."],
    ["공간 등록", "마이페이지 <b>‘내 등록 공간 → 새 공간 등록’</b>에서 사진(최대 10장·드래그로 대표 지정)·가격·편의시설·핵심 태그·소개를 입력해요."],
    ["예약 규칙 설정", "‘공간 관리 → 예약 규칙’에서 <b>즉시 예약 자동 수락</b>, 최소/최대 이용시간, 청소 버퍼를 정하고, <b>자동 수락 시 게스트 안내 메시지</b>(출입·주차·비밀번호 등)를 미리 저장해요."],
    ["예약·정산 관리", "‘예약 요청’에서 수락/거절, ‘가용성 차단’ 달력으로 불가일 관리, ‘정산’ 탭에서 정산 예정액·지급 상태·계좌를 관리해요."],
  ];
  const cards = [
    ["bolt", "즉시 예약 자동 수락", "켜두면 게스트 결제 즉시 예약이 확정되고, 미리 적어둔 이용 안내가 채팅·알림으로 자동 전달돼요. 문의가 크게 줄어듭니다."],
    ["home", "청소 보증금", "공간 등록 시 보증금 금액·입금 계좌를 설정하면, 예약 확정 후 게스트에게 <b>계좌 입금 안내</b>가 전달돼요. 파손·미정리 없으면 이용 후 환불하는 조건입니다."],
    ["won", "수수료 · 정산", "플랫폼 수수료는 <b>호스트·파트너·패키지 일괄 5%</b>예요(회원 서비스료 0%). 이용 완료 건은 수수료를 제외하고 정산되며, ‘정산’ 탭에서 월별로 지급됩니다."],
    ["studio", "파트너(부대서비스)", "촬영·케이터링·렌탈 등은 파트너로 등록해요. ‘파트너 정보’에서 소개·대여 품목·대여 시작가·사진을 등록하면 <b>맞춤 업체</b>에 노출되고, 회원 견적 요청에 입찰할 수 있어요."],
    ["star", "노출을 높이는 팁", "선명한 대표 사진, 핵심 옵션 <b>#해시태그</b>(주차·빔프로젝터·루프탑뷰 등), 정성 어린 소개, 빠른 응답과 좋은 후기가 상위 노출·선정에 도움이 됩니다."],
    ["doc", "견적 요청 응대", "회원이 통합 견적을 요청하면 조건에 맞는 파트너에게 알림이 가요. 마이페이지에서 <b>금액·제안을 담아 입찰</b>하고, 선정되면 채팅으로 세부를 조율합니다."],
  ];
  return `
  <section class="help-sec">
    <div class="help-intro">
      <h2 class="help-h2">공간을 빌려주거나 서비스를 제공하시나요?</h2>
      <p class="help-lead">호스트(공간)·파트너(부대서비스)로 등록하면 등록·예약·정산까지 마이페이지에서 관리할 수 있어요. 아래 순서만 따라 하면 됩니다.</p>
    </div>

    <h3 class="help-h3">시작하기 4단계</h3>
    <ol class="hflow">${hostSteps.map((s, i) => `<li><span class="hflow__n">${i + 1}</span><div><b>${s[0]}</b><p>${s[1]}</p></div></li>`).join("")}</ol>

    <h3 class="help-h3">꼭 알아두세요</h3>
    <div class="help-cards">
      ${cards.map((c) => `<div class="help-card"><b>${ic(c[0], 16)} ${c[1]}</b><p>${c[2]}</p></div>`).join("")}
    </div>

    <div class="help-note">
      <b>${ic("home", 16)} 지금 시작하기</b>
      <p>아직 등록 전이라면 <b>사업자 등록</b>부터, 이미 승인된 호스트라면 <b>공간 등록</b>으로 바로 시작하세요.</p>
      <div class="help-note__cta"><a class="btn btn--accent btn--sm" href="business.html">사업자 등록</a><a class="btn btn--outline btn--sm" href="host.html">공간 등록</a></div>
    </div>
  </section>`;
}

// ---------- 렌더 · 탭 ----------
const RENDER = { guide: guideHTML, booking: bookingHTML, faq: faqHTML, host: hostHTML };
function setTab(tab) {
  if (!RENDER[tab]) tab = "guide";
  $("#helpBody").innerHTML = RENDER[tab]();
  document.querySelectorAll("#helpTabs .help-tab").forEach((b) => b.classList.toggle("is-active", b.dataset.htab === tab));
  try { history.replaceState(null, "", "help.html?tab=" + tab); } catch (e) {}
  if (tab === "faq") wireFaq();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
$("#helpTabs").addEventListener("click", (e) => { const b = e.target.closest("[data-htab]"); if (b) setTab(b.dataset.htab); });

// FAQ 카테고리 필터 + 1:1 문의
function wireFaq() {
  const chips = $("#faqChips");
  if (chips) chips.addEventListener("click", (e) => {
    const b = e.target.closest("[data-faqcat]"); if (!b) return;
    chips.querySelectorAll(".faq-chip").forEach((x) => x.classList.toggle("is-on", x === b));
    const cat = b.dataset.faqcat;
    document.querySelectorAll("#faqList .faq-item").forEach((it) => { it.style.display = (cat === "전체" || it.dataset.cat === cat) ? "" : "none"; if (cat !== "전체" && it.dataset.cat !== cat) it.open = false; });
  });
  const send = $("#hinqSend");
  if (send) send.addEventListener("click", () => {
    const a = window.AUTH.get();
    const err = $("#hinqErr");
    if (!a) { err.textContent = "로그인 후 문의할 수 있어요."; err.hidden = false; setTimeout(() => (location.href = "login.html"), 1000); return; }
    const cat = $("#hinqCat").value, subject = $("#hinqSubject").value.trim(), text = $("#hinqText").value.trim();
    if (!text) { err.textContent = "문의 내용을 입력해 주세요."; err.hidden = false; return; }
    err.hidden = true;
    const fullText = `[${cat}] ${subject ? subject + " — " : ""}${text}`;
    window.INQUIRY.add({ userId: a.userId, name: window.AUTH.displayName(a), category: cat, subject: subject || cat, text: fullText });
    if (window.NOTIF) window.NOTIF.add({ forUser: "admin", title: "새 1:1 문의", sub: `[${cat}] ${text.slice(0, 24)}`, link: "admin.html?tab=cs" });
    $("#hinqSubject").value = ""; $("#hinqText").value = "";
    toast("문의를 접수했어요 · 관리자가 확인 후 답변드릴게요");
  });
}

// 초기 탭 (?tab=)
setTab(new URLSearchParams(location.search).get("tab") || "guide");

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
