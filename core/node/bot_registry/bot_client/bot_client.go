package bot_client

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"

	"github.com/ethereum/go-ethereum/common"
	"github.com/towns-protocol/towns/core/node/base"
	"github.com/towns-protocol/towns/core/node/protocol"
)

type InitializeData struct{}

type BotServiceRequestPayload struct {
	Command string `json:"command"`
	Data    any    `json:",omitempty"`
}

type BotClient struct {
	httpClient *http.Client
}

func NewBotClient(httpClient *http.Client, allowLoopback bool) *BotClient {
	if !allowLoopback {
		httpClient = NewExternalRequestHttpClient(httpClient)
	}
	return &BotClient{
		httpClient: httpClient,
	}
}

// InitializeWebhook calls "initialize" on a bot service specified by the webhook url
// with a jwt token included in the request header that was generated from the shared
// secret returned to the bot upon registration. The caller should verify that should
// verify that we can see a device_id and fallback key in the user stream that matches
// the device id and fallback key returned in the status message.
func (b *BotClient) InitializeWebhook(
	ctx context.Context,
	webhookUrl string,
	botId common.Address,
	hs256SharedSecret [32]byte,
) error {
	payload := BotServiceRequestPayload{
		Command: "initialize",
	}
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return base.WrapRiverError(protocol.Err_INTERNAL, err).
			Message("Error constructing request payload to initialize webhook").
			Tag("botId", botId)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", webhookUrl, bytes.NewBuffer(jsonData))
	if err != nil {
		return base.WrapRiverError(protocol.Err_INTERNAL, err).
			Message("Error constructing request to initialize webhook").
			Tag("botId", botId)
	}

	if err := signRequest(req, hs256SharedSecret[:], botId); err != nil {
		return base.WrapRiverError(protocol.Err_INTERNAL, err).
			Message("Error signing request to initialize webhook").
			Tag("botId", botId)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")

	resp, err := b.httpClient.Do(req)
	if err != nil {
		return base.WrapRiverError(protocol.Err_CANNOT_CALL_WEBHOOK, err).
			Message("Unable to initialize the webhook").
			Tag("botId", botId)
	}
	defer resp.Body.Close()

	// TODO: validate that the bot server returns the expected device_id and fallback key
	// based on what we also see in the bot's user stream.
	// device_id, fallback key should come in via sync runner and tracked streams,
	// and be persisted to the cache / db.
	if resp.StatusCode != http.StatusOK {
		return base.WrapRiverError(protocol.Err_CANNOT_CALL_WEBHOOK, err).
			Message("Webhook response non-OK status").
			Tag("botId", botId)
	}

	return nil
}

// GetWebhookStatus sends an "info" message to the bot service and expects a 200 with
// version info returned.
// TODO - implement.
func (b *BotClient) GetWebhookStatus(
	ctx context.Context,
	webhookUrl string,
	botId common.Address,
	hs256SharedSecret [32]byte,
) error {
	return nil
}
