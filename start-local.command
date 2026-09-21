#!/bin/zsh
cd "$(dirname "$0")" || exit 1

if curl -fsS "http://127.0.0.1:4173/" >/dev/null 2>&1; then
  open "http://127.0.0.1:4173/"
  exit 0
fi

python3 -m http.server 4173 >/tmp/retro98-local-server.log 2>&1 &
retro_server_pid=$!
trap 'kill "$retro_server_pid" 2>/dev/null' EXIT INT TERM

for attempt in {1..30}; do
  if curl -fsS "http://127.0.0.1:4173/" >/dev/null 2>&1; then
    open "http://127.0.0.1:4173/"
    wait "$retro_server_pid"
    exit $?
  fi
  sleep 0.1
done

echo "Could not start Retro '98 on port 4173."
exit 1
