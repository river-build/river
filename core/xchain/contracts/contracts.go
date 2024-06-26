package contracts

const (
	NodeVoteStatus__NOT_VOTED uint8 = iota
	NodeVoteStatus__PASSED
	NodeVoteStatus__FAILED
)

// func (g *IEntitlementGated) WatchEntitlementCheckResultPosted(opts *bind.WatchOpts, sink chan<- *IEntitlementGatedEntitlementCheckResultPosted, transactionId [][32]byte) (event.Subscription, error) {
// 	if g.v3IEntitlementGated != nil {
// 		v3Sink := make(chan *v3.IEntitlementGatedEntitlementCheckResultPosted)
// 		sub, err := g.v3IEntitlementGated.WatchEntitlementCheckResultPosted(opts, v3Sink, transactionId)
// 		go func() {
// 			for v3Event := range v3Sink {
// 				shimEvent := convertV3ToShimResultPosted(v3Event)
// 				sink <- shimEvent
// 			}
// 		}()
// 		return sub, err
// 	} else {
// 		devSink := make(chan *dev.IEntitlementGatedEntitlementCheckResultPosted)
// 		sub, err := g.devIEntitlementGated.WatchEntitlementCheckResultPosted(opts, devSink, transactionId)
// 		go func() {
// 			for devEvent := range devSink {
// 				shimEvent := converDevToShimResultPosted(devEvent)
// 				sink <- shimEvent
// 			}
// 		}()
// 		return sub, err
// 	}
// }

// func (g *IEntitlementGated) GetRuleData(opts *bind.CallOpts, transactionId [32]byte, roleId *big.Int) (*IRuleData, error) {
// 	var ruleData IRuleData
// 	if g.v3IEntitlementGated != nil {
// 		v3RuleData, err := g.v3IEntitlementGated.GetRuleData(opts, transactionId, roleId)
// 		if err != nil {
// 			return nil, err
// 		}
// 		ruleData = IRuleData{
// 			Operations:        make([]IRuleEntitlementOperation, len(v3RuleData.Operations)),
// 			CheckOperations:   make([]IRuleEntitlementCheckOperation, len(v3RuleData.CheckOperations)),
// 			LogicalOperations: make([]IRuleEntitlementLogicalOperation, len(v3RuleData.LogicalOperations)),
// 		}
// 		for i, op := range v3RuleData.Operations {
// 			ruleData.Operations[i] = IRuleEntitlementOperation{
// 				OpType: op.OpType,
// 				Index:  op.Index,
// 			}
// 		}
// 		for i, op := range v3RuleData.CheckOperations {
// 			ruleData.CheckOperations[i] = IRuleEntitlementCheckOperation{
// 				OpType:          op.OpType,
// 				ChainId:         op.ChainId,
// 				ContractAddress: op.ContractAddress,
// 				Threshold:       op.Threshold,
// 			}
// 		}
// 		for i, op := range v3RuleData.LogicalOperations {
// 			ruleData.LogicalOperations[i] = IRuleEntitlementLogicalOperation{
// 				LogOpType:           op.LogOpType,
// 				LeftOperationIndex:  op.LeftOperationIndex,
// 				RightOperationIndex: op.RightOperationIndex,
// 			}
// 		}
// 		return &ruleData, nil
// 	} else {
// 		devRuleDtata, err := g.devIEntitlementGated.GetRuleData(opts, transactionId, roleId)
// 		if err != nil {
// 			return nil, err
// 		}
// 		ruleData = IRuleData{
// 			Operations:        make([]IRuleEntitlementOperation, len(devRuleDtata.Operations)),
// 			CheckOperations:   make([]IRuleEntitlementCheckOperation, len(devRuleDtata.CheckOperations)),
// 			LogicalOperations: make([]IRuleEntitlementLogicalOperation, len(devRuleDtata.LogicalOperations)),
// 		}
// 		for i, op := range devRuleDtata.Operations {
// 			ruleData.Operations[i] = IRuleEntitlementOperation{
// 				OpType: op.OpType,
// 				Index:  op.Index,
// 			}
// 		}
// 		for i, op := range devRuleDtata.CheckOperations {
// 			ruleData.CheckOperations[i] = IRuleEntitlementCheckOperation{
// 				OpType:          op.OpType,
// 				ChainId:         op.ChainId,
// 				ContractAddress: op.ContractAddress,
// 				Threshold:       op.Threshold,
// 			}
// 		}
// 		for i, op := range devRuleDtata.LogicalOperations {
// 			ruleData.LogicalOperations[i] = IRuleEntitlementLogicalOperation{
// 				LogOpType:           op.LogOpType,
// 				LeftOperationIndex:  op.LeftOperationIndex,
// 				RightOperationIndex: op.RightOperationIndex,
// 			}
// 		}
// 		return &ruleData, nil
// 	}
// }

// func (c *IEntitlementChecker) EstimateGas(ctx context.Context, client *ethclient.Client, From common.Address, To *common.Address, name string, args ...interface{}) (*uint64, error) {
// 	log := dlog.FromCtx(ctx)
// 	// Generate the data for the contract method call
// 	// You must replace `YourContractABI` with the actual ABI of your contract
// 	// and `registerNodeMethodID` with the actual method ID you wish to call.
// 	// The following line is a placeholder for the encoded data of your method call.
// 	parsedABI := c.GetAbi()

// 	method, err := parsedABI.Pack(name, args...)
// 	if err != nil {
// 		return nil, err
// 	}

// 	// Prepare the transaction call message
// 	msg := ethereum.CallMsg{
// 		From: From,   // Sender of the transaction (optional)
// 		To:   To,     // Contract address
// 		Data: method, // Encoded method call
// 	}

// 	// Estimate the gas required for the transaction
// 	estimatedGas, err := client.EstimateGas(ctx, msg)
// 	if err != nil {
// 		log.Error("Failed to estimate gas", "err", err)
// 		return nil, err
// 	}

// 	log.Debug("estimatedGas", "estimatedGas", estimatedGas)
// 	return &estimatedGas, nil

// }

// func (c *IEntitlementChecker) WatchEntitlementCheckRequested(opts *bind.WatchOpts, sink chan<- *IEntitlementCheckerEntitlementCheckRequested, nodeAddress []common.Address) (event.Subscription, error) {
// 	if c.v3IEntitlementChecker != nil {
// 		v3Sink := make(chan *v3.IEntitlementCheckerEntitlementCheckRequested)
// 		sub, err := c.v3IEntitlementChecker.WatchEntitlementCheckRequested(opts, v3Sink)
// 		go func() {
// 			for v3Event := range v3Sink {
// 				shimEvent := convertV3ToShimCheckRequested(v3Event)
// 				sink <- shimEvent
// 			}
// 		}()
// 		return sub, err
// 	} else {
// 		devSink := make(chan *dev.IEntitlementCheckerEntitlementCheckRequested)
// 		sub, err := c.devIEntitlementChecker.WatchEntitlementCheckRequested(opts, devSink)
// 		go func() {
// 			for devEvent := range devSink {
// 				shimEvent := convertDevToShimCheckRequested(devEvent)
// 				sink <- shimEvent
// 			}
// 		}()
// 		return sub, err
// 	}
// }

// func convertRuleDataToV3(ruleData IRuleData) v3.IRuleEntitlementRuleData {
// 	operations := make([]v3.IRuleEntitlementOperation, len(ruleData.Operations))
// 	for i, op := range ruleData.Operations {
// 		operations[i] = v3.IRuleEntitlementOperation{
// 			OpType: op.OpType,
// 			Index:  op.Index,
// 		}
// 	}
// 	checkOperations := make([]v3.IRuleEntitlementCheckOperation, len(ruleData.CheckOperations))
// 	for i, op := range ruleData.CheckOperations {
// 		checkOperations[i] = v3.IRuleEntitlementCheckOperation{
// 			OpType:          op.OpType,
// 			ChainId:         op.ChainId,
// 			ContractAddress: op.ContractAddress,
// 			Threshold:       op.Threshold,
// 		}
// 	}
// 	logicalOperations := make([]v3.IRuleEntitlementLogicalOperation, len(ruleData.LogicalOperations))
// 	for i, op := range ruleData.LogicalOperations {
// 		logicalOperations[i] = v3.IRuleEntitlementLogicalOperation{
// 			LogOpType:           op.LogOpType,
// 			LeftOperationIndex:  op.LeftOperationIndex,
// 			RightOperationIndex: op.RightOperationIndex,
// 		}
// 	}
// 	return v3.IRuleEntitlementRuleData{
// 		Operations:        operations,
// 		CheckOperations:   checkOperations,
// 		LogicalOperations: logicalOperations,
// 	}
// }

// func convertRuleDataToDev(ruleData IRuleData) dev.IRuleEntitlementRuleData {
// 	operations := make([]dev.IRuleEntitlementOperation, len(ruleData.Operations))
// 	for i, op := range ruleData.Operations {
// 		operations[i] = dev.IRuleEntitlementOperation{
// 			OpType: op.OpType,
// 			Index:  op.Index,
// 		}
// 	}
// 	checkOperations := make([]dev.IRuleEntitlementCheckOperation, len(ruleData.CheckOperations))
// 	for i, op := range ruleData.CheckOperations {
// 		checkOperations[i] = dev.IRuleEntitlementCheckOperation{
// 			OpType:          op.OpType,
// 			ChainId:         op.ChainId,
// 			ContractAddress: op.ContractAddress,
// 			Threshold:       op.Threshold,
// 		}
// 	}
// 	logicalOperations := make([]dev.IRuleEntitlementLogicalOperation, len(ruleData.LogicalOperations))
// 	for i, op := range ruleData.LogicalOperations {
// 		logicalOperations[i] = dev.IRuleEntitlementLogicalOperation{
// 			LogOpType:           op.LogOpType,
// 			LeftOperationIndex:  op.LeftOperationIndex,
// 			RightOperationIndex: op.RightOperationIndex,
// 		}
// 	}
// 	return dev.IRuleEntitlementRuleData{
// 		Operations:        operations,
// 		CheckOperations:   checkOperations,
// 		LogicalOperations: logicalOperations,
// 	}

// }
