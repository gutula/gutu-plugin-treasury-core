export const domainCatalog = {
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
} as const;
