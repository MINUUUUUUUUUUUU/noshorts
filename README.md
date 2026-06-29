# noshorts

> noooo youtube shorts — YouTube 쇼츠 접속을 막아 쇼츠 중독을 끊어주는 Chrome 확장 프로그램.

YouTube **쇼츠(Shorts)** 의 무한 스크롤에 빠지지 않도록 막아주는 확장입니다.
팝업의 토글 두 개로 동작을 고를 수 있습니다.

## 기능

- **쇼츠 차단 on/off** (마스터 스위치)
- **쇼츠 영상 표시 방식** 토글
  - 켜짐(표시): `/shorts/<id>` → `/watch?v=<id>` 로 보내 같은 영상을 **일반 플레이어**로 시청
  - 꺼짐(차단): 확장 자체의 **차단 안내 페이지**로 보내 영상 자체를 띄우지 않음
- 홈·검색·사이드바의 **쇼츠 칸/링크(진입점) 숨김**
- YouTube는 SPA(단일 페이지 앱)라 앱 내부 이동도 함께 처리
  (내비게이션 이벤트 + DOM 변화 감시 + 폴링 안전망)
- 설정은 `chrome.storage.sync` 에 저장

## 기술 / 정책 메모

- **Manifest V3** 기반 (Manifest V2는 지원 종료).
- 권한은 최소화: `storage` + `*://*.youtube.com/*` 호스트 권한만 사용.
- Chrome Web Store 정책의 **단일 목적(single purpose)** 원칙에 맞춰
  "쇼츠 차단" 하나의 기능만 수행합니다.

## 설치 (개발자 모드)

1. 이 저장소를 클론하거나 다운로드합니다.
2. Chrome 주소창에 `chrome://extensions` 입력 후 이동.
3. 우측 상단 **개발자 모드**를 켭니다.
4. **압축해제된 확장 프로그램을 로드** 클릭 → 이 폴더(`noshorts`)를 선택.
5. YouTube 쇼츠 URL에 접속해 동작을 확인합니다.

## 프로젝트 구조

```
noshorts/
├── manifest.json        # MV3 매니페스트
├── src/
│   ├── content.js       # 쇼츠 감지·차단/리다이렉트 + 진입점 숨김
│   ├── blocked.html     # 차단 안내 페이지
│   ├── blocked.js       # 차단 페이지 버튼 동작
│   ├── popup.html       # 토글 UI (차단 on/off, 영상 표시)
│   └── popup.js         # 토글 상태 저장/표시
└── icons/               # 확장 아이콘 (16/32/48/128)
```

## 라이선스

[MIT](LICENSE)
