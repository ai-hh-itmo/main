export type RecommendationRequest = {
  vacancy_text: string;
  top_n: number;
  top_k: number;
};

export type Candidate = {
  candidate_id: string;
  final_score: number;
};

export type CandidateDetails = {
  candidate_id: string;
  resume?: string | null;
  has_contacted?: boolean | null;
  has_replied?: boolean | null;
  history_appearances?: number | null;
  exp_years?: number | null;
  salary_expectation?: number | null;
};

export type RecommendationResponse = {
  top_candidates: Candidate[];
  request_id?: string;
};

export type HealthResponse = {
  status: string;
  backend_available: boolean;
  request_id?: string;
};

export type ApiErrorResponse = {
  error: string;
  status?: number;
  request_id?: string;
};
