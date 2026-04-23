# Treasury Core

<p align="center">
  <img src="./docs/assets/gutu-mascot.png" alt="Gutu mascot" width="220" />
</p>

Cash-position tracking, banking operations, liquidity forecasting, and treasury-side reconciliation for finance teams.

![Maturity: Hardened](https://img.shields.io/badge/Maturity-Hardened-2563eb) ![Verification: Build+Typecheck+Lint+Test+Contracts+Migrations+Integration](https://img.shields.io/badge/Verification-Build%2BTypecheck%2BLint%2BTest%2BContracts%2BMigrations%2BIntegration-2563eb) ![DB: postgres+sqlite](https://img.shields.io/badge/DB-postgres%2Bsqlite-2563eb) ![Integration Model: Actions+Resources+Jobs+Workflows+UI](https://img.shields.io/badge/Integration%20Model-Actions%2BResources%2BJobs%2BWorkflows%2BUI-2563eb)

## Part Of The Gutu Stack

| Aspect | Value |
| --- | --- |
| Repo kind | First-party plugin |
| Domain group | Operational Data |
| Default category | Business / Accounting & Finance |
| Primary focus | cash position, banking, liquidity forecasting |
| Best when | You need a governed domain boundary with explicit contracts and independent release cadence. |
| Composes through | Actions+Resources+Jobs+Workflows+UI |

- Gutu keeps plugins as independent repos with manifest-governed boundaries, compatibility channels, and verification lanes instead of hiding everything behind one giant mutable codebase.
- This plugin is meant to compose through explicit actions, resources, jobs, workflows, and runtime envelopes, not through undocumented hook chains.

## What It Does Now

Owns treasury-side cash posture, banking operations, and liquidity forecasting as a finance boundary distinct from ledger truth.

- Exports 3 governed actions: `treasury.cash-position.capture`, `treasury.banking.publish`, `treasury.forecasts.refresh`.
- Owns 3 resource contracts: `treasury.cash-position`, `treasury.banking`, `treasury.forecasts`.
- Publishes 2 job definitions with explicit queue and retry policy metadata.
- Publishes 1 workflow definition with state-machine descriptions and mandatory steps.
- Adds richer admin workspace contributions on top of the base UI surface.
- Ships explicit SQL migration or rollback helpers alongside the domain model.
- Documents 5 owned entity surface(s): `Cash Position`, `Banking Setup`, `Forecast`, `Reconciliation Session`, `Payout Batch`.
- Carries 3 report surface(s) and 3 exception queue(s) for operator parity and reconciliation visibility.
- Tracks ERPNext reference parity against module(s): `Accounts`.
- Operational scenario matrix includes `bank-import`, `payment-order-execution`, `cash-forecast-refresh`.
- Governs 3 settings or policy surface(s) for operator control and rollout safety.

## Maturity

**Maturity Tier:** `Hardened`

This tier is justified because unit coverage exists, contract coverage exists, integration coverage exists, migration coverage exists, job definitions are exported, and workflow definitions are exported.

## Verified Capability Summary

- Domain group: **Operational Data**
- Default category: **Business / Accounting & Finance**
- Verification surface: **Build+Typecheck+Lint+Test+Contracts+Migrations+Integration**
- Tests discovered: **5** total files across unit, contract, integration, migration lanes
- Integration model: **Actions+Resources+Jobs+Workflows+UI**
- Database support: **postgres + sqlite**

## Dependency And Compatibility Summary

| Field | Value |
| --- | --- |
| Package | `@plugins/treasury-core` |
| Manifest ID | `treasury-core` |
| Repo | [gutu-plugin-treasury-core](https://github.com/gutula/gutu-plugin-treasury-core) |
| Depends On | `auth-core`, `org-tenant-core`, `role-policy-core`, `audit-core`, `workflow-core`, `accounting-core`, `payments-core`, `traceability-core` |
| Requested Capabilities | `ui.register.admin`, `api.rest.mount`, `data.write.treasury`, `events.publish.treasury` |
| Provided Capabilities | `treasury.cash-position`, `treasury.banking`, `treasury.forecasts` |
| Runtime | bun>=1.3.12 |
| Database | postgres, sqlite |
| Integration Model | Actions+Resources+Jobs+Workflows+UI |

## Capability Matrix

| Surface | Count | Details |
| --- | --- | --- |
| Actions | 3 | `treasury.cash-position.capture`, `treasury.banking.publish`, `treasury.forecasts.refresh` |
| Resources | 3 | `treasury.cash-position`, `treasury.banking`, `treasury.forecasts` |
| Jobs | 2 | `treasury.projections.refresh`, `treasury.reconciliation.run` |
| Workflows | 1 | `treasury-lifecycle` |
| UI | Present | base UI surface, admin contributions |
| Owned Entities | 5 | `Cash Position`, `Banking Setup`, `Forecast`, `Reconciliation Session`, `Payout Batch` |
| Reports | 3 | `Cash Position Summary`, `Bank Reconciliation Overview`, `Treasury Forecast` |
| Exception Queues | 3 | `unmatched-bank-transactions`, `payout-failure-review`, `forecast-variance-review` |
| Operational Scenarios | 3 | `bank-import`, `payment-order-execution`, `cash-forecast-refresh` |
| Settings Surfaces | 3 | `Bank`, `Bank Account`, `Bank Statement Import` |
| ERPNext Refs | 1 | `Accounts` |

## Quick Start For Integrators

Use this repo inside a **compatible Gutu workspace** or the **ecosystem certification workspace** so its `workspace:*` dependencies resolve honestly.

```bash
# from a compatible workspace that already includes this plugin's dependency graph
bun install
bun run build
bun run test
bun run docs:check
```

```ts
import { manifest, createPrimaryRecordAction, BusinessPrimaryResource, jobDefinitions, workflowDefinitions, adminContributions, uiSurface } from "@plugins/treasury-core";

console.log(manifest.id);
console.log(createPrimaryRecordAction.id);
console.log(BusinessPrimaryResource.id);
```

Use the root repo scripts for day-to-day work **after the workspace is bootstrapped**, or run the nested package directly from `framework/builtin-plugins/treasury-core` if you need lower-level control.

## Current Test Coverage

- Root verification scripts: `bun run build`, `bun run typecheck`, `bun run lint`, `bun run test`, `bun run test:contracts`, `bun run test:unit`, `bun run test:integration`, `bun run test:migrations`, `bun run docs:check`
- Unit files: 1
- Contracts files: 1
- Integration files: 1
- Migrations files: 2

## Known Boundaries And Non-Goals

- Not a full vertical application suite; this plugin only owns the domain slice exported in this repo.
- Not a replacement for explicit orchestration in jobs/workflows when multi-step automation is required.
- Cross-plugin composition should use Gutu command, event, job, and workflow primitives. This repo should not be documented as exposing a generic WordPress-style hook system unless one is explicitly exported.

## Recommended Next Milestones

- Deepen bank-statement, payout, and forecast-variance coverage where treasury work becomes daily operator activity.
- Clarify accounting and payments handoffs before live treasury automation depends on this contract.
- Broaden lifecycle coverage with deeper orchestration, reconciliation, and operator tooling where the business flow requires it.
- Add more explicit domain events or follow-up job surfaces when downstream systems need tighter coupling.
- Convert more ERP parity references into first-class runtime handlers where needed, starting from `Bank`, `Bank Account`, `Bank Transaction`.

## More Docs

See [DEVELOPER.md](./DEVELOPER.md), [TODO.md](./TODO.md), [SECURITY.md](./SECURITY.md), [CONTRIBUTING.md](./CONTRIBUTING.md). The internal domain sources used to build those docs live under:

- `plugins/gutu-plugin-treasury-core/framework/builtin-plugins/treasury-core/docs/AGENT_CONTEXT.md`
- `plugins/gutu-plugin-treasury-core/framework/builtin-plugins/treasury-core/docs/BUSINESS_RULES.md`
- `plugins/gutu-plugin-treasury-core/framework/builtin-plugins/treasury-core/docs/EDGE_CASES.md`
- `plugins/gutu-plugin-treasury-core/framework/builtin-plugins/treasury-core/docs/FLOWS.md`
- `plugins/gutu-plugin-treasury-core/framework/builtin-plugins/treasury-core/docs/GLOSSARY.md`
- `plugins/gutu-plugin-treasury-core/framework/builtin-plugins/treasury-core/docs/MANDATORY_STEPS.md`
