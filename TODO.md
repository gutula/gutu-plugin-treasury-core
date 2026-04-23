# Treasury Core TODO

**Maturity Tier:** `Hardened`

## Shipped Now

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

## Current Gaps

- Repo-local documentation verification entrypoints were missing before this pass and need to stay green as the repo evolves.

## Recommended Next

- Deepen bank-statement, payout, and forecast-variance coverage where treasury work becomes daily operator activity.
- Clarify accounting and payments handoffs before live treasury automation depends on this contract.
- Broaden lifecycle coverage with deeper orchestration, reconciliation, and operator tooling where the business flow requires it.
- Add more explicit domain events or follow-up job surfaces when downstream systems need tighter coupling.
- Convert more ERP parity references into first-class runtime handlers where needed, starting from `Bank`, `Bank Account`, `Bank Transaction`.

## Later / Optional

- Outbound connectors, richer analytics, or portal-facing experiences once the core domain contracts harden.
