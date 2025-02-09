package bot_registry

import (
	"context"

	"connectrpc.com/connect"

	"github.com/ethereum/go-ethereum/common"

	"github.com/towns-protocol/towns/core/config"
	"github.com/towns-protocol/towns/core/node/authentication"
	"github.com/towns-protocol/towns/core/node/base"
	. "github.com/towns-protocol/towns/core/node/protocol"
	"github.com/towns-protocol/towns/core/node/storage"
)

const (
	botServiceChallengePrefix = "BS_AUTH:"
)

type (
	Service struct {
		authentication.AuthServiceMixin
		cfg   config.BotRegistryConfig
		store storage.BotRegistryStore
	}
)

func NewService(
	cfg config.BotRegistryConfig,
	store storage.BotRegistryStore,
) (*Service, error) {
	s := &Service{
		cfg:   cfg,
		store: store,
	}

	if err := s.InitAuthentication(botServiceChallengePrefix, &cfg.Authentication); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Service) Start(ctx context.Context) {
	// TODO
}

func (s *Service) RegisterWebhook(
	ctx context.Context,
	req *connect.Request[RegisterWebhookRequest],
) (
	*connect.Response[RegisterWebhookResponse],
	error,
) {
	// Validate input
	var bot, owner common.Address
	var err error
	if bot, err = base.BytesToAddress(req.Msg.BotId); err != nil {
		return nil, base.WrapRiverError(Err_INVALID_ARGUMENT, err).
			Message("Invalid bot id").
			Tag("bot_id", req.Msg.BotId)
	}
	if owner, err = base.BytesToAddress(req.Msg.BotOwnerId); err != nil {
		return nil, base.WrapRiverError(Err_INVALID_ARGUMENT, err).
			Message("Invalid bot owner id").
			Tag("bot_owner_id", req.Msg.BotOwnerId)
	}

	userId := authentication.UserFromAuthenticatedContext(ctx)
	if bot != userId && owner != userId {
		return nil, base.RiverError(
			Err_PERMISSION_DENIED,
			"Registering user is neither bot nor owner",
			"owner",
			owner,
			"bot",
			bot,
			"userId",
			userId,
		)
	}

	// TODO: Validate URL by sending a request to the webhook
	webhook := req.Msg.WebhookUrl

	// Store the bot record in pg
	if err := s.store.CreateBot(ctx, owner, bot, webhook); err != nil {
		return nil, base.AsRiverError(err, Err_INTERNAL).Func("RegisterWebhook")
	}

	// TODO
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
			Message("Invalid bot id").
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
				Message("Unable to fetch info for bot").
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
