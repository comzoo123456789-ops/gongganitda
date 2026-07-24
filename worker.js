// 공간잇다 — 정적 자산 서빙 + 약관 문서 API(KV)
const KEY = "docs";
const JSONH = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 약관 문서 API — 모든 기기 공통(KV 서버 저장)
    if (url.pathname === "/api/legal") {
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" } });
      }
      if (request.method === "GET") {
        const data = (await env.LEGAL_KV.get(KEY)) || "{}";
        return new Response(data, { headers: JSONH });
      }
      if (request.method === "POST") {
        let payload;
        try { payload = await request.json(); } catch (e) { return new Response('{"error":"bad json"}', { status: 400, headers: JSONH }); }
        const k = payload && payload.key;
        if (!k) return new Response('{"error":"key required"}', { status: 400, headers: JSONH });
        let docs = {};
        try { docs = JSON.parse((await env.LEGAL_KV.get(KEY)) || "{}"); } catch (e) { docs = {}; }
        if (payload.reset) { delete docs[k]; }
        else if (payload.doc && typeof payload.doc === "object") { docs[k] = { title: String(payload.doc.title || ""), updated: String(payload.doc.updated || ""), html: String(payload.doc.html || "") }; }
        else return new Response('{"error":"doc required"}', { status: 400, headers: JSONH });
        await env.LEGAL_KV.put(KEY, JSON.stringify(docs));
        return new Response(JSON.stringify({ ok: true, docs }), { headers: JSONH });
      }
      return new Response('{"error":"method not allowed"}', { status: 405, headers: JSONH });
    }

    // 카카오 간편로그인 — 인가코드 → 토큰 교환 → 프로필 조회 → 프론트로 리다이렉트
    //   필요한 서버 비밀값: KAKAO_REST_KEY (필수), KAKAO_CLIENT_SECRET (선택)
    //   설정: npx wrangler secret put KAKAO_REST_KEY  /  KAKAO_CLIENT_SECRET
    if (url.pathname === "/oauth/kakao") {
      const back = (q) => Response.redirect(url.origin + "/login?" + q, 302);
      const code = url.searchParams.get("code");
      const oerr = url.searchParams.get("error");
      if (oerr || !code) return back("kko_err=" + encodeURIComponent(oerr || "no_code"));
      if (!env.KAKAO_REST_KEY) return back("kko_err=" + encodeURIComponent("no_rest_key"));
      try {
        const redirectUri = url.origin + "/oauth/kakao";
        const body = new URLSearchParams({ grant_type: "authorization_code", client_id: env.KAKAO_REST_KEY, redirect_uri: redirectUri, code });
        if (env.KAKAO_CLIENT_SECRET) body.set("client_secret", env.KAKAO_CLIENT_SECRET);
        const tr = await fetch("https://kauth.kakao.com/oauth/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded;charset=utf-8" }, body });
        const tj = await tr.json();
        if (!tj.access_token) {
          const detail = (tj.error_description || tj.error || "unknown") + (tj.error_code ? " [" + tj.error_code + "]" : "");
          return back("kko_err=token&kko_detail=" + encodeURIComponent(detail));
        }
        const mr = await fetch("https://kapi.kakao.com/v2/user/me", { headers: { Authorization: "Bearer " + tj.access_token } });
        const mj = await mr.json();
        const prof = (mj.kakao_account && mj.kakao_account.profile) || mj.properties || {};
        const payload = { id: mj.id, nickname: prof.nickname || (mj.properties && mj.properties.nickname) || "카카오회원", image: prof.profile_image_url || (mj.properties && mj.properties.profile_image) || "" };
        // UTF-8 안전 base64url (한글 닉네임)
        const bytes = new TextEncoder().encode(JSON.stringify(payload));
        let bin = ""; bytes.forEach((b) => (bin += String.fromCharCode(b)));
        const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        return back("kko=" + b64);
      } catch (e) {
        return back("kko_err=exception");
      }
    }

    return env.ASSETS.fetch(request);
  },
};
