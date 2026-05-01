package config

import (
	"github.com/caarlos0/env/v6"
	"github.com/joho/godotenv"

	"github.com/ai-hh-itmo/backend/internal/logger"
)

type Config struct {
	Server   ServerConfig
	Client   ClientConfig
	Services ServicesConfig
}

func Load() Config {
	_ = godotenv.Load()

	cfg := Config{}
	if err := env.Parse(&cfg, env.Options{
		RequiredIfNoDef: true,
	}); err != nil {
		logger.Error("failed to parse environment config", "err", err)
		panic(err)
	}
	return cfg
}
