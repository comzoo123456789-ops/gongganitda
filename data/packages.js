// ============================================================
// 공간잇다 — 올인원 패키지 (서비스 종료)
//  패키지 기능은 제거되었습니다. 데이터는 비어 있으며,
//  기존 참조 코드가 깨지지 않도록 헬퍼는 그대로 유지합니다.
// ============================================================
const PACKAGES = [];
const PKG_SPACE_OPTIONS = {};
PACKAGES.forEach((p) => { p.spaceOptions = PKG_SPACE_OPTIONS[p.id] || []; });
const pkgById = (id) => PACKAGES.find((p) => p.id === id);
function pkgSpaceObjs(p) { const all = (typeof getAllSpaces === "function") ? getAllSpaces() : []; return (p.spaceOptions || []).map((id) => all.find((s) => String(s.id) === String(id))).filter(Boolean); }
function pkgAvailSpaces(p) { return pkgSpaceObjs(p).filter((s) => !s.blinded && !s.rejected && !s.hidden); }
function pkgImg(p, w, h) { return p.img ? `https://images.unsplash.com/photo-${p.img}?w=${w || 800}&h=${h || 600}&fit=crop&q=80` : ""; }
function pkgPartners(p) { const seen = {}; const out = []; (p.items || []).forEach((x) => { if (x.partner && !seen[x.partnerId || x.partner]) { seen[x.partnerId || x.partner] = 1; out.push({ name: x.partner, id: x.partnerId, role: x.role, icon: x.icon }); } }); return out; }
