# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This repository is newly initialized and contains no source code yet. The project is named `quan-demo` and is MIT-licensed (copyright Jiexin Li, 2026).

## Getting Started

As code is added to this repository, update this file with:
- Build, lint, and test commands
- Architecture overview and key design decisions
- Any non-obvious conventions or constraints

## Commands

- `npm run dev` — start local dev server at http://localhost:4321
- `npm run build` — build for production (output: `dist/`)
- `npm test` — run unit tests (vitest + happy-dom)
- `npm run test:watch` — run tests in watch mode

## Architecture

Astro v5 with `output: 'server'` (Astro v5 removed `output: 'hybrid'`). Deployed to Cloudflare Pages via GitHub integration (no Wrangler — CF dashboard only).

**Prerender convention:** Static pages (homepage, category listing, product detail, cart, checkout) must include `export const prerender = true`. Dynamic SSR pages (order confirmation `/order/[id]`) and API routes (`/api/*`) omit this flag and run as CF Workers.

Product pages use `getStaticPaths()` + `export const prerender = true` to prerender all product/category paths at build time from `src/data/products.json`.

Cart state lives in `localStorage`. Orders are written to CF KV namespace `QUAN_STORE` via POST /api/order.

**Local dev note:** API routes require CF KV which is unavailable locally. The full order flow only works on the deployed CF Pages site.
