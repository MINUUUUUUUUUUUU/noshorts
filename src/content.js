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
// 접근 시 리다이렉트만 맡는다. 쇼츠 목록의 숨김은 CSS(:has())로 처리해
// 새 콘텐츠가 자동 처리된다.

const KEY_ENABLED = "enabled";
const KEY_SHOW_VIDEO = "showVideo";
const HIDE_CLASS = "ysb-on";

const BLOCK_PAGE = chrome.runtime.getURL("src/blocked.html");

let enabled = true; // 마스터 on/off
let settingsLoaded = false;
const changedDuringLoad = new Set();
let showVideo = false; // false=차단 페이지, true=일반 watch로 표시

// 콘텐츠가 그려지기 전에 즉시 숨김 활성화(기본 켜짐 가정) → 깜빡임 방지.
// 저장된 값이 꺼짐이면 아래 storage 콜백에서 해제한다.
function syncRootClass() {
  if (document.documentElement) {
    document.documentElement.classList.toggle(HIDE_CLASS, enabled);
  }
}

syncRootClass();
// document_start에서는 아직 <html>이 없을 수 있다.
if (!document.documentElement) {
  const rootObserver = new MutationObserver(() => {
    if (document.documentElement) {
      syncRootClass();
      rootObserver.disconnect();
    }
  });
  rootObserver.observe(document, { childList: true });
}

// ---- 쇼츠 URL 판별/리다이렉트 ----------------------------------------------

function isShortsPath(urlString) {
  try {
    const p = new URL(urlString).pathname;
    return p === "/shorts" || p.startsWith("/shorts/");
  } catch {
    return false;
  }
}

function shortsVideoId(urlString) {
  try {
    const m = new URL(urlString).pathname.match(/^\/shorts\/([^/?#]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function handleShorts() {
  if (!settingsLoaded || !enabled) return;
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
  syncRootClass();
  handleShorts();
}

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

// 초기 읽기보다 최신 변경 이벤트가 우선한다. 키별로 병합해 다른 설정도 보존한다.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (changes[KEY_ENABLED]) {
    enabled = changes[KEY_ENABLED].newValue !== false;
    if (!settingsLoaded) changedDuringLoad.add(KEY_ENABLED);
  }
  if (changes[KEY_SHOW_VIDEO]) {
    showVideo = changes[KEY_SHOW_VIDEO].newValue === true;
    if (!settingsLoaded) changedDuringLoad.add(KEY_SHOW_VIDEO);
  }
  applyState();
});

chrome.storage.sync.get(
  { [KEY_ENABLED]: true, [KEY_SHOW_VIDEO]: false },
  (result) => {
    if (!changedDuringLoad.has(KEY_ENABLED)) enabled = result[KEY_ENABLED] !== false;
    if (!changedDuringLoad.has(KEY_SHOW_VIDEO)) showVideo = result[KEY_SHOW_VIDEO] === true;
    settingsLoaded = true;
    changedDuringLoad.clear();
    applyState();
  }
);
