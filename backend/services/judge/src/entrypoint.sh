#!/bin/sh
set -eu
# Do not leave JUDGE_SECRET in pid 1's environment. The HTTP adapter reads fd 3.
secret="${JUDGE_SECRET:-}"
unset JUDGE_SECRET
export JUDGE_SECRET_FD=3
exec 3<<EOF
${secret}
EOF
exec env -u JUDGE_SECRET node src/server.mjs
