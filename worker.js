// 공간잇다 — 정적 자산 서빙 Worker
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
