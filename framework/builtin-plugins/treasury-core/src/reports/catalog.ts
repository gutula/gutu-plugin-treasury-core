export const reportDefinitions = [
  {
    "id": "treasury-core.report.01",
    "label": "Cash Position Summary",
    "owningPlugin": "treasury-core",
    "source": "erpnext-parity",
    "exceptionQueues": [
      "unmatched-bank-transactions",
      "payout-failure-review",
      "forecast-variance-review"
    ]
  },
  {
    "id": "treasury-core.report.02",
    "label": "Bank Reconciliation Overview",
    "owningPlugin": "treasury-core",
    "source": "erpnext-parity",
    "exceptionQueues": [
      "unmatched-bank-transactions",
      "payout-failure-review",
      "forecast-variance-review"
    ]
  },
  {
    "id": "treasury-core.report.03",
    "label": "Treasury Forecast",
    "owningPlugin": "treasury-core",
    "source": "erpnext-parity",
    "exceptionQueues": [
      "unmatched-bank-transactions",
      "payout-failure-review",
      "forecast-variance-review"
    ]
  }
] as const;
