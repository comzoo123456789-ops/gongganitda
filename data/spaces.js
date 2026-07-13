// 등록 공간 (샘플)
//  img: Unsplash 사진 ID  ·  g: 로딩 실패 시 폴백 그라디언트
const SPACES = [
  { id: 1, name: "와일리 라운지 1F", cat: "event", region: "서울 강남구 역삼동", price: 30000, capacity: 40, rating: 4.9, reviews: 128, now: true, flagship: true, tags: ["빔프로젝터", "주차 가능", "음향 시설", "냉난방"], img: "1600585154340-be6161a56a0c", g: ["#b5563b", "#cf7a5f"] },
  { id: 2, name: "감성 파티룸 하이드", cat: "party", region: "서울 마포구 연남동", price: 25000, capacity: 15, rating: 4.8, reviews: 212, now: true, tags: ["넷플릭스", "무드 조명", "취사 가능", "블루투스 스피커"], img: "1505373877841-8d25f7d46678", g: ["#8d6e97", "#b49ac0"] },
  { id: 3, name: "브릭 세미나룸", cat: "meeting", region: "서울 강남구 삼성동", price: 20000, capacity: 20, rating: 4.7, reviews: 96, now: true, tags: ["화이트보드", "빔프로젝터", "화상회의", "와이파이"], img: "1497366754035-f200968a6e72", g: ["#5b7f8c", "#87a7b2"] },
  { id: 4, name: "사운드 보컬 연습실", cat: "practice", region: "서울 서초구 서초동", price: 12000, capacity: 4, rating: 4.9, reviews: 340, now: true, tags: ["방음 완비", "마이크", "녹음 가능", "앰프"], img: "1511379938547-c1f69419868d", g: ["#8a7a4e", "#b3a06b"] },
  { id: 5, name: "화이트 호리존 스튜디오", cat: "studio", region: "서울 성동구 성수동", price: 35000, capacity: 10, rating: 4.8, reviews: 154, now: false, tags: ["호리존", "조명 장비", "분장실", "주차"], img: "1519710164239-da123dc03ef4", g: ["#5f7a5c", "#89a486"] },
  { id: 6, name: "우드톤 공유주방", cat: "cafe", region: "서울 용산구 이태원동", price: 28000, capacity: 12, rating: 4.6, reviews: 73, now: true, tags: ["오븐", "식기 완비", "취사 가능", "냉장고"], img: "1571624436279-b272aff752b5", g: ["#9c7b56", "#c2a079"] },
  { id: 7, name: "조용한 스터디룸", cat: "study", region: "서울 종로구 혜화동", price: 8000, capacity: 6, rating: 4.7, reviews: 189, now: true, tags: ["와이파이", "콘센트", "화이트보드", "정수기"], img: "1497215728101-856f4ea42174", g: ["#567f74", "#83a89e"] },
  { id: 8, name: "루프탑 이벤트홀", cat: "event", region: "서울 강남구 청담동", price: 60000, capacity: 60, rating: 4.9, reviews: 88, now: true, tags: ["루프탑", "음향 시설", "케이터링", "주차"], img: "1515169067868-5387ec356754", g: ["#b5563b", "#d98a6f"] },
  { id: 9, name: "미니 코워킹 오피스", cat: "office", region: "서울 마포구 서교동", price: 15000, capacity: 8, rating: 4.5, reviews: 64, now: false, tags: ["회의실", "프린터", "라운지", "와이파이"], img: "1560448204-e02f11c3d0e2", g: ["#6b6b8a", "#9494ad"] },
  { id: 10, name: "댄스 연습 스튜디오", cat: "practice", region: "서울 광진구 자양동", price: 18000, capacity: 12, rating: 4.8, reviews: 276, now: true, tags: ["전면 거울", "음향", "댄스 마루", "샤워실"], img: "1600607687939-ce8a6c25118c", g: ["#8a7a4e", "#a99a68"] },
  { id: 11, name: "북유럽 감성 파티룸", cat: "party", region: "서울 송파구 잠실동", price: 32000, capacity: 20, rating: 4.9, reviews: 301, now: true, tags: ["빔프로젝터", "무드 조명", "취사 가능", "노래방"], img: "1524758631624-e2822e304c36", g: ["#8d6e97", "#a98cba"] },
  { id: 12, name: "라이브 방송 스튜디오", cat: "studio", region: "서울 영등포구 여의도동", price: 40000, capacity: 6, rating: 4.7, reviews: 47, now: true, tags: ["송출 장비", "조명", "방음", "편집실"], img: "1521737604893-d14cc237f11d", g: ["#5f7a5c", "#7e9a7b"] },
];
// 썸네일 URL — 등록 공간은 photo(직접 URL), 샘플은 Unsplash id, 없으면 "" (그라디언트 폴백)
function thumbUrl(s, w, h) {
  if (s.photo) return s.photo;
  if (s.img) return `https://images.unsplash.com/photo-${s.img}?w=${w || 800}&h=${h || 600}&fit=crop&q=80`;
  return "";
}
const spaceImg = thumbUrl; // 하위호환

// 샘플 공간 좌표(서울 자치구 근사) — 지도 마커용
const _COORDS = {
  1: [37.5006, 127.0364], 2: [37.5606, 126.9250], 3: [37.5140, 127.0565], 4: [37.4836, 127.0327],
  5: [37.5445, 127.0560], 6: [37.5345, 126.9946], 7: [37.5820, 127.0016], 8: [37.5250, 127.0470],
  9: [37.5556, 126.9188], 10: [37.5347, 127.0820], 11: [37.5133, 127.1000], 12: [37.5215, 126.9243],
};
SPACES.forEach((s) => { const c = _COORDS[s.id]; if (c) { s.lat = c[0]; s.lng = c[1]; } });
// 네이버 지도 검색 URL (주소로 위치 표시)
function naverMapUrl(q) { return "https://map.naver.com/p/search/" + encodeURIComponent(q || ""); }
// 카드용 지역 축약 — 앞의 시/도를 떼고 구·동 위주로
function regionShort(r) {
  return (r || "").replace(/^(서울특별시|서울시|서울|부산광역시|부산|대구광역시|대구|인천광역시|인천|광주광역시|광주|대전광역시|대전|울산광역시|울산|세종특별자치시|세종|경기도|경기|강원특별자치도|강원도|강원|충청북도|충북|충청남도|충남|전라북도|전북|전라남도|전남|경상북도|경북|경상남도|경남|제주특별자치도|제주도|제주)\s+/, "").trim();
}

// 전국 지역 (광역시·도)
const REGIONS = ["서울", "경기", "인천", "강원", "대전", "세종", "충북", "충남", "부산", "대구", "울산", "경북", "경남", "광주", "전북", "전남", "제주"];

// 호스트가 등록한 공간(localStorage) + 샘플 공간 병합
function getAllSpaces() {
  let mine = [];
  try { mine = JSON.parse(localStorage.getItem("gi_spaces") || "[]"); } catch (e) {}
  return [...mine, ...SPACES];
}
