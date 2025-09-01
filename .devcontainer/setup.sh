#!/usr/bin/env bash
set -euo pipefail


# Python
if ! [ -d api/.venv ]; then
  python -m venv api/.venv
fi
# shellcheck source=/dev/null
source api/.venv/bin/activate || true
python -m pip install -U pip wheel || true
if [ -f api/requirements.txt ]; then
  pip install -r api/requirements.txt || true
fi

# Node (web/)
if [ -f web/package.json ]; then
  pushd web >/dev/null
  if command -v npm >/dev/null 2>&1; then
    (npm ci || npm install) || true
  fi
  popd >/dev/null
fi

# Env handling
if [ ! -f .env ]; then
  echo "# Auto-generated .env (demo mode)" > .env
  echo "OPENAI_API_KEY=${OPENAI_API_KEY:-demo-openai-key}" >> .env
  echo "DATABASE_URL=${DATABASE_URL:-sqlite:///demo.db}" >> .env
  echo "BREEZE_API_KEY=${BREEZE_API_KEY:-demo-breeze-key}" >> .env
  echo "BREEZE_API_SECRET=${BREEZE_API_SECRET:-demo-breeze-secret}" >> .env
  echo "BREEZE_SESSION_TOKEN=${BREEZE_SESSION_TOKEN:-demo-session}" >> .env
fi

# Seed demo data if script exists
if [ -f scripts/seed_demo.py ]; then
  python scripts/seed_demo.py || true
fi

echo "Setup complete ✅"
