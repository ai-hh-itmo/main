package config

type ServicesConfig struct {
	SummarizerURL string `env:"SUMMARIZER_URL"`
	EmbedderURL   string `env:"EMBEDDER_URL"`
	MatcherURL    string `env:"MATCHER_URL"`
	RecSysURL     string `env:"RECSYS_URL"`
}
