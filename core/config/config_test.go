package config_test

import (
	"os"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/node/testutils"
)

func TestDatabaseConfig_UrlAndPasswordDoesNotLog(t *testing.T) {
	cfg := config.DatabaseConfig{
		Url:           "pg://host:port",
		Host:          "localhost",
		Port:          5432,
		User:          "user",
		Password:      "password",
		Database:      "testdb",
		Extra:         "extra",
		NumPartitions: 256,
	}
	// Log cfg to buffer
	logger, buffer := testutils.ZapJsonLogger()
	logger.Infow("test message", "databaseConfig", cfg)

	logOutput := buffer.String()
	logOutput = testutils.RemoveJsonTimestamp(logOutput)

	expectedBytes, err := os.ReadFile("testdata/databaseconfig_json.txt")
	require.NoError(t, err)
	expected := testutils.RemoveJsonTimestamp(string(expectedBytes))

	// Assert output is as expected: password is not logged, other fields included
	require.Equal(t, expected, logOutput)
}

func TestTlsConfig_KeyDoesNotLog(t *testing.T) {
	cfg := config.TLSConfig{
		Key:  "keyvalue",
		Cert: "certvalue",
	}

	// Log cfg to buffer
	logger, buffer := testutils.ZapJsonLogger()
	logger.Infow("test message", "tlsConfig", cfg)

	logOutput := buffer.String()
	logOutput = testutils.RemoveJsonTimestamp(logOutput)

	expectedBytes, err := os.ReadFile("testdata/tlsconfig_json.txt")
	require.NoError(t, err)
	expected := testutils.RemoveJsonTimestamp(string(expectedBytes))

	// Assert output is as expected: TLS Key is not logged, other fields included
	require.Equal(t, expected, logOutput)
}
