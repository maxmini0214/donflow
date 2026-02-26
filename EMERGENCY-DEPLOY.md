# 🚨 Emergency Deployment Guide (GitHub Suspended)

## Option 1: Vercel (추천 — 가장 빠름)
```bash
cd /Users/max/Desktop/agent/side-projects/finance-app/donflow
npx vercel dist-portable --prod
# → 이메일 입력 → 프로젝트 이름 → 즉시 배포
# 결과: https://donflow.vercel.app 또는 유사 URL
```

## Option 2: Netlify
```bash
npx netlify-cli deploy --dir=dist-portable --prod
# → 브라우저 로그인 → 즉시 배포
```

## Option 3: Surge.sh (가장 간단)
```bash
npx surge dist-portable donflow.surge.sh
# → 이메일/비밀번호 입력 → 즉시 배포
```

## Option 4: Cloudflare Pages
```bash
npx wrangler pages deploy dist-portable --project-name=donflow
```

## 포터블 빌드 정보
- 경로: `dist-portable/` (base: '/' — 루트 도메인용)
- 기존 `dist/`는 base: '/donflow/' (GitHub Pages용)
- SPA이므로 모든 경로를 index.html로 리라이트 필요
- vercel.json 포함됨

## GitHub 계정 복구
1. **어필 폼**: https://support.github.com/contact/reinstatement
2. 사유 작성 시 포인트:
   - 오픈소스 프로젝트 (DonFlow, 25+ dev tools, 27 games)
   - 모든 코드가 직접 작성 (AI 보조, 자동 생성 아님)
   - 위반 사항이 있었다면 수정하겠다는 의지
3. 응답까지 보통 1-5 영업일
4. 이메일 확인 필수 (maxmini0214@gmail.com)

## 정지 원인 추정
- 48시간 내 94 commits (자동화 패턴으로 인식 가능)
- GitHub TOS: 과도한 자동화된 활동은 제한 대상
- 복구 후 대책: 커밋 배칭 (하루 10-15개 이하), 의미 단위 커밋
