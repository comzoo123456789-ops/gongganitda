// 등록 공간 (샘플) — g: 썸네일 그라디언트 [진한색, 밝은색]
const SPACES = [
  { id: 1, name: "와일리 라운지 1F", cat: "event", region: "서울 강남구 역삼동", price: 30000, capacity: 40, rating: 4.9, reviews: 128, now: true, flagship: true, tags: ["빔프로젝터", "주차 가능", "음향 시설"], g: ["#b5563b", "#cf7a5f"] },
  { id: 2, name: "감성 파티룸 하이드", cat: "party", region: "서울 마포구 연남동", price: 25000, capacity: 15, rating: 4.8, reviews: 212, now: true, tags: ["넷플릭스", "무드 조명", "취사 가능"], g: ["#8d6e97", "#b49ac0"] },
  { id: 3, name: "브릭 세미나룸", cat: "meeting", region: "서울 강남구 삼성동", price: 20000, capacity: 20, rating: 4.7, reviews: 96, now: true, tags: ["화이트보드", "빔프로젝터", "화상회의"], g: ["#5b7f8c", "#87a7b2"] },
  { id: 4, name: "사운드 보컬 연습실", cat: "practice", region: "서울 서초구 서초동", price: 12000, capacity: 4, rating: 4.9, reviews: 340, now: true, tags: ["방음 완비", "마이크", "녹음 가능"], g: ["#8a7a4e", "#b3a06b"] },
  { id: 5, name: "화이트 호리존 스튜디오", cat: "studio", region: "서울 성동구 성수동", price: 35000, capacity: 10, rating: 4.8, reviews: 154, now: false, tags: ["호리존", "조명 장비", "분장실"], g: ["#5f7a5c", "#89a486"] },
  { id: 6, name: "우드톤 공유주방", cat: "cafe", region: "서울 용산구 이태원동", price: 28000, capacity: 12, rating: 4.6, reviews: 73, now: true, tags: ["오븐", "식기 완비", "취사 가능"], g: ["#9c7b56", "#c2a079"] },
  { id: 7, name: "조용한 스터디룸", cat: "study", region: "서울 종로구 혜화동", price: 8000, capacity: 6, rating: 4.7, reviews: 189, now: true, tags: ["와이파이", "콘센트", "화이트보드"], g: ["#567f74", "#83a89e"] },
  { id: 8, name: "루프탑 이벤트홀", cat: "event", region: "서울 강남구 청담동", price: 60000, capacity: 60, rating: 4.9, reviews: 88, now: true, tags: ["루프탑", "음향 시설", "케이터링"], g: ["#b5563b", "#d98a6f"] },
  { id: 9, name: "미니 코워킹 오피스", cat: "office", region: "서울 마포구 서교동", price: 15000, capacity: 8, rating: 4.5, reviews: 64, now: false, tags: ["회의실", "프린터", "라운지"], g: ["#6b6b8a", "#9494ad"] },
  { id: 10, name: "댄스 연습 스튜디오", cat: "practice", region: "서울 광진구 자양동", price: 18000, capacity: 12, rating: 4.8, reviews: 276, now: true, tags: ["전면 거울", "음향", "댄스 마루"], g: ["#8a7a4e", "#a99a68"] },
  { id: 11, name: "북유럽 감성 파티룸", cat: "party", region: "서울 송파구 잠실동", price: 32000, capacity: 20, rating: 4.9, reviews: 301, now: true, tags: ["빔프로젝터", "무드 조명", "취사 가능"], g: ["#8d6e97", "#a98cba"] },
  { id: 12, name: "라이브 방송 스튜디오", cat: "studio", region: "서울 영등포구 여의도동", price: 40000, capacity: 6, rating: 4.7, reviews: 47, now: true, tags: ["송출 장비", "조명", "방음"], g: ["#5f7a5c", "#7e9a7b"] },
];
