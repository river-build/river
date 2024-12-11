package events

import (
	"context"

	"github.com/ethereum/go-ethereum/common"

	"github.com/river-build/river/core/node/dlog"
)

type QuorumPool struct {
	localErrChannel  chan error
	remotes          int
	remoteErrChannel chan error
	tags             []any
}

func NewQuorumPool(tags ...any) *QuorumPool {
	return &QuorumPool{
		tags: tags,
	}
}

func (q *QuorumPool) GoLocal(ctx context.Context, f func(ctx context.Context) error) {
	q.localErrChannel = make(chan error, 1)
	go func() {
		err := f(ctx)
		if err != nil {
			tags := []any{"error", err}
			tags = append(tags, q.tags...)
			dlog.FromCtx(ctx).Warn("QuorumPool: GoLocal: Error", tags...)
		}
		q.localErrChannel <- err
	}()
}

func (q *QuorumPool) GoRemotes(
	ctx context.Context,
	nodes []common.Address,
	f func(ctx context.Context, node common.Address) error,
) {
	// Reset cancel on ctx to avoid canceling remotes in progress:
	// Wait() completes when quorum is achieved and some remotes are still in progress.
	deadline, ok := ctx.Deadline()
	ctx = context.WithoutCancel(ctx)
	if ok {
		var cancel context.CancelFunc
		ctx, cancel = context.WithDeadline(ctx, deadline)
		defer cancel()
	}

	q.remoteErrChannel = make(chan error, len(nodes))
	q.remotes += len(nodes)
	for _, node := range nodes {
		go func(node common.Address) {
			err := f(ctx, node)
			if err != nil {
				tags := []any{"error", err, "node", node}
				tags = append(tags, q.tags...)
				dlog.FromCtx(ctx).Warn("QuorumPool: GoRemotes: Error", tags...)
			}
			q.remoteErrChannel <- err
		}(node)
	}
}

func (q *QuorumPool) Wait() error {
	// First wait for local if any.
	if q.localErrChannel != nil {
		if err := <-q.localErrChannel; err != nil {
			return err
		}
	}

	// Then wait for majority quorum of remotes.
	if q.remotes > 0 {
		remoteQuorum := RemoteQuorumNum(q.remotes, q.localErrChannel != nil)

		var firstErr error
		success := 0
		failure := 0
		for i := 0; i < q.remotes; i++ {
			err := <-q.remoteErrChannel
			if err == nil {
				success++
				if success >= remoteQuorum {
					return nil
				}
			} else {
				if firstErr == nil {
					firstErr = err
				}
				failure++
				if failure > q.remotes-remoteQuorum {
					return firstErr
				}
			}
		}
		// TODO: agument error with more info.
		return firstErr
	}

	return nil
}

func TotalQuorumNum(totalNumNodes int) int {
	return (totalNumNodes + 1) / 2
}

// Returns number of remotes that need to succeed for quorum based on where the local is present.
func RemoteQuorumNum(remotes int, local bool) int {
	if local {
		return TotalQuorumNum(remotes+1) - 1
	} else {
		return TotalQuorumNum(remotes)
	}
}
