package model

type RecommendationRequest struct {
	VacancyText string `json:"vacancy_text"`
	TopN        int    `json:"top_n,omitempty"`
	TopK        int    `json:"top_k,omitempty"`
}

type RecommendationResponse struct {
	TopCandidates []FinalCandidate `json:"top_candidates"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type SummarizerRequest struct {
	VacancyText string `json:"vacancy_text"`
}

type SummarizerResponse struct {
	Summary string `json:"summary"`
}

type EmbedderRequest struct {
	Text string `json:"text"`
}

type EmbedderResponse struct {
	Embedding []float64 `json:"embedding"`
}

type MatcherRequest struct {
	VacancyEmbedding []float64 `json:"vacancy_embedding"`
	TopK             int       `json:"top_k,omitempty"`
}

type MatchCandidate struct {
	CandidateID      string  `json:"candidate_id"`
	CosineSimilarity float64 `json:"cosine_similarity"`
}

type MatcherResponse struct {
	Candidates []MatchCandidate `json:"candidates"`
}

type RecSysRequest struct {
	Candidates []MatchCandidate `json:"candidates"`
	TopN       int              `json:"top_n,omitempty"`
}

type FinalCandidate struct {
	CandidateID string  `json:"candidate_id"`
	FinalScore  float64 `json:"final_score"`
}

type RecSysResponse struct {
	TopCandidates []FinalCandidate `json:"top_candidates"`
}
