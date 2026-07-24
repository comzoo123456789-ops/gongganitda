// ============================================================
// 공간잇다 — 최근 본 / 찜한 공간 플로팅 퀵메뉴 (좌하단)
//   공간 데이터가 있는 페이지에 포함 (index/search/space/map/packages/vendors)
// ============================================================
(function () {
  if (document.getElementById("qm")) return;
  if (typeof getAllSpaces !== "function" || !window.FAV) return;
  const won = (n) => (+n || 0).toLocaleString("ko-KR");
  const cat = (id) => (typeof catById === "function" ? catById(id) : { label: "", ink: "#8a7a4e" });
  const img = (s, w, h) => (typeof spaceImg === "function" ? spaceImg(s, w, h) : (s.photo || ""));
  const priceOf = (s) => (window.priceOf ? window.priceOf(s) : { price: s.price, pct: 0 });
  const recent = () => { try { return JSON.parse(localStorage.getItem("gi_recent") || "[]"); } catch (e) { return []; } };
  const favs = () => { try { return window.FAV.list(); } catch (e) { return []; } };
  const byId = () => { const m = {}; getAllSpaces().forEach((s) => { if (!s.blinded && !s.rejected && !s.hidden) m[s.id] = s; }); return m; };

  const HEART = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20.3S3.5 15.5 3.5 9.4C3.5 6.6 5.6 4.7 8 4.7c1.7 0 3.1 1 4 2.3.9-1.3 2.3-2.3 4-2.3 2.4 0 4.5 1.9 4.5 4.7 0 6.1-8.5 10.9-8.5 10.9Z"/></svg>';

  const wrap = document.createElement("div");
  wrap.id = "qm"; wrap.className = "qm";
  wrap.innerHTML = `<div class="qm__panel" id="qmPanel" hidden></div>
    <button class="qm__fab" id="qmFab" aria-label="최근 본·찜한 공간">${HEART}<span class="qm__count" id="qmCount" hidden></span></button>`;
  document.body.appendChild(wrap);
  const fab = wrap.querySelector("#qmFab"), panel = wrap.querySelector("#qmPanel"), countEl = wrap.querySelector("#qmCount");
  let tab = "recent";

  function totalCount() { return favs().length + recent().length; }
  function refreshFab() {
    const fn = favs().length;
    countEl.textContent = fn; countEl.hidden = fn === 0;
    wrap.style.display = totalCount() ? "" : "none";
  }
  function miniCard(s, isFav) {
    const c = cat(s.cat), g = s.g || [c.ink, "#cfc7b8"], u = img(s, 150, 110), pr = priceOf(s);
    return `<div class="qm-card" data-qmgo="${s.id}">
      <span class="qm-card__thumb" style="background:linear-gradient(135deg,${g[0]},${g[1]})">${u ? `<img src="${u}" alt="" loading="lazy" onerror="this.remove()" />` : ""}</span>
      <span class="qm-card__body"><b>${s.name}</b><span class="qm-card__meta">${c.label} · ${won(pr.price)}원/시간</span></span>
      <button type="button" class="qm-card__heart${isFav ? " is-on" : ""}" data-qmfav="${s.id}" aria-label="찜">${HEART}</button>
    </div>`;
  }
  function draw() {
    const m = byId();
    const rc = recent().map((id) => m[id]).filter(Boolean);
    const fv = favs().map((id) => m[id]).filter(Boolean);
    const list = tab === "recent" ? rc : fv;
    const favSet = new Set(favs());
    panel.innerHTML = `
      <div class="qm__head">
        <div class="qm__tabs">
          <button type="button" class="qm__tab${tab === "recent" ? " is-on" : ""}" data-qmtab="recent">최근 본 <b>${rc.length}</b></button>
          <button type="button" class="qm__tab${tab === "fav" ? " is-on" : ""}" data-qmtab="fav">찜 <b>${fv.length}</b></button>
        </div>
        <button type="button" class="qm__x" data-qmx aria-label="닫기">✕</button>
      </div>
      <div class="qm__body">${list.length ? list.map((s) => miniCard(s, favSet.has(s.id))).join("") : `<div class="qm__empty">${tab === "recent" ? "최근 본 공간이 없어요.<br />공간을 둘러보면 여기에 모여요." : "찜한 공간이 없어요.<br />마음에 드는 공간에 하트를 눌러보세요."}</div>`}</div>`;
  }
  function open() { panel.hidden = false; draw(); }
  function close() { panel.hidden = true; }

  fab.addEventListener("click", (e) => { e.stopPropagation(); if (panel.hidden) open(); else close(); });
  panel.addEventListener("click", (e) => {
    e.stopPropagation(); // 패널 내부 클릭이 바깥-닫기 핸들러로 전파되지 않도록 (재렌더로 노드 분리 시 오판 방지)
    if (e.target.closest("[data-qmx]")) { close(); return; }
    const t = e.target.closest("[data-qmtab]"); if (t) { tab = t.dataset.qmtab; draw(); return; }
    const fv = e.target.closest("[data-qmfav]"); if (fv) { window.FAV.toggle(+fv.dataset.qmfav); refreshFab(); draw(); return; }
    const go = e.target.closest("[data-qmgo]"); if (go) { location.href = "space.html?id=" + go.dataset.qmgo; return; }
  });
  document.addEventListener("click", () => { if (!panel.hidden) close(); });

  refreshFab();
})();
