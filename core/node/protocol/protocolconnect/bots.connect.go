// Code generated by protoc-gen-connect-go. DO NOT EDIT.
//
// Source: bots.proto

package protocolconnect

import (
	connect "connectrpc.com/connect"
	context "context"
	errors "errors"
	protocol "github.com/towns-protocol/towns/core/node/protocol"
	http "net/http"
	strings "strings"
)

// This is a compile-time assertion to ensure that this generated file and the connect package are
// compatible. If you get a compiler error that this constant is not defined, this code was
// generated with a version of connect newer than the one compiled into your binary. You can fix the
// problem by either regenerating this code with an older version of connect or updating the connect
// version compiled into your binary.
const _ = connect.IsAtLeastVersion1_13_0

const (
	// BotRegistryServiceName is the fully-qualified name of the BotRegistryService service.
	BotRegistryServiceName = "river.BotRegistryService"
)

// These constants are the fully-qualified names of the RPCs defined in this package. They're
// exposed at runtime as Spec.Procedure and as the final two segments of the HTTP route.
//
// Note that these are different from the fully-qualified method names used by
// google.golang.org/protobuf/reflect/protoreflect. To convert from these constants to
// reflection-formatted method names, remove the leading slash and convert the remaining slash to a
// period.
const (
	// BotRegistryServiceRegisterProcedure is the fully-qualified name of the BotRegistryService's
	// Register RPC.
	BotRegistryServiceRegisterProcedure = "/river.BotRegistryService/Register"
	// BotRegistryServiceRegisterWebhookProcedure is the fully-qualified name of the
	// BotRegistryService's RegisterWebhook RPC.
	BotRegistryServiceRegisterWebhookProcedure = "/river.BotRegistryService/RegisterWebhook"
	// BotRegistryServiceGetStatusProcedure is the fully-qualified name of the BotRegistryService's
	// GetStatus RPC.
	BotRegistryServiceGetStatusProcedure = "/river.BotRegistryService/GetStatus"
)

// These variables are the protoreflect.Descriptor objects for the RPCs defined in this package.
var (
	botRegistryServiceServiceDescriptor               = protocol.File_bots_proto.Services().ByName("BotRegistryService")
	botRegistryServiceRegisterMethodDescriptor        = botRegistryServiceServiceDescriptor.Methods().ByName("Register")
	botRegistryServiceRegisterWebhookMethodDescriptor = botRegistryServiceServiceDescriptor.Methods().ByName("RegisterWebhook")
	botRegistryServiceGetStatusMethodDescriptor       = botRegistryServiceServiceDescriptor.Methods().ByName("GetStatus")
)

// BotRegistryServiceClient is a client for the river.BotRegistryService service.
type BotRegistryServiceClient interface {
	Register(context.Context, *connect.Request[protocol.RegisterRequest]) (*connect.Response[protocol.RegisterResponse], error)
	RegisterWebhook(context.Context, *connect.Request[protocol.RegisterWebhookRequest]) (*connect.Response[protocol.RegisterWebhookResponse], error)
	// rpc RotateSecret(RotateSecretRequest) returns (RotateSecretResponse);
	GetStatus(context.Context, *connect.Request[protocol.GetStatusRequest]) (*connect.Response[protocol.GetStatusResponse], error)
}

// NewBotRegistryServiceClient constructs a client for the river.BotRegistryService service. By
// default, it uses the Connect protocol with the binary Protobuf Codec, asks for gzipped responses,
// and sends uncompressed requests. To use the gRPC or gRPC-Web protocols, supply the
// connect.WithGRPC() or connect.WithGRPCWeb() options.
//
// The URL supplied here should be the base URL for the Connect or gRPC server (for example,
// http://api.acme.com or https://acme.com/grpc).
func NewBotRegistryServiceClient(httpClient connect.HTTPClient, baseURL string, opts ...connect.ClientOption) BotRegistryServiceClient {
	baseURL = strings.TrimRight(baseURL, "/")
	return &botRegistryServiceClient{
		register: connect.NewClient[protocol.RegisterRequest, protocol.RegisterResponse](
			httpClient,
			baseURL+BotRegistryServiceRegisterProcedure,
			connect.WithSchema(botRegistryServiceRegisterMethodDescriptor),
			connect.WithClientOptions(opts...),
		),
		registerWebhook: connect.NewClient[protocol.RegisterWebhookRequest, protocol.RegisterWebhookResponse](
			httpClient,
			baseURL+BotRegistryServiceRegisterWebhookProcedure,
			connect.WithSchema(botRegistryServiceRegisterWebhookMethodDescriptor),
			connect.WithClientOptions(opts...),
		),
		getStatus: connect.NewClient[protocol.GetStatusRequest, protocol.GetStatusResponse](
			httpClient,
			baseURL+BotRegistryServiceGetStatusProcedure,
			connect.WithSchema(botRegistryServiceGetStatusMethodDescriptor),
			connect.WithClientOptions(opts...),
		),
	}
}

// botRegistryServiceClient implements BotRegistryServiceClient.
type botRegistryServiceClient struct {
	register        *connect.Client[protocol.RegisterRequest, protocol.RegisterResponse]
	registerWebhook *connect.Client[protocol.RegisterWebhookRequest, protocol.RegisterWebhookResponse]
	getStatus       *connect.Client[protocol.GetStatusRequest, protocol.GetStatusResponse]
}

// Register calls river.BotRegistryService.Register.
func (c *botRegistryServiceClient) Register(ctx context.Context, req *connect.Request[protocol.RegisterRequest]) (*connect.Response[protocol.RegisterResponse], error) {
	return c.register.CallUnary(ctx, req)
}

// RegisterWebhook calls river.BotRegistryService.RegisterWebhook.
func (c *botRegistryServiceClient) RegisterWebhook(ctx context.Context, req *connect.Request[protocol.RegisterWebhookRequest]) (*connect.Response[protocol.RegisterWebhookResponse], error) {
	return c.registerWebhook.CallUnary(ctx, req)
}

// GetStatus calls river.BotRegistryService.GetStatus.
func (c *botRegistryServiceClient) GetStatus(ctx context.Context, req *connect.Request[protocol.GetStatusRequest]) (*connect.Response[protocol.GetStatusResponse], error) {
	return c.getStatus.CallUnary(ctx, req)
}

// BotRegistryServiceHandler is an implementation of the river.BotRegistryService service.
type BotRegistryServiceHandler interface {
	Register(context.Context, *connect.Request[protocol.RegisterRequest]) (*connect.Response[protocol.RegisterResponse], error)
	RegisterWebhook(context.Context, *connect.Request[protocol.RegisterWebhookRequest]) (*connect.Response[protocol.RegisterWebhookResponse], error)
	// rpc RotateSecret(RotateSecretRequest) returns (RotateSecretResponse);
	GetStatus(context.Context, *connect.Request[protocol.GetStatusRequest]) (*connect.Response[protocol.GetStatusResponse], error)
}

// NewBotRegistryServiceHandler builds an HTTP handler from the service implementation. It returns
// the path on which to mount the handler and the handler itself.
//
// By default, handlers support the Connect, gRPC, and gRPC-Web protocols with the binary Protobuf
// and JSON codecs. They also support gzip compression.
func NewBotRegistryServiceHandler(svc BotRegistryServiceHandler, opts ...connect.HandlerOption) (string, http.Handler) {
	botRegistryServiceRegisterHandler := connect.NewUnaryHandler(
		BotRegistryServiceRegisterProcedure,
		svc.Register,
		connect.WithSchema(botRegistryServiceRegisterMethodDescriptor),
		connect.WithHandlerOptions(opts...),
	)
	botRegistryServiceRegisterWebhookHandler := connect.NewUnaryHandler(
		BotRegistryServiceRegisterWebhookProcedure,
		svc.RegisterWebhook,
		connect.WithSchema(botRegistryServiceRegisterWebhookMethodDescriptor),
		connect.WithHandlerOptions(opts...),
	)
	botRegistryServiceGetStatusHandler := connect.NewUnaryHandler(
		BotRegistryServiceGetStatusProcedure,
		svc.GetStatus,
		connect.WithSchema(botRegistryServiceGetStatusMethodDescriptor),
		connect.WithHandlerOptions(opts...),
	)
	return "/river.BotRegistryService/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case BotRegistryServiceRegisterProcedure:
			botRegistryServiceRegisterHandler.ServeHTTP(w, r)
		case BotRegistryServiceRegisterWebhookProcedure:
			botRegistryServiceRegisterWebhookHandler.ServeHTTP(w, r)
		case BotRegistryServiceGetStatusProcedure:
			botRegistryServiceGetStatusHandler.ServeHTTP(w, r)
		default:
			http.NotFound(w, r)
		}
	})
}

// UnimplementedBotRegistryServiceHandler returns CodeUnimplemented from all methods.
type UnimplementedBotRegistryServiceHandler struct{}

func (UnimplementedBotRegistryServiceHandler) Register(context.Context, *connect.Request[protocol.RegisterRequest]) (*connect.Response[protocol.RegisterResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("river.BotRegistryService.Register is not implemented"))
}

func (UnimplementedBotRegistryServiceHandler) RegisterWebhook(context.Context, *connect.Request[protocol.RegisterWebhookRequest]) (*connect.Response[protocol.RegisterWebhookResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("river.BotRegistryService.RegisterWebhook is not implemented"))
}

func (UnimplementedBotRegistryServiceHandler) GetStatus(context.Context, *connect.Request[protocol.GetStatusRequest]) (*connect.Response[protocol.GetStatusResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("river.BotRegistryService.GetStatus is not implemented"))
}
