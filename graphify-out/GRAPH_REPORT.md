# Graph Report - personal-expense-control  (2026-10-24)

## Corpus Check
- 62 files · ~19,268 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .example 1, (none) 1, .ico 1)

## Summary
- 394 nodes · 1036 edges · 19 communities (14 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ce0262a5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- gastos/page.tsx
- eslint.config.mjs
- presupuestos/page.tsx
- app/page.tsx
- check-users.mjs
- CategoryForm.tsx
- usuarios/actions.ts
- package.json
- compilerOptions
- auditoria/page.tsx
- dependencies
- next-auth
- scripts
- prisma
- README.md
- CLAUDE.md
- .claude/CLAUDE.md
- postcss.config.mjs
- { GET, POST }

## God Nodes (most connected - your core abstractions)
1. `Home()` - 30 edges
2. `Button()` - 24 edges
3. `GastosPage()` - 23 edges
4. `audit()` - 21 edges
5. `requireUser()` - 19 edges
6. `@prisma/client` - 19 edges
7. `Card()` - 16 edges
8. `AuditoriaPage()` - 16 edges
9. `prisma` - 16 edges
10. `next` - 16 edges

## Surprising Connections (you probably didn't know these)
- `AuditoriaPage()` --calls--> `requireUser()`  [EXTRACTED]
  app/auditoria/page.tsx → lib/auth.ts
- `createCategory()` --calls--> `audit()`  [EXTRACTED]
  app/categorias/actions.ts → lib/audit.ts
- `createCategory()` --calls--> `requireUser()`  [EXTRACTED]
  app/categorias/actions.ts → lib/auth.ts
- `updateCategory()` --calls--> `audit()`  [EXTRACTED]
  app/categorias/actions.ts → lib/audit.ts
- `updateCategory()` --calls--> `requireUser()`  [EXTRACTED]
  app/categorias/actions.ts → lib/auth.ts

## Import Cycles
- None detected.

## Communities (19 total, 5 thin omitted)

### Community 0 - "gastos/page.tsx"
Cohesion: 0.09
Nodes (54): Button(), BUTTON_VARIANTS, ButtonLink(), Card(), fieldClass, Input(), Label(), Select() (+46 more)

### Community 1 - "eslint.config.mjs"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 2 - "presupuestos/page.tsx"
Cohesion: 0.07
Nodes (47): AuditStamp(), DeleteBudgetButton(), dateFormatter, formatDate(), formatMoney(), moneyFormatter, BudgetCard(), dynamic (+39 more)

### Community 3 - "app/page.tsx"
Cohesion: 0.09
Nodes (51): dynamic, Empty(), Home(), periodHref(), SearchParams, Stat(), AXIS_TICK, CategoriasChart() (+43 more)

### Community 4 - "check-users.mjs"
Cohesion: 0.16
Nodes (11): RuleInput, UserChange, userChangeError(), valid, admin, base, member, no() (+3 more)

### Community 5 - "CategoryForm.tsx"
Cohesion: 0.10
Nodes (39): createCategory(), deleteCategory(), readFields(), readId(), unexpectedError(), updateCategory(), CategoryForm(), handleFile() (+31 more)

### Community 6 - "usuarios/actions.ts"
Cohesion: 0.09
Nodes (40): updateSettings(), geistMono, geistSans, LINKS, metadata, RootLayout(), ERRORS, LoginPage() (+32 more)

### Community 7 - "package.json"
Cohesion: 0.13
Nodes (20): devDependencies, eslint@^9, eslint-config-next@15.5.28, tailwindcss@^4, @tailwindcss/postcss@^4, @types/node@^20, @types/react@^19, @types/react-dom@^19 (+12 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 9 - "auditoria/page.tsx"
Cohesion: 0.25
Nodes (15): AuditoriaPage(), metadata, SearchParams, single(), Table(), ACTION_LABELS, AT_FORMAT, Change (+7 more)

### Community 10 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, @auth/prisma-adapter@2.11.3, lucide-react@^1.61.0, next@15.5.28, next-auth@5.0.0-beta.32, @prisma/client@^6.19.3, react@19.1.0, react-dom@19.1.0 (+5 more)

### Community 11 - "next-auth"
Cohesion: 0.60
Nodes (3): authConfig, config, next-auth

### Community 12 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 14 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **1 isolated node(s):** `{ GET, POST }`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 122 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@prisma/client` connect `presupuestos/page.tsx` to `gastos/page.tsx`, `app/page.tsx`, `check-users.mjs`, `CategoryForm.tsx`, `usuarios/actions.ts`, `package.json`, `auditoria/page.tsx`, `dependencies`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **What connects `{ GET, POST }` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `gastos/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09114183307731695 - nodes in this community are weakly interconnected._
- **Why does `next` connect `usuarios/actions.ts` to `gastos/page.tsx`, `presupuestos/page.tsx`, `app/page.tsx`, `CategoryForm.tsx`, `package.json`, `auditoria/page.tsx`, `dependencies`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Should `presupuestos/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06623376623376623 - nodes in this community are weakly interconnected._
- **Why does `prisma` connect `usuarios/actions.ts` to `gastos/page.tsx`, `presupuestos/page.tsx`, `app/page.tsx`, `CategoryForm.tsx`, `auditoria/page.tsx`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08735150244584207 - nodes in this community are weakly interconnected._