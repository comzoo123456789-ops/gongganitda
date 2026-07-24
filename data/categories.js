// 공간 유형 (대분류)
const CATEGORIES = [
  { id: "party", label: "파티룸", icon: "party", tint: "#ece0e8", ink: "#8d6e97", img: "1505373877841-8d25f7d46678" },
  { id: "meeting", label: "회의·세미나", icon: "meeting", tint: "#dfe7ea", ink: "#5b7f8c", img: "1497366754035-f200968a6e72" },
  { id: "practice", label: "연습실", icon: "practice", tint: "#e7e2d6", ink: "#8a7a4e", img: "1511379938547-c1f69419868d" },
  { id: "studio", label: "스튜디오", icon: "studio", tint: "#e3e6df", ink: "#5f7a5c", img: "1519710164239-da123dc03ef4" },
  { id: "cafe", label: "카페·주방", icon: "cafe", tint: "#ece2d8", ink: "#9c7b56", img: "1571624436279-b272aff752b5" },
  { id: "event", label: "행사·공연", icon: "event", tint: "#ecdedb", ink: "#b5563b", img: "1515169067868-5387ec356754" },
  { id: "study", label: "스터디룸", icon: "study", tint: "#dee6e4", ink: "#567f74", img: "1497215728101-856f4ea42174" },
  { id: "office", label: "오피스", icon: "office", tint: "#e2e2ea", ink: "#6b6b8a", img: "1497366216548-37526070297c" },
  { id: "popup", label: "팝업스토어", icon: "popup", tint: "#efe0e5", ink: "#a4587a", img: "1441986300917-64674bd600d8" },
];
const catById = (id) => CATEGORIES.find((c) => c.id === id) || { label: id, icon: "grid", ink: "#888" };

// 견적 요청(견적요청) 부대 서비스 — 공간 + 필요한 모든 것 종합
const SERVICES = [
  { id: "camera", label: "촬영장비·카메라", icon: "studio", tint: "#e3e6df", ink: "#5f7a5c", desc: "카메라·조명·짐벌 대여", unit: "대·일" },
  { id: "photo", label: "행사 사진작가", icon: "spark", tint: "#e0e6ef", ink: "#4f6a93", desc: "행사 스냅·영상 촬영", unit: "시간" },
  { id: "catering", label: "케이터링", icon: "cafe", tint: "#ece2d8", ink: "#9c7b56", desc: "다과·도시락·뷔페 준비", unit: "인분" },
  { id: "office", label: "사무가구·기기", icon: "office", tint: "#e2e2ea", ink: "#6b6b8a", desc: "책상·의자·복합기·프린터", unit: "점·일" },
  { id: "cleaning", label: "청소", icon: "cleaning", tint: "#dee6e4", ink: "#567f74", desc: "행사 전후 청소·정리", unit: "회" },
  { id: "repair", label: "하자보수", icon: "wrench", tint: "#ecdedb", ink: "#b5563b", desc: "설비·시설 보수", unit: "건" },
  { id: "interior", label: "인테리어", icon: "roller", tint: "#ece0e8", ink: "#8d6e97", desc: "시공·데코·공간 연출", unit: "건" },
  { id: "banner", label: "현수막·사인", icon: "banner", tint: "#e9e1d3", ink: "#977f42", desc: "현수막·배너·사인물 제작", unit: "장" },
  { id: "projector", label: "빔프로젝터·스크린", icon: "projector", tint: "#dfe6ea", ink: "#4f7c93", desc: "빔프로젝터·스크린·음향", unit: "대·일" },
  { id: "goods", label: "기념품·굿즈", icon: "goods", tint: "#efe0e5", ink: "#a4587a", desc: "판촉물·기념품·굿즈 제작", unit: "개" },
];
const svcById = (id) => SERVICES.find((s) => s.id === id) || { label: id, icon: "grid", ink: "#888" };

// 견적 요청 "공간 대관" — 호스트가 입찰하는 특수 카테고리(부대서비스와 별도)
const SPACE_CAT = { id: "space", label: "공간 대관", icon: "pin", tint: "#dfe7ea", ink: "#5b7f8c", desc: "장소·대관", unit: "시간" };
// 요청 카테고리(공간 + 서비스) 공용 조회
const reqCatById = (id) => (id === "space" ? SPACE_CAT : svcById(id));
