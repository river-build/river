package rules

import (
	"github.com/river-build/river/core/node/auth"
	. "github.com/river-build/river/core/node/base"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
)

type AddEventSideEffects struct {
	RequiredParentEvent  *RequiredParentEvent
	OnEntitlementFailure *OnEntitlementFailure
}

type RequiredParentEvent struct {
	Payload  IsStreamEvent_Payload
	StreamId shared.StreamId
}

type OnEntitlementFailure struct {
	Payload  IsStreamEvent_Payload
	StreamId shared.StreamId
}

type ruleBuilderAE interface {
	check(f func() (bool, error)) ruleBuilderAE
	checkOneOf(f ...func() (bool, error)) ruleBuilderAE
	requireChainAuth(f func() (*auth.ChainAuthArgs, error)) ruleBuilderAE
	requireParentEvent(f func() (*RequiredParentEvent, error)) ruleBuilderAE
	onEntitlementFailure(f func() (*OnEntitlementFailure, error)) ruleBuilderAE
	fail(err error) ruleBuilderAE
	run() (bool, *auth.ChainAuthArgs, *AddEventSideEffects, error)
}

type ruleBuilderAEImpl struct {
	failErr            error
	checks             [][]func() (bool, error)
	chainAuth          func() (*auth.ChainAuthArgs, error)
	parentEvent        func() (*RequiredParentEvent, error)
	entitlementFailure func() (*OnEntitlementFailure, error)
}

func aeBuilder() ruleBuilderAE {
	return &ruleBuilderAEImpl{
		failErr: nil,
		checks:  nil,
		chainAuth: func() (*auth.ChainAuthArgs, error) {
			return nil, nil
		},
		parentEvent: func() (*RequiredParentEvent, error) {
			return nil, nil
		},
		entitlementFailure: func() (*OnEntitlementFailure, error) {
			return nil, nil
		},
	}
}

func (re *ruleBuilderAEImpl) check(f func() (bool, error)) ruleBuilderAE {
	return re.checkOneOf(f)
}

func (re *ruleBuilderAEImpl) checkOneOf(f ...func() (bool, error)) ruleBuilderAE {
	re.checks = append(re.checks, f)
	return re
}

func (re *ruleBuilderAEImpl) requireChainAuth(f func() (*auth.ChainAuthArgs, error)) ruleBuilderAE {
	re.chainAuth = f
	return re
}

func (re *ruleBuilderAEImpl) requireParentEvent(f func() (*RequiredParentEvent, error)) ruleBuilderAE {
	re.parentEvent = f
	return re
}

func (re *ruleBuilderAEImpl) onEntitlementFailure(f func() (*OnEntitlementFailure, error)) ruleBuilderAE {
	re.entitlementFailure = f
	return re
}

func (re *ruleBuilderAEImpl) fail(err error) ruleBuilderAE {
	re.failErr = err
	return re
}

func runChecksAE(checksList [][]func() (bool, error)) (bool, error) {
	// outer loop is an and
	for _, checks := range checksList {
		// inner loop is an or
		foundCanAdd := false
		var errorMsgs []string
		for _, check := range checks {
			canAdd, err := check()
			if err != nil {
				errorMsgs = append(errorMsgs, err.Error())
			} else if canAdd {
				foundCanAdd = true
				break
			}
		}
		if !foundCanAdd {
			if len(errorMsgs) == 0 {
				return false, nil
			} else if len(errorMsgs) == 1 {
				return false, RiverError(Err_PERMISSION_DENIED, "check failed", "reason", errorMsgs[0])
			} else {
				return false, RiverError(Err_PERMISSION_DENIED, "checkOneOf failed", "reasons", errorMsgs)
			}
		}
	}
	return true, nil
}

func (re *ruleBuilderAEImpl) run() (bool, *auth.ChainAuthArgs, *AddEventSideEffects, error) {
	if re.failErr != nil {
		return false, nil, nil, re.failErr
	}

	canAdd, err := runChecksAE(re.checks)
	if err != nil || !canAdd {
		return false, nil, nil, err
	}
	chainAuthArgs, err := re.chainAuth()
	if err != nil {
		return false, nil, nil, err
	}
	requiredParentEvent, err := re.parentEvent()
	if err != nil {
		return false, nil, nil, err
	}
	onEntitlementFailure, err := re.entitlementFailure()
	if err != nil {
		return false, nil, nil, err
	}
	if len(re.checks) == 0 && chainAuthArgs == nil && requiredParentEvent == nil {
		return false, nil, nil, RiverError(Err_INTERNAL, "no checks or requirements")
	}
	sideEffects := &AddEventSideEffects{
		RequiredParentEvent:  requiredParentEvent,
		OnEntitlementFailure: onEntitlementFailure,
	}
	return true, chainAuthArgs, sideEffects, nil
}
