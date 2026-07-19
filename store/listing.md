# Chrome Web Store 리스팅 자료 (복붙용)

대시보드( https://chrome.google.com/webstore/devconsole )에 그대로 붙여넣는 원고입니다.
심사에서 요구하는 필드별로 정리했습니다.

---

## 0. 이름 (Extension name)
스토어 표시 이름은 `manifest.json`의 `name` 값이 그대로 쓰입니다.

- 현재: **YouTube Shorts Blocker**
- ⚠️ 정책상 더 안전한 대안: **Shorts Blocker for YouTube**
  (이름 맨 앞의 "YouTube"는 공식 앱으로 오해될 소지가 있어, "for YouTube" 형태 권장.
  바꾸려면 manifest `name`을 수정하세요.)

---

## 1. 요약 / Short description  (최대 132자)
> Block YouTube Shorts and hide them across YouTube. Two simple toggles, no tracking, no data collected.

한국어 리스팅용:
> YouTube 쇼츠를 막고 홈·검색·사이드바에서 숨깁니다. 토글 2개, 추적 없음, 데이터 수집 없음.

---

## 2. 카테고리 / 언어
- Category: **Productivity**
- Default language: **English** (원하면 한국어를 기본으로)

---

## 3. 상세 설명 / Detailed description

### English
Short-form video, no more. YouTube Shorts Blocker keeps you off the endless Shorts feed so you can use YouTube on purpose — not by autopilot.

What it does
• Blocks Shorts pages — opening a /shorts link is stopped and sent to a clean block page. Prefer to still watch it? Flip one toggle and Shorts open in the normal video player instead.
• Hides Shorts everywhere — the Shorts shelves on Home, Subscriptions and Search, and the Shorts entry in the sidebar.
• Two simple toggles — turn blocking on/off, and choose how Shorts open.
• Fast & private — runs only on youtube.com, saves nothing but your settings, collects no data, needs no account, and loads no remote code.

Works in your browser language: English, 한국어, 日本語, 简体中文, Español, Français, Deutsch.

Open source: https://github.com/MINUUUUUUUUUUUU/noshorts

### 한국어
짧은 영상, 이제 그만. YouTube Shorts Blocker는 무한 쇼츠 피드에서 당신을 지켜줘, 유튜브를 '자동조종'이 아니라 '의도적으로' 쓰게 해줍니다.

기능
• 쇼츠 페이지 차단 — /shorts 링크로 들어가면 막아서 깔끔한 차단 페이지로 보냅니다. 그래도 보고 싶다면 토글 하나로 일반 플레이어에서 열리게 바꿀 수 있어요.
• 쇼츠 숨김 — 홈·구독·검색의 쇼츠 칸과 왼쪽 사이드바의 'Shorts' 메뉴까지 숨깁니다.
• 토글 2개 — 차단 on/off, 쇼츠를 어떻게 열지 선택.
• 빠르고 프라이빗 — youtube.com에서만 동작, 설정 외에는 아무것도 저장 안 함, 데이터 수집 없음, 계정 불필요, 원격 코드 없음.

브라우저 언어에 맞춰 표시: 영어·한국어·일본어·중국어(간체)·스페인어·프랑스어·독일어.

---

## 4. Privacy practices 탭 (심사 통과 핵심)

### Single purpose (단일 목적)
> This extension has a single purpose: to block YouTube Shorts. It stops Shorts pages from opening (redirecting them to a block page or to the normal video player) and hides Shorts shelves and links across YouTube, helping the user avoid short-form video.

### 권한 사유 (Permission justification)
- **storage**
  > Stores the user's two on/off preferences (blocking enabled, and whether Shorts open as normal videos) locally. No data is transmitted.
- **Host permission `*://*.youtube.com/*`**
  > Required so the extension can run on YouTube pages to detect Shorts URLs, redirect them, and hide Shorts entry points. The extension runs only on youtube.com and does not read or send page content.

### 데이터 수집 공시 (Data collection)
- 모든 데이터 유형 → **수집하지 않음(collect: none)** 으로 체크.
- 인증 항목 3개 모두 체크:
  - ☑ 제3자에게 사용자 데이터를 판매하지 않음
  - ☑ 승인된 용도와 무관한 목적으로 사용/전송하지 않음
  - ☑ 신용도 판단/대출 목적으로 사용/전송하지 않음

### Privacy policy URL
> https://github.com/MINUUUUUUUUUUUU/noshorts/blob/main/PRIVACY.md

---

## 5. 필요한 이미지 애셋
- **아이콘 128×128** — 보유(`icons/icon128.png`). ⚠️ 단, 현재 아이콘은 YouTube Shorts 공식 로고를 사용 → 상표 문제로 거절 위험. 교체 권장.
- **스크린샷 1장 이상** — 1280×800 또는 640×400 (PNG/JPG). 팝업 + 차단 페이지 캡처 권장.
- (선택) 작은 프로모 타일 440×280.

---

## 6. 제출 & 업데이트
- 업로드 zip: 릴리스의 **`noshorts-v1.4.0.zip`** (Releases 탭).
- 업데이트 시: `manifest.json` version 증가 → push → 새 릴리스 zip 업로드.
