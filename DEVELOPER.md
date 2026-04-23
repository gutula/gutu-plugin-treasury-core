# Treasury Core Developer Guide

Cash-position tracking, banking operations, liquidity forecasting, and treasury-side reconciliation for finance teams.

**Maturity Tier:** `Hardened`

## Purpose And Architecture Role

Owns treasury-side cash posture, banking operations, and liquidity forecasting as a finance boundary distinct from ledger truth.

### This plugin is the right fit when

- You need **cash position**, **banking**, **liquidity forecasting** as a governed domain boundary.
- You want to integrate through declared actions, resources, jobs, workflows, and UI surfaces instead of implicit side effects.
- You need the host application to keep plugin boundaries honest through manifest capabilities, permissions, and verification lanes.

### This plugin is intentionally not

- Not a full vertical application suite; this plugin only owns the domain slice exported in this repo.
- Not a replacement for explicit orchestration in jobs/workflows when multi-step automation is required.

## Repo Map

| Path | Purpose |
| --- | --- |
| `package.json` | Root extracted-repo manifest, workspace wiring, and repo-level script entrypoints. |
| `framework/builtin-plugins/treasury-core` | Nested publishable plugin package. |
| `framework/builtin-plugins/treasury-core/src` | Runtime source, actions, resources, services, and UI exports. |
| `framework/builtin-plugins/treasury-core/tests` | Unit, contract, integration, and migration coverage where present. |
| `framework/builtin-plugins/treasury-core/docs` | Internal domain-doc source set kept in sync with this guide. |
| `framework/builtin-plugins/treasury-core/db/schema.ts` | Database schema contract when durable state is owned. |
| `framework/builtin-plugins/treasury-core/src/postgres.ts` | SQL migration and rollback helpers when exported. |

## Manifest Contract

| Field | Value |
| --- | --- |
| Package Name | `@plugins/treasury-core` |
| Manifest ID | `treasury-core` |
| Display Name | Treasury Core |
| Domain Group | Operational Data |
| Default Category | Business / Accounting & Finance |
| Version | `0.1.0` |
| Kind | `plugin` |
| Trust Tier | `first-party` |
| Review Tier | `R1` |
| Isolation Profile | `same-process-trusted` |
| Framework Compatibility | ^0.1.0 |
| Runtime Compatibility | bun>=1.3.12 |
| Database Compatibility | postgres, sqlite |

## Dependency Graph And Capability Requests

| Field | Value |
| --- | --- |
| Depends On | `auth-core`, `org-tenant-core`, `role-policy-core`, `audit-core`, `workflow-core`, `accounting-core`, `traceability-core` |
| Recommended Plugins | `payments-core` |
| Capability Enhancing | `e-invoicing-core`, `analytics-bi-core` |
| Integration Only | `business-portals-core` |
| Suggested Packs | `localization-global-base`, `localization-india`, `localization-united-states`, `sector-financial-services-compliance` |
| Standalone Supported | Yes |
| Requested Capabilities | `ui.register.admin`, `api.rest.mount`, `data.write.treasury`, `events.publish.treasury` |
| Provides Capabilities | `treasury.cash-position`, `treasury.banking`, `treasury.forecasts` |
| Owns Data | `treasury.cash-position`, `treasury.banking`, `treasury.forecasts`, `treasury.reconciliation` |

### Dependency interpretation

- Direct plugin dependencies describe package-level coupling that must already be present in the host graph.
- Requested capabilities tell the host what platform services or sibling plugins this package expects to find.
- Provided capabilities and owned data tell integrators what this package is authoritative for.

## Public Integration Surfaces

| Type | ID / Symbol | Access / Mode | Notes |
| --- | --- | --- | --- |
| Action | `treasury.cash-position.capture` | Permission: `treasury.cash-position.write` | Capture Cash Position<br>Idempotent<br>Audited |
| Action | `treasury.banking.publish` | Permission: `treasury.banking.write` | Publish Banking Instruction<br>Non-idempotent<br>Audited |
| Action | `treasury.forecasts.refresh` | Permission: `treasury.forecasts.write` | Refresh Treasury Forecast<br>Non-idempotent<br>Audited |
| Action | `treasury.cash-position.hold` | Permission: `treasury.cash-position.write` | Place Record On Hold<br>Non-idempotent<br>Audited |
| Action | `treasury.cash-position.release` | Permission: `treasury.cash-position.write` | Release Record Hold<br>Non-idempotent<br>Audited |
| Action | `treasury.cash-position.amend` | Permission: `treasury.cash-position.write` | Amend Record<br>Non-idempotent<br>Audited |
| Action | `treasury.cash-position.reverse` | Permission: `treasury.cash-position.write` | Reverse Record<br>Non-idempotent<br>Audited |
| Resource | `treasury.cash-position` | Portal disabled | Cash and liquidity position records across accounts and entities.<br>Purpose: Own treasury-side cash posture without mutating ledger truth directly.<br>Admin auto-CRUD enabled<br>Fields: `title`, `recordState`, `approvalState`, `postingState`, `fulfillmentState`, `updatedAt` |
| Resource | `treasury.banking` | Portal disabled | Banking relationship and treasury instruction records.<br>Purpose: Coordinate treasury operations as a distinct finance boundary.<br>Admin auto-CRUD enabled<br>Fields: `label`, `status`, `requestedAction`, `updatedAt` |
| Resource | `treasury.forecasts` | Portal disabled | Cash forecast and liquidity planning projections.<br>Purpose: Expose treasury planning and reconciliation posture explicitly.<br>Admin auto-CRUD enabled<br>Fields: `severity`, `status`, `reasonCode`, `updatedAt` |

### Job Catalog

| Job | Queue | Retry | Timeout |
| --- | --- | --- | --- |
| `treasury.projections.refresh` | `treasury-projections` | Retry policy not declared | No timeout declared |
| `treasury.reconciliation.run` | `treasury-reconciliation` | Retry policy not declared | No timeout declared |


### Workflow Catalog

| Workflow | Actors | States | Purpose |
| --- | --- | --- | --- |
| `treasury-lifecycle` | `treasurer`, `controller`, `approver` | `draft`, `pending_approval`, `active`, `reconciled`, `closed`, `canceled` | Keep liquidity planning, bank coordination, and treasury exceptions explicit. |


### UI Surface Summary

| Surface | Present | Notes |
| --- | --- | --- |
| UI Surface | Yes | A bounded UI surface export is present. |
| Admin Contributions | Yes | Additional admin workspace contributions are exported. |
| Zone/Canvas Extension | No | No dedicated zone extension export. |

## Hooks, Events, And Orchestration

This plugin should be integrated through **explicit commands/actions, resources, jobs, workflows, and the surrounding Gutu event runtime**. It must **not** be documented as a generic WordPress-style hook system unless such a hook API is explicitly exported.

- No standalone plugin-owned lifecycle event feed is exported today.
- Job surface: `treasury.projections.refresh`, `treasury.reconciliation.run`.
- Workflow surface: `treasury-lifecycle`.
- Recommended composition pattern: invoke actions, read resources, then let the surrounding Gutu command/event/job runtime handle downstream automation.

## Storage, Schema, And Migration Notes

- Database compatibility: `postgres`, `sqlite`
- Schema file: `framework/builtin-plugins/treasury-core/db/schema.ts`
- SQL helper file: `framework/builtin-plugins/treasury-core/src/postgres.ts`
- Migration lane present: Yes

The plugin ships explicit SQL helper exports. Use those helpers as the truth source for database migration or rollback expectations.

## Failure Modes And Recovery

- Action inputs can fail schema validation or permission evaluation before any durable mutation happens.
- If downstream automation is needed, the host must add it explicitly instead of assuming this plugin emits jobs.
- There is no separate lifecycle-event feed to rely on today; do not build one implicitly from internal details.
- Schema regressions are expected to show up in the migration lane and should block shipment.

## Mermaid Flows

### Primary Lifecycle

```mermaid
flowchart LR
  caller["Host or operator"] --> action["treasury.cash-position.capture"]
  action --> validation["Schema + permission guard"]
  validation --> service["Treasury Core service layer"]
  service --> state["treasury.cash-position"]
  service --> jobs["Follow-up jobs / queue definitions"]
  service --> workflows["Workflow state transitions"]
  state --> ui["Admin contributions"]
```

### Workflow State Machine

```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> pending_approval
  draft --> active
  draft --> reconciled
  draft --> closed
  draft --> canceled
```


## Integration Recipes

### 1. Host wiring

```ts
import { manifest, captureCashPositionAction, BusinessPrimaryResource, jobDefinitions, workflowDefinitions, adminContributions, uiSurface } from "@plugins/treasury-core";

export const pluginSurface = {
  manifest,
  captureCashPositionAction,
  BusinessPrimaryResource,
  jobDefinitions,
  workflowDefinitions,
  adminContributions,
  uiSurface
};
```

Use this pattern when your host needs to register the plugin’s declared exports without reaching into internal file paths.

### 2. Action-first orchestration

```ts
import { manifest, captureCashPositionAction } from "@plugins/treasury-core";

console.log("plugin", manifest.id);
console.log("action", captureCashPositionAction.id);
```

- Prefer action IDs as the stable integration boundary.
- Respect the declared permission, idempotency, and audit metadata instead of bypassing the service layer.
- Treat resource IDs as the read-model boundary for downstream consumers.

### 3. Cross-plugin composition

- Register the workflow definitions with the host runtime instead of re-encoding state transitions outside the plugin.
- Drive follow-up automation from explicit workflow transitions and resource reads.
- Pair workflow decisions with notifications or jobs in the outer orchestration layer when humans must be kept in the loop.

## Test Matrix

| Lane | Present | Evidence |
| --- | --- | --- |
| Build | Yes | `bun run build` |
| Typecheck | Yes | `bun run typecheck` |
| Lint | Yes | `bun run lint` |
| Test | Yes | `bun run test` |
| Unit | Yes | 1 file(s) |
| Contracts | Yes | 1 file(s) |
| Integration | Yes | 1 file(s) |
| Migrations | Yes | 2 file(s) |

### Verification commands

- `bun run build`
- `bun run typecheck`
- `bun run lint`
- `bun run test`
- `bun run test:contracts`
- `bun run test:unit`
- `bun run test:integration`
- `bun run test:migrations`
- `bun run docs:check`

## Current Truth And Recommended Next

### Current truth

- Exports 7 governed actions: `treasury.cash-position.capture`, `treasury.banking.publish`, `treasury.forecasts.refresh`, `treasury.cash-position.hold`, `treasury.cash-position.release`, `treasury.cash-position.amend`, `treasury.cash-position.reverse`.
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

### Current gaps

- No extra gaps were discovered beyond the plugin’s declared boundaries.

### Recommended next

- Deepen bank-statement, payout, and forecast-variance coverage where treasury work becomes daily operator activity.
- Clarify accounting and payments handoffs before live treasury automation depends on this contract.
- Broaden lifecycle coverage with deeper orchestration, reconciliation, and operator tooling where the business flow requires it.
- Add more explicit domain events or follow-up job surfaces when downstream systems need tighter coupling.
- Convert more ERP parity references into first-class runtime handlers where needed, starting from `Bank`, `Bank Account`, `Bank Transaction`.

### Later / optional

- Outbound connectors, richer analytics, or portal-facing experiences once the core domain contracts harden.
