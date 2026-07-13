// ============================================================
// 공간잇다 — 지도 페이지
//  NAVER_MAP_KEY 있으면 네이버 동적 지도 + 마커(+주소 지오코딩), 없으면 지역 목록
// ============================================================
(function () {
  const $ = (s) => document.querySelector(s);
  const won = (n) => (+n || 0).toLocaleString("ko-KR");
  const spaces = getAllSpaces();
  const key = window.NAVER_MAP_KEY;
  let map = null, authFailed = false;

  // 네이버 인증 실패 시 자동 호출됨 → 목록형으로 폴백 + 안내
  window.navermap_authFailure = function () { authFailed = true; fallback(); };

  if (key) {
    // 신규 콘솔은 ncpKeyId, 구버전은 ncpClientId — 순차 시도(스크립트 로드 실패 시)
    loadNaver("ncpKeyId", onReady, () => loadNaver("ncpClientId", onReady, fallback));
  } else {
    fallback();
  }

  function loadNaver(param, done, fail) {
    const sc = document.createElement("script");
    sc.src = `https://oapi.map.naver.com/openapi/v3/maps.js?${param}=${encodeURIComponent(key)}&submodules=geocoder`;
    sc.onload = () => { setTimeout(() => (window.naver && naver.maps ? done() : fail()), 60); };
    sc.onerror = fail;
    document.head.appendChild(sc);
  }

  function onReady() {
    $("#mapFallback").hidden = true;
    map = new naver.maps.Map("map", { center: new naver.maps.LatLng(37.53, 126.99), zoom: 11 });
    const bounds = new naver.maps.LatLngBounds();
    let anyBound = false;

    spaces.forEach((s) => {
      if (s.lat && s.lng) { addMarker(s, new naver.maps.LatLng(s.lat, s.lng)); bounds.extend(new naver.maps.LatLng(s.lat, s.lng)); anyBound = true; }
    });
    if (anyBound) map.fitBounds(bounds);

    // 좌표 없는(호스트 등록) 공간은 주소로 지오코딩
    const hasGeocoder = naver.maps.Service && naver.maps.Service.geocode;
    spaces.filter((s) => !(s.lat && s.lng) && (s.addr || s.region)).forEach((s) => {
      if (!hasGeocoder) return;
      naver.maps.Service.geocode({ query: s.addr || s.region }, (status, res) => {
        if (status !== naver.maps.Service.Status.OK) return;
        const it = res.v2 && res.v2.addresses && res.v2.addresses[0];
        if (!it) return;
        addMarker(s, new naver.maps.LatLng(+it.y, +it.x));
      });
    });
  }

  function addMarker(s, pos) {
    const mk = new naver.maps.Marker({ position: pos, map, title: s.name });
    const iw = new naver.maps.InfoWindow({
      content: `<div style="padding:10px 14px;min-width:150px;font-family:Pretendard,sans-serif"><b style="font-size:0.95rem">${s.name}</b><br /><span style="color:#b0503a;font-weight:700">${won(s.price)}원/시간</span><br /><a href="space.html?id=${s.id}" style="color:#1c1a15;font-weight:700">상세 보기 →</a></div>`,
      borderColor: "#ded8cc",
    });
    naver.maps.Event.addListener(mk, "click", () => { iw.getMap() ? iw.close() : iw.open(map, mk); });
  }

  function fallback() {
    $("#map").style.display = "none";
    $("#mapFallback").hidden = false;
    $("#mapNote").innerHTML = authFailed
      ? '⚠️ 네이버 지도 인증에 실패했어요. 콘솔에서 <b>Web 서비스 URL에 이 사이트 도메인</b>을 등록했는지 확인해 주세요. 아래는 지역별 목록입니다.'
      : "지역별 공간 목록이에요. 항목을 누르면 네이버 지도에서 위치가 열립니다.";
    const byGu = {};
    spaces.forEach((s) => { const gu = (s.region || "기타").split(" ").slice(0, 2).join(" "); (byGu[gu] = byGu[gu] || []).push(s); });
    $("#mapFallback").innerHTML = Object.keys(byGu).sort().map((gu) => `
      <div class="mapf-group">
        <h3 class="mapf-group__t">${gu} <span>${byGu[gu].length}</span></h3>
        <div class="mapf-list">
          ${byGu[gu].map((s) => `<div class="mapf-item">
            <div class="mapf-item__main" onclick="location.href='space.html?id=${s.id}'"><b>${s.name}</b><span>${s.region} · ${won(s.price)}원/시간</span></div>
            <a class="mapf-item__pin" href="${naverMapUrl(s.addr || s.region)}" target="_blank" rel="noopener" title="네이버 지도">${iconSVG("pin", 16)}</a>
          </div>`).join("")}
        </div>
      </div>`).join("");
  }

  const hm = $("#hmenu"), nav = $("#nav");
  if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
})();
