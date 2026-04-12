// ============================================================
// KOGVANTAGE — Codeword System Types
// ============================================================

export type CodewordCategory = 'project' | 'person' | 'date' | 'financial' | 'location' | 'custom';

export interface CodewordConfig {
  id: string;
  category: CodewordCategory;
  real_value: string;           // Encrypted at rest (AES-256-GCM)
  codeword: string;             // e.g., "ALPHA-7", "PROJECT-ECHO"
  applies_to_roles: string;     // JSON array of UserRole values that see the REAL value
  date_shift_days: number;      // For date category: offset ±N days (0 = no shift)
  financial_mask_type: 'exact' | 'range' | 'percentage' | 'hidden'; // For financial category
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CodewordFilterContext {
  userRole: string;
  activeCodewords: CodewordConfig[];
  // Filter functions
  filterText: (text: string) => string;
  filterDate: (date: string) => string;
  filterAmount: (amount: number) => string;
  canSeeRealValue: (codeword: CodewordConfig) => boolean;
}
