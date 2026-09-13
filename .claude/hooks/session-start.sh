#!/bin/bash
# Claude Code 웹(원격 컨테이너) 세션 시작 시 ponytail 플러그인을 설치한다.
# 로컬(맥북 등)에서는 CLAUDE_CODE_REMOTE가 없으므로 아무 것도 하지 않고 종료한다.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if ! claude plugin marketplace list 2>/dev/null | grep -q "ponytail"; then
  claude plugin marketplace add DietrichGebert/ponytail
fi

if ! claude plugin list 2>/dev/null | grep -q "ponytail@ponytail"; then
  claude plugin install ponytail@ponytail
fi
