// 공간 유형 (대분류)
const CATEGORIES = [
  { id: "party", label: "파티룸", icon: "party", tint: "#ece0e8", ink: "#8d6e97" },
  { id: "meeting", label: "회의·세미나", icon: "meeting", tint: "#dfe7ea", ink: "#5b7f8c" },
  { id: "practice", label: "연습실", icon: "practice", tint: "#e7e2d6", ink: "#8a7a4e" },
  { id: "studio", label: "스튜디오", icon: "studio", tint: "#e3e6df", ink: "#5f7a5c" },
  { id: "cafe", label: "카페·주방", icon: "cafe", tint: "#ece2d8", ink: "#9c7b56" },
  { id: "event", label: "행사·공연", icon: "event", tint: "#ecdedb", ink: "#b5563b" },
  { id: "study", label: "스터디룸", icon: "study", tint: "#dee6e4", ink: "#567f74" },
  { id: "office", label: "오피스", icon: "office", tint: "#e2e2ea", ink: "#6b6b8a" },
];
const catById = (id) => CATEGORIES.find((c) => c.id === id) || { label: id, icon: "grid", ink: "#888" };
