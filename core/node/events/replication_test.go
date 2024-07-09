package events

import (
	"testing"
)

func TestReplicatedMbProduction(t *testing.T) {
	_, tc := makeCacheTestContext(t, testParams{replFactor: 5, numInstances: 5})
	// require := tc.require

	tc.initAllCaches(&MiniblockProducerOpts{TestDisableMbProdcutionOnBlock: true})

	streamId, streamNodes, prevMbHash := tc.createReplStream()

	for range 20 {
		tc.addReplEvent(streamId, prevMbHash, streamNodes)
	}

	leaderAddr := streamNodes[0]
	leader := tc.instancesByAddr[leaderAddr]

	leader.mbProducer
}
