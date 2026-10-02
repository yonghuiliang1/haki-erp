/**
 * Export customer types
 * Customer = foreign-trade business partner (master data), not a login account.
 */

export interface ExportCustomer {
  id: string;
  /** Customer company name */
  name: string;
  /** Country / region, e.g. "United States" */
  country: string;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  status?: boolean;
  notes?: string | null;
}

/** Create / update payload for customer master data */
export interface CustomerInput {
  name: string;
  country: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}