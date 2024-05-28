package config

import "time"

// Default returns default configuration settings
func Default() *Config {
	return &Config{
		Stream: StreamConfig{
			Media: MediaStreamConfig{
				MaxChunkCount: 10,
				MaxChunkSize:  500000,
			},
			StreamMembershipLimits: map[string]int{
				"77": 6,
				"88": 2,
			},
			RecencyConstraints: RecencyConstraintsConfig{
				AgeSeconds:  11,
				Generations: 5,
			},
			ReplicationFactor:           1,
			DefaultMinEventsPerSnapshot: 100,
			MinEventsPerSnapshot: map[string]int{
				"a1": 10, // USER_INBOX
				"a5": 10, // USER_SETTINGS
				"a8": 10, // USER
				"ad": 10, // USER_DEVICE_KEY
			},
			CacheExpiration:             5 * time.Minute,
			CacheExpirationPollInterval: 30 * time.Second,
		},
	}
}
