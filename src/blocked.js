// noshorts — blocked 페이지 동작
// 인라인 스크립트는 확장 페이지 CSP에 막히므로 별도 파일로 분리한다.

// chrome.i18n 으로 사용자 언어에 맞게 텍스트/문서 제목을 채운다.
function t(key) {
  return chrome.i18n.getMessage(key) || "";
}

document.querySelectorAll("[data-i18n]").forEach((el) => {
  const msg = t(el.dataset.i18n);
  if (msg) el.textContent = msg;
});

const localizedTitle = t("blockedTitle");
if (localizedTitle) document.title = localizedTitle;

document.documentElement.lang = chrome.i18n.getUILanguage();

document.getElementById("home").addEventListener("click", () => {
  location.href = "https://www.youtube.com/";
});

document.getElementById("back").addEventListener("click", () => {
  // 직전 페이지가 쇼츠였다면 다시 막히므로, 히스토리가 있으면 두 칸 전으로.
  if (history.length > 1) {
    history.back();
  } else {
    location.href = "https://www.youtube.com/";
  }
});
