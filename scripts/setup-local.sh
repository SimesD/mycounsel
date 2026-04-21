#!/usr/bin/env bash
# One-time local setup: creates the local D1 SQLite schema
set -e

echo "→ Setting up local D1 database..."
npx wrangler d1 execute mycounsel-db --local --file schema.sql

echo ""
echo "✓ Local database ready."
echo ""
echo "Next:"
echo "  1. Fill in your API keys in .dev.vars"
echo "  2. Run: npm run dev"
echo ""
echo "Endpoints:"
echo "  POST http://localhost:8787/contract/generate"
echo "  GET  http://localhost:8787/contract/:id/report"
echo "  POST http://localhost:8787/contract/:id/decision"
