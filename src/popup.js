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

function render(enabled, showVideo) {
  toggleEnabled.checked = enabled;
  toggleShow.checked = showVideo;

  // 차단이 꺼져 있으면 표시 방식 선택은 의미가 없으므로 비활성화.
  rowShow.classList.toggle("disabled", !enabled);

  if (!enabled) {
    status.textContent = "쇼츠 차단이 꺼져 있습니다.";
  } else if (showVideo) {
    status.textContent = "쇼츠를 일반 영상 페이지로 보냅니다.";
  } else {
    status.textContent = "쇼츠를 차단 페이지로 막습니다.";
  }
}

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
