// noshorts — popup script
// 두 가지 설정을 chrome.storage.sync 에 저장/표시한다.
//   - enabled   : 쇼츠 차단 on/off (마스터)
//   - showVideo : 쇼츠 영상 표시 방식 (true=일반 watch, false=차단 페이지)

const KEY_ENABLED = "enabled";
const KEY_SHOW_VIDEO = "showVideo";

const toggleEnabled = document.getElementById("toggle-enabled");
const toggleShow = document.getElementById("toggle-show");
const changedDuringLoad = new Set();
let settingsLoaded = false;
let enabled = true;
let showVideo = false;
const status = document.getElementById("status");

// chrome.i18n으로 메시지 조회 (없는 키는 빈 문자열 반환)
function t(key) {
  return chrome.i18n.getMessage(key);
}

// data-i18n 속성이 붙은 모든 요소를 사용자 언어로 채운다.
function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const msg = t(el.dataset.i18n);
    if (msg) el.textContent = msg;
  });
}

function render() {
  toggleEnabled.checked = enabled;
  toggleShow.checked = showVideo;

  // 마스터가 꺼져 있어도 다음에 사용할 영상 표시 설정은 변경할 수 있다.
  toggleEnabled.disabled = !settingsLoaded;
  toggleShow.disabled = !settingsLoaded;

  if (!enabled) {
    status.textContent = t("statusOff");
  } else if (showVideo) {
    status.textContent = t("statusShow");
  } else {
    status.textContent = t("statusBlock");
  }
}

applyStaticI18n();

// 초기 읽기 중에는 입력을 막고, 다른 팝업/기기에서 변경한 값도 반영한다.
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
  if (settingsLoaded) render();
});

chrome.storage.sync.get(
  { [KEY_ENABLED]: true, [KEY_SHOW_VIDEO]: false },
  (result) => {
    if (!changedDuringLoad.has(KEY_ENABLED)) enabled = result[KEY_ENABLED] !== false;
    if (!changedDuringLoad.has(KEY_SHOW_VIDEO)) showVideo = result[KEY_SHOW_VIDEO] === true;
    settingsLoaded = true;
    changedDuringLoad.clear();
    render();
  }
);

toggleEnabled.addEventListener("change", () => {
  enabled = toggleEnabled.checked;
  render();
  chrome.storage.sync.set({ [KEY_ENABLED]: enabled });
});

toggleShow.addEventListener("change", () => {
  showVideo = toggleShow.checked;
  render();
  chrome.storage.sync.set({ [KEY_SHOW_VIDEO]: showVideo });
});
