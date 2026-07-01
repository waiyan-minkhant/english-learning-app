#!/usr/bin/env bash
# Run once in Railway shell after first API deploy (DATABASE_URL must be set).
set -euo pipefail
cd "$(dirname "$0")/.."
pnpm --filter api db:seed
echo "Seeded demo users: teacher@demo.local, student1@demo.local, student2@demo.local (password: password123)"
