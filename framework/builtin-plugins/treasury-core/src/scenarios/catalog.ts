export const scenarioDefinitions = [
  {
    "id": "bank-import",
    "owningPlugin": "treasury-core",
    "workflowId": "treasury-lifecycle",
    "actionIds": [
      "treasury.cash-position.capture",
      "treasury.banking.publish",
      "treasury.forecasts.refresh"
    ],
    "downstreamTargets": {
      "create": [],
      "advance": [
        "traceability.links.record"
      ],
      "reconcile": [
        "accounting.payments.allocate",
        "traceability.reconciliation.queue"
      ]
    }
  },
  {
    "id": "payment-order-execution",
    "owningPlugin": "treasury-core",
    "workflowId": "treasury-lifecycle",
    "actionIds": [
      "treasury.cash-position.capture",
      "treasury.banking.publish",
      "treasury.forecasts.refresh"
    ],
    "downstreamTargets": {
      "create": [],
      "advance": [
        "traceability.links.record"
      ],
      "reconcile": [
        "accounting.payments.allocate",
        "traceability.reconciliation.queue"
      ]
    }
  },
  {
    "id": "cash-forecast-refresh",
    "owningPlugin": "treasury-core",
    "workflowId": "treasury-lifecycle",
    "actionIds": [
      "treasury.cash-position.capture",
      "treasury.banking.publish",
      "treasury.forecasts.refresh"
    ],
    "downstreamTargets": {
      "create": [],
      "advance": [
        "traceability.links.record"
      ],
      "reconcile": [
        "accounting.payments.allocate",
        "traceability.reconciliation.queue"
      ]
    }
  }
] as const;
