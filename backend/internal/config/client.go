package config

import "time"

type ClientConfig struct {
	RequestTimeout time.Duration `env:"REQUEST_TIMEOUT"`
	RetryCount     int           `env:"RETRY_COUNT"`
	RetryDelay     time.Duration `env:"RETRY_DELAY"`
}
