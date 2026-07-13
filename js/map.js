// ============================================================
// 공간잇다 — 지도 페이지
//  NAVER_MAP_KEY 있으면 네이버 지도 + 마커, 없으면 지역별 목록 + 네이버 링크
// ============================================================
(function () {
  const $ = (s) => document.querySelector(s);
  const won = (n) => (+n || 0).toLocaleString("ko-KR");
  const spaces = getAllSpaces();
  const key = window.NAVER_MAP_KEY;

  if (key) {
    const sc = document.createElement("script");
    sc.src = "https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=" + encodeURIComponent(key);
    sc.onload = initMap;
    sc.onerror = fallback;
    document.head.appendChild(sc);
  } else {
    fallback();
  }

  function initMap() {
    if (!window.naver || !naver.maps) { fallback(); return; }
    $("#mapFallback").hidden = true;
    const withCoord = spaces.filter((s) => s.lat && s.lng);
    const map = new naver.maps.Map("map", { center: new naver.maps.LatLng(37.53, 126.99), zoom: 11 });
    const bounds = new naver.maps.LatLngBounds();
    withCoord.forEach((s) => {
      const pos = new naver.maps.LatLng(s.lat, s.lng);
      const mk = new naver.maps.Marker({ position: pos, map, title: s.name });
      const iw = new naver.maps.InfoWindow({
        content: `<div style="padding:10px 14px;min-width:150px"><b style="font-size:0.95rem">${s.name}</b><br /><span style="color:#b0503a;font-weight:700">${won(s.price)}원/시간</span><br /><a href="space.html?id=${s.id}" style="color:#1c1a15;font-weight:700">상세 보기 →</a></div>`,
      });
      naver.maps.Event.addListener(mk, "click", () => iw.open(map, mk));
      bounds.extend(pos);
    });
    if (withCoord.length) map.fitBounds(bounds);
  }

  function fallback() {
    $("#map").style.display = "none";
    $("#mapNote").textContent = "지역별 공간 목록이에요. 항목을 누르면 네이버 지도에서 위치가 열립니다. (네이버 지도 키를 넣으면 지도 위 핀으로 표시됩니다)";
    const byGu = {};
    spaces.forEach((s) => { const gu = (s.region || "기타").split(" ").slice(0, 2).join(" "); (byGu[gu] = byGu[gu] || []).push(s); });
    $("#mapFallback").innerHTML = Object.keys(byGu).sort().map((gu) => `
      <div class="mapf-group">
        <h3 class="mapf-group__t">${gu} <span>${byGu[gu].length}</span></h3>
        <div class="mapf-list">
          ${byGu[gu].map((s) => `<div class="mapf-item">
            <div class="mapf-item__main" onclick="location.href='space.html?id=${s.id}'">
              <b>${s.name}</b><span>${s.region} · ${won(s.price)}원/시간</span>
            </div>
            <a class="mapf-item__pin" href="${naverMapUrl(s.addr || s.region)}" target="_blank" rel="noopener" title="네이버 지도">${iconSVG("pin", 16)}</a>
          </div>`).join("")}
        </div>
      </div>`).join("");
  }

  // 햄버거
  const hm = $("#hmenu"), nav = $("#nav");
  if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
})();
