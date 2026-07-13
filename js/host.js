// ============================================================
// 공간잇다 — 호스트 공간 등록 (localStorage 저장, 데모)
// ============================================================
const $ = (s) => document.querySelector(s);
const won = (n) => (+n || 0).toLocaleString("ko-KR");
const AMENITIES = ["주차", "와이파이", "빔프로젝터", "취사 가능", "음향 시설", "방음", "화이트보드", "무드 조명", "냉난방", "노래방"];

// 유형 select · 편의시설 체크
$("#hCat").innerHTML = `<option value="">선택하세요</option>` + CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join("");
$("#hAmen").innerHTML = AMENITIES.map((a) => `<label class="hf-chk"><input type="checkbox" value="${a}" /><span>${a}</span></label>`).join("");

// 수정 모드 (?id=) — 기존 공간 불러와 채우기
const editId = +new URLSearchParams(location.search).get("id") || 0;
let editSpace = null;
if (editId) {
  let mine = [];
  try { mine = JSON.parse(localStorage.getItem("gi_spaces") || "[]"); } catch (e) {}
  editSpace = mine.find((s) => s.id === editId);
  if (editSpace) {
    $("#hTitle").textContent = "공간 수정";
    $("#hSub").textContent = "등록한 공간의 정보를 수정하세요.";
    $("#hSubmit").textContent = "수정 저장";
    $("#hName").value = editSpace.name || "";
    $("#hCat").value = editSpace.cat || "";
    $("#hCapacity").value = editSpace.capacity || "";
    $("#hRegion").value = editSpace.region || "";
    $("#hPrice").value = editSpace.price || "";
    $("#hPhoto").value = editSpace.photo || "";
    $("#hDesc").value = editSpace.desc || "";
    document.querySelectorAll("#hAmen input").forEach((i) => { i.checked = (editSpace.tags || []).indexOf(i.value) >= 0; });
  }
}

const val = (id) => $(id).value.trim();
const checkedAmen = () => [...document.querySelectorAll('#hAmen input:checked')].map((i) => i.value);

// ---------- 미리보기 ----------
function draft() {
  const catId = $("#hCat").value;
  const c = catId ? catById(catId) : { label: "유형", ink: "#8a7a4e", tint: "#e7e2d6" };
  return {
    name: val("#hName") || "공간 이름",
    cat: catId, catLabel: c.label,
    region: val("#hRegion") || "지역 · 주소",
    price: +$("#hPrice").value || 0,
    capacity: +$("#hCapacity").value || 0,
    photo: val("#hPhoto"),
    g: [c.ink, c.tint],
    tags: checkedAmen(),
  };
}
function renderPreview() {
  const d = draft();
  const img = d.photo;
  $("#hvCard").innerHTML = `<article class="sp-card">
    <div class="sp-card__thumb" style="background:linear-gradient(135deg,${d.g[0]},${d.g[1]})">
      ${img ? `<img src="${img}" alt="" onerror="this.remove()" />` : ""}
      <span class="sp-card__badge"><i></i>실시간 예약</span>
    </div>
    <div class="sp-card__body">
      <span class="sp-card__cat">${d.catLabel}</span>
      <h3 class="sp-card__name">${d.name}</h3>
      <div class="sp-card__meta">
        <span>${iconSVG("pin", 14)}${d.region.replace("서울 ", "")}</span>
        <span>${iconSVG("users", 14)}~${d.capacity || 0}인</span>
      </div>
      <div class="sp-card__foot">
        <span class="sp-card__price">${won(d.price)}<span>원 / 시간</span></span>
        <span class="sp-card__rating">${iconSVG("star", 14)}신규</span>
      </div>
    </div>
  </article>`;
}
document.addEventListener("input", renderPreview);
document.addEventListener("change", renderPreview);
renderPreview();

// ---------- 토스트 ----------
let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2600); }

// ---------- 저장 ----------
$("#hostForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("#hErr");
  const name = val("#hName"), cat = $("#hCat").value, region = val("#hRegion");
  const price = +$("#hPrice").value, capacity = +$("#hCapacity").value;
  if (!name || !cat || !region || !price || !capacity) {
    err.textContent = "필수 항목(*)을 모두 입력해 주세요.";
    err.hidden = false;
    return;
  }
  err.hidden = true;
  const c = catById(cat);
  const fields = { name, cat, region, price, capacity, tags: checkedAmen(), desc: val("#hDesc"), photo: val("#hPhoto"), g: [c.ink, c.tint] };
  let mine = [];
  try { mine = JSON.parse(localStorage.getItem("gi_spaces") || "[]"); } catch (e2) {}
  let goId;
  if (editId && editSpace) {
    const i = mine.findIndex((s) => s.id === editId);
    if (i >= 0) mine[i] = Object.assign({}, mine[i], fields);
    goId = editId;
    localStorage.setItem("gi_spaces", JSON.stringify(mine));
    toast("공간 정보를 수정했어요");
  } else {
    const space = Object.assign({ id: Date.now(), rating: 0, reviews: 0, now: true, host: true, ownerId: (window.AUTH && window.AUTH.get() ? window.AUTH.get().userId : "host") }, fields);
    goId = space.id;
    mine.unshift(space);
    localStorage.setItem("gi_spaces", JSON.stringify(mine));
    toast("공간이 등록되었어요!");
  }
  setTimeout(() => (location.href = "space.html?id=" + goId), 900);
});

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
