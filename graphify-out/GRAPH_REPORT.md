# Graph Report - personal-expense-control  (2026-10-24)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 381 nodes · 891 edges · 20 communities (15 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ab74922`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19

## God Nodes (most connected - your core abstractions)
1. `Home()` - 27 edges
2. `audit()` - 21 edges
3. `requireUser()` - 19 edges
4. `@prisma/client` - 19 edges
5. `next` - 18 edges
6. `prisma` - 16 edges
7. `compilerOptions` - 16 edges
8. `GastosPage()` - 15 edges
9. `CategoryIcon()` - 13 edges
10. `AuditStamp()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `AuditoriaPage()` --calls--> `requireUser()`  [EXTRACTED]
  app/auditoria/page.tsx → lib/auth.ts
- `createCategory()` --calls--> `audit()`  [EXTRACTED]
  app/categorias/actions.ts → lib/audit.ts
- `updateCategory()` --calls--> `audit()`  [EXTRACTED]
  app/categorias/actions.ts → lib/audit.ts
- `deleteCategory()` --calls--> `audit()`  [EXTRACTED]
  app/categorias/actions.ts → lib/audit.ts
- `ok()` --calls--> `parseCategoryIcon()`  [EXTRACTED]
  scripts/check-category-icon.mjs → app/categorias/shared.ts

## Import Cycles
- None detected.

## Communities (20 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (52): AuditStamp(), ConfiguracionPage(), dynamic, BudgetForm(), currencies, FormBudget, FormCategory, initialState (+44 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (51): Card(), dynamic, Empty(), Home(), periodHref(), SearchParams, AXIS_TICK, CategoriasChart() (+43 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (37): createCategory(), deleteCategory(), readFields(), readId(), unexpectedError(), updateCategory(), CategoryForm(), handleFile() (+29 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (31): updateSettings(), geistMono, geistSans, LINKS, metadata, RootLayout(), ERRORS, LoginPage() (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (35): borrarGasto(), crearGasto(), editarGasto(), isNotFound(), toRecord(), DeleteExpenseButton(), handleClick(), CURRENCIES (+27 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (20): devDependencies, eslint@^9, eslint-config-next@15.5.28, tailwindcss@^4, @tailwindcss/postcss@^4, @types/node@^20, @types/react@^19, @types/react-dom@^19 (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.26
Nodes (14): AuditoriaPage(), metadata, SearchParams, single(), ACTION_LABELS, AT_FORMAT, Change, diffAudit() (+6 more)

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (12): normalizeEmail(), RuleInput, UserChange, userChangeError(), valid, admin, base, member (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.25
Nodes (12): createBudget(), deleteBudget(), snapshot(), updateBudget(), WITH_CATEGORY_IDS, audit(), toAuditJson(), readRawBudgetInput() (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (14): dependencies, @auth/prisma-adapter@2.11.3, lucide-react@^1.61.0, next@15.5.28, next-auth@5.0.0-beta.32, @prisma/client@^6.19.3, react@19.1.0, react-dom@19.1.0 (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 12 - "Community 12"
Cohesion: 0.60
Nodes (3): authConfig, config, next-auth

### Community 13 - "Community 13"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 15 - "Community 15"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **1 isolated node(s):** `{ GET, POST }`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 120 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@prisma/client` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 7`, `Community 8`, `Community 10`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **What connects `{ GET, POST }` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 7`, `Community 9`, `Community 10`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08735150244584207 - nodes in this community are weakly interconnected._
- **Why does `prisma` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 7`, `Community 9`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.10821256038647344 - nodes in this community are weakly interconnected._