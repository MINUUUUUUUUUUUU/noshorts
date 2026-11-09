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

6. 같은 화면의 **Variables**에 `CWS_ENABLED` = `true`를 등록합니다. 이 값이 없으면 테스트와 ZIP 생성만 실행되고 스토어 제출은 생략됩니다.
7. **Actions → Chrome Web Store → Run workflow → main**으로 최초 연결을 검증합니다. 성공한 `PENDING_REVIEW`는 심사 접수이며 게시 완료는 아닙니다. 실제 게시 여부는 개발자 콘솔에서 확인합니다.

스토어 설명·개인정보 공개·배포 국가 등 기존 대시보드 설정을 사용합니다. 필수 정보가 미완성이면 대시보드에서 먼저 완성해야 합니다.

## 버전과 재실행

ZIP 내부 버전은 `manifest.json`의 세 자리 버전에 해당 워크플로의 `github.run_number`를 붙입니다. 예: `1.4.0` + 실행 12 → `1.4.0.12`. 저장소 manifest는 수정하지 않습니다. 같은 실행을 재시도하면 동일 버전이며, 이미 게시되거나 심사 중이면 중복 제출을 건너뜁니다.

스토어의 기존 버전이 더 높다면 manifest 기본 버전을 먼저 올립니다. 실행 번호는 1..65535만 허용합니다. 이를 초과하거나 워크플로를 교체해 실행 번호가 초기화되면 기본 버전과 번호 정책을 조정해야 합니다. GitHub Release ZIP은 manifest 기본 버전이고, 스토어 제출 ZIP은 **Chrome Web Store 실행의 noshorts-webstore artifact**입니다.

다른 버전이 심사 중이면 기존 심사를 취소하지 않고 실행을 실패시킵니다. 심사 완료 후 가장 최신 main 실행을 재시도하거나 Run workflow를 실행하세요. 반려된 버전은 피드백을 해결하고 새 실행으로 제출합니다. 연속 push는 GitHub concurrency에 따라 대기 실행이 최신 실행으로 대체될 수 있습니다.

## 로컬 검증

```sh
node --test tests/content.test.cjs
python3 -m unittest discover -s tests -p 'test_webstore.py' -v
python3 scripts/webstore.py package --run-number 1 --archive /tmp/noshorts-webstore.zip
```

테스트는 API 응답을 대체해 중복 제출, 버전 역행, 업로드 실패 및 비동기 처리를 검증합니다. 실제 OAuth 연결·스토어 업로드는 자격증명 등록 후 Actions에서 검증해야 합니다.

API 명세: [Google 공식 v2 discovery](https://github.com/googleapis/google-api-go-client/blob/main/chromewebstore/v2/chromewebstore-api.json), [Chrome Web Store API](https://developer.chrome.com/docs/webstore/api).
