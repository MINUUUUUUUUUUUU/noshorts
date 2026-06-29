// noshorts — content script
// YouTube 쇼츠(`/shorts/...`)로의 접근을 감지해 일반 시청 페이지(`/watch?v=...`)로
// 리다이렉트한다. YouTube는 SPA(단일 페이지 앱)라 페이지 전체 새로고침 없이
// 내부에서 화면이 바뀌므로, 최초 로드 + 내부 내비게이션 양쪽을 모두 처리한다.

const STORAGE_KEY = "enabled";

// 활성화 여부. 저장된 값이 없으면 기본 활성(true).
let enabled = true;

// `/shorts/<id>` 형태면 일반 watch URL로 변환해서 돌려주고, 아니면 null.
function shortsToWatchUrl(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch (e) {
    return null;
  }

  const match = url.pathname.match(/^\/shorts\/([^/?#]+)/);
  if (!match) return null;

  const videoId = match[1];
  const target = new URL("https://www.youtube.com/watch");
  target.searchParams.set("v", videoId);
  return target.toString();
}

// 현재 위치가 쇼츠면 일반 시청 페이지로 교체한다.
function redirectIfShorts() {
  if (!enabled) return;

  const watchUrl = shortsToWatchUrl(location.href);
  if (watchUrl && watchUrl !== location.href) {
    location.replace(watchUrl);
  }
}

// 1) 최초 진입(전체 페이지 로드) 시 즉시 검사.
redirectIfShorts();

// 2) YouTube 내부 내비게이션(SPA) 처리.
//    YouTube가 발생시키는 커스텀 이벤트를 듣는다.
window.addEventListener("yt-navigate-start", redirectIfShorts, true);
window.addEventListener("yt-navigate-finish", redirectIfShorts, true);

// 3) 안전망: 일부 경로 변경은 위 이벤트로 안 잡힐 수 있어 짧은 폴링으로 보완.
let lastHref = location.href;
setInterval(() => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    redirectIfShorts();
  }
}, 500);

// 저장된 on/off 상태를 읽어와 반영.
chrome.storage.sync.get({ [STORAGE_KEY]: true }, (result) => {
  enabled = result[STORAGE_KEY];
  redirectIfShorts();
});

// 팝업에서 토글이 바뀌면 즉시 반영.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes[STORAGE_KEY]) {
    enabled = changes[STORAGE_KEY].newValue;
    redirectIfShorts();
  }
});
