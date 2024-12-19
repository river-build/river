package mls_service_test

import (
	"testing"

	"github.com/river-build/river/core/node/mls_service"
	"github.com/stretchr/testify/require"
)

func TestMlsInfo(t *testing.T) {
	require := require.New(t)
	info, err := mls_service.InfoRequest()
	if err != nil {
		t.Errorf("Error: %v", err)
	}
	
	require.Equal("MLS Service welcomes you", info.Graffiti)
	require.Greater(len(info.Git), 0)
}