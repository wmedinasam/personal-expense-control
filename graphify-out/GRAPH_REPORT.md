# Graph Report - personal-expense-control  (2026-10-24)

## Corpus Check
- 59 files · ~19,081 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .example 1, (none) 1, .ico 1)

## Summary
- 390 nodes · 1017 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ab74922`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app/page.tsx
- package.json
- index.tsx
- gastos/page.tsx
- categorias/actions.ts
- presupuestos/page.tsx
- auth.ts
- shared.ts
- compilerOptions
- auditoria/page.tsx
- audit.ts
- README.md
- postcss.config.mjs
- { GET, POST }

## God Nodes (most connected - your core abstractions)
1. `Home()` - 30 edges
2. `GastosPage()` - 23 edges
3. `Button()` - 22 edges
4. `audit()` - 21 edges
5. `requireUser()` - 19 edges
6. `@prisma/client` - 19 edges
7. `Card()` - 16 edges
8. `prisma` - 16 edges
9. `next` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `AuditStamp()` --calls--> `formatAuditStamp()`  [EXTRACTED]
  app/_components/AuditStamp.tsx → lib/audit.ts
- `AuditoriaPage()` --calls--> `requireUser()`  [EXTRACTED]
  app/auditoria/page.tsx → lib/auth.ts
- `validateCategoryFields()` --calls--> `parseCategoryIcon()`  [EXTRACTED]
  lib/categories.ts → app/categorias/shared.ts
- `ok()` --calls--> `parseCategoryIcon()`  [EXTRACTED]
  scripts/check-category-icon.mjs → app/categorias/shared.ts
- `ConfiguracionPage()` --calls--> `getCurrentUser`  [EXTRACTED]
  app/configuracion/page.tsx → lib/auth.ts

## Import Cycles
- None detected.

## Communities (14 total, 2 thin omitted)

### Community 0 - "app/page.tsx"
Cohesion: 0.09
Nodes (51): dynamic, Empty(), Home(), periodHref(), SearchParams, Stat(), AXIS_TICK, CategoriasChart() (+43 more)

### Community 1 - "package.json"
Cohesion: 0.05
Nodes (45): compat, __dirname, eslintConfig, __filename, dependencies, @auth/prisma-adapter@2.11.3, lucide-react@^1.61.0, next@15.5.28 (+37 more)

### Community 2 - "index.tsx"
Cohesion: 0.12
Nodes (40): CategoryForm(), Props, CategoryIcon(), CategoryRow(), CategoriasPage(), dynamic, AuditStamp(), Button() (+32 more)

### Community 3 - "gastos/page.tsx"
Cohesion: 0.10
Nodes (38): borrarGasto(), crearGasto(), editarGasto(), isNotFound(), toRecord(), DeleteExpenseButton(), handleClick(), handleSubmit() (+30 more)

### Community 4 - "categorias/actions.ts"
Cohesion: 0.10
Nodes (36): createCategory(), deleteCategory(), readFields(), readId(), unexpectedError(), updateCategory(), ActionResult, updateSettings() (+28 more)

### Community 5 - "presupuestos/page.tsx"
Cohesion: 0.11
Nodes (29): EmptyState(), DeleteBudgetButton(), dateFormatter, formatDate(), formatMoney(), moneyFormatter, BudgetCard(), dynamic (+21 more)

### Community 6 - "auth.ts"
Cohesion: 0.12
Nodes (19): geistMono, geistSans, LINKS, metadata, RootLayout(), ERRORS, LoginPage(), metadata (+11 more)

### Community 7 - "shared.ts"
Cohesion: 0.12
Nodes (20): handleFile(), LUCIDE_ICONS, Props, CATEGORY_COLORS, CATEGORY_ICONS, CategoryFields, CategoryIconName, CategoryListItem (+12 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 9 - "auditoria/page.tsx"
Cohesion: 0.26
Nodes (14): AuditoriaPage(), metadata, SearchParams, single(), ACTION_LABELS, AT_FORMAT, Change, diffAudit() (+6 more)

### Community 10 - "audit.ts"
Cohesion: 0.17
Nodes (13): AuditClient, AuditEntity, AuditInput, AuditStampData, formatAuditStamp(), formatStamp(), STAMP_FORMAT, toAuditJson() (+5 more)

### Community 11 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **1 isolated node(s):** `{ GET, POST }`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 119 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@prisma/client` connect `gastos/page.tsx` to `app/page.tsx`, `package.json`, `index.tsx`, `categorias/actions.ts`, `presupuestos/page.tsx`, `auditoria/page.tsx`, `audit.ts`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **What connects `{ GET, POST }` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08735150244584207 - nodes in this community are weakly interconnected._
- **Why does `next` connect `auth.ts` to `app/page.tsx`, `package.json`, `index.tsx`, `gastos/page.tsx`, `categorias/actions.ts`, `presupuestos/page.tsx`, `auditoria/page.tsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05019607843137255 - nodes in this community are weakly interconnected._
- **Why does `prisma` connect `gastos/page.tsx` to `app/page.tsx`, `index.tsx`, `categorias/actions.ts`, `presupuestos/page.tsx`, `auth.ts`, `shared.ts`, `auditoria/page.tsx`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._