// noshorts — popup script
// 두 가지 설정을 chrome.storage.sync 에 저장/표시한다.
//   - enabled   : 쇼츠 차단 on/off (마스터)
//   - showVideo : 쇼츠 영상 표시 방식 (true=일반 watch, false=차단 페이지)

const KEY_ENABLED = "enabled";
const KEY_SHOW_VIDEO = "showVideo";

const toggleEnabled = document.getElementById("toggle-enabled");
const toggleShow = document.getElementById("toggle-show");
const rowShow = document.getElementById("row-show");
const status = document.getElementById("status");

// chrome.i18n 으로 메시지 조회 (없으면 기존 텍스트 유지)
function t(key) {
  return chrome.i18n.getMessage(key) || "";
}

// data-i18n 속성이 붙은 모든 요소를 사용자 언어로 채운다.
function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const msg = t(el.dataset.i18n);
    if (msg) el.textContent = msg;
  });
}

function render(enabled, showVideo) {
  toggleEnabled.checked = enabled;
  toggleShow.checked = showVideo;

  // 차단이 꺼져 있으면 표시 방식 선택은 의미가 없으므로 비활성화.
  rowShow.classList.toggle("disabled", !enabled);

  if (!enabled) {
    status.textContent = t("statusOff");
  } else if (showVideo) {
    status.textContent = t("statusShow");
  } else {
    status.textContent = t("statusBlock");
  }
}

applyStaticI18n();

// 저장된 상태 로드 (기본값: 차단 켜짐 / 영상 표시 끔)
chrome.storage.sync.get(
  { [KEY_ENABLED]: true, [KEY_SHOW_VIDEO]: false },
  (result) => {
    render(result[KEY_ENABLED], result[KEY_SHOW_VIDEO]);
  }
);

toggleEnabled.addEventListener("change", () => {
  chrome.storage.sync.set({ [KEY_ENABLED]: toggleEnabled.checked }, () => {
    render(toggleEnabled.checked, toggleShow.checked);
  });
});

toggleShow.addEventListener("change", () => {
  chrome.storage.sync.set({ [KEY_SHOW_VIDEO]: toggleShow.checked }, () => {
    render(toggleEnabled.checked, toggleShow.checked);
  });
});
