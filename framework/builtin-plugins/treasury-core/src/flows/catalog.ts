import {
  advancePrimaryRecord,
  amendPrimaryRecord,
  createPrimaryRecord,
  placePrimaryRecordOnHold,
  reconcilePrimaryRecord,
  releasePrimaryRecordHold,
  reversePrimaryRecord,
  type AdvancePrimaryRecordInput,
  type AmendPrimaryRecordInput,
  type CreatePrimaryRecordInput,
  type PlacePrimaryRecordOnHoldInput,
  type ReconcilePrimaryRecordInput,
  type ReleasePrimaryRecordHoldInput,
  type ReversePrimaryRecordInput
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
  },
  {
    "id": "treasury.cash-position.hold",
    "label": "Place Record On Hold",
    "phase": "hold",
    "methodName": "placeRecordOnHold"
  },
  {
    "id": "treasury.cash-position.release",
    "label": "Release Record Hold",
    "phase": "release",
    "methodName": "releaseRecordHold"
  },
  {
    "id": "treasury.cash-position.amend",
    "label": "Amend Record",
    "phase": "amend",
    "methodName": "amendRecord"
  },
  {
    "id": "treasury.cash-position.reverse",
    "label": "Reverse Record",
    "phase": "reverse",
    "methodName": "reverseRecord"
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

export async function placeRecordOnHold(input: PlacePrimaryRecordOnHoldInput) {
  return placePrimaryRecordOnHold(input);
}

export async function releaseRecordHold(input: ReleasePrimaryRecordHoldInput) {
  return releasePrimaryRecordHold(input);
}

export async function amendRecord(input: AmendPrimaryRecordInput) {
  return amendPrimaryRecord(input);
}

export async function reverseRecord(input: ReversePrimaryRecordInput) {
  return reversePrimaryRecord(input);
}
