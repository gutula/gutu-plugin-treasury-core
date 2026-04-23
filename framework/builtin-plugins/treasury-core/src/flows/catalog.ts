import {
  advancePrimaryRecord,
  createPrimaryRecord,
  reconcilePrimaryRecord,
  type AdvancePrimaryRecordInput,
  type CreatePrimaryRecordInput,
  type ReconcilePrimaryRecordInput
} from "../services/main.service";

export const businessFlowDefinitions = [
  {
    "id": "treasury.cash-position.capture",
    "label": "Capture Cash Position",
    "phase": "create",
    "methodName": "captureCashPosition"
  },
  {
    "id": "treasury.banking.publish",
    "label": "Publish Banking Instruction",
    "phase": "advance",
    "methodName": "publishBankingInstruction"
  },
  {
    "id": "treasury.forecasts.refresh",
    "label": "Refresh Treasury Forecast",
    "phase": "reconcile",
    "methodName": "refreshTreasuryForecast"
  }
] as const;

export async function captureCashPosition(input: CreatePrimaryRecordInput) {
  return createPrimaryRecord(input);
}

export async function publishBankingInstruction(input: AdvancePrimaryRecordInput) {
  return advancePrimaryRecord(input);
}

export async function refreshTreasuryForecast(input: ReconcilePrimaryRecordInput) {
  return reconcilePrimaryRecord(input);
}
