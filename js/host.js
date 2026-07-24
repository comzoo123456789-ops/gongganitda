// ============================================================
// 공간잇다 — 호스트 공간 등록 (localStorage 저장, 데모)
// ============================================================
const $ = (s) => document.querySelector(s);
const won = (n) => (+n || 0).toLocaleString("ko-KR");
const AMENITIES = ["주차", "와이파이", "빔프로젝터", "취사 가능", "음향 시설", "방음", "화이트보드", "무드 조명", "냉난방", "노래방"];

// 유형 select · 편의시설 체크
$("#hCat").innerHTML = `<option value="">선택하세요</option>` + CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join("");
$("#hAmen").innerHTML = AMENITIES.map((a) => `<label class="hf-chk"><input type="checkbox" value="${a}" /><span>${a}</span></label>`).join("");

// ---------- 편의시설 직접 추가 (커스텀 태그) ----------
function addAmen(raw) {
  const v = (raw || "").trim(); if (!v) return;
  const exists = [...document.querySelectorAll('#hAmen input')].some((i) => i.value === v);
  if (exists) { const el = [...document.querySelectorAll('#hAmen input')].find((i) => i.value === v); if (el) el.checked = true; renderPreview(); return; }
  const lbl = document.createElement("label");
  lbl.className = "hf-chk hf-chk--custom";
  lbl.innerHTML = `<input type="checkbox" value="${v.replace(/"/g, "&quot;")}" checked /><span>${v.replace(/</g, "&lt;")}</span><button type="button" class="hf-chk__x" aria-label="삭제">✕</button>`;
  $("#hAmen").appendChild(lbl);
  renderPreview();
}
$("#hAmenAdd").addEventListener("click", () => { addAmen($("#hAmenInput").value); $("#hAmenInput").value = ""; $("#hAmenInput").focus(); });
$("#hAmenInput").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addAmen(e.target.value); e.target.value = ""; } });
$("#hAmen").addEventListener("click", (e) => { const x = e.target.closest(".hf-chk__x"); if (x) { e.preventDefault(); x.closest(".hf-chk").remove(); renderPreview(); } });

// ---------- 이미지 업로드 (드롭존 · 최대 10장 · 순서변경/삭제) ----------
const MAX_PHOTOS = 10;
let photos = [];
function downscaleImg(file, max, cb) {
  const rd = new FileReader();
  rd.onload = () => { const img = new Image(); img.onload = () => {
    let w = img.width, h = img.height;
    if (w > max || h > max) { if (w > h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } }
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").drawImage(img, 0, 0, w, h);
    try { cb(cv.toDataURL("image/jpeg", 0.72)); } catch (e) { cb(rd.result); }
  }; img.onerror = () => cb(rd.result); img.src = rd.result; };
  rd.readAsDataURL(file);
}
let dragFrom = -1;
function renderPhotos() {
  const grid = $("#hPhotoGrid");
  grid.innerHTML = photos.map((p, i) => `<div class="ph-thumb${i === 0 ? " is-rep" : ""}" draggable="true" data-i="${i}">
    <img src="${p}" alt="" />
    ${i === 0 ? `<span class="ph-thumb__rep">대표</span>` : ""}
    <button type="button" class="ph-thumb__x" data-rmph="${i}" aria-label="삭제">✕</button>
  </div>`).join("");
  renderPreview();
}
function addPhotos(urls) {
  urls.forEach((u) => { if (photos.length < MAX_PHOTOS && u) photos.push(u); });
  if (urls.length && photos.length >= MAX_PHOTOS) toast(`사진은 최대 ${MAX_PHOTOS}장까지 등록할 수 있어요`);
  renderPhotos();
}
function handleFiles(files) {
  [...files].filter((f) => /^image\//.test(f.type)).slice(0, MAX_PHOTOS).forEach((f) => {
    if (photos.length >= MAX_PHOTOS) { toast(`사진은 최대 ${MAX_PHOTOS}장까지 등록할 수 있어요`); return; }
    downscaleImg(f, 1200, (url) => { if (photos.length < MAX_PHOTOS) { photos.push(url); renderPhotos(); } });
  });
}
const drop = $("#hDrop"), fileInput = $("#hFile");
drop.addEventListener("click", () => fileInput.click());
drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } });
fileInput.addEventListener("change", () => { handleFiles(fileInput.files); fileInput.value = ""; });
["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("is-over"); }));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); if (ev !== "drop" || !drop.contains(e.relatedTarget)) drop.classList.remove("is-over"); }));
drop.addEventListener("drop", (e) => { if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files); });
$("#hUrlAdd").addEventListener("click", () => { const u = $("#hPhoto").value.trim(); if (u) { addPhotos([u]); $("#hPhoto").value = ""; } });
$("#hPhoto").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("#hUrlAdd").click(); } });
$("#hPhotoGrid").addEventListener("click", (e) => { const b = e.target.closest("[data-rmph]"); if (b) { photos.splice(+b.dataset.rmph, 1); renderPhotos(); } });
// 드래그로 순서 변경 (맨 앞 = 대표)
$("#hPhotoGrid").addEventListener("dragstart", (e) => { const t = e.target.closest(".ph-thumb"); if (t) { dragFrom = +t.dataset.i; e.dataTransfer.effectAllowed = "move"; t.classList.add("is-drag"); } });
$("#hPhotoGrid").addEventListener("dragend", (e) => { const t = e.target.closest(".ph-thumb"); if (t) t.classList.remove("is-drag"); });
$("#hPhotoGrid").addEventListener("dragover", (e) => { e.preventDefault(); });
$("#hPhotoGrid").addEventListener("drop", (e) => {
  e.preventDefault(); const t = e.target.closest(".ph-thumb"); if (!t || dragFrom < 0) return;
  const to = +t.dataset.i; if (to === dragFrom) return;
  const [m] = photos.splice(dragFrom, 1); photos.splice(to, 0, m); dragFrom = -1; renderPhotos();
});

// ---------- 핵심 옵션 해시태그 ----------
const TAG_SUGGEST = ["주차3대가능", "빔프로젝터", "루프탑뷰", "반려동물가능", "24시간운영", "무선마이크", "취사가능", "역5분", "대형스크린", "포토존", "음향완비", "짐보관가능"];
let optTags = [];
function renderTags() {
  $("#hTagList").innerHTML = optTags.map((t, i) => `<span class="optag optag--edit">#${t}<button type="button" data-deltag="${i}" aria-label="삭제">✕</button></span>`).join("");
  $("#hTagSug").innerHTML = TAG_SUGGEST.filter((t) => !optTags.includes(t)).slice(0, 8).map((t) => `<button type="button" class="tagsug__b" data-addtag="${t}">+ ${t}</button>`).join("");
}
function addTag(raw) {
  const t = (raw || "").replace(/^#/, "").replace(/\s+/g, "").trim();
  if (!t || optTags.includes(t) || optTags.length >= 8) return;
  optTags.push(t); renderTags(); renderPreview();
}
$("#hTagInput").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addTag(e.target.value); e.target.value = ""; } });
$("#hTagSug").addEventListener("click", (e) => { const b = e.target.closest("[data-addtag]"); if (b) { addTag(b.dataset.addtag); } });
$("#hTagList").addEventListener("click", (e) => { const b = e.target.closest("[data-deltag]"); if (b) { optTags.splice(+b.dataset.deltag, 1); renderTags(); renderPreview(); } });

// 수정 모드 (?id=) — 기존 공간 불러와 채우기
const editId = +new URLSearchParams(location.search).get("id") || 0;
let editSpace = null;
if (editId) {
  // 등록 공간 + 샘플 공간 모두 수정 가능하도록 전체에서 조회
  editSpace = (typeof getAllSpaces === "function" ? getAllSpaces() : []).find((s) => s.id === editId);
  if (editSpace) {
    $("#hTitle").textContent = "공간 수정";
    $("#hSub").textContent = "등록한 공간의 정보를 수정하세요.";
    $("#hSubmit").textContent = "수정 저장";
    $("#hName").value = editSpace.name || "";
    $("#hCat").value = editSpace.cat || "";
    $("#hCapacity").value = editSpace.capacity || "";
    $("#hRegion").value = editSpace.region || "";
    $("#hPrice").value = editSpace.price || "";
    $("#hDesc").value = editSpace.desc || "";
    // 편의시설: 기본 목록은 체크, 목록에 없는 커스텀 태그는 추가
    const amenVals = editSpace.tags || [];
    document.querySelectorAll("#hAmen input").forEach((i) => { i.checked = amenVals.indexOf(i.value) >= 0; });
    amenVals.filter((a) => !AMENITIES.includes(a)).forEach((a) => addAmen(a));
    optTags = (editSpace.optTags || []).slice(0, 8);
    photos = (editSpace.photos && editSpace.photos.length) ? editSpace.photos.slice(0, MAX_PHOTOS) : (editSpace.photo ? [editSpace.photo] : []);
    if (editSpace.deposit) { $("#hDeposit").value = editSpace.deposit.amount || ""; $("#hDepBank").value = editSpace.deposit.bank || ""; $("#hDepAcct").value = editSpace.deposit.account || ""; }
  }
}
renderTags();
renderPhotos();

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
    photo: photos[0] || "",
    g: [c.ink, c.tint],
    tags: checkedAmen(),
    optTags: optTags.slice(),
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
      ${d.optTags && d.optTags.length ? `<div class="sp-tags">${d.optTags.slice(0, 3).map((t) => `<span class="optag">#${t}</span>`).join("")}</div>` : ""}
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
  const depAmt = +$("#hDeposit").value || 0;
  const deposit = depAmt > 0 ? { amount: depAmt, bank: val("#hDepBank"), account: val("#hDepAcct") } : null;
  const fields = { name, cat, region, price, capacity, tags: checkedAmen(), optTags: optTags.slice(), desc: val("#hDesc"), photos: photos.slice(), photo: photos[0] || "", deposit, g: [c.ink, c.tint] };
  let mine = [];
  try { mine = JSON.parse(localStorage.getItem("gi_spaces") || "[]"); } catch (e2) {}
  let goId;
  if (editId && editSpace) {
    const i = mine.findIndex((s) => s.id === editId);
    if (i >= 0) mine[i] = Object.assign({}, mine[i], fields);
    else mine.unshift(Object.assign({}, editSpace, fields, { id: editId })); // 샘플 공간 수정 → gi_spaces에 오버라이드 저장
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

// 주소 검색 (데모) — 실서비스에선 카카오/도로명 주소 API 연동
$("#hAddrSearch").addEventListener("click", () => {
  const q = prompt("주소 검색 (데모)\n도로명·지번 주소를 입력하면 그대로 반영됩니다.\n예) 서울 성동구 성수동 12-3", $("#hRegion").value || "");
  if (q && q.trim()) { $("#hRegion").value = q.trim(); renderPreview(); toast("주소를 반영했어요"); }
});

// 햄버거
const hm = $("#hmenu"), nav = $("#nav");
if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
