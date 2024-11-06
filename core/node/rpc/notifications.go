package rpc

import (
	"context"
	"net"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/river-build/river/core/config"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/notifications"
	"github.com/river-build/river/core/node/notifications/push"
)

func (s *Service) startNotificationMode(notifier push.MessageNotifier) error {
	var err error
	s.startTime = time.Now()

	s.initInstance(ServerModeNotification)

	err = s.initRiverChain()
	if err != nil {
		return AsRiverError(err).Message("Failed to init river chain").LogError(s.defaultLogger)
	}

	err = s.prepareStore()
	if err != nil {
		return err
	}

	err = s.initNotificationsStore()
	if err != nil {
		return AsRiverError(err).Message("Failed to init store").LogError(s.defaultLogger)
	}

	if notifier == nil {
		if s.config.Notifications.Simulate {
			dlog.FromCtx(s.serverCtx).Info("Simulate sending notifications (dev mode)")
			notifier = push.NewMessageNotificationsSimulator(s.metrics)
		} else {
			notifier, err = push.NewMessageNotifier(&s.config.Notifications, s.metrics)
			if err != nil {
				return err
			}
		}
	}

	processor := notifications.NewNotificationMessageProcessor(
		s.serverCtx,
		s.notifications,
		s.config.Notifications,
		notifier,
	)

	s.SetStatus("OK")

	s.NotificationService, err = notifications.NewService(
		s.serverCtx,
		s.config.Notifications,
		s.chainConfig,
		s.notifications,
		s.registryContract,
		s.nodeRegistry,
		s.metrics,
		processor,
	)
	if err != nil {
		return AsRiverError(err).Message("Failed to instantiate notification service").LogError(s.defaultLogger)
	}

	err = s.runHttpServer()
	if err != nil {
		return AsRiverError(err).Message("Failed to run http server").LogError(s.defaultLogger)
	}

	s.mux.HandleFunc("/status", s.handleStatus)

	if err := s.initNotificationHandlers(); err != nil {
		return err
	}

	s.riverChain.StartChainMonitor(s.serverCtx)
	s.NotificationService.Start(s.serverCtx)

	// Retrieve the TCP address of the listener
	tcpAddr := s.listener.Addr().(*net.TCPAddr)

	// Get the port as an integer
	port := tcpAddr.Port

	// build the url by converting the integer to a string
	url := s.config.UrlSchema() + "://localhost:" + strconv.Itoa(port)
	s.defaultLogger.Info("Server started", "port", port, "https", !s.config.DisableHttps, "url", url)

	return nil
}

func StartServerInNotificationMode(
	ctx context.Context,
	cfg *config.Config,
	riverChain *crypto.Blockchain,
	listener net.Listener,
	notifier push.MessageNotifier,
) (*Service, error) {
	notificationService := &Service{
		serverCtx:  ctx,
		config:     cfg,
		riverChain: riverChain,
		listener:   listener,
		exitSignal: make(chan error, 1),
	}

	err := notificationService.startNotificationMode(notifier)
	if err != nil {
		notificationService.Close()
		return nil, err
	}

	return notificationService, nil
}

func RunNotificationService(ctx context.Context, cfg *config.Config) error {
	log := dlog.FromCtx(ctx)

	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	service, err := StartServerInNotificationMode(ctx, cfg, nil, nil, nil)
	if err != nil {
		log.Error("Failed to start server", "error", err)
		return err
	}
	defer service.Close()

	osSignal := make(chan os.Signal, 1)
	signal.Notify(osSignal, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		sig := <-osSignal
		log.Info("Got OS signal", "signal", sig.String())
		service.exitSignal <- nil
	}()

	err = <-service.exitSignal
	//log.Info("Notification stats", "stats", service.Archiver.GetStats())
	return err
}
