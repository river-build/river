package mls_service_test

import (
	"context"
	"testing"

	"github.com/river-build/river/core/node/mls_service"
	"github.com/river-build/river/core/node/mls_service/mls_tools"
	"github.com/stretchr/testify/require"
)

func TestMlsInfo(t *testing.T) {
	require := require.New(t)
	info, err := mls_service.InfoRequest(context.Background())
	if err != nil {
		t.Errorf("Error: %v", err)
	}
	
	require.Equal("MLS Service welcomes you", info.Graffiti)
	require.Greater(len(info.Git), 0)
}

func TestMlsInitialGroupInfo(t *testing.T) {
	require := require.New(t)
	info, err := mls_service.InitialGroupInfoRequest(context.Background(), &mls_tools.InitialGroupInfoRequest{})
	if err != nil {
		t.Errorf("Error: %v", err)
	}
	require.Equal(mls_tools.ValidationResult_INVALID_GROUP_INFO, info.GetResult())
}

func TestMlsExternalJoin(t *testing.T) {
	require := require.New(t)
	info, err := mls_service.ExternalJoinRequest(context.Background(), &mls_tools.ExternalJoinRequest{})
	if err != nil {
		t.Errorf("Error: %v", err)
	}
	require.Equal(mls_tools.ValidationResult_INVALID_EXTERNAL_GROUP, info.GetResult())
}
