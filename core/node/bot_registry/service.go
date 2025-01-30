package bot_registry

import (
	"context"

	"connectrpc.com/connect"

	. "github.com/river-build/river/core/node/protocol"
)

type (
	Service struct {
		ctx context.Context
	}
)

func NewService(
	ctx context.Context,
) (*Service, error) {
	return &Service{
		ctx,
	}, nil
}

func (s *Service) Start(ctx context.Context) {
	// TODO
}

func (s *Service) RegisterWebhook(
	context.Context,
	*connect.Request[RegisterWebhookRequest],
) (
	*connect.Response[RegisterWebhookResponse],
	error,
) {
	// TODO
	return &connect.Response[RegisterWebhookResponse]{}, nil
}

func (s *Service) GetStatus(
	context.Context,
	*connect.Request[GetStatusRequest],
) (
	*connect.Response[GetStatusResponse],
	error,
) {
	// TODO
	return &connect.Response[GetStatusResponse]{}, nil
}
