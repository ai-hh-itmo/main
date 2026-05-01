package observability

import (
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

type Metrics struct {
	httpRequestsTotal *prometheus.CounterVec
	stageDuration     *prometheus.HistogramVec
	stageRequests     *prometheus.CounterVec
	registry          *prometheus.Registry
}

func NewMetrics() *Metrics {
	registry := prometheus.NewRegistry()

	httpRequestsTotal := prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "backend_http_requests_total",
			Help: "Total HTTP requests handled by backend, labeled by status.",
		},
		[]string{"status"},
	)

	stageDuration := prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "backend_stage_duration_seconds",
			Help:    "ML pipeline stage duration in seconds.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"stage", "status"},
	)

	stageRequests := prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "backend_stage_requests_total",
			Help: "Total ML pipeline stage calls labeled by stage and status.",
		},
		[]string{"stage", "status"},
	)

	registry.MustRegister(httpRequestsTotal, stageDuration, stageRequests)

	return &Metrics{
		httpRequestsTotal: httpRequestsTotal,
		stageDuration:     stageDuration,
		stageRequests:     stageRequests,
		registry:          registry,
	}
}

func (m *Metrics) ObserveHTTP(err bool) {
	status := "success"
	if err {
		status = "error"
	}
	m.httpRequestsTotal.WithLabelValues(status).Inc()
}

func (m *Metrics) ObserveStage(name string, duration time.Duration, err bool) {
	status := "success"
	if err {
		status = "error"
	}
	m.stageRequests.WithLabelValues(name, status).Inc()
	m.stageDuration.WithLabelValues(name, status).Observe(duration.Seconds())
}

func (m *Metrics) Handler() http.HandlerFunc {
	return promhttp.HandlerFor(m.registry, promhttp.HandlerOpts{}).ServeHTTP
}
