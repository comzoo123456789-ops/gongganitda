// ============================================================
// 공간잇다 — 견적 요청 이용 가이드 인포그래픽 (모든 페이지 공용)
//   [data-guide] 요소를 누르면 인포그래픽 모달이 열립니다.
// ============================================================
(function () {
  const ic = (typeof iconSVG === "function") ? iconSVG : () => "";
  // 단계·서비스 의미에 맞춘 커스텀 듀오톤 아이콘 (currentColor로 단계 색 반영)
  const gsvg = (p, s) => `<svg viewBox="0 0 24 24" width="${s || 26}" height="${s || 26}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const GI = {
    // 흐름도: 촬영·케이터링·공간
    cam: '<path d="M4 8.6A1.6 1.6 0 0 1 5.6 7H8l1.2-1.6h5.6L16 7h2.4A1.6 1.6 0 0 1 20 8.6V17a1.6 1.6 0 0 1-1.6 1.5H5.6A1.6 1.6 0 0 1 4 17z" fill="currentColor" opacity=".13"/><path d="M4 8.6A1.6 1.6 0 0 1 5.6 7H8l1.2-1.6h5.6L16 7h2.4A1.6 1.6 0 0 1 20 8.6V17a1.6 1.6 0 0 1-1.6 1.5H5.6A1.6 1.6 0 0 1 4 17z"/><circle cx="12" cy="12.4" r="3.3"/><circle cx="12" cy="12.4" r="1.1" fill="currentColor"/>',
    plate: '<path d="M4 15a8 8 0 0 1 16 0z" fill="currentColor" opacity=".13"/><path d="M4 15a8 8 0 0 1 16 0"/><line x1="2.6" y1="15.4" x2="21.4" y2="15.4"/><line x1="12" y1="7" x2="12" y2="5.6"/><circle cx="12" cy="5" r=".9" fill="currentColor"/><path d="M8.8 3.4c.7.5.7 1.4 0 1.9" opacity=".55"/><path d="M15.2 3.4c.7.5.7 1.4 0 1.9" opacity=".55"/>',
    bldg: '<path d="M4 20V10.4a1 1 0 0 1 .64-.93l6.8-2.6a1 1 0 0 1 1.36.93V20" fill="currentColor" opacity=".13"/><path d="M4 20V10.4a1 1 0 0 1 .64-.93l6.8-2.6a1 1 0 0 1 1.36.93V20"/><line x1="3" y1="20" x2="14" y2="20"/><rect x="6.4" y="15.4" width="3.2" height="4.6"/><circle cx="6.8" cy="11.6" r=".55" fill="currentColor"/><circle cx="10.4" cy="10.9" r=".55" fill="currentColor"/><path d="M18.4 3.6c1.9 0 3.4 1.5 3.4 3.3 0 2.2-3.4 5.3-3.4 5.3S15 9.1 15 6.9c0-1.8 1.5-3.3 3.4-3.3z" fill="currentColor" opacity=".13"/><path d="M18.4 3.6c1.9 0 3.4 1.5 3.4 3.3 0 2.2-3.4 5.3-3.4 5.3S15 9.1 15 6.9c0-1.8 1.5-3.3 3.4-3.3z"/><circle cx="18.4" cy="6.9" r="1.05" fill="currentColor"/>',
    // 단계 1~4
    step: [
      // 1) 요청 등록 — 입력 폼 + 연필
      '<rect x="3.5" y="4" width="12" height="16" rx="2" fill="currentColor" opacity=".13"/><path d="M3.5 6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2z"/><line x1="6.2" y1="8.4" x2="12.8" y2="8.4"/><line x1="6.2" y1="11.4" x2="12.8" y2="11.4"/><line x1="6.2" y1="14.4" x2="9.8" y2="14.4"/><path d="M18.4 12.1l2.5 2.5-5.2 5.2-2.7.2.2-2.7z" fill="currentColor" opacity=".18"/><path d="M18.4 12.1l2.5 2.5-5.2 5.2-2.7.2.2-2.7z"/><line x1="17.1" y1="13.4" x2="19.6" y2="15.9"/>',
      // 2) 파트너 견적 경쟁 — 여러 견적서가 수신함으로
      '<rect x="6" y="3.6" width="7.4" height="9.4" rx="1.2" opacity=".45" transform="rotate(-8 9.7 8.3)"/><rect x="8.4" y="3" width="7.6" height="9.6" rx="1.2" fill="currentColor" opacity=".13"/><rect x="8.4" y="3" width="7.6" height="9.6" rx="1.2"/><line x1="10.2" y1="6" x2="14.2" y2="6"/><line x1="10.2" y1="8.3" x2="14.2" y2="8.3"/><path d="M3.5 15.4l1.8 3.3a1.5 1.5 0 0 0 1.3.8h10.8a1.5 1.5 0 0 0 1.3-.8l1.8-3.3z" fill="currentColor" opacity=".13"/><path d="M3.5 15.4l1.8 3.3a1.5 1.5 0 0 0 1.3.8h10.8a1.5 1.5 0 0 0 1.3-.8l1.8-3.3"/><path d="M3.5 15.4H8m8 0h4.5"/>',
      // 3) 비교하고 선택 — 저울
      '<line x1="12" y1="4.8" x2="12" y2="19.4"/><line x1="7.5" y1="19.4" x2="16.5" y2="19.4"/><line x1="4.5" y1="8" x2="19.5" y2="8"/><circle cx="12" cy="4.6" r="1" fill="currentColor"/><path d="M4.5 8l-2 4.3h4z" fill="currentColor" opacity=".14"/><path d="M2.5 12.3a2 2 0 0 0 4 0"/><path d="M19.5 8l-2 4.3h4z" fill="currentColor" opacity=".14"/><path d="M17.5 12.3a2 2 0 0 0 4 0"/>',
      // 4) 확정·결제·이용 — 체크 배지 + 반짝임
      '<circle cx="11.5" cy="11.3" r="7" fill="currentColor" opacity=".13"/><circle cx="11.5" cy="11.3" r="7"/><path d="M8.2 11.4l2.2 2.2 4.5-4.9"/><path d="M8.6 17.8l-1.2 2.7M14.4 17.8l1.2 2.7" opacity=".55"/><path d="M20 3.6l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3L18.2 6l1.3-.5z" fill="currentColor"/>',
    ],
    // 혜택 아이콘
    relax: '<rect x="6.5" y="3" width="11" height="18" rx="2.6" fill="currentColor" opacity=".13"/><rect x="6.5" y="3" width="11" height="18" rx="2.6"/><line x1="10.4" y1="18.3" x2="13.6" y2="18.3"/><path d="M9 9.9l1.9 1.9 4-4.3"/>',
    lowprice: '<rect x="4" y="9.5" width="3.4" height="8.5" rx="1" fill="currentColor" opacity=".13"/><rect x="4" y="9.5" width="3.4" height="8.5" rx="1"/><rect x="9.3" y="12.5" width="3.4" height="5.5" rx="1" fill="currentColor" opacity=".13"/><rect x="9.3" y="12.5" width="3.4" height="5.5" rx="1"/><rect x="14.6" y="15" width="3.4" height="3" rx="1" fill="currentColor" opacity=".13"/><rect x="14.6" y="15" width="3.4" height="3" rx="1"/><path d="M5.5 7.2l5.4 3 5.4-3.6"/><path d="M20.3 4.8l-3.9 1.8M16.4 6.6l.4-2.9"/>',
    onestop: '<circle cx="9" cy="9.2" r="4.6" fill="currentColor" opacity=".13"/><circle cx="15" cy="9.2" r="4.6" fill="currentColor" opacity=".13"/><circle cx="12" cy="14.8" r="4.6" fill="currentColor" opacity=".13"/><circle cx="9" cy="9.2" r="4.6"/><circle cx="15" cy="9.2" r="4.6"/><circle cx="12" cy="14.8" r="4.6"/>',
    me: '<circle cx="12" cy="7.6" r="4" fill="currentColor" stroke="none"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0z" fill="currentColor" stroke="none"/>',
  };
  const STEPS = [
    { t: "요청 한 번 등록", d: "날짜·인원·예산과 필요한 것(공간·촬영·케이터링 등)을 한 번에 적어요.<br>발품 팔 필요 없어요." },
    { t: "파트너가 견적 경쟁", d: "요청을 본 여러 파트너가 견적서를 보내옵니다.<br>기다리기만 하면 견적이 쌓여요." },
    { t: "비교하고 선택", d: "카테고리별로 최저가·후기·제안을 비교하고,<br>마음에 드는 곳만 골라요." },
    { t: "확정·결제·이용", d: "선택한 견적만 결제하면 끝.<br>이용일에 맞춰 파트너가 준비합니다." },
  ];
  const WHY = [
    ["relax", "발품 제로", "여러 곳에 전화·문의할 필요 없이 한 번만 요청"],
    ["lowprice", "최저가 경쟁", "파트너들이 서로 경쟁해 더 좋은 견적을 제시"],
    ["onestop", "원스톱", "공간+장비+케이터링까지 한 자리에서 해결"],
  ];

  function html() {
    return `<div class="gmodal__bd" data-gclose></div>
    <div class="gmodal__card">
      <button class="gmodal__x" data-gclose aria-label="닫기">✕</button>
      <div class="guide">
        <span class="guide__eyebrow">▶ 1분 가이드</span>
        <h2 class="guide__title">견적 요청, 이렇게 이용해요</h2>
        <p class="guide__lead">내가 파트너를 찾아다니는 게 아니라,<br /><b>파트너들이 나에게 견적을 보내오는</b> 방식이에요.</p>

        <div class="guide__diagram">
          <div class="gdia__vendors">
            <span class="gdia__v gdia__v--blue">${gsvg(GI.cam, 22)}<b>촬영</b></span>
            <span class="gdia__v gdia__v--pink">${gsvg(GI.plate, 22)}<b>케이터링</b></span>
            <span class="gdia__v gdia__v--yellow">${gsvg(GI.bldg, 22)}<b>공간</b></span>
          </div>
          <div class="gdia__arrow"><span class="gdia__arrowtx">${ic("doc", 15)} 견적 제출</span></div>
          <div class="gdia__me"><span class="gdia__meic">${gsvg(GI.me, 20)}</span> 내가 <b>비교하고 선택</b></div>
        </div>

        <div class="guide__steps">
          ${STEPS.map((s, i) => `<div class="gstep gstep--c${i}" style="--i:${i}"><div class="gstep__top"><span class="gstep__ic">${gsvg(GI.step[i], 26)}</span><span class="gstep__n">${i + 1}</span></div><b class="gstep__t">${s.t}</b><span class="gstep__d">${s.d}</span></div>`).join("")}
        </div>

        <div class="guide__why">
          ${WHY.map((w, i) => `<div class="gwhy gwhy--${i}"><span class="gwhy__ic">${gsvg(GI[w[0]], 24)}</span><b>${w[1]}</b><span>${w[2]}</span></div>`).join("")}
        </div>

        <a href="request.html" class="btn btn--accent btn--lg btn--block">지금 견적 요청 시작하기 →</a>
      </div>
    </div>`;
  }

  let el;
  function ensure() {
    if (el) return el;
    el = document.createElement("div");
    el.className = "gmodal";
    el.id = "giGuide";
    el.hidden = true;
    el.innerHTML = html();
    el.addEventListener("click", (e) => { if (e.target.closest("[data-gclose]")) close(); });
    document.body.appendChild(el);
    return el;
  }
  function open() { ensure().hidden = false; document.body.style.overflow = "hidden"; }
  function close() { if (el) el.hidden = true; document.body.style.overflow = ""; }
  window.openGuide = open;

  document.addEventListener("click", (e) => { if (e.target.closest("[data-guide]")) { e.preventDefault(); open(); } });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
})();
