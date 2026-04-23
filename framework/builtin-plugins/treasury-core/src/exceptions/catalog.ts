export const exceptionQueueDefinitions = [
  {
    "id": "unmatched-bank-transactions",
    "label": "Unmatched Bank Transactions",
    "severity": "medium",
    "owner": "treasurer",
    "reconciliationJobId": "treasury.reconciliation.run"
  },
  {
    "id": "payout-failure-review",
    "label": "Payout Failure Review",
    "severity": "medium",
    "owner": "treasurer",
    "reconciliationJobId": "treasury.reconciliation.run"
  },
  {
    "id": "forecast-variance-review",
    "label": "Forecast Variance Review",
    "severity": "medium",
    "owner": "treasurer",
    "reconciliationJobId": "treasury.reconciliation.run"
  }
] as const;
