// ============================================================
// 공간잇다 — 지도 페이지
//  NAVER_MAP_KEY 있으면 네이버 동적 지도 + 마커(+주소 지오코딩), 없으면 지역 목록
// ============================================================
(function () {
  const $ = (s) => document.querySelector(s);
  const won = (n) => (+n || 0).toLocaleString("ko-KR");
  const spaces = getPublicSpaces();
  const key = window.NAVER_MAP_KEY;
  let map = null, authFailed = false;

  // 신규 콘솔=ncpKeyId, 구버전=ncpClientId. 인증 실패 시에도 대체 파라미터로 재시도.
  const PARAMS = ["ncpKeyId", "ncpClientId"];
  let attempt = 0, settled = false;
  // 네이버 인증 실패 시 자동 호출됨 → 다음 파라미터로 재시도, 모두 실패면 목록 폴백
  window.navermap_authFailure = function () { if (!settled) nextOrFail(true); };

  if (key) nextOrFail(false); else fallback();

  function removeNavScripts() { document.querySelectorAll("script[data-navmap]").forEach((s) => s.remove()); }
  function nextOrFail(auth) {
    if (settled) return;
    removeNavScripts(); try { delete window.naver; } catch (e) { window.naver = undefined; }
    if (attempt < PARAMS.length) loadNaver(PARAMS[attempt++]);
    else { settled = true; authFailed = auth; fallback(); }
  }
  function loadNaver(param) {
    const sc = document.createElement("script");
    sc.dataset.navmap = "1";
    sc.src = `https://oapi.map.naver.com/openapi/v3/maps.js?${param}=${encodeURIComponent(key)}&submodules=geocoder`;
    sc.onload = () => setTimeout(() => { if (settled) return; if (window.naver && naver.maps) { settled = true; onReady(); } }, 400);
    sc.onerror = () => nextOrFail(false);
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
      ? iconSVG("alert", 14) + ' 네이버 지도 인증에 실패했어요. 네이버 클라우드 콘솔 <b>Maps 애플리케이션 → Web 서비스 URL</b>에 <b><code>' + location.origin + '</code></b> 이 정확히 등록되어 있는지 확인해 주세요. 아래는 지역별 목록입니다.'
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

  // 내 주변 공간 찾기 (지오로케이션)
  function toast(m) { const t = $("#toast"); if (!t) return; t.textContent = m; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2600); }
  function dist(a, b, c, d) { const R = 6371, dLat = (c - a) * Math.PI / 180, dLng = (d - b) * Math.PI / 180, la = a * Math.PI / 180, lc = c * Math.PI / 180; const x = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lc) * Math.sin(dLng / 2) ** 2; return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)); }
  const nearBtn = $("#mapNear");
  if (nearBtn) nearBtn.addEventListener("click", () => {
    if (!navigator.geolocation) { toast("이 브라우저는 위치 기능을 지원하지 않아요"); return; }
    nearBtn.disabled = true; nearBtn.textContent = "위치 확인 중…";
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      nearBtn.disabled = false; nearBtn.innerHTML = iconSVG("pin", 14) + " 내 주변 공간 찾기";
      // 거리 계산 후 가장 가까운 공간 안내
      const withGeo = spaces.filter((s) => s.lat && s.lng).map((s) => ({ s, km: dist(lat, lng, s.lat, s.lng) })).sort((a, b) => a.km - b.km);
      if (map && naver && naver.maps) {
        const me = new naver.maps.LatLng(lat, lng);
        map.setCenter(me); map.setZoom(13);
        new naver.maps.Marker({ position: me, map, icon: { content: '<div style="width:18px;height:18px;background:#4f46e5;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>', anchor: new naver.maps.Point(9, 9) } });
        if (withGeo[0]) toast(`가장 가까운 공간: ${withGeo[0].s.name} (약 ${withGeo[0].km.toFixed(1)}km)`);
      } else {
        // 폴백 목록을 거리순으로 재정렬
        const fb = $("#mapFallback");
        $("#mapNote").innerHTML = `${iconSVG("pin", 14)} <b>내 위치 기준 가까운 순</b>으로 정렬했어요.`;
        fb.innerHTML = `<div class="mapf-group"><h3 class="mapf-group__t">가까운 공간</h3><div class="mapf-list">${withGeo.map(({ s, km }) => `<div class="mapf-item"><div class="mapf-item__main" onclick="location.href='space.html?id=${s.id}'"><b>${s.name}</b><span>${s.region} · 약 ${km.toFixed(1)}km · ${won(s.price)}원/시간</span></div><a class="mapf-item__pin" href="${naverMapUrl(s.addr || s.region)}" target="_blank" rel="noopener">${iconSVG("pin", 16)}</a></div>`).join("")}</div></div>`;
      }
    }, () => { nearBtn.disabled = false; nearBtn.innerHTML = iconSVG("pin", 14) + " 내 주변 공간 찾기"; toast("위치 권한이 필요해요"); }, { enableHighAccuracy: true, timeout: 8000 });
  });

  const hm = $("#hmenu"), nav = $("#nav");
  if (hm) hm.addEventListener("click", () => { hm.classList.toggle("is-open"); nav.classList.toggle("is-open"); });
})();
