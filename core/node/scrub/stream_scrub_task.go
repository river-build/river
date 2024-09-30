package scrub

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/panjf2000/ants/v2"

	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/node/auth"
	"github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/rules"
	"github.com/river-build/river/core/node/shared"
)

type StreamScrubTaskProcessor interface {
	// TryScheduleScrub schedules a stream scrub task iff:
	//
	// - the stream is a channel stream,
	//
	// - the stream has not been recently scrubbed, and
	//
	// - there is no pending scrub for the given stream.
	TryScheduleScrub(ctx context.Context, streamId shared.StreamId) (bool, error)
}

type streamScrubTaskProcessorImpl struct {
	ctx             context.Context
	pendingTasks    sync.Map
	workerPool      *ants.Pool
	cache           events.StreamCache
	scrubEventQueue chan<- *rules.DerivedEvent
	chainAuth       auth.ChainAuth
	config          *config.Config
}

func NewStreamScrubTasksProcessor(
	ctx context.Context,
	cache events.StreamCache,
	scrubEventQueue chan<- *rules.DerivedEvent,
	chainAuth auth.ChainAuth,
	cfg *config.Config,
) (StreamScrubTaskProcessor, error) {
	workerPool, err := ants.NewPool(100, ants.WithNonblocking(true))
	if err != nil {
		return nil, base.WrapRiverError(protocol.Err_INTERNAL, err).
			Message("Unable to create stream scrub task worker processor").
			Func("syncDatabaseWithRegistry")
	}

	proc := &streamScrubTaskProcessorImpl{
		ctx:             ctx,
		cache:           cache,
		workerPool:      workerPool,
		scrubEventQueue: scrubEventQueue,
		chainAuth:       chainAuth,
		config:          cfg,
	}
	return proc, nil
}

func (tp *streamScrubTaskProcessorImpl) processTask(task *streamScrubTask) {
	log := dlog.FromCtx(tp.ctx).With("Func", "streamScrubTask.process")
	_, view, err := tp.cache.GetStream(tp.ctx, task.channelId)
	if err != nil {
		log.Error(
			"Unable to scrub stream; could not fetch stream view",
			"streamId",
			task.channelId,
			"error",
			err,
		)
		return
	}

	members, err := view.(events.JoinableStreamView).GetChannelMembers()
	if err != nil {
		log.Error("Failed to fetch stream members", "error", err)
		return
	}
	for member := range (*members).Iter() {
		isEntitled, err := tp.chainAuth.IsEntitled(
			tp.ctx,
			tp.config,
			auth.NewChainAuthArgsForChannel(
				task.spaceId,
				task.channelId,
				member,
				auth.PermissionRead,
			),
		)
		if err != nil {
			log.Error("Scrubbing error: unable to evaluate user entitlement",
				"user",
				member,
				"channel",
				task.channelId,
				"spaceId",
				task.spaceId,
				"error",
				err,
			)
			continue
		}
		// In the case that the user is not entitled, they must have lost their entitlement
		// after joining the channel, so let's go ahead and boot them.
		if !isEntitled {
			userId, err := shared.AddressFromUserId(member)
			if err != nil {
				log.Error("Error converting user id into address", "member", member, "error", err)
				continue
			}
			userStreamId, err := shared.UserStreamIdFromBytes(userId)
			if err != nil {
				log.Error(
					"Error constructing user id stream from user address",
					"userAddress",
					userId,
					"error",
					err,
				)
			}

			log.Info("Entitlement loss detected; enqueueing scrub for user",
				"user",
				member,
				"userStreamId",
				userStreamId,
				"channel",
				task.channelId,
				"space",
				task.spaceId,
			)
			tp.scrubEventQueue <- &rules.DerivedEvent{
				StreamId: userStreamId,
				Payload: events.Make_UserPayload_Membership(
					protocol.MembershipOp_SO_LEAVE,
					task.channelId,
					&member,
					task.spaceId[:],
				),
			}
		}
	}
}

type streamScrubTask struct {
	channelId     shared.StreamId
	spaceId       shared.StreamId
	taskProcessor *streamScrubTaskProcessorImpl
}

func (t *streamScrubTask) process() {
	t.taskProcessor.processTask(t)
}

// TryScheduleScrub schedules a stream scrub task if:
// - the stream is a channel stream,
// - the stream has not been recently scrubbed, and
// - there is no pending scrub for the given stream.
// If the worker pool is full, the method will not block but will return an error.
// This is so that we don't affect ability to post updates to channels with stale scrubs
// whenever the node falls behind due to high scrubbing volume.
func (tp *streamScrubTaskProcessorImpl) TryScheduleScrub(
	ctx context.Context,
	streamId shared.StreamId,
) (bool, error) {
	log := dlog.FromCtx(ctx).With("Func", "TryScheduleScrub")
	if !shared.ValidChannelStreamId(&streamId) {
		return false, nil
	}

	_, view, err := tp.cache.GetStream(ctx, streamId)
	if err != nil {
		log.Warn("Unable to get stream from cache", "streamId", streamId)
		return false, err
	}

	joinableView, ok := view.(events.JoinableStreamView)
	if !ok {
		log.Error("Unable to cast channel view as JoinableStreamView", "streamId", streamId)
		return false, fmt.Errorf("unable to cast channel view JoinableStreamView")
	}
	if time.Since(joinableView.LastScrubbedTime()) < tp.config.Scrubbing.ScrubEligibleDuration {
		return false, nil
	}

	task := &streamScrubTask{channelId: streamId, spaceId: *view.StreamParentId(), taskProcessor: tp}
	_, alreadyScheduled := tp.pendingTasks.LoadOrStore(streamId, task)
	if !alreadyScheduled {
		log.Info("Scheduling scrub for stream", "streamId", streamId)
		_ = tp.workerPool.Submit(func() {
			task.process()
			tp.pendingTasks.Delete(task.channelId)
			joinableView.MarkScrubbed(ctx)
		})
	}

	return !alreadyScheduled, nil
}
