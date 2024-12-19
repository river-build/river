package mls_service

import (
	"context"
	"log"

	"github.com/river-build/river/core/node/mls_service/mls_tools"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func InfoRequest() (*mls_tools.InfoResponse, error) {
	client, err := grpc.NewClient("unix:/tmp/mls_service",
		grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal("NewClient:", err)
	}
	defer client.Close()

	mlsClient := mls_tools.NewMslClient(client)
	info, err := mlsClient.Info(context.Background(), &mls_tools.InfoRequest{})

	if err != nil {
		return nil, err
	}
	return info, nil
}
