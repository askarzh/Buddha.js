#!/bin/bash
# Isolated-bundle smoke test: copies the bundle OUTSIDE the repo (no node_modules
# up-tree) and runs an MCP tools/list over stdio. Proves self-containedness.
set -u
BUNDLE="$1"
D=$(mktemp -d)
cp "$BUNDLE" "$D/server.mjs"
OUT=$(printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"0"}}}' \
 '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 | BUDDHA_STATE_DIR="$D/state" timeout 15 node "$D/server.mjs" 2>&1)
COUNT=$(echo "$OUT" | grep -o '"name":"buddha_' | wc -l)
echo "tool-count=$COUNT"
if [ "$COUNT" -eq 14 ]; then echo "ISOLATED-SMOKE: PASS"; else echo "ISOLATED-SMOKE: FAIL"; echo "$OUT" | head -c 400; exit 1; fi
