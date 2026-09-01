#!/bin/bash
# The CHANGELOG promises that every version surface moves together on each
# release. That promise has drifted twice already (dsh held at 0.5.1 by a
# deliberate ruling, then the plugin manifest bumped alone), and nothing but
# discipline was checking it. Now something does.
set -u

fail=0
read_json_version() { grep -m1 '"version"' "$1" | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/'; }

ROOT=$(read_json_version package.json)
PLUGIN=$(read_json_version plugin/.claude-plugin/plugin.json)
MCPB=$(read_json_version mcpb/manifest.json)
DSH=$(read_json_version dsh/package.json)
MCP=$(grep -m1 "version: '" src/mcp/index.ts | sed "s/.*version: '\([^']*\)'.*/\1/")

printf 'package.json            %s\n' "$ROOT"
printf 'plugin manifest         %s\n' "$PLUGIN"
printf 'mcpb manifest           %s\n' "$MCPB"
printf 'dsh/package.json        %s\n' "$DSH"
printf 'mcp serverInfo          %s\n' "$MCP"

for pair in "plugin manifest:$PLUGIN" "mcpb manifest:$MCPB" "dsh/package.json:$DSH" "mcp serverInfo:$MCP"; do
  name=${pair%%:*}
  value=${pair##*:}
  if [ "$value" != "$ROOT" ]; then
    echo "MISMATCH: $name is $value, package.json is $ROOT"
    fail=1
  fi
done

if [ "$fail" -ne 0 ]; then
  echo 'VERSION-CHECK: FAIL — all five surfaces must carry the same version (see CHANGELOG).'
  exit 1
fi

echo 'VERSION-CHECK: PASS'
