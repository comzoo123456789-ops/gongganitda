# 공간잇다 (gongganitda)

필요한 순간, 필요한 공간을 잇다 — 공간 대관 마켓플레이스 (wylie.co.kr)

프로모션 사이트(promoboard)와 **독립된 별도 프로젝트**입니다. 디자인 시스템(웜 그레이지 + Noto Serif KR 헤드라인 + 라인 아이콘)만 계승했습니다.

## 구조
```
index.html            홈(초기) 화면
css/style.css         디자인 시스템
data/categories.js    공간 유형 8종
data/spaces.js        샘플 공간 데이터
js/icons.js, main.js  아이콘 · 렌더 로직
worker.js             Cloudflare 정적 서빙 Worker
wrangler.toml         배포 설정 (name = gongganitda)
```

## 배포
```bash
npx wrangler deploy      # Cloudflare에 직접 배포
```

### GitHub 연동(자동 배포)으로 전환하려면
1. GitHub에 새 저장소 생성 (예: `gongganitda`)
2. `git remote add origin <repo-url>` → `git push -u origin main`
3. Cloudflare 대시보드 → Workers & Pages → 해당 Worker → Git 연결 → 저장소 선택
4. 이후 `git push`할 때마다 자동 배포

## 다음 단계(예정)
공간 상세 페이지 · 예약 플로우 · 호스트 공간 등록 · 로그인/회원가입 · 마이페이지
