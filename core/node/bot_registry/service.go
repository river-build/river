package bot_registry

import (
	"context"
	"encoding/hex"
	"time"

	"connectrpc.com/connect"

	"github.com/ethereum/go-ethereum/common"

	"github.com/towns-protocol/towns/core/config"
	"github.com/towns-protocol/towns/core/node/authentication"
	"github.com/towns-protocol/towns/core/node/base"
	"github.com/towns-protocol/towns/core/node/bot_registry/sync"
	"github.com/towns-protocol/towns/core/node/crypto"
	"github.com/towns-protocol/towns/core/node/infra"
	"github.com/towns-protocol/towns/core/node/logging"
	"github.com/towns-protocol/towns/core/node/nodes"
	. "github.com/towns-protocol/towns/core/node/protocol"
	"github.com/towns-protocol/towns/core/node/protocol/protocolconnect"
	"github.com/towns-protocol/towns/core/node/registries"
	"github.com/towns-protocol/towns/core/node/storage"
	"github.com/towns-protocol/towns/core/node/track_streams"
)

const (
	botServiceChallengePrefix = "BS_AUTH:"
)

type (
	Service struct {
		authentication.AuthServiceMixin
		cfg                           config.BotRegistryConfig
		store                         storage.BotRegistryStore
		streamsTracker                track_streams.StreamsTracker
		sharedSecretDataEncryptionKey [32]byte `json:"-" yaml:"-"` // Just in case, protect this from being logged
	}
)

var _ protocolconnect.BotRegistryServiceHandler = (*Service)(nil)

func NewService(
	ctx context.Context,
	cfg config.BotRegistryConfig,
	onChainConfig crypto.OnChainConfiguration,
	store storage.BotRegistryStore,
	riverRegistry *registries.RiverRegistryContract,
	nodes []nodes.NodeRegistry,
	metrics infra.MetricsFactory,
	listener track_streams.StreamEventListener,
) (*Service, error) {
	tracker, err := sync.NewBotRegistryStreamsTracker(
		ctx,
		cfg,
		onChainConfig,
		riverRegistry,
		nodes,
		metrics,
		listener,
	)
	if err != nil {
		return nil, err
	}

	sharedSecretDataEncryptionKey, err := hex.DecodeString(cfg.SharedSecretDataEncryptionKey)
	if err != nil || len(sharedSecretDataEncryptionKey) != 32 {
		return nil, base.AsRiverError(err, Err_INVALID_ARGUMENT).
			Message("BotRegistryConfig SharedSecretDataEncryptionKey must be a 32-byte key encoded as hex")
	}

	s := &Service{
		cfg:                           cfg,
		store:                         store,
		streamsTracker:                tracker,
		sharedSecretDataEncryptionKey: [32]byte(sharedSecretDataEncryptionKey),
	}

	if err := s.InitAuthentication(botServiceChallengePrefix, &cfg.Authentication); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Service) Start(ctx context.Context) {
	log := logging.FromCtx(ctx)

	go func() {
		for {
			log.Infow("Start bot registry streams tracker")

			if err := s.streamsTracker.Run(ctx); err != nil {
				log.Errorw("tracking streams failed", "err", err)
			}

			select {
			case <-time.After(10 * time.Second):
				continue
			case <-ctx.Done():
				return
			}
		}
	}()
}

func (s *Service) Register(
	ctx context.Context,
	req *connect.Request[RegisterRequest],
) (
	*connect.Response[RegisterResponse],
	error,
) {
	var bot, owner common.Address
	var err error
	if bot, err = base.BytesToAddress(req.Msg.BotId); err != nil {
		return nil, base.WrapRiverError(Err_INVALID_ARGUMENT, err).
			Message("invalid bot id").
			Tag("bot_id", req.Msg.BotId)
	}

	if owner, err = base.BytesToAddress(req.Msg.BotOwnerId); err != nil {
		return nil, base.WrapRiverError(Err_INVALID_ARGUMENT, err).
			Message("invalid owner id").
			Tag("owner_id", req.Msg.BotOwnerId)
	}

	userId := authentication.UserFromAuthenticatedContext(ctx)
	if owner != userId {
		return nil, base.RiverError(
			Err_PERMISSION_DENIED,
			"authenticated user must be bot owner",
			"owner",
			owner,
			"userId",
			userId,
		)
	}

	// Generate a secret, encrypt it, and store the bot record in pg.
	botSecret, err := genHS256SharedSecret()
	if err != nil {
		return nil, base.AsRiverError(err, Err_INTERNAL).Message("error generating shared secret for bot")
	}

	encrypted, err := encryptSharedSecret(botSecret, s.sharedSecretDataEncryptionKey)
	if err != nil {
		return nil, base.AsRiverError(err, Err_INTERNAL).Message("error encrypting shared secret for bot")
	}

	if err := s.store.CreateBot(ctx, owner, bot, encrypted); err != nil {
		return nil, base.AsRiverError(err, Err_INTERNAL).Func("Register")
	}

	return &connect.Response[RegisterResponse]{
		Msg: &RegisterResponse{
			Hs256SharedSecret: botSecret[:],
		},
	}, nil
}

func (s *Service) RegisterWebhook(
	ctx context.Context,
	req *connect.Request[RegisterWebhookRequest],
) (
	*connect.Response[RegisterWebhookResponse],
	error,
) {
	// Validate input
	var bot common.Address
	var botInfo *storage.BotInfo
	var err error
	if bot, err = base.BytesToAddress(req.Msg.BotId); err != nil {
		return nil, base.WrapRiverError(Err_INVALID_ARGUMENT, err).
			Message("invalid bot id").
			Tag("bot_id", req.Msg.BotId)
	}
	if botInfo, err = s.store.GetBotInfo(ctx, bot); err != nil {
		return nil, base.WrapRiverError(Err_INTERNAL, err).Message("could not determine bot owner").
			Tag("bot_id", bot)
	}

	userId := authentication.UserFromAuthenticatedContext(ctx)
	if bot != userId && botInfo.Owner != userId {
		return nil, base.RiverError(
			Err_PERMISSION_DENIED,
			"authenticated user must be either bot or owner",
			"owner",
			botInfo.Owner,
			"bot",
			bot,
			"userId",
			userId,
		)
	}

	// TODO: Validate URL by sending a request to the webhook
	webhook := req.Msg.WebhookUrl

	// Store the bot record in pg
	if err := s.store.RegisterWebhook(ctx, bot, webhook); err != nil {
		return nil, base.AsRiverError(err, Err_INTERNAL).Func("RegisterWebhook")
	}

	return &connect.Response[RegisterWebhookResponse]{}, nil
}

func (s *Service) GetStatus(
	ctx context.Context,
	req *connect.Request[GetStatusRequest],
) (
	*connect.Response[GetStatusResponse],
	error,
) {
	bot, err := base.BytesToAddress(req.Msg.BotId)
	if err != nil {
		return nil, base.WrapRiverError(Err_INVALID_ARGUMENT, err).
			Message("invalid bot id").
			Tag("bot_id", req.Msg.BotId).
			Func("GetStatus")
	}

	// TODO: implement 2 second caching here
	if _, err = s.store.GetBotInfo(ctx, bot); err != nil {
		// Bot does not exist
		if base.IsRiverErrorCode(err, Err_NOT_FOUND) {
			return &connect.Response[GetStatusResponse]{
				Msg: &GetStatusResponse{
					IsRegistered: false,
				},
			}, nil
		} else {
			// Error fetching bot
			return nil, base.WrapRiverError(Err_INTERNAL, err).
				Message("unable to fetch info for bot").
				Tag("bot_id", bot).
				Func("GetStatus")
		}
	}

	// TODO: issue request to bot service, confirm 200 response, and
	// validate returned version info. Return in the response.
	return &connect.Response[GetStatusResponse]{
		Msg: &GetStatusResponse{
			IsRegistered: true,
		},
	}, nil
}
