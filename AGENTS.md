# AGENTS.md

Instructions for AI coding agents (e.g. Jules) working in this repository.

## Project overview

GoSimpleLiving is an affiliate publication and automation platform focused on helping people buy fewer, better products for a simpler, lower-waste home across kitchen, decluttering, sustainable household, small-space living, and beginner gardening categories.

- **Language / runtime:** TypeScript, Node.js (v20+)
- **Framework:** React 19, Vite, React Router v7, Tailwind CSS v4
- **Package manager:** npm

## Setup

```bash
npm install
```

## Common commands

| Task | Command |
| --- | --- |
| Install deps | `npm install` |
| Run dev server | `npm run dev` |
| Build | `npm run build` |
| Preview build | `npm run preview` |

## Project structure

- `src/` — React application source code (components, hooks, pages, contexts, utilities)
- `services/` — AI agent services (product monitor, search analyst, research assistant, content drafter, compliance checker, performance optimizer) and Supabase client setup
- `components/` — Core UI components (product cards, modals, comparison tables, structured data)
- `public/` — Static assets, `robots.txt`, `sitemap.xml`, and `_redirects`
- `supabase/` — Database migration scripts and schema setups

## Coding standards

- Use functional React components with hooks.
- Prefer named exports for utilities and services.
- Always include TypeScript types for props, functions, and API responses; avoid `any`.
- Keep affiliate links and disclosures merchant-aware (`affiliateUtils.ts`).
- Never display raw database system status or internal recovery messages in the public UI.

## Testing & Verification requirements

- Every feature change or UI update must be verified with `npm run build`.
- Use Playwright script runs or local browser testing to visually verify frontend changes.
- Ensure all canonical URLs reference `https://www.gosimpleliving.co/`.

## Constraints and gotchas

- Canonical domain must strictly be `https://www.gosimpleliving.co/`. Do not introduce `.com` variants in meta tags, sitemaps, or canonical tags.
- AI agents in `services/aiAgents/` operate in draft/preview mode and must require explicit human approval prior to publishing.
- Do not add software keys or digital license products to the catalog; retain the simple living product repositioning.

## Pull request expectations

- Keep PRs focused and self-contained.
- Provide descriptive commit messages with a clear summary of changes.
- Ensure `npm run build` passes with zero TypeScript or bundling errors before submitting.
