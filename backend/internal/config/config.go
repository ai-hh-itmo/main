package config

import (
	"time"

	"github.com/caarlos0/env/v6"
	"github.com/joho/godotenv"

	"github.com/ai-hh-itmo/backend/internal/logger"
)

type Config struct {
	Server   ServerConfig
	Client   ClientConfig
	Services ServicesConfig
}

type ServerConfig struct {
	Port string `env:"PORT"`
}

type ClientConfig struct {
	RequestTimeout time.Duration `env:"REQUEST_TIMEOUT"`
	RetryCount     int           `env:"RETRY_COUNT"`
	RetryDelay     time.Duration `env:"RETRY_DELAY"`
}

type ServicesConfig struct {
	SummarizerURL string `env:"SUMMARIZER_URL"`
	EmbedderURL   string `env:"EMBEDDER_URL"`
	MatcherURL    string `env:"MATCHER_URL"`
	RecSysURL     string `env:"RECSYS_URL"`
}

func Load() Config {
	_ = godotenv.Load()

	cfg := Config{}
	if err := env.Parse(&cfg); err != nil {
		logger.Error("failed to parse environment config", "err", err)
		panic(err)
	}
	return cfg
}
