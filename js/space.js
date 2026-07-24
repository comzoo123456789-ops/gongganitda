// ============================================================
// 공간잇다 — 공간 상세 · 예약 페이지
// ============================================================
const $ = (s) => document.querySelector(s);
const won = (n) => n.toLocaleString("ko-KR");
(function spacePage() {
const params = new URLSearchParams(location.search);
const id = +params.get("id");
const ALL = getAllSpaces();
const S = ALL.find((s) => s.id === id) || ALL[0];
// 호스트 숨김(공사·일시 이용 불가)·관리자 블라인드/반려 공간은 게스트에게 '이용 불가' 안내
// (소유 호스트·관리자는 미리보기 허용)
if (S) {
  const _v = window.AUTH && window.AUTH.get();
  const _canPreview = _v && (_v.role === "admin" || _v.userId === S.ownerId);
  if ((S.hidden || S.blinded || S.rejected) && !_canPreview) {
    const reason = S.hidden ? "호스트가 현재 이 공간을 비공개(일시 이용 불가)로 전환했어요." : "현재 노출이 중단된 공간이에요.";
    document.getElementById("sp").innerHTML = `<div class="sp-unavail"><div class="sp-unavail__ic">${iconSVG("lock", 30)}</div><h1>지금은 이용할 수 없는 공간이에요</h1><p>${reason}<br />다른 멋진 공간을 둘러보세요.</p><div class="sp-unavail__act"><a class="btn btn--accent" href="search.html">다른 공간 둘러보기 →</a><a class="btn btn--outline" href="index.html">홈으로</a></div></div>`;
    return; // 상세 렌더 중단
  }
}
const C = catById(S.cat);
const SG = S.g || [C.ink, "#cfc7b8"];
if (window.STATLOG && S) window.STATLOG.view(S.id); // 조회수 집계(통계)
// 최근 본 공간 기록 (플로팅 퀵메뉴용)
if (S) { try { let r = JSON.parse(localStorage.getItem("gi_recent") || "[]"); r = [S.id, ...r.filter((x) => x !== S.id)].slice(0, 12); localStorage.setItem("gi_recent", JSON.stringify(r)); } catch (e) {} }

// 같은 유형의 다른 공간 (갤러리 보조 이미지 + 관련 공간)
const others = ALL.filter((s) => s.id !== S.id && !s.blinded && !s.rejected && !s.hidden);
const sameCat = others.filter((s) => s.cat === S.cat);
// 같은 유형 우선, 부족하면 다른 공간으로 채워 항상 3개 확보
const galleryExtra = [...sameCat, ...others.filter((s) => s.cat !== S.cat)].slice(0, 3);

// 결정적 후기 생성
const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const REV_NAMES = ["김도현", "이서연", "박준영", "최유진", "정민석", "한지우"];
const REV_TXT = [
  "사진보다 실물이 훨씬 좋았어요. 청결하고 위치도 편했습니다.",
  "모임하기 딱 좋은 공간이었어요. 호스트님도 친절하셨습니다.",
  "시설이 잘 갖춰져 있어서 준비 없이도 편하게 이용했어요.",
  "가격 대비 만족도 최고입니다. 다음에 또 예약할게요!",
  "조용하고 아늑해서 집중하기 좋았습니다. 추천해요.",
];
function reviews() {
  const n = 3;
  return Array.from({ length: n }, (_, i) => {
    const seed = hash(S.name + i);
    return {
      name: REV_NAMES[seed % REV_NAMES.length],
      txt: REV_TXT[seed % REV_TXT.length],
      stars: 4 + (seed % 2),
      color: SG[i % 2],
    };
  });
}

// 편의시설 아이콘 매핑
const amenIcon = (t) => {
  if (/주차/.test(t)) return "pin";
  if (/와이파이|wifi/i.test(t)) return "grid";
  if (/음향|스피커|마이크|앰프|노래방/.test(t)) return "practice";
  if (/빔|프로젝터|넷플/.test(t)) return "studio";
  if (/조명/.test(t)) return "event";
  if (/취사|오븐|냉장고|식기|정수기/.test(t)) return "cafe";
  if (/화이트보드|프린터|콘센트|화상/.test(t)) return "meeting";
  return "star";
};

// ---------- 렌더 ----------
$("#sp").innerHTML = `
  <a href="index.html" class="sp-back"><span style="display:inline-flex;transform:scaleX(-1)">${iconSVG("arrow", 16)}</span>목록으로</a>

  <div class="sp-gallery">
    <div class="sp-gallery__main" style="background:linear-gradient(135deg,${SG[0]},${SG[1]})"><span class="sp-ph sp-ph--lg"><span class="sp-ph__mark"><i class="sp-ph__dot"></i>공간잇다</span></span>${(S.photos && S.photos[0]) || spaceImg(S, 1000, 900) ? `<img src="${(S.photos && S.photos[0]) || spaceImg(S, 1000, 900)}" alt="${S.name}" onerror="this.remove()" />` : ""}</div>
    ${(S.photos && S.photos.length)
      ? S.photos.slice(1).map((u) => `<div class="sp-gallery__sm" style="background:linear-gradient(135deg,${SG[0]},${SG[1]})"><img src="${u}" alt="${S.name}" onerror="this.remove()" /></div>`).join("")
      : galleryExtra.slice(0, 2).map((g) => { const gg = g.g || [C.ink, "#cfc7b8"]; const u = spaceImg(g, 500, 400); return `<div class="sp-gallery__sm" style="background:linear-gradient(135deg,${gg[0]},${gg[1]})">${u ? `<img src="${u}" alt="" onerror="this.remove()" />` : ""}</div>`; }).join("")}
  </div>
  <div class="sp-gallery__nav" id="galNav"></div>

  <nav class="sp-nav" id="spNav">
    <a href="#sec-info" data-sec="sec-info">공간 정보</a>
    <a href="#sec-amen" data-sec="sec-amen">편의시설</a>
    <a href="#sec-rev" data-sec="sec-rev">사용자 후기</a>
    <a href="#sec-loc" data-sec="sec-loc">위치</a>
    <a href="#sec-guide" data-sec="sec-guide">이용 안내</a>
  </nav>

  <div class="sp-layout">
    <div class="sp-main">
      <div class="sp-head">
        <div class="sp-head__row">
          <div>
            <span class="sp-head__cat">${C.label}</span>
            <h1 class="sp-head__title">${S.name}</h1>
          </div>
          <div class="sp-head__actions">
            <button class="sp-act ${window.FAV.has(S.id) ? "is-on" : ""}" id="spFav" aria-label="찜하기">${iconSVG("heart", 18)}<span id="spFavTxt">${window.FAV.has(S.id) ? "찜함" : "찜"}</span></button>
            <button class="sp-act" id="spShare" aria-label="공유하기"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg><span>공유</span></button>
          </div>
        </div>
        <div class="sp-head__meta">
          <span class="rate">${S.reviews ? `${iconSVG("star", 16)}${S.rating} <em style="color:var(--faint);font-weight:500">· 후기 ${S.reviews}</em>` : `<em style="color:var(--accent);font-weight:700">신규 공간</em>`}</span>
          <span>${iconSVG("pin", 16)}${S.region}</span>
          <span>${iconSVG("users", 16)}최대 ${S.capacity}인</span>
        </div>
        ${(S.optTags && S.optTags.length) ? `<div class="sp-tags sp-tags--head">${S.optTags.map((t) => `<a class="optag optag--lg optag--link" href="search.html?tag=${encodeURIComponent(t)}">#${t}</a>`).join("")}</div>` : ""}
      </div>

      <div class="sp-sec" id="sec-info">
        <h2 class="sp-sec__title">공간 소개</h2>
        <p class="sp-desc">${S.desc ? S.desc.replace(/</g, "&lt;").replace(/\n/g, "<br />") : `${S.region}에 위치한 <b>${S.name}</b>은(는) 최대 ${S.capacity}인까지 이용 가능한 ${C.label} 공간입니다. 시간 단위로 편하게 대관할 수 있으며, 필요한 기본 시설을 모두 갖추고 있어 준비 없이도 바로 이용하실 수 있습니다. 모임·행사·작업 등 목적에 맞게 자유롭게 활용해 보세요.`}</p>
      </div>

      <div class="sp-sec" id="sec-amen">
        <h2 class="sp-sec__title">편의시설</h2>
        <ul class="sp-amen">
          ${S.tags.map((t) => `<li>${iconSVG(amenIcon(t), 18)}${t}</li>`).join("")}
        </ul>
      </div>

      <div class="sp-sec" id="sec-loc">
        <h2 class="sp-sec__title">위치</h2>
        <div class="sp-loc">
          <div class="sp-loc__addr">${iconSVG("pin", 18)} ${S.region}</div>
          <a class="btn btn--outline btn--sm" href="${naverMapUrl(S.addr || S.region)}" target="_blank" rel="noopener">네이버 지도에서 보기 →</a>
        </div>
      </div>

      <div class="sp-sec" id="sec-rev">
        <h2 class="sp-sec__title">이용 후기 <span id="spRevAvg"></span></h2>
        <div id="spReviewForm"></div>
        <div class="sp-rev" id="spRev"></div>
      </div>

      <div class="sp-sec" id="sec-guide">
        <h2 class="sp-sec__title">이용 안내</h2>
        <p class="sp-desc" style="font-size:0.9rem;color:var(--muted)">· 예약은 시간 단위로 가능합니다.<br />· 퇴실 시 공간을 이용 전 상태로 정리해 주세요.<br />· <b style="color:var(--ink-2)">취소·환불 규정</b> — ${(window.SITECFG ? window.SITECFG.get().refund : "이용 3일 전까지 100% 환불, 1~2일 전 50%, 당일 환불 불가")} <a href="#" data-legal="refund" style="color:var(--accent);font-weight:600">전문 보기</a></p>
        ${(S.deposit && S.deposit.amount) ? `<div class="sp-deposit">${iconSVG("won", 16)} <b>청소 보증금 ${won(S.deposit.amount)}원</b><span>예약 확정 후 호스트 계좌(${S.deposit.bank || "-"} ${S.deposit.account || ""})로 입금해 주세요. 파손·미정리가 없으면 이용 후 환불됩니다.</span></div>` : ""}
      </div>

      <div class="sp-sec">
        <h2 class="sp-sec__title">이 공간과 함께하는 파트너</h2>
        <p class="sp-sec__sub">케이터링·장비·연출 파트너를 견적 요청 전에 미리 확인하세요.</p>
        <div class="matchp" id="matchPartners"></div>
      </div>

      <div class="sp-sec">
        <h2 class="sp-sec__title">비슷한 공간</h2>
        <div class="sp-rel" id="relGrid"></div>
      </div>
    </div>

    <!-- 예약 카드 -->
    <aside>
      <div class="book">
        <div class="book__price" id="bkPrice"></div>
        <div class="book__field">
          <label class="book__label">날짜 선택</label>
          <div class="cal" id="bkCal"></div>
        </div>
        <div class="book__row">
          <div class="book__field">
            <label class="book__label">시작 시간</label>
            <select id="bkStart"></select>
          </div>
          <div class="book__field">
            <label class="book__label">이용 시간</label>
            <select id="bkHours"></select>
          </div>
        </div>
        <div class="book__field">
          <label class="book__label">인원</label>
          <input type="number" id="bkGuests" min="1" max="${S.capacity}" value="2" />
        </div>
        <div class="book__opts">
          <div class="book__opts__h">${iconSVG("wrench", 13)} 부대서비스 추가 <span>예상가 · 예약 후 견적으로 확정</span></div>
          ${[["🍽 케이터링", 150000], ["📷 촬영·스냅", 200000], ["🎥 장비 렌탈", 100000], ["🎈 데코·연출", 120000]].map(([label, price]) => `<label class="book__opt"><input type="checkbox" class="bk-opt" value="${price}" data-lbl="${label}" /><span class="book__opt__box"></span><span class="book__opt__l">${label}</span><em>+${won(price)}원</em></label>`).join("")}
        </div>
        <p class="book__couponnote">${iconSVG("ticket", 14)} 쿠폰은 <b>예약 진행</b> 단계에서 적용할 수 있어요.</p>
        <div class="book__sum">
          <div class="book__sumrow"><span id="bkCalc"></span><span id="bkSub"></span></div>
          <div class="book__sumrow book__disc" id="bkDiscRow" hidden><span id="bkDiscLbl"></span><span id="bkDisc"></span></div>
          <div class="book__sumrow"><span>서비스 수수료</span><span id="bkFee"></span></div>
          <div class="book__sumrow book__optsum" id="bkOptRow" hidden><span id="bkOptLbl">부대서비스(예상)</span><span id="bkOpt"></span></div>
          <div class="book__total"><span>예상 총액</span><b id="bkTotal"></b></div>
        </div>
        <button class="btn btn--accent btn--lg btn--block" id="bkGo">예약 진행 →</button>
        <button class="btn btn--soft btn--block" id="spInquire" style="margin-top:8px">${iconSVG("chat", 16)} 호스트에게 1:1 문의</button>
        <p class="book__note">예약 진행 페이지에서 부대서비스(케이터링·촬영장비 등)도 함께 요청할 수 있어요</p>
      </div>
    </aside>
  </div>
  <div class="bk-mobar" id="bkMobar"><div class="bk-mobar__l"><b id="bkMoTotal">0원</b><span>예상 총액 · 세부 계산기 열기</span></div><button class="btn btn--accent" id="bkMoGo">예약 진행 →</button></div>
`;

document.title = `${S.name} · 공간잇다`;

// 갤러리 캐러셀 (모바일: 1장씩 스와이프) — 페이지 도트
(function () {
  const gal = document.querySelector(".sp-gallery"), nav = document.getElementById("galNav");
  if (!gal || !nav) return;
  const slides = gal.querySelectorAll(".sp-gallery__main, .sp-gallery__sm");
  if (slides.length < 2) return;
  nav.innerHTML = Array.from(slides).map((_, i) => `<button class="sp-gallery__dot${i === 0 ? " is-on" : ""}" data-gi="${i}" aria-label="사진 ${i + 1}"></button>`).join("");
  const dots = nav.querySelectorAll(".sp-gallery__dot");
  let raf = 0;
  gal.addEventListener("scroll", () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const i = Math.round(gal.scrollLeft / gal.clientWidth);
      dots.forEach((d, di) => d.classList.toggle("is-on", di === i));
    });
  }, { passive: true });
  nav.addEventListener("click", (e) => { const b = e.target.closest("[data-gi]"); if (b) gal.scrollTo({ left: b.dataset.gi * gal.clientWidth, behavior: "smooth" }); });
})();

// 관련 공간 카드
$("#relGrid").innerHTML = galleryExtra.map((s) => {
  const c = catById(s.cat);
  const gg = s.g || [c.ink, "#cfc7b8"];
  const u = spaceImg(s, 500, 400);
  return `<article class="sp-card" onclick="location.href='space.html?id=${s.id}'">
    <div class="sp-card__thumb" style="background:linear-gradient(135deg,${gg[0]},${gg[1]})">
      ${u ? `<img src="${u}" alt="${s.name}" loading="lazy" onerror="this.remove()" />` : ""}
    </div>
    <div class="sp-card__body">
      <span class="sp-card__cat">${c.label}</span>
      <h3 class="sp-card__name">${s.name}</h3>
      <div class="sp-card__foot"><span class="sp-card__price">${won(s.price)}<span>원 / 시간</span></span><span class="sp-card__rating">${iconSVG("star", 14)}${s.rating}</span></div>
    </div>
  </article>`;
}).join("");

// ---------- 후기 (포토 리뷰 · 호스트 답글) ----------
function isHost() { const a = window.AUTH.get(); return a && a.userId === (S.ownerId || "host"); }
function downscaleImg(file, cb) {
  if (!/^image\//.test(file.type)) { cb(null); return; }
  const rd = new FileReader(); rd.onload = () => { const img = new Image(); img.onload = () => { let w = img.width, h = img.height, m = 720; if (w > m || h > m) { if (w > h) { h = Math.round(h * m / w); w = m; } else { w = Math.round(w * m / h); h = m; } } const cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").drawImage(img, 0, 0, w, h); try { cb(cv.toDataURL("image/jpeg", 0.7)); } catch (e) { cb(null); } }; img.onerror = () => cb(null); img.src = rd.result; }; rd.readAsDataURL(file);
}
function allReviews() {
  const real = window.REVIEWS.list(S.id).filter((r) => !r.hidden).map((r) => ({ id: r.id, name: r.name, txt: r.text, stars: r.rating, photos: r.photos || [], reply: r.reply || null, color: SG[0], real: true }));
  const demo = S.reviews ? reviews() : [];
  return real.concat(demo);
}
function photoView(src) { modal.hidden = false; modalCard.innerHTML = `<div class="modal__head"><b>후기 사진</b><button class="modal__x" data-mclose>✕</button></div><img src="${src}" alt="" style="width:100%;border-radius:12px" />`; }
function renderReviews() {
  const list = allReviews();
  const cnt = list.length;
  const avg = cnt ? (list.reduce((a, r) => a + r.stars, 0) / cnt).toFixed(1) : 0;
  $("#spRevAvg").innerHTML = cnt ? `<span style="color:var(--gold)">★ ${avg}</span> <span style="color:var(--faint);font-weight:500;font-size:0.9rem">(${cnt})</span>` : "";
  // 포토 리뷰 상단 스트립
  const allPhotos = [];
  list.forEach((r) => (r.photos || []).forEach((p) => allPhotos.push(p)));
  const strip = allPhotos.length ? `<div class="sp-revphotos"><div class="sp-revphotos__t">${iconSVG("studio", 14)} 포토 후기 ${allPhotos.length}</div><div class="sp-revphotos__row">${allPhotos.slice(0, 12).map((p) => `<img src="${p}" alt="" data-revphoto="${p}" loading="lazy" />`).join("")}</div></div>` : "";
  const host = isHost();
  const rows = cnt ? list.map((r) => `<div class="sp-revrow">
    <span class="sp-revrow__av" style="background:${r.color}">${(r.name || "익명").charAt(0)}</span>
    <div class="sp-revrow__body">
      <div class="sp-revrow__name">${window.PRIVACY ? window.PRIVACY.name(r.name || "익명") : (r.name || "익명")}</div>
      <div class="sp-revrow__stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div>
      <div class="sp-revrow__txt">${r.txt}</div>
      ${(r.photos && r.photos.length) ? `<div class="sp-revrow__photos">${r.photos.map((p) => `<img src="${p}" alt="" data-revphoto="${p}" loading="lazy" />`).join("")}</div>` : ""}
      ${r.reply ? `<div class="sp-revreply"><b>${iconSVG("home", 13)} 호스트 답글</b><span>${r.reply.text}</span></div>` : ""}
      ${(host && r.real && !r.reply) ? `<button class="sp-revreply__btn" data-reply="${r.id}">답글 달기</button>` : ""}
      ${(host && r.real) ? `<div class="sp-revreply__form" data-replyform="${r.id}" hidden><textarea rows="2" placeholder="감사 인사나 피드백을 남겨보세요"></textarea><button class="btn btn--accent btn--sm" data-replysend="${r.id}">답글 등록</button></div>` : ""}
    </div>
  </div>`).join("") : `<p class="sp-desc" style="color:var(--muted)">아직 등록된 후기가 없어요. 첫 후기를 남겨보세요.</p>`;
  $("#spRev").innerHTML = strip + rows;
}
$("#spRev").addEventListener("click", (e) => {
  const ph = e.target.closest("[data-revphoto]"); if (ph) { photoView(ph.dataset.revphoto); return; }
  const rb = e.target.closest("[data-reply]"); if (rb) { const f = document.querySelector(`[data-replyform="${rb.dataset.reply}"]`); if (f) { f.hidden = false; rb.hidden = true; } return; }
  const rs = e.target.closest("[data-replysend]"); if (rs) {
    const id = rs.dataset.replysend, f = document.querySelector(`[data-replyform="${id}"]`), t = f.querySelector("textarea").value.trim();
    if (!t) { toast("답글 내용을 입력해주세요"); return; }
    window.REVIEWS.update(id, { reply: { text: t, ts: Date.now() } });
    renderReviews(); toast("답글을 등록했어요");
  }
});
function renderReviewForm() {
  const a = window.AUTH.get();
  const box = $("#spReviewForm");
  if (!a) { box.innerHTML = `<p class="sp-revlogin">후기를 남기려면 <a href="login.html">로그인</a>하세요.</p>`; return; }
  box.innerHTML = `<button class="btn btn--outline btn--sm" id="revToggle">${iconSVG("edit", 14)} 후기 쓰기</button>
    <div class="sp-revform" id="revForm" hidden>
      <div class="sp-revstars" id="revStars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}">★</button>`).join("")}</div>
      <textarea id="revText" rows="3" placeholder="이용 경험을 남겨주세요"></textarea>
      <div class="sp-revform__photos" id="revPhotos"></div>
      <label class="sp-revform__add">${iconSVG("studio", 14)} 사진 첨부<input type="file" id="revFile" accept="image/*" multiple hidden /></label>
      <button class="btn btn--accent btn--sm" id="revSubmit">등록하기</button>
    </div>`;
  let star = 5, photos = [];
  const paint = () => box.querySelectorAll("#revStars button").forEach((b, i) => b.classList.toggle("on", i < star));
  const paintPhotos = () => { $("#revPhotos").innerHTML = photos.map((p, i) => `<span class="sp-revform__ph"><img src="${p}" alt="" /><button type="button" data-delrevph="${i}">✕</button></span>`).join(""); };
  paint();
  $("#revToggle").addEventListener("click", () => { const f = $("#revForm"); f.hidden = !f.hidden; });
  $("#revStars").addEventListener("click", (e) => { const b = e.target.closest("[data-star]"); if (b) { star = +b.dataset.star; paint(); } });
  $("#revFile").addEventListener("change", (e) => { [...e.target.files].slice(0, 5).forEach((f) => downscaleImg(f, (url) => { if (url && photos.length < 5) { photos.push(url); paintPhotos(); } })); e.target.value = ""; });
  $("#revPhotos").addEventListener("click", (e) => { const d = e.target.closest("[data-delrevph]"); if (d) { photos.splice(+d.dataset.delrevph, 1); paintPhotos(); } });
  $("#revSubmit").addEventListener("click", () => {
    const t = $("#revText").value.trim();
    if (!t) { toast("후기 내용을 입력해주세요"); return; }
    window.REVIEWS.add({ spaceId: S.id, userId: a.userId, name: window.AUTH.displayName(a), rating: star, text: t, photos: photos.slice() });
    $("#revText").value = ""; photos = []; $("#revForm").hidden = true;
    renderReviews(); toast("후기가 등록되었어요!");
  });
}
renderReviews(); renderReviewForm();
// #2b: 매칭 파트너 미니 프로필 (아코디언)
function renderMatchPartners() {
  const box = document.getElementById("matchPartners"); if (!box) return;
  const vendors = (window.AUTH.users() || []).filter((u) => u.role === "vendor" && !u.suspended && ((u.items || []).length || u.intro || (u.serviceCats || []).length));
  const reg = (S.region || "").split(" ")[0];
  vendors.sort((a, b) => (((b.addr || "").includes(reg)) ? 1 : 0) - (((a.addr || "").includes(reg)) ? 1 : 0) || (b.manner || 0) - (a.manner || 0));
  const pick = vendors.slice(0, 4);
  if (!pick.length) { box.innerHTML = `<p class="matchp__empty">연결 가능한 파트너가 곧 등록됩니다. 견적 요청 시 매칭해 드려요.</p>`; return; }
  box.innerHTML = pick.map((v, i) => {
    const cat = (v.serviceCats || [])[0];
    const catL = (cat && window.reqCatById) ? reqCatById(cat).label : "부대서비스";
    const items = (v.items || []).slice(0, 3);
    const nm = v.nick || v.name || "파트너";
    return `<div class="matchp-card">
      <button type="button" class="matchp-card__hd" data-mptoggle="${i}">
        <span class="matchp-card__ava">${nm.slice(0, 1)}</span>
        <span class="matchp-card__info"><b>${nm}</b><span>${catL}${v.manner ? ` · ${iconSVG("star", 11)}매너 ${v.manner}` : ""}${v.startPrice ? ` · ${won(v.startPrice)}원~` : ""}</span></span>
        <span class="matchp-card__chev">▾</span>
      </button>
      <div class="matchp-card__body" data-mpbody="${i}" hidden>
        ${items.length ? `<div class="matchp-card__items">${items.map((it) => `<span class="matchp-chip">${it}</span>`).join("")}</div>` : ""}
        ${v.intro ? `<p class="matchp-card__intro">${(v.intro || "").replace(/</g, "&lt;").slice(0, 140)}</p>` : ""}
        ${(v.photos && v.photos.length) ? `<div class="matchp-card__ph">${v.photos.slice(0, 3).map((p) => `<img src="${p}" alt="" loading="lazy" onerror="this.remove()" />`).join("")}</div>` : ""}
        <a class="btn btn--soft btn--sm" href="vendors.html">파트너 목록에서 보기 →</a>
      </div>
    </div>`;
  }).join("");
  box.addEventListener("click", (e) => {
    const t = e.target.closest("[data-mptoggle]"); if (!t) return;
    const body = box.querySelector(`[data-mpbody="${t.dataset.mptoggle}"]`);
    const card = t.closest(".matchp-card");
    if (body) { const show = body.hidden; body.hidden = !show; card.classList.toggle("is-open", show); }
  });
}
renderMatchPartners();

// ---------- 예약 위젯 (달력 + 시간, 중복 방지) ----------
const bkStart = $("#bkStart"), bkHours = $("#bkHours"), bkGuests = $("#bkGuests");
const pad = (n) => String(n).padStart(2, "0");
const fmtD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
let calMonth = new Date(todayD.getFullYear(), todayD.getMonth(), 1);
let selDate = fmtD(new Date(todayD.getTime() + 86400000)); // 내일

const SET = window.SETTINGS.get(S.id);
for (let h = 9; h <= 21; h++) bkStart.insertAdjacentHTML("beforeend", `<option value="${h}">${pad(h)}:00</option>`);
bkStart.value = 14;
for (let h = SET.minH; h <= SET.maxH; h++) bkHours.insertAdjacentHTML("beforeend", `<option value="${h}">${h}시간</option>`);
bkHours.value = Math.max(SET.minH, Math.min(2, SET.maxH));

// 이미 예약된 시간(같은 공간·같은 날짜) + 청소 버퍼 → 중복 방지
function occupiedHours(dateStr) {
  const occ = new Set();
  const buf = SET.buffer || 0;
  window.BOOKINGS.list().filter((b) => b.spaceId === S.id && b.date === dateStr && b.status !== "declined" && b.status !== "cancelled")
    .forEach((b) => { for (let h = b.start; h < b.start + b.hours + buf; h++) occ.add(h); });
  // 호스트가 차단한 시간대(공사·정비 등)도 예약 불가
  if (window.BLOCKS) window.BLOCKS.getSlots(S.id, dateStr).forEach((h) => occ.add(h));
  return occ;
}
const WD = ["일", "월", "화", "수", "목", "금", "토"];
function renderCal() {
  const y = calMonth.getFullYear(), m = calMonth.getMonth();
  const startWd = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const canPrev = calMonth > new Date(todayD.getFullYear(), todayD.getMonth(), 1);
  const canNext = calMonth < new Date(todayD.getFullYear(), todayD.getMonth() + 2, 1);
  let cells = "";
  for (let i = 0; i < startWd; i++) cells += `<span class="cal-e"></span>`;
  for (let d = 1; d <= days; d++) {
    const dt = new Date(y, m, d); const ds = fmtD(dt); const past = dt < todayD; const blk = window.BLOCKS.has(S.id, ds);
    const partial = !blk && window.BLOCKS.slotCount(S.id, ds) > 0; // 일부 시간대만 차단
    cells += `<button type="button" class="cal-d ${ds === selDate ? "is-sel" : ""} ${blk ? "is-block" : ""} ${partial ? "is-partial" : ""}" data-d="${ds}" ${past || blk ? "disabled" : ""}${partial ? ' title="일부 시간대 예약 불가"' : ""}>${d}</button>`;
  }
  $("#bkCal").innerHTML =
    `<div class="cal-top"><button type="button" class="cal-nav" data-cal="-1" ${canPrev ? "" : "disabled"}>‹</button><b>${y}년 ${m + 1}월</b><button type="button" class="cal-nav" data-cal="1" ${canNext ? "" : "disabled"}>›</button></div>
     <div class="cal-wd">${WD.map((w) => `<span>${w}</span>`).join("")}</div>
     <div class="cal-grid">${cells}</div>`;
}
function refreshSlots() {
  const occ = occupiedHours(selDate);
  const isToday = selDate === fmtD(todayD);
  const nowH = new Date().getHours();
  [...bkStart.options].forEach((o) => { o.disabled = occ.has(+o.value) || (isToday && +o.value <= nowH); });
  if (bkStart.selectedOptions[0] && bkStart.selectedOptions[0].disabled) { const av = [...bkStart.options].find((o) => !o.disabled); if (av) bkStart.value = av.value; }
  const start = +bkStart.value;
  [...bkHours.options].forEach((o) => { const h = +o.value; let ok = start + h <= 22; for (let x = start; x < start + h; x++) if (occ.has(x)) ok = false; o.disabled = !ok; });
  if (bkHours.selectedOptions[0] && bkHours.selectedOptions[0].disabled) { const av = [...bkHours.options].find((o) => !o.disabled); if (av) bkHours.value = av.value; }
  recalc();
}
let couponPct = 0, couponFlat = 0;
function renderPrice() {
  const fp = window.priceOf(S);
  $("#bkPrice").innerHTML = fp.pct
    ? `<span class="book__old">${won(fp.orig)}원</span><strong>${won(fp.price)}원</strong><span>/ 시간</span><span class="book__flash">${iconSVG("bolt", 12)}${fp.pct}%</span>`
    : `<strong>${won(fp.price)}원</strong><span>/ 시간</span>`;
}
function recalc() {
  const hours = +bkHours.value;
  const fp = window.priceOf(S);
  const unit = couponPct ? Math.round(fp.price * (100 - couponPct) / 100 / 100) * 100 : fp.price;
  const subRaw = unit * hours;
  const sub = Math.max(0, subRaw - couponFlat), fee = Math.round(sub * (window.CUSTOMER_FEE || 0));
  const save = fp.orig * hours - sub;
  $("#bkCalc").textContent = `${won(unit)}원 × ${hours}시간`;
  $("#bkSub").textContent = won(sub) + "원";
  const dr = $("#bkDiscRow");
  if (save > 0) { dr.hidden = false; $("#bkDiscLbl").textContent = "할인" + (fp.pct ? ` ${fp.pct}%` : "") + (couponPct ? ` · 쿠폰 ${couponPct}%` : "") + (couponFlat ? ` · 쿠폰 -${won(couponFlat)}원` : ""); $("#bkDisc").textContent = "-" + won(save) + "원"; }
  else dr.hidden = true;
  $("#bkFee").textContent = won(fee) + "원";
  // 부대서비스 예상 옵션 합계
  const optEls = [...document.querySelectorAll(".bk-opt:checked")];
  const optSum = optEls.reduce((a, el) => a + (+el.value || 0), 0);
  const optRow = $("#bkOptRow");
  if (optRow) { if (optSum > 0) { optRow.hidden = false; $("#bkOptLbl").textContent = `부대서비스 예상 (${optEls.length}종)`; $("#bkOpt").textContent = "+" + won(optSum) + "원"; } else optRow.hidden = true; }
  const grand = sub + fee + optSum;
  $("#bkTotal").textContent = won(grand) + "원";
  const mo = $("#bkMoTotal"); if (mo) mo.textContent = won(grand) + "원";
  recalc._unit = unit; recalc._total = sub + fee; recalc._optSum = optSum;
}
renderPrice();
if ($("#bkCouponBtn")) $("#bkCouponBtn").addEventListener("click", () => {
  const code = $("#bkCoupon").value.trim();
  const msg = $("#bkCouponMsg");
  couponPct = 0; couponFlat = 0;
  // 1) 호스트 쿠폰(개별 공간)
  const hp = window.DISCOUNT.couponPct(S.id, code);
  if (hp) { couponPct = hp; msg.textContent = `호스트 쿠폰 적용 · ${hp}% 할인`; msg.className = "book__couponmsg ok"; recalc(); return; }
  // 2) 와일리(플랫폼) 쿠폰
  const fp = window.priceOf(S); const sub = fp.price * (+bkHours.value);
  const pc = window.PCOUPONS ? window.PCOUPONS.validate(code, { scope: "space", amount: sub }) : null;
  if (pc && pc.ok) { if (pc.coupon.discType === "amount") couponFlat = pc.off; else couponPct = pc.coupon.value; couponPct2 = pc.coupon.id; msg.textContent = `와일리 쿠폰 적용 · ${pc.label}`; msg.className = "book__couponmsg ok"; recalc(); return; }
  msg.textContent = code ? (pc ? pc.msg : "유효하지 않은 쿠폰이에요") : ""; msg.className = "book__couponmsg no"; recalc();
});
let couponPct2 = null; // 적용된 플랫폼 쿠폰 id (결제 시 redeem)
$("#bkCal").addEventListener("click", (e) => {
  const nav = e.target.closest(".cal-nav");
  if (nav && !nav.disabled) { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + +nav.dataset.cal, 1); renderCal(); return; }
  const day = e.target.closest(".cal-d");
  if (day && !day.disabled) { selDate = day.dataset.d; renderCal(); refreshSlots(); }
});
bkStart.addEventListener("change", refreshSlots);
bkHours.addEventListener("change", recalc);
document.querySelectorAll(".bk-opt").forEach((el) => el.addEventListener("change", recalc));
{ const mg = document.getElementById("bkMoGo"); if (mg) mg.addEventListener("click", () => { const b = document.querySelector(".book"); if (b) b.scrollIntoView({ behavior: "smooth", block: "start" }); const go = document.getElementById("bkGo"); if (go) setTimeout(() => go.click(), 350); }); }
renderCal(); refreshSlots();

// 토스트
let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2600); }

const modal = $("#modal"), modalCard = $("#modalCard");
function closeModal() { modal.hidden = true; modalCard.innerHTML = ""; }
modal.addEventListener("click", (e) => { if (e.target.closest("[data-mclose]")) closeModal(); });

$("#bkGo").addEventListener("click", () => {
  const start = +bkStart.value, hours = +bkHours.value, g = +bkGuests.value;
  if (bkStart.selectedOptions[0] && bkStart.selectedOptions[0].disabled) { toast("선택한 시간은 예약이 찼어요"); return; }
  if (!g || g < 1) { toast("인원을 입력해주세요"); return; }
  if (g > S.capacity) { toast(`최대 ${S.capacity}인까지 이용 가능해요`); return; }
  const a = window.AUTH.get();
  if (!a) { toast("로그인 후 예약할 수 있어요"); setTimeout(() => (location.href = "login.html"), 900); return; }
  if (a.role !== "guest") { toast("예약은 일반 회원만 가능해요"); return; }
  if ((S.ownerId || "host") === a.userId) { toast("내 공간에는 예약할 수 없어요"); return; }
  // 상세 예약/견적 페이지로 이동 — 공간 예약 + 부대서비스 함께 진행
  const p = new URLSearchParams({ space: S.id, date: selDate, start: start, hours: hours, guests: g });
  location.href = "request.html?" + p.toString();
});

// 호스트에게 1:1 문의(채팅)
const spInq = $("#spInquire");
if (spInq) spInq.addEventListener("click", () => {
  const a = window.AUTH.get();
  if (!a) { toast("로그인 후 문의할 수 있어요"); setTimeout(() => (location.href = "login.html"), 900); return; }
  if (a.role !== "guest") { toast("호스트 문의·채팅은 일반 회원만 가능해요"); return; }
  const hostId = S.ownerId || "host";
  if (hostId === a.userId) { toast("내 공간에는 문의할 수 없어요"); return; }
  const tid = "s:" + S.id;
  window.CHATMETA.set(tid, { title: S.name, hostId, guestId: a.userId });
  if (window.openChatWidget) window.openChatWidget(tid);
  else toast("채팅을 열 수 없어요");
});

// 찜하기
const favBtn = $("#spFav");
if (favBtn) favBtn.addEventListener("click", () => {
  const on = window.FAV.toggle(S.id);
  favBtn.classList.toggle("is-on", on);
  $("#spFavTxt").textContent = on ? "찜함" : "찜";
  toast(on ? "찜 목록에 담았어요" : "찜을 해제했어요");
});

// 공유하기 (카카오톡 · 링크 복사 · 시스템 공유)
function copyLink() {
  const url = location.href;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => toast("링크를 복사했어요")).catch(() => fallbackCopy(url));
  } else fallbackCopy(url);
}
function fallbackCopy(url) {
  const ta = document.createElement("textarea"); ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); toast("링크를 복사했어요"); } catch (e) { toast("링크 복사에 실패했어요"); }
  ta.remove();
}
const shareBtn = $("#spShare");
if (shareBtn) shareBtn.addEventListener("click", () => {
  modal.hidden = false;
  modalCard.innerHTML = `
    <div class="modal__head"><b>공유하기</b><button class="modal__x" data-mclose>✕</button></div>
    <p class="share__sub">${S.name}<br /><span>일행과 링크를 공유하고 함께 결정하세요</span></p>
    <div class="share__grid">
      <button class="share__b share__b--kko" data-share="kakao"><span class="share__ic">${iconSVG("chat", 18)}</span>카카오톡</button>
      <button class="share__b" data-share="copy"><span class="share__ic">${iconSVG("link", 18)}</span>링크 복사</button>
      <button class="share__b" data-share="more"><span class="share__ic">${iconSVG("upload", 18)}</span>다른 앱</button>
    </div>`;
  modalCard.querySelector(".share__grid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-share]"); if (!b) return;
    const how = b.dataset.share, url = location.href, title = `${S.name} · 공간잇다`;
    if (how === "kakao") {
      if (window.Kakao && window.Kakao.Share && window.Kakao.isInitialized && window.Kakao.isInitialized()) {
        window.Kakao.Share.sendDefault({ objectType: "feed", content: { title, description: `${S.region} · 최대 ${S.capacity}인 · ${won(S.price)}원/시간`, imageUrl: spaceImg(S, 800, 420) || "", link: { mobileWebUrl: url, webUrl: url } } });
      } else { copyLink(); toast("링크를 복사했어요 — 카카오톡에 붙여넣기 하세요"); }
    } else if (how === "copy") { copyLink(); }
    else if (how === "more") {
      if (navigator.share) navigator.share({ title, text: `${S.name} 같이 보러 가요`, url }).catch(() => {});
      else copyLink();
    }
    closeModal();
  });
});

function openConfirm(start, hours, g) {
  const total = recalc._total, unit = recalc._unit;
  const dep = (S.deposit && S.deposit.amount) ? +S.deposit.amount : 0;
  const auto = window.SETTINGS.get(S.id).autoAccept;
  modal.hidden = false;
  modalCard.innerHTML = `
    <div class="modal__head"><b>예약 확인</b><button class="modal__x" data-mclose>✕</button></div>
    <div class="cf">
      <div class="cf-row"><span>공간</span><b>${S.name}</b></div>
      <div class="cf-row"><span>일시</span><b>${selDate} ${pad(start)}:00~${pad(start + hours)}:00</b></div>
      <div class="cf-row"><span>인원</span><b>${g}인</b></div>
      <div class="cf-row"><span>시간요금</span><b>${won(unit)}원 × ${hours}시간</b></div>
      <div class="cf-total"><span>${dep ? "① 공간 이용료" : "총 결제금액"}</span><b>${won(total)}원</b></div>
      ${dep ? `<div class="cf-total cf-total--dep"><span>② 청소 보증금 <em>별도 결제</em></span><b>${won(dep)}원</b></div>` : ""}
    </div>
    ${dep ? `<p class="cf-depnote">${iconSVG("won", 14)} 이용료와 보증금은 <b>각각 따로 카드 결제</b>됩니다. 보증금은 이용 후 파손·미정리가 없으면 <b>전액 환불</b>돼요. <span>(보증금은 매출이 아닌 예수금입니다)</span></p>` : ""}
    <p class="cf-policy">취소·환불: ${(window.SITECFG ? window.SITECFG.get().refund : "이용 3일 전 100% · 1~2일 전 50% · 당일 환불 불가")} <a href="#" data-legal="refund" style="color:var(--accent);font-weight:700">전문 보기</a></p>
    <button class="btn btn--accent btn--lg btn--block" id="cfGo">${dep ? `이용료·보증금 결제하고 ${auto ? "예약" : "요청"}` : (auto ? "결제하고 즉시 예약" : "결제하고 예약 요청")}</button>
    <p class="modal__note">데모 결제 — 실제로 청구되지 않습니다.</p>`;
  $("#cfGo").addEventListener("click", () => doBooking(start, hours, g));
}
function doBooking(start, hours, g) {
  const a = window.AUTH.get();
  const unit = recalc._unit, total = recalc._total;
  const hostId = S.ownerId || "host";
  const set = window.SETTINGS.get(S.id);
  const auto = set.autoAccept;
  const status = auto ? "confirmed" : "requested";
  const bid = "b" + Date.now();
  // 예약 = 공간 이용료만 (보증금은 별도 · 매출/정산 미포함)
  window.BOOKINGS.add({ id: bid, spaceId: S.id, spaceName: S.name, hostId, guestId: a.userId, guestName: window.AUTH.displayName(a), price: unit, coupon: couponPct || 0, date: selDate, start, hours, guests: g, total, status, ts: Date.now() });
  // 청소 보증금 = 별도 카드 결제 → 예수금으로 기록(이용 후 환불)
  const dep = (S.deposit && S.deposit.amount) ? +S.deposit.amount : 0;
  if (dep > 0 && window.DEPOSITS) {
    window.DEPOSITS.add({ id: "dep" + Date.now(), bookingId: bid, spaceId: S.id, spaceName: S.name, hostId, guestId: a.userId, guestName: window.AUTH.displayName(a), amount: dep, date: selDate, ts: Date.now(), deduct: 0 });
  }
  if (couponPct2 && window.PCOUPONS) window.PCOUPONS.redeem(couponPct2); // 와일리 쿠폰 사용 처리
  window.NOTIF.add({ forUser: hostId, title: S.name, sub: (auto ? "새 예약(자동수락)" : "새 예약 요청") + ` · ${selDate} ${pad(start)}:00`, link: "mypage.html" });
  // 자동 수락 시: 호스트가 미리 적어둔 이용 안내 메시지를 게스트에게 전달
  if (auto && set.autoMsg) window.NOTIF.add({ forUser: a.userId, title: `${S.name} · 이용 안내`, sub: set.autoMsg, link: "mypage.html" });
  // 청소 보증금 결제 완료 안내(카드 별도 결제)
  if (dep > 0) window.NOTIF.add({ forUser: a.userId, title: "청소 보증금 결제 완료", sub: `${won(dep)}원 별도 결제 · 이용 후 파손 없으면 환불`, link: "mypage.html?tab=book" });
  closeModal();
  toast(auto ? "예약이 확정되었어요!" : "예약을 요청했어요! 호스트 확인을 기다려 주세요");
  setTimeout(() => (location.href = "mypage.html"), 1100);
}

// 상세 섹션 내비 (sticky + 스크롤 스파이 + 부드러운 이동)
(function spNav() {
  const sn = $("#spNav"); if (!sn) return;
  const links = [...sn.querySelectorAll("[data-sec]")];
  const secs = () => links.map((l) => document.getElementById(l.dataset.sec)).filter(Boolean);
  function onScroll() {
    const y = window.scrollY + 150; let cur = null;
    secs().forEach((s) => { if (s.offsetTop <= y) cur = s; });
    links.forEach((l) => l.classList.toggle("is-active", cur && l.dataset.sec === cur.id));
  }
  sn.addEventListener("click", (e) => { const a = e.target.closest("[data-sec]"); if (!a) return; e.preventDefault(); const s = document.getElementById(a.dataset.sec); if (s) window.scrollTo({ top: s.offsetTop - 110, behavior: "smooth" }); });
  window.addEventListener("scroll", onScroll); onScroll();
})();
})();

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
