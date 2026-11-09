# Chrome Web Store 업데이트 자동화

기존 항목 `akfmjlfeanibkgichgmfpnmjlekacmfl`에 새 패키지를 제출합니다.
게시자 ID는 제공된 개발자 콘솔 URL의 `086c7f23-71df-4cf3-b214-b6f6a51f14b7`입니다.
API 권한 오류가 나면 개발자 콘솔 계정의 게시자 ID와 접근 권한을 확인하세요.

`main` push → 테스트 → ZIP 생성 → Web Store API v2 업로드 → 심사 요청 → Google 승인 후 자동 게시.
문서만 변경한 push도 실행됩니다. Google 심사와 승인은 자동화가 대신할 수 없습니다.
기존 GitHub Release 워크플로는 별도로 유지됩니다.

## 최초 계정 연결

1. 확장 소유자 또는 해당 게시자 권한이 있는 Google 계정으로 Google Cloud 프로젝트를 만들거나 선택하고 **Chrome Web Store API**를 활성화합니다.
2. Google Auth Platform에서 OAuth 동의 화면과 OAuth 클라이언트(웹 애플리케이션)를 설정합니다. 외부 앱의 Testing 상태에서는 refresh token이 7일 후 만료될 수 있으므로 지속적인 CI에 적절한 게시 상태로 설정합니다.
3. [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)를 사용할 경우 클라이언트의 승인된 리디렉션 URI에 `https://developers.google.com/oauthplayground`를 추가합니다. Playground 설정에서 **Use your own OAuth credentials**를 선택해 본인의 client ID/secret을 입력합니다.
4. `https://www.googleapis.com/auth/chromewebstore` 범위로 소유자 계정의 동의를 받고 authorization code를 토큰으로 교환해 refresh token을 발급합니다. 오프라인 접근을 사용합니다. Playground 기본 클라이언트로 발급한 임시 토큰은 CI에 사용하지 않습니다.
5. GitHub 저장소 **Settings → Secrets and variables → Actions → Secrets**에 아래 세 값을 등록합니다. 채팅이나 저장소 파일에 값을 넣지 마세요.

   | Secret | 값 |
   | --- | --- |
   | `CWS_CLIENT_ID` | 본인의 OAuth 클라이언트 ID |
   | `CWS_CLIENT_SECRET` | 해당 클라이언트의 secret |
   | `CWS_REFRESH_TOKEN` | 위 계정과 범위로 발급한 refresh token |

6. 같은 화면의 **Variables**에 `CWS_ENABLED` = `true`를 등록합니다. 이 값이 없으면 테스트와 임시 ZIP 생성만 실행되고 스토어 제출은 생략됩니다.
7. **Actions → Chrome Web Store → Run workflow → main**으로 최초 연결을 검증합니다. 성공한 `PENDING_REVIEW`는 심사 접수이며 게시 완료는 아닙니다. 실제 게시 여부는 개발자 콘솔에서 확인합니다.

스토어 설명·개인정보 공개·배포 국가 등 기존 대시보드 설정을 사용합니다. 필수 정보가 미완성이면 대시보드에서 먼저 완성해야 합니다.

## 비용과 자동 재시도

공개 저장소의 무료 표준 `ubuntu-latest` runner만 사용합니다. 저장소를 비공개로 바꾸면 이 작업은 실행하지 않습니다. 유료 runner나 다른 클라우드 서비스를 추가하지 않으며, Actions artifact 저장 공간을 사용하지 않도록 ZIP은 실행 중 임시 파일로만 만듭니다.

`main` push 때 실행하고, UTC 기준 매일 00:23·06:23·12:23·18:23에 최신 main을 다시 확인합니다. 한국 시간으로 03:23·09:23·15:23·21:23입니다. GitHub 스케줄은 지연·누락될 수 있어 정확한 시각을 보장하지 않습니다. 계정 잠금 중에는 정기 실행도 차단됩니다. GitHub가 실행을 허용하면 다음 정상 실행에서 이어갑니다. 이것이 계정 잠금 자체를 해제하지는 않습니다.

다른 버전이 심사 중이면 `WAITING_FOR_REVIEW`로 기록하고 종료합니다. 다음 정기 실행에서 다시 확인해, 기존 버전이 게시된 뒤 최신 main을 제출합니다. 기존 심사를 자동 취소하지 않습니다. 이미 같은 버전이 심사 중이거나 게시됐으면 중복 업로드하지 않습니다. 반려, 계정 정책 위반, 자격증명 만료는 사용자 조치가 필요합니다. 스테이징된 버전은 대시보드에서 게시하거나 취소해야 대기가 풀립니다.

공개 저장소의 예약 실행은 60일 동안 저장소 활동이 없으면 GitHub가 비활성화할 수 있습니다. 장기 방치 후에는 예약 실행 활성 상태를 확인해야 합니다. 일반 push 트리거는 별도입니다.

## 버전

ZIP 내부 버전은 manifest의 세 자리 버전에 최신 main의 첫 번째 부모 이력 커밋 수를 붙입니다. 예: `1.4.0` + 커밋 수 12 → `1.4.0.12`. 전체 이력을 checkout하므로 같은 커밋의 수동·정기 재시도는 항상 같은 버전입니다. 저장소 manifest는 수정하지 않습니다.

main 이력을 강제로 다시 쓰지 마세요. 스토어의 기존 버전이 더 높거나 커밋 수가 65535를 초과하면 버전 정책을 조정해야 합니다. 기존 실행 번호 방식에서 전환할 때도 스토어 버전이 더 높으면 manifest 기본 버전을 먼저 올립니다. 버전 역행은 자동으로 차단합니다.

스토어 ZIP은 임시 파일이며 업로드 artifact로 보관하지 않습니다. 기존 GitHub Release ZIP은 manifest 기본 버전으로 별도 생성됩니다. 연속 push의 대기 작업은 GitHub concurrency에 따라 최신 작업으로 대체될 수 있으며, 정기 실행은 항상 최신 main을 검사합니다.

## 로컬 검증

```sh
node --test tests/content.test.cjs
python3 -m unittest discover -s tests -p 'test_webstore.py' -v
python3 scripts/webstore.py package --revision 1 --archive /tmp/noshorts-webstore.zip
```

테스트는 API 응답을 대체해 중복 제출, 버전 역행, 업로드 실패 및 비동기 처리를 검증합니다. 실제 OAuth 연결·스토어 업로드는 자격증명 등록 후 Actions에서 검증해야 합니다.

API 명세: [Google 공식 v2 discovery](https://github.com/googleapis/google-api-go-client/blob/main/chromewebstore/v2/chromewebstore-api.json), [Chrome Web Store API](https://developer.chrome.com/docs/webstore/api).
