package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/ai-hh-itmo/backend/internal/config"
	"github.com/ai-hh-itmo/backend/internal/logger"
	"github.com/ai-hh-itmo/backend/internal/ml"
	"github.com/ai-hh-itmo/backend/internal/observability"
	"github.com/ai-hh-itmo/backend/internal/presentation/api"
	"github.com/ai-hh-itmo/backend/internal/service"
)

// @title Talentmine Backend API
// @version 0.1.0
// @description Go orchestrator API for vacancy-based candidate recommendations.
// @BasePath /
// @produce json
// @accept json
func main() {
	cfg := config.Load()
	metrics := observability.NewMetrics()

	mlClient := ml.New(
		cfg.Client,
		cfg.Services,
	)

	orchestrator := service.NewOrchestrator(mlClient, metrics)
	handler := api.NewHandler(orchestrator, metrics)

	router := gin.New()
	router.Use(gin.Recovery())
	handler.Register(router)

	server := &http.Server{
		Addr:    ":" + cfg.Server.Port,
		Handler: router,
	}

	logger.Info("starting server", "port", cfg.Server.Port)
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server stopped with error", "err", err)
			os.Exit(1)
		}
	}()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	<-ctx.Done()

	logger.Info("shutdown signal received")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", "err", err)
		os.Exit(1)
	}

	logger.Info("server shutdown complete")
}
