#!/bin/bash
# noshorts — 주기적 자동 push (push 전용)
#
# WIP 자동 커밋은 하지 않는다. 내가 직접 만든 커밋 중 원격에 아직 안 올라간
# 것이 있으면 push만 한다. (예전엔 변경분을 자동 커밋했으나, 편집 도중과
# 경합해 지저분한 auto-backup 커밋이 생겨 push 전용으로 변경)
#
# 자격증명은 이 스크립트에 두지 않는다. git credential.helper(osxkeychain)에
# seed된 토큰을 사용하므로 비대화식으로도 push 된다. launchd에서 주기 호출.

set -uo pipefail

REPO="/Users/minu/noshorts"
BRANCH="main"
LOG="$REPO/.auto-push.log"

export GIT_TERMINAL_PROMPT=0  # 자격증명 없으면 멈추지 말고 즉시 실패

cd "$REPO" || exit 1
ts() { date '+%Y-%m-%d %H:%M:%S'; }

# 원격 상태 갱신 후, 로컬에 안 올라간 커밋이 있으면 push
git fetch origin "$BRANCH" -q 2>/dev/null || true
LOCAL=$(git rev-parse "$BRANCH" 2>/dev/null)
REMOTE=$(git rev-parse "origin/$BRANCH" 2>/dev/null || echo "")

if [ -z "$REMOTE" ] || [ "$LOCAL" != "$REMOTE" ]; then
  if git push origin "$BRANCH" >>"$LOG" 2>&1; then
    echo "[$(ts)] pushed $LOCAL" >>"$LOG"
  else
    echo "[$(ts)] push FAILED (자격증명 미설정?) — Keychain seed 필요" >>"$LOG"
  fi
else
  echo "[$(ts)] nothing to push" >>"$LOG"
fi
