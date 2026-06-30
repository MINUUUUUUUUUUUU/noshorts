#!/bin/bash
# noshorts — 주기적 자동 커밋 + push
#
# 자격증명은 이 스크립트에 두지 않는다. git credential.helper(osxkeychain)에
# 저장된 토큰을 사용하므로, 한 번 seed 해두면 비대화식으로도 push 된다.
# launchd 등에서 주기적으로 호출된다.

set -uo pipefail

REPO="/Users/minu/noshorts"
BRANCH="main"
LOG="$REPO/.auto-push.log"

# 비대화식: 자격증명이 없으면 멈추지 말고 즉시 실패하게
export GIT_TERMINAL_PROMPT=0

cd "$REPO" || exit 1

ts() { date '+%Y-%m-%d %H:%M:%S'; }

# 1) 변경분이 있으면 자동 커밋
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "chore: auto-backup $(ts)" >>"$LOG" 2>&1
  echo "[$(ts)] committed local changes" >>"$LOG"
fi

# 2) 원격보다 앞선 커밋이 있으면 push
LOCAL=$(git rev-parse "$BRANCH" 2>/dev/null)
REMOTE=$(git rev-parse "origin/$BRANCH" 2>/dev/null || echo "")
if [ "$LOCAL" != "$REMOTE" ]; then
  if git push origin "$BRANCH" >>"$LOG" 2>&1; then
    echo "[$(ts)] pushed $LOCAL" >>"$LOG"
  else
    echo "[$(ts)] push FAILED (자격증명 미설정?) — Keychain seed 필요" >>"$LOG"
  fi
else
  echo "[$(ts)] nothing to push" >>"$LOG"
fi
