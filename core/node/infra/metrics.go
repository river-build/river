package infra

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/river-build/river/core/node/config"
	"github.com/river-build/river/core/node/dlog"
)

type Metrics struct {
	promauto.Factory
	registry         *prometheus.Registry
	functionDuration *prometheus.HistogramVec
	successMetrics   *prometheus.CounterVec
	httpServer       *http.Server
}

func NewMetrics() *Metrics {
	r := prometheus.NewRegistry()
	f := promauto.With(r)
	return &Metrics{
		Factory:  f,
		registry: r,
		functionDuration: f.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "function_execution_duration_ms",
				Help:    "Duration of function execution",
				Buckets: []float64{1, 2, 5, 10, 20, 30, 60, 120, 300, 600, 1200, 1800},
			},
			[]string{"name", "category"},
		),
		successMetrics: f.NewCounterVec(
			prometheus.CounterOpts{
				Name: "success_metrics",
				Help: "success metrics",
			},
			[]string{"name", "status", "category"},
		),
	}
}

/* SuccessMetrics is a struct for tracking success/failure of various operations.
 * Parent represents the higher level service (e.g. all RPC calls). When the metric is updated,
 * the parent is also updated (recursively).
 */
type SuccessMetrics struct {
	m      *Metrics
	Name   string
	Parent *SuccessMetrics
}

const (
	RPC_CATEGORY             = "rpc"
	DB_CALLS_CATEGORY        = "db_calls"
	CONTRACT_CALLS_CATEGORY  = "contract_calls"
	CONTRACT_WRITES_CATEGORY = "contract_writes"
)

func (m *Metrics) NewSuccessMetrics(name string, parent *SuccessMetrics) *SuccessMetrics {
	return &SuccessMetrics{
		m:      m,
		Name:   name,
		Parent: parent,
	}
}

func (m *Metrics) StoreExecutionTimeMetrics(name string, category string, startTime time.Time) {
	m.functionDuration.WithLabelValues(name, category).Observe(float64(time.Since(startTime).Milliseconds()))
}

func (m *Metrics) NewCounterHelper(name string, help string) prometheus.Counter {
	return m.NewCounter(prometheus.CounterOpts{
		Name: name,
		Help: help,
	})
}

func (m *Metrics) NewCounterVecHelper(name string, help string, labels ...string) *prometheus.CounterVec {
	return m.NewCounterVec(prometheus.CounterOpts{
		Name: name,
		Help: help,
	}, labels)
}

func (m *Metrics) NewGaugeVecHelper(name string, help string, labels ...string) *prometheus.GaugeVec {
	return m.NewGaugeVec(prometheus.GaugeOpts{
		Name: name,
		Help: help,
	}, labels)
}

func (m *Metrics) NewHistogramHelper(name string, help string, buckets []float64, labels ...string) *prometheus.HistogramVec {
	return m.NewHistogramVec(prometheus.HistogramOpts{
		Name:    name,
		Help:    help,
		Buckets: buckets,
	}, labels)
}

/* Increment pass counter for this metric and its parent. */
func (m *SuccessMetrics) PassInc() {
	args := []string{m.Name, "pass"}
	if m.Parent != nil {
		args = append(args, m.Parent.Name)
	} else {
		args = append(args, "root")
	}
	m.m.successMetrics.WithLabelValues(args...).Inc()
	if m.Parent != nil {
		m.Parent.PassInc()
	}
}

/* Increment fail counter for this metric and its parent. */
func (m *SuccessMetrics) FailInc() {
	args := []string{m.Name, "fail"}
	if m.Parent != nil {
		args = append(args, m.Parent.Name)
	} else {
		args = append(args, "root")
	}
	m.m.successMetrics.WithLabelValues(args...).Inc()
	if m.Parent != nil {
		m.Parent.FailInc()
	}
}

// update counter for a child metric and recursively update itself
func (m *SuccessMetrics) PassIncForChild(child string) {
	// args are name, status, category
	m.m.successMetrics.WithLabelValues(child, "pass", m.Name).Inc()
	// recursively increment parent
	m.PassInc()
}

// update counter for a child metric and recursively update itself
func (m *SuccessMetrics) FailIncForChild(child string) {
	// args are name, status, category
	m.m.successMetrics.WithLabelValues(child, "fail", m.Name).Inc()
	// recursively increment parent
	m.FailInc()
}

func (m *Metrics) StartMetricsServer(ctx context.Context, config config.MetricsConfig) {
	log := dlog.FromCtx(ctx)

	if !config.Enabled {
		log.Info("Metrics service is disabled")
		return
	}

	mux := http.NewServeMux()

	metricsHandler := promhttp.HandlerFor(
		m.registry,
		promhttp.HandlerOpts{
			Registry:          m.registry,
			EnableOpenMetrics: true,
			ProcessStartTime:  time.Now(),
		},
	)

	mux.Handle("/metrics", metricsHandler)

	m.httpServer = &http.Server{
		Addr:    fmt.Sprintf("%s:%d", config.Interface, config.Port),
		Handler: mux,
	}

	go m.serveHttp(ctx)
	go m.waitForClose(ctx)
}

func (m *Metrics) serveHttp(ctx context.Context) {
	log := dlog.FromCtx(ctx)

	log.Info("Starting metrics HTTP server", "addr", m.httpServer.Addr)
	err := m.httpServer.ListenAndServe()
	if err != nil {
		if err == http.ErrServerClosed {
			log.Info("Metrics HTTP server closed")
		} else {
			log.Error("Metrics HTTP server error", "err", err)
		}
	}
}

func (m *Metrics) waitForClose(ctx context.Context) {
	<-ctx.Done()
	log := dlog.FromCtx(ctx)

	err := m.httpServer.Close()
	if err != nil {
		log.Error("Error closing metrics HTTP server", "err", err)
	} else {
		log.Info("Metrics HTTP server closed")
	}
}
