package infra

import (
	node_infra "github.com/river-build/river/core/node/infra"
)

var (
	// contractReads is the root for contract reads/event decode operations.
	contractReads = node_infra.NewSuccessMetrics(node_infra.CONTRACT_CALLS_CATEGORY, nil)
	// contractWrites is the root for transactions sent by xchain.
	contractWrites = node_infra.NewSuccessMetrics(node_infra.CONTRACT_WRITES_CATEGORY, nil)
	// entitlementCheckRequested keeps track how many entitlement check requests are read and decoded from Base.
	entitlementCheckRequested = node_infra.NewSuccessMetrics("entitlement_checks_requested", nil)
	// entitlementCheckProcessed keeps track how many entitlement check requests are processed.
	// Failures are expected when other xchain instances have already reached a quorum and the request was dropped on
	// Base.
	entitlementCheckProcessed = node_infra.NewSuccessMetrics("entitlement_checks_processed", nil)
	// entitlementCheckTx keeps tracks how many times an entitlement check result transaction was sent to Base.
	entitlementCheckTx = node_infra.NewSuccessMetrics("entitlement_checks", contractWrites)

	getRuleDataCalls = node_infra.NewSuccessMetrics("get_rule_data", contractReads)
)
