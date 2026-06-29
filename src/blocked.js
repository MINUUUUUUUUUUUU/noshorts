// noshorts — blocked 페이지 동작
// 인라인 스크립트는 확장 페이지 CSP에 막히므로 별도 파일로 분리한다.

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
