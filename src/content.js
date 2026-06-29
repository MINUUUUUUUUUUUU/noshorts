// noshorts — content script
//
// YouTube 쇼츠(`/shorts/...`) 처리. 두 가지 설정으로 동작한다.
//   - enabled   : 확장 전체 on/off (마스터 스위치). 기본 켜짐.
//   - showVideo : 쇼츠 영상 표시 방식.
//        true  → `/watch?v=...` 로 보내 같은 영상을 일반 플레이어로 시청
//        false → 확장 자체의 차단 안내 페이지로 보내 영상 자체를 띄우지 않음
//
// YouTube는 SPA(단일 페이지 앱)라 전체 새로고침 없이 화면이 바뀌므로
// 최초 로드 + 내부 내비게이션 + DOM 변화 모두를 감시한다.
// 또한 홈/검색/사이드바의 쇼츠 진입점(쇼츠 칸·링크)은 항상 숨긴다.

const KEY_ENABLED = "enabled";
const KEY_SHOW_VIDEO = "showVideo";

let enabled = true; // 마스터 on/off
let showVideo = false; // false=차단 페이지, true=일반 watch로 표시

const BLOCK_PAGE = chrome.runtime.getURL("src/blocked.html");

// ---- 쇼츠 URL 판별 ----------------------------------------------------------

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

// 현재 위치가 쇼츠면 설정에 맞게 처리.
function handleShorts() {
  if (!enabled) return;
  if (!isShortsPath(location.href)) return;

  if (showVideo) {
    // 같은 영상을 일반 시청 페이지로.
    const id = shortsVideoId(location.href);
    if (id) {
      const target = new URL("https://www.youtube.com/watch");
      target.searchParams.set("v", id);
      if (target.toString() !== location.href) {
        location.replace(target.toString());
      }
    }
  } else {
    // 영상 자체를 막고 차단 안내 페이지로.
    location.replace(BLOCK_PAGE);
  }
}

// ---- 쇼츠 진입점 숨기기 -----------------------------------------------------

const HIDE_ATTR = "data-noshorts-hidden";

// 쇼츠 전용 "칸/선반" 컴포넌트 (홈·검색·구독 피드 등)
const SHELF_SELECTORS = [
  "ytd-reel-shelf-renderer",
  "ytd-rich-shelf-renderer[is-shorts]",
  "ytm-shorts-lockup-view-model",
  "grid-shelf-view-model",
];

function hideEl(el) {
  if (!el || el.getAttribute(HIDE_ATTR) !== null) return;
  el.setAttribute(HIDE_ATTR, "");
  el.style.setProperty("display", "none", "important");
}

function restoreAll() {
  document.querySelectorAll(`[${HIDE_ATTR}]`).forEach((el) => {
    el.removeAttribute(HIDE_ATTR);
    el.style.removeProperty("display");
  });
}

function hideEntryPoints() {
  if (!enabled) {
    restoreAll();
    return;
  }

  // 1) 쇼츠 전용 칸(선반) 숨김 — 가능하면 감싸는 섹션째로.
  SHELF_SELECTORS.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      hideEl(el.closest("ytd-rich-section-renderer") || el);
    });
  });

  // 2) `/shorts` 로 향하는 링크의 카드/메뉴 항목 숨김
  //    (사이드바, 검색결과, 추천 영상 등)
  document
    .querySelectorAll('a[href^="/shorts"], a[href*="/shorts/"]')
    .forEach((a) => {
      const host = a.closest(
        "ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer, " +
          "ytd-rich-item-renderer, ytd-video-renderer, " +
          "ytd-grid-video-renderer, ytd-compact-video-renderer, " +
          "ytd-reel-item-renderer"
      );
      hideEl(host || a);
    });
}

// ---- 실행 루프 --------------------------------------------------------------

function tick() {
  handleShorts();
  hideEntryPoints();
}

// 1) 최초 진입(전체 로드)
tick();

// 2) YouTube 내부 내비게이션(SPA) 이벤트
window.addEventListener("yt-navigate-start", tick, true);
window.addEventListener("yt-navigate-finish", tick, true);

// 3) DOM 변화 감시 — 새로 그려지는 쇼츠 칸을 바로 숨김.
//    (우리가 바꾸는 건 속성/스타일뿐이라 childList 관찰은 루프를 일으키지 않음)
const observer = new MutationObserver(() => {
  if (enabled) hideEntryPoints();
});
function startObserver() {
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
if (document.body) startObserver();
else document.addEventListener("DOMContentLoaded", startObserver);

// 4) 안전망: URL 변화/누락분을 주기적으로 보완.
let lastHref = location.href;
setInterval(() => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    handleShorts();
  }
  if (enabled) hideEntryPoints();
}, 700);

// ---- 설정 로드 & 변경 반영 --------------------------------------------------

chrome.storage.sync.get(
  { [KEY_ENABLED]: true, [KEY_SHOW_VIDEO]: false },
  (result) => {
    enabled = result[KEY_ENABLED];
    showVideo = result[KEY_SHOW_VIDEO];
    tick();
  }
);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (changes[KEY_ENABLED]) enabled = changes[KEY_ENABLED].newValue;
  if (changes[KEY_SHOW_VIDEO]) showVideo = changes[KEY_SHOW_VIDEO].newValue;
  tick();
});
