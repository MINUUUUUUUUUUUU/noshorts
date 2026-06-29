// noshorts — popup script
// on/off 토글 상태를 chrome.storage.sync 에 저장/표시한다.

const STORAGE_KEY = "enabled";

const toggle = document.getElementById("toggle");
const status = document.getElementById("status");

function render(enabled) {
  toggle.checked = enabled;
  status.textContent = enabled
    ? "쇼츠 차단이 켜져 있습니다."
    : "쇼츠 차단이 꺼져 있습니다.";
}

// 저장된 상태 로드 (기본값: 켜짐)
chrome.storage.sync.get({ [STORAGE_KEY]: true }, (result) => {
  render(result[STORAGE_KEY]);
});

// 토글 변경 시 저장
toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ [STORAGE_KEY]: enabled }, () => {
    render(enabled);
  });
});
