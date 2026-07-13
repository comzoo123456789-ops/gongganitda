// ============================================================
// 공간잇다 — 공간 상세 · 예약 페이지
// ============================================================
const $ = (s) => document.querySelector(s);
const won = (n) => n.toLocaleString("ko-KR");
const params = new URLSearchParams(location.search);
const id = +params.get("id");
const ALL = getAllSpaces();
const S = ALL.find((s) => s.id === id) || ALL[0];
const C = catById(S.cat);
const SG = S.g || [C.ink, "#cfc7b8"];

// 같은 유형의 다른 공간 (갤러리 보조 이미지 + 관련 공간)
const others = ALL.filter((s) => s.id !== S.id);
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
    <div class="sp-gallery__main" style="background:linear-gradient(135deg,${SG[0]},${SG[1]})">${spaceImg(S, 1000, 900) ? `<img src="${spaceImg(S, 1000, 900)}" alt="${S.name}" onerror="this.remove()" />` : ""}</div>
    ${galleryExtra.slice(0, 2).map((g) => { const gg = g.g || [C.ink, "#cfc7b8"]; const u = spaceImg(g, 500, 400); return `<div class="sp-gallery__sm" style="background:linear-gradient(135deg,${gg[0]},${gg[1]})">${u ? `<img src="${u}" alt="" onerror="this.remove()" />` : ""}</div>`; }).join("")}
  </div>

  <div class="sp-layout">
    <div class="sp-main">
      <div class="sp-head">
        <span class="sp-head__cat">${C.label}</span>
        <h1 class="sp-head__title">${S.name}</h1>
        <div class="sp-head__meta">
          <span class="rate">${S.reviews ? `${iconSVG("star", 16)}${S.rating} <em style="color:var(--faint);font-weight:500">· 후기 ${S.reviews}</em>` : `<em style="color:var(--accent);font-weight:700">신규 공간</em>`}</span>
          <span>${iconSVG("pin", 16)}${S.region}</span>
          <span>${iconSVG("users", 16)}최대 ${S.capacity}인</span>
        </div>
      </div>

      <div class="sp-sec">
        <h2 class="sp-sec__title">공간 소개</h2>
        <p class="sp-desc">${S.region}에 위치한 <b>${S.name}</b>은(는) 최대 ${S.capacity}인까지 이용 가능한 ${C.label} 공간입니다. 시간 단위로 편하게 대관할 수 있으며, 필요한 기본 시설을 모두 갖추고 있어 준비 없이도 바로 이용하실 수 있습니다. 모임·행사·작업 등 목적에 맞게 자유롭게 활용해 보세요.</p>
      </div>

      <div class="sp-sec">
        <h2 class="sp-sec__title">편의시설</h2>
        <ul class="sp-amen">
          ${S.tags.map((t) => `<li>${iconSVG(amenIcon(t), 18)}${t}</li>`).join("")}
        </ul>
      </div>

      <div class="sp-sec">
        <h2 class="sp-sec__title">이용 후기 ${S.reviews ? `<span style="color:var(--gold)">★ ${S.rating}</span> <span style="color:var(--faint);font-weight:500;font-size:0.9rem">(${S.reviews})</span>` : ""}</h2>
        ${S.reviews ? `<div class="sp-rev">
          ${reviews().map((r) => `<div class="sp-revrow">
            <span class="sp-revrow__av" style="background:${r.color}">${r.name.charAt(0)}</span>
            <div><div class="sp-revrow__name">${r.name}</div><div class="sp-revrow__stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div><div class="sp-revrow__txt">${r.txt}</div></div>
          </div>`).join("")}
        </div>` : `<p class="sp-desc" style="color:var(--muted)">아직 등록된 후기가 없어요. 첫 이용 후기를 남겨보세요.</p>`}
      </div>

      <div class="sp-sec">
        <h2 class="sp-sec__title">이용 안내</h2>
        <p class="sp-desc" style="font-size:0.9rem;color:var(--muted)">· 예약은 시간 단위로 가능하며, 최소 1시간부터 이용할 수 있습니다.<br />· 퇴실 시 공간을 이용 전 상태로 정리해 주세요.<br />· 취소·환불 규정은 예약 확정 시 안내됩니다. (데모 사이트)</p>
      </div>

      <div class="sp-sec">
        <h2 class="sp-sec__title">비슷한 공간</h2>
        <div class="sp-rel" id="relGrid"></div>
      </div>
    </div>

    <!-- 예약 카드 -->
    <aside>
      <div class="book">
        <div class="book__price"><strong>${won(S.price)}원</strong><span>/ 시간</span></div>
        <div class="book__field">
          <label class="book__label">날짜</label>
          <input type="date" id="bkDate" />
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
        <div class="book__sum">
          <div class="book__sumrow"><span id="bkCalc">${won(S.price)}원 × 2시간</span><span id="bkSub">${won(S.price * 2)}원</span></div>
          <div class="book__sumrow"><span>서비스 수수료</span><span id="bkFee">${won(Math.round(S.price * 2 * 0.05))}원</span></div>
          <div class="book__total"><span>총 결제금액</span><b id="bkTotal">${won(Math.round(S.price * 2 * 1.05))}원</b></div>
        </div>
        <button class="btn btn--accent btn--lg btn--block" id="bkGo">예약 요청하기</button>
        <p class="book__note">아직 결제되지 않아요 · 호스트 승인 후 확정됩니다</p>
      </div>
    </aside>
  </div>
`;

document.title = `${S.name} · 공간잇다`;

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

// ---------- 예약 위젯 ----------
const bkDate = $("#bkDate"), bkStart = $("#bkStart"), bkHours = $("#bkHours"), bkGuests = $("#bkGuests");
const today = new Date(); today.setDate(today.getDate() + 1);
bkDate.value = today.toISOString().slice(0, 10);
bkDate.min = new Date().toISOString().slice(0, 10);
for (let h = 9; h <= 21; h++) bkStart.insertAdjacentHTML("beforeend", `<option value="${h}">${String(h).padStart(2, "0")}:00</option>`);
bkStart.value = 14;
for (let h = 1; h <= 8; h++) bkHours.insertAdjacentHTML("beforeend", `<option value="${h}">${h}시간</option>`);
bkHours.value = 2;

function recalc() {
  const hours = +bkHours.value;
  const sub = S.price * hours;
  const fee = Math.round(sub * 0.05);
  const start = +bkStart.value, end = start + hours;
  $("#bkCalc").textContent = `${won(S.price)}원 × ${hours}시간`;
  $("#bkSub").textContent = won(sub) + "원";
  $("#bkFee").textContent = won(fee) + "원";
  $("#bkTotal").textContent = won(sub + fee) + "원";
  // 마감 시간 초과 방지
  [...bkHours.options].forEach((o) => (o.disabled = start + +o.value > 23));
}
bkStart.addEventListener("change", recalc);
bkHours.addEventListener("change", recalc);
recalc();

// 토스트
let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2600); }

$("#bkGo").addEventListener("click", () => {
  const start = +bkStart.value, hours = +bkHours.value;
  const g = +bkGuests.value;
  if (g > S.capacity) { toast(`최대 ${S.capacity}인까지 이용 가능해요`); return; }
  toast(`예약 요청 완료! ${bkDate.value} ${String(start).padStart(2, "0")}:00~${String(start + hours).padStart(2, "0")}:00 · ${g}인 (데모)`);
});

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
