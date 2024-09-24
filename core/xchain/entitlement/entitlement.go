package entitlement

import (
	"context"
	"fmt"
	"sync"

	"github.com/ethereum/go-ethereum/common"

	"github.com/river-build/river/core/contracts/base"
	"github.com/river-build/river/core/contracts/types"
	"github.com/river-build/river/core/node/dlog"
)

func (e *Evaluator) EvaluateRuleData(
	ctx context.Context,
	linkedWallets []common.Address,
	ruleData *base.IRuleEntitlementBaseRuleDataV2,
) (bool, error) {
	log := dlog.FromCtx(ctx)
	log.Info("Evaluating rule data", "ruleData", ruleData)
	opTree, err := types.GetOperationTree(ctx, ruleData)
	if err != nil {
		return false, err
	}
	return e.evaluateOp(ctx, opTree, linkedWallets)
}

func isNilOrCancelled(err error) bool {
	return err == nil || err == context.Canceled
}

// evaluateAndOperation evaluates the results of it's two child operations, ANDs them, and
// returns the final response. As soon as any one child operation evaluates as unentitled,
// the method will short-circuit evaluation of the other child and return a false response.
//
// In the case where one child operation results in an error:
//   - If the other child evaluates as unentitled, return the false result, because the user
//     is definitely not entitled.
//   - If the other child evaluates to true, return the error because we do not know
//     if the user was truly entitled.
//
// If both child calls result in an error, the method will return a wrapped error.
func (e *Evaluator) evaluateAndOperation(
	ctx context.Context,
	op *types.AndOperation,
	linkedWallets []common.Address,
) (bool, error) {
	if op.LeftOperation == nil || op.RightOperation == nil {
		return false, fmt.Errorf("operation is nil")
	}
	leftCtx, leftCancel := context.WithCancel(ctx)
	rightCtx, rightCancel := context.WithCancel(ctx)
	leftResult := false
	leftErr := error(nil)
	rightResult := false
	rightErr := error(nil)
	wg := sync.WaitGroup{}
	wg.Add(2)
	defer leftCancel()
	defer rightCancel()
	go func() {
		leftResult, leftErr = e.evaluateOp(leftCtx, op.LeftOperation, linkedWallets)
		if !leftResult && isNilOrCancelled(leftErr) {
			// cancel the other goroutine if the left result is false, since we know
			// the user is unentitled
			rightCancel()
		}
		wg.Done()
	}()

	go func() {
		rightResult, rightErr = e.evaluateOp(rightCtx, op.RightOperation, linkedWallets)
		if !rightResult && isNilOrCancelled(rightErr) {
			// cancel the other goroutine if the right result is false, since we know
			// the user is unentitled
			leftCancel()
		}
		wg.Done()
	}()

	wg.Wait()
	if leftResult && rightResult {
		return true, nil
	} else if !leftResult && leftErr == nil {
		return false, nil
	} else if !rightResult && rightErr == nil {
		return false, nil
	} else {
		if !isNilOrCancelled(leftErr) && !isNilOrCancelled(rightErr) {
			return false, fmt.Errorf("%w; %w", leftErr, rightErr)
		} else {
			finalErr := leftErr
			if !isNilOrCancelled(rightErr) {
				finalErr = rightErr
			}
			return false, finalErr
		}
	}
}

// evaluateOrOperation evaluates the results of it's two child operations, ORs them, and
// returns the final response. As soon as any one child operation evaluates as entitled,
// the method will short-circuit evaluation of the other child and return a true response.
//
// In the case where one child operation results in an error:
//   - If the other child evaluates as entitled, return the true result, because the user
//     is definitely entitled.
//   - If the other child evaluates to false, return the error because we do not know
//     if the user was truly unentitled.
//
// If both child calls result in an error, the method will return a wrapped error.
func (e *Evaluator) evaluateOrOperation(
	ctx context.Context,
	op *types.OrOperation,
	linkedWallets []common.Address,
) (bool, error) {
	if op.LeftOperation == nil || op.RightOperation == nil {
		return false, fmt.Errorf("operation is nil")
	}
	leftCtx, leftCancel := context.WithCancel(ctx)
	rightCtx, rightCancel := context.WithCancel(ctx)
	leftResult := false
	leftErr := error(nil)
	rightResult := false
	rightErr := error(nil)
	wg := sync.WaitGroup{}
	wg.Add(2)
	defer leftCancel()
	defer rightCancel()
	go func() {
		leftResult, leftErr = e.evaluateOp(leftCtx, op.LeftOperation, linkedWallets)
		if leftResult {
			// cancel the other goroutine if the left result is true, since we know
			// the user is unentitled
			rightCancel()
		}
		wg.Done()
	}()

	go func() {
		rightResult, rightErr = e.evaluateOp(rightCtx, op.RightOperation, linkedWallets)
		if rightResult {
			// cancel the other goroutine if the right result is true, since we know
			// the user is entitled
			leftCancel()
		}
		wg.Done()
	}()

	wg.Wait()
	// If at least one child evaluates as entitled, log any errors and return a true result.
	if leftResult || rightResult {
		return true, nil
	} else {
		if leftErr != nil && rightErr != nil {
			return false, fmt.Errorf("%w; %w", leftErr, rightErr)
		} else {
			finalErr := leftErr
			if rightErr != nil {
				finalErr = rightErr
			}
			return false, finalErr
		}
	}
}

func awaitTimeout(ctx context.Context, f func() error) error {
	doneCh := make(chan error, 1)

	go func() {
		doneCh <- f()
	}()

	select {
	case <-ctx.Done():
		// If the context was cancelled or expired, return an error
		return ctx.Err()
	case err := <-doneCh:
		// If the function finished executing, return its result
		return err
	}
}

func (e *Evaluator) evaluateOp(
	ctx context.Context,
	op types.Operation,
	linkedWallets []common.Address,
) (bool, error) {
	if op == nil {
		return false, fmt.Errorf("operation is nil")
	}

	switch op.GetOpType() {
	case types.CHECK:
		checkOp := (op).(*types.CheckOperation)
		return e.evaluateCheckOperation(ctx, checkOp, linkedWallets)
	case types.LOGICAL:
		logicalOp := (op).(types.LogicalOperation)

		switch logicalOp.GetLogicalType() {
		case types.AND:
			andOp := (op).(*types.AndOperation)
			return e.evaluateAndOperation(ctx, andOp, linkedWallets)
		case types.OR:
			orOp := (op).(*types.OrOperation)
			return e.evaluateOrOperation(ctx, orOp, linkedWallets)
		case types.LogNONE:
			fallthrough
		default:
			return false, fmt.Errorf("invalid LogicalOperation type")
		}
	case types.NONE:
		fallthrough
	default:
		return false, fmt.Errorf("invalid Operation type")
	}
}
