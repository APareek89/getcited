#!/usr/bin/env bash
# Dev-server launcher. The corp MITM proxy re-signs TLS, so Node needs the corp CA
# bundle or every server-side fetch (Supabase, Anthropic, crawls) fails with
# UNABLE_TO_GET_ISSUER_CERT_LOCALLY. Also pins Node 22 (pnpm 11 breaks on Node 18).
set -euo pipefail

CAB="/Users/anandpareek/Documents/SEO content Skill/scripts/system-ca-bundle.pem"
if [ -f "$CAB" ]; then
  export NODE_EXTRA_CA_CERTS="$CAB" SSL_CERT_FILE="$CAB" CURL_CA_BUNDLE="$CAB"
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_BIN="/Users/anandpareek/.nvm/versions/node/v22.22.0/bin/node"
[ -x "$NODE_BIN" ] || NODE_BIN="$(command -v node)"

exec "$NODE_BIN" "$DIR/node_modules/next/dist/bin/next" dev "$DIR" -p "${PORT:-3210}"
