export type DonorStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface DonorRequest {
  id: string;
  user_id: string;
  status: DonorStatus;
  requested_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  notes?: string | null;
}

export interface DonorStatusResponse {
  status: DonorStatus;
  request?: DonorRequest;
}

export interface DonorRequestResponse {
  message: string;
  request: DonorRequest;
}
