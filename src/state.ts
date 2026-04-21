// Central state interface passed between all agent nodes

export type ContractStatus =
  | 'INTAKE'
  | 'RESEARCH'
  | 'DRAFTING'
  | 'RISK_ASSESSMENT'
  | 'LAWYER_REVIEW'
  | 'SENT_FOR_REVIEW'
  | 'SIGNING';

export interface Party {
  name: string;
  co_number?: string;
  role: string;
  address: string;
}

export interface DraftVersion {
  version: number;
  content: string;
  author: string;
  created_at: string;
}

export interface RiskReport {
  enforceability_score: number; // 0–100
  warnings: Array<{
    title: string;
    detail: string;
    statutory_basis: string;
  }>;
  statutory_basis: string; // Primary governing statute
  anchor_case?: string;
  recommendation: string;
}

export interface ContractState {
  id: string;
  user_id: string;
  status: ContractStatus;
  inputs: {
    intent: string;
    parties: Party[];
    commercial_terms: Record<string, unknown>;
  };
  legal_context: {
    statutes: string[];
    precedents: string[];
    anchor_case_summary?: string;
  };
  draft_versions: DraftVersion[];
  risk_report?: RiskReport;
  lawyer_notes?: string;
  review_request?: string;   // user's message sent with the draft to in-house lawyers
  review_sent_at?: string;   // ISO timestamp
  signature_request_id?: string;
  // Internal routing flag set by the user after reviewing the draft
  user_decision?: 'ADJUST' | 'APPROVE';
  // Accumulated error messages for surface-level reporting
  errors?: string[];
}

// LangGraph channel definition — reducers for array fields append; scalars overwrite
export const contractStateChannels = {
  id: { value: (a: string, b: string) => b ?? a, default: () => '' },
  user_id: { value: (a: string, b: string) => b ?? a, default: () => '' },
  status: {
    value: (a: ContractStatus, b: ContractStatus) => b ?? a,
    default: (): ContractStatus => 'INTAKE',
  },
  inputs: {
    value: (
      a: ContractState['inputs'],
      b: Partial<ContractState['inputs']>
    ) => ({ ...a, ...b }),
    default: () => ({ intent: '', parties: [], commercial_terms: {} }),
  },
  legal_context: {
    value: (
      a: ContractState['legal_context'],
      b: Partial<ContractState['legal_context']>
    ) => ({ ...a, ...b }),
    default: () => ({ statutes: [], precedents: [] }),
  },
  draft_versions: {
    value: (a: DraftVersion[], b: DraftVersion[]) => [...a, ...b],
    default: (): DraftVersion[] => [],
  },
  risk_report: {
    value: (_a: RiskReport | undefined, b: RiskReport | undefined) => b,
    default: (): RiskReport | undefined => undefined,
  },
  lawyer_notes: {
    value: (_a: string | undefined, b: string | undefined) => b,
    default: (): string | undefined => undefined,
  },
  signature_request_id: {
    value: (_a: string | undefined, b: string | undefined) => b,
    default: (): string | undefined => undefined,
  },
  user_decision: {
    value: (
      _a: 'ADJUST' | 'APPROVE' | undefined,
      b: 'ADJUST' | 'APPROVE' | undefined
    ) => b,
    default: (): 'ADJUST' | 'APPROVE' | undefined => undefined,
  },
  errors: {
    value: (a: string[] | undefined, b: string[] | undefined) =>
      [...(a ?? []), ...(b ?? [])],
    default: (): string[] => [],
  },
};
