package mls_service

import (
	"context"
	"log"

	"github.com/river-build/river/core/node/mls_service/mls_tools"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func socketName() string {
	return "unix:/tmp/mls_service"
}

func InfoRequest() (*mls_tools.InfoResponse, error) {
	client, err := grpc.NewClient(socketName(),
		grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal("NewClient:", err)
	}
	defer client.Close()

	mlsClient := mls_tools.NewMlsClient(client)
	info, err := mlsClient.Info(context.Background(), &mls_tools.InfoRequest{})

	if err != nil {
		return nil, err
	}
	return info, nil
}

func InitialGroupInfoRequest(request *mls_tools.InitialGroupInfoRequest) (*mls_tools.InitialGroupInfoResponse, error) {
	client, err := grpc.NewClient(socketName(),
		grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal("NewClient:", err)
	}
	defer client.Close()

	mlsClient := mls_tools.NewMlsClient(client)
	info, err := mlsClient.InitialGroupInfo(context.Background(), request)
	if err != nil {
		return nil, err
	}
	return info, nil
}

func ExternalJoinRequest(request *mls_tools.ExternalJoinRequest) (*mls_tools.ExternalJoinResponse, error) {
	client, err := grpc.NewClient(socketName(),
		grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal("NewClient:", err)
	}
	defer client.Close()

	mlsClient := mls_tools.NewMlsClient(client)
	info, err := mlsClient.ExternalJoin(context.Background(), request)
	if err != nil {
		return nil, err
	}
	return info, nil
}
