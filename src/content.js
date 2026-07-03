// YouTube Shorts Blocker — content script
//
// 두 가지 설정으로 동작한다.
//   - enabled   : 확장 전체 on/off (마스터). 기본 켜짐.
//   - showVideo : 쇼츠 영상 표시 방식.
//        true  → `/watch?v=...` 로 보내 같은 영상을 일반 플레이어로 시청
//        false → 확장 자체의 차단 안내 페이지로 보내 영상 자체를 띄우지 않음
//
// 쇼츠 진입점(선반/카드/사이드바 메뉴)의 '숨김'은 hide.css 가 담당한다.
// 이 스크립트는 (1) 숨김을 켜고 끄는 html.ysb-on 클래스 토글, (2) 쇼츠 URL
// 접근 시 리다이렉트만 맡는다. 숨김을 CSS(:has())로 옮겨 MutationObserver 없이
// 새 콘텐츠가 자동 처리되고 깜빡임도 없다.

const KEY_ENABLED = "enabled";
const KEY_SHOW_VIDEO = "showVideo";
const HIDE_CLASS = "ysb-on";

const ROOT = document.documentElement;
const BLOCK_PAGE = chrome.runtime.getURL("src/blocked.html");

let enabled = true; // 마스터 on/off
let showVideo = false; // false=차단 페이지, true=일반 watch로 표시

// 콘텐츠가 그려지기 전에 즉시 숨김 활성화(기본 켜짐 가정) → 깜빡임 방지.
// 저장된 값이 꺼짐이면 아래 storage 콜백에서 해제한다.
ROOT.classList.add(HIDE_CLASS);

// ---- 쇼츠 URL 판별/리다이렉트 ----------------------------------------------

function isShortsPath(urlString) {
  try {
    const p = new URL(urlString).pathname;
    return p === "/shorts" || p.startsWith("/shorts/");
  } catch (e) {
    return false;
  }
}

function shortsVideoId(urlString) {
  try {
    const m = new URL(urlString).pathname.match(/^\/shorts\/([^/?#]+)/);
    return m ? m[1] : null;
  } catch (e) {
    return null;
  }
}

function handleShorts() {
  if (!enabled) return;
  if (!isShortsPath(location.href)) return;

  if (showVideo) {
    const id = shortsVideoId(location.href);
    if (id) {
      const target = new URL("https://www.youtube.com/watch");
      target.searchParams.set("v", id);
      if (target.toString() !== location.href) {
        location.replace(target.toString());
      }
    }
  } else {
    location.replace(BLOCK_PAGE);
  }
}

// ---- 상태 반영 --------------------------------------------------------------

function applyState() {
  ROOT.classList.toggle(HIDE_CLASS, enabled);
  handleShorts();
}

// 최초 진입
handleShorts();

// YouTube 내부 내비게이션(SPA) 이벤트
window.addEventListener("yt-navigate-start", handleShorts, true);
window.addEventListener("yt-navigate-finish", handleShorts, true);

// 안전망: 이벤트로 안 잡히는 URL 변화를 가볍게 폴링(문자열 비교뿐).
let lastHref = location.href;
setInterval(() => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    handleShorts();
  }
}, 500);

// 저장된 설정 로드 & 변경 반영
chrome.storage.sync.get(
  { [KEY_ENABLED]: true, [KEY_SHOW_VIDEO]: false },
  (result) => {
    enabled = result[KEY_ENABLED];
    showVideo = result[KEY_SHOW_VIDEO];
    applyState();
  }
);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (changes[KEY_ENABLED]) enabled = changes[KEY_ENABLED].newValue;
  if (changes[KEY_SHOW_VIDEO]) showVideo = changes[KEY_SHOW_VIDEO].newValue;
  applyState();
});
