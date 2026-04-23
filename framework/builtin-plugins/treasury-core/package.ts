import { definePackage } from "@platform/kernel";

export default definePackage({
  "id": "treasury-core",
  "kind": "plugin",
  "version": "0.1.0",
  "contractVersion": "1.0.0",
  "sourceRepo": "gutu-plugin-treasury-core",
  "displayName": "Treasury Core",
  "domainGroup": "Operational Data",
  "defaultCategory": {
    "id": "business",
    "label": "Business",
    "subcategoryId": "accounting_finance",
    "subcategoryLabel": "Accounting & Finance"
  },
  "description": "Cash-position tracking, banking operations, liquidity forecasting, and treasury-side reconciliation for finance teams.",
  "extends": [],
  "dependsOn": [
    "auth-core",
    "org-tenant-core",
    "role-policy-core",
    "audit-core",
    "workflow-core",
    "accounting-core",
    "traceability-core"
  ],
  "dependencyContracts": [
    {
      "packageId": "auth-core",
      "class": "required",
      "rationale": "Required for Treasury Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "org-tenant-core",
      "class": "required",
      "rationale": "Required for Treasury Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "role-policy-core",
      "class": "required",
      "rationale": "Required for Treasury Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "audit-core",
      "class": "required",
      "rationale": "Required for Treasury Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "workflow-core",
      "class": "required",
      "rationale": "Required for Treasury Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "accounting-core",
      "class": "required",
      "rationale": "Required for Treasury Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "traceability-core",
      "class": "required",
      "rationale": "Required for Treasury Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "payments-core",
      "class": "optional",
      "rationale": "Recommended with Treasury Core for smoother production adoption and operator experience."
    },
    {
      "packageId": "e-invoicing-core",
      "class": "capability-enhancing",
      "rationale": "Improves Treasury Core with deeper downstream automation, visibility, or workflow coverage."
    },
    {
      "packageId": "analytics-bi-core",
      "class": "capability-enhancing",
      "rationale": "Improves Treasury Core with deeper downstream automation, visibility, or workflow coverage."
    },
    {
      "packageId": "business-portals-core",
      "class": "integration-only",
      "rationale": "Only needed when Treasury Core must exchange data or actions with adjacent or external surfaces."
    }
  ],
  "recommendedPlugins": [
    "payments-core"
  ],
  "capabilityEnhancingPlugins": [
    "e-invoicing-core",
    "analytics-bi-core"
  ],
  "integrationOnlyPlugins": [
    "business-portals-core"
  ],
  "suggestedPacks": [
    "localization-global-base",
    "localization-india",
    "localization-united-states",
    "sector-financial-services-compliance"
  ],
  "standaloneSupported": true,
  "installNotes": [
    "Treasury should usually follow Accounting; payments connectivity is recommended when live payout or collection orchestration is needed."
  ],
  "optionalWith": [
    "payments-core"
  ],
  "conflictsWith": [],
  "providesCapabilities": [
    "treasury.cash-position",
    "treasury.banking",
    "treasury.forecasts"
  ],
  "requestedCapabilities": [
    "ui.register.admin",
    "api.rest.mount",
    "data.write.treasury",
    "events.publish.treasury"
  ],
  "ownsData": [
    "treasury.cash-position",
    "treasury.banking",
    "treasury.forecasts",
    "treasury.reconciliation"
  ],
  "extendsData": [],
  "publicCommands": [
    "treasury.cash-position.capture",
    "treasury.banking.publish",
    "treasury.forecasts.refresh",
    "treasury.cash-position.hold",
    "treasury.cash-position.release",
    "treasury.cash-position.amend",
    "treasury.cash-position.reverse"
  ],
  "publicQueries": [
    "treasury.cash-summary",
    "treasury.forecast-summary"
  ],
  "publicEvents": [
    "treasury.cash-position-captured.v1",
    "treasury.banking-published.v1",
    "treasury.forecast-refreshed.v1"
  ],
  "domainCatalog": {
    "erpnextModules": [
      "Accounts"
    ],
    "erpnextDoctypes": [
      "Bank",
      "Bank Account",
      "Bank Transaction",
      "Bank Statement Import",
      "Bank Reconciliation Tool",
      "Payment Order"
    ],
    "ownedEntities": [
      "Cash Position",
      "Banking Setup",
      "Forecast",
      "Reconciliation Session",
      "Payout Batch"
    ],
    "reports": [
      "Cash Position Summary",
      "Bank Reconciliation Overview",
      "Treasury Forecast"
    ],
    "exceptionQueues": [
      "unmatched-bank-transactions",
      "payout-failure-review",
      "forecast-variance-review"
    ],
    "operationalScenarios": [
      "bank-import",
      "payment-order-execution",
      "cash-forecast-refresh"
    ],
    "settingsSurfaces": [
      "Bank",
      "Bank Account",
      "Bank Statement Import"
    ],
    "edgeCases": [
      "duplicate statement import",
      "partial bank match",
      "payment-order rejection"
    ]
  },
  "slotClaims": [],
  "trustTier": "first-party",
  "reviewTier": "R1",
  "isolationProfile": "same-process-trusted",
  "compatibility": {
    "framework": "^0.1.0",
    "runtime": "bun>=1.3.12",
    "db": [
      "postgres",
      "sqlite"
    ]
  }
});
