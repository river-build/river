package scrub

import (
	"context"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/gammazero/workerpool"
	"github.com/prometheus/client_golang/prometheus"

	"go.opentelemetry.io/otel/attribute"
	otelCodes "go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"

	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/node/auth"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/infra"
	. "github.com/river-build/river/core/node/protocol"
	. "github.com/river-build/river/core/node/shared"
)

type StreamScrubTaskProcessor interface {
	// TryScheduleScrub schedules a stream scrub task iff:
	//
	// - the stream is a channel stream,
	//
	// - the stream has not been recently scrubbed, and
	//
	// - there is no pending scrub for the given stream.
	//
	// If force is set to true, a scrub will be scheduled even if the stream was recently scrubbed.
	TryScheduleScrub(ctx context.Context, streamId StreamId, force bool) (bool, error)
}

type EventAdder interface {
	AddEventPayload(ctx context.Context, streamId StreamId, payload IsStreamEvent_Payload) error
}

type streamScrubTaskProcessorImpl struct {
	ctx          context.Context
	pendingTasks sync.Map
	workerPool   *workerpool.WorkerPool
	cache        events.StreamCache
	eventAdder   EventAdder
	chainAuth    auth.ChainAuth
	config       *config.Config
	tracer       trace.Tracer

	streamsScrubbed   *prometheus.CounterVec
	entitlementLosses *prometheus.CounterVec
	userBoots         *prometheus.CounterVec
	scrubQueueLength  *prometheus.GaugeFunc
}

func NewStreamScrubTasksProcessor(
	ctx context.Context,
	cache events.StreamCache,
	eventAdder EventAdder,
	chainAuth auth.ChainAuth,
	cfg *config.Config,
	metrics infra.MetricsFactory,
	tracer trace.Tracer,
	nodeAddress common.Address,
) (StreamScrubTaskProcessor, error) {
	streamsScrubbedCounter := metrics.NewCounterVecEx(
		"streams_scrubbed",
		"Number of streams scrubbed",
		"space_id",
		"channel_id",
		"node_address",
	)
	entitlementLossesCounter := metrics.NewCounterVecEx(
		"entitlement_losses",
		"Number of entitlement losses detected",
		"space_id",
		"channel_id",
		"user_id",
		"node_address",
	)
	userBootsCounter := metrics.NewCounterVecEx(
		"user_boots",
		"Number of users booted due to stream scrubbing",
		"space_id",
		"channel_id",
		"user_id",
		"node_address",
	)
	sharedLabels := prometheus.Labels{"node_address": nodeAddress.String()}

	workerPool := workerpool.New(100)
	scrubQueueLength := metrics.NewGaugeFunc(
		prometheus.GaugeOpts{
			Name: "scrub_queue_length",
			Help: "Number of streams with a pending scrub scheduled",
		},
		func() float64 {
			return float64(workerPool.WaitingQueueSize())
		},
	)

	proc := &streamScrubTaskProcessorImpl{
		ctx:        ctx,
		cache:      cache,
		workerPool: workerPool,
		eventAdder: eventAdder,
		chainAuth:  chainAuth,
		config:     cfg,

		streamsScrubbed:   streamsScrubbedCounter.MustCurryWith(sharedLabels),
		entitlementLosses: entitlementLossesCounter.MustCurryWith(sharedLabels),
		userBoots:         userBootsCounter.MustCurryWith(sharedLabels),
		scrubQueueLength:  &scrubQueueLength,

		tracer: tracer,
	}
	return proc, nil
}

func (tp *streamScrubTaskProcessorImpl) processMember(
	task *streamScrubTask,
	ctx context.Context,
	member string,
) {
	log := dlog.FromCtx(ctx).
		With("Func", "streamScrubTask.processMember").
		With("channelId", task.channelId).
		With("spaceId", task.spaceId).
		With("userId", member)

	var span trace.Span

	if tp.tracer != nil {
		ctx, span = tp.tracer.Start(ctx, "member_scrub")
		span.SetAttributes(attribute.String("spaceId", task.spaceId.String()))
		span.SetAttributes(attribute.String("channelId", task.channelId.String()))
		span.SetAttributes(attribute.String("userId", member))
		defer span.End()
	}

	isEntitled, err := tp.chainAuth.IsEntitled(
		ctx,
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
			"error",
			err,
		)
		return
	}
	if span != nil {
		span.SetAttributes(attribute.Bool("isEntitled", isEntitled))
	}

	// In the case that the user is not entitled, they must have lost their entitlement
	// after joining the channel, so let's go ahead and boot them.
	if !isEntitled {
		tp.entitlementLosses.With(
			prometheus.Labels{
				"space_id":   task.spaceId.String(),
				"channel_id": task.channelId.String(),
				"user_id":    member,
			},
		).Inc()

		userId, err := AddressFromUserId(member)
		if err != nil {
			log.Error("Error converting user id into address", "member", member, "error", err)
			return
		}
		userStreamId, err := UserStreamIdFromBytes(userId)
		if err != nil {
			log.Error(
				"Error constructing user id stream from user address",
				"userAddress",
				userId,
				"error",
				err,
			)
		}
		log.Info("Entitlement loss detected; adding LEAVE event for user",
			"user",
			member,
			"userStreamId",
			userStreamId,
		)
		err = tp.eventAdder.AddEventPayload(
			ctx,
			userStreamId,
			events.Make_UserPayload_Membership(
				MembershipOp_SO_LEAVE,
				task.channelId,
				&member,
				task.spaceId[:],
			),
		)
		if err != nil {
			log.Error(
				"scrub error: unable to add channel leave event to user stream",
				"userStreamId",
				userStreamId,
				"error",
				err,
			)
		}
	}

	tp.userBoots.With(
		prometheus.Labels{
			"space_id":   task.spaceId.String(),
			"channel_id": task.channelId.String(),
			"user_id":    member,
		},
	).Inc()

	if span != nil {
		span.SetStatus(otelCodes.Ok, "")
	}
}

func (tp *streamScrubTaskProcessorImpl) processTask(task *streamScrubTask) {
	log := dlog.FromCtx(tp.ctx).
		With("Func", "streamScrubTask.process").
		With("channelId", task.channelId).
		With("spaceId", task.spaceId)

	var span trace.Span
	ctx := tp.ctx
	if tp.tracer != nil {
		ctx, span = tp.tracer.Start(tp.ctx, "streamScrubTaskProcess.processTask")
		span.SetAttributes(attribute.String("spaceId", task.spaceId.String()))
		span.SetAttributes(attribute.String("channelId", task.channelId.String()))
		defer span.End()
	}

	_, view, err := tp.cache.GetStream(ctx, task.channelId)
	if err != nil {
		log.Error(
			"Unable to scrub stream; could not fetch stream view",
			"error",
			err,
		)
		return
	}

	joinableView, ok := view.(events.JoinableStreamView)
	if !ok {
		log.Error("Unable to scrub stream; could not cast view to JoinableStreamView")
		return
	}

	members, err := joinableView.GetChannelMembers()
	if err != nil {
		log.Error("Failed to fetch stream members", "error", err)
		return
	}

	for member := range (*members).Iter() {
		tp.processMember(task, ctx, member)
	}

	if span != nil {
		span.SetStatus(otelCodes.Ok, "")
	}

	tp.streamsScrubbed.With(
		prometheus.Labels{
			"space_id":   task.spaceId.String(),
			"channel_id": task.channelId.String(),
		},
	).Inc()
}

type streamScrubTask struct {
	channelId     StreamId
	spaceId       StreamId
	taskProcessor *streamScrubTaskProcessorImpl
}

func (t *streamScrubTask) process() {
	t.taskProcessor.processTask(t)
}

// TryScheduleScrub schedules a stream scrub task if:
// - the stream is a channel stream,
// - the stream has not been recently scrubbed, and
// - there is no pending scrub for the given stream.
// The force parameter will schedule a scrub even if the stream was recently scrubbed.
// If the worker pool is full, the method will not block but will return an error.
// This is so that we don't affect ability to post updates to channels with stale scrubs
// whenever the node falls behind due to high scrubbing volume.
// Note: if we ever scrub spaces, we'll need to make sure we kick the user from all channels
// in the space before kicking them out of the space.
func (tp *streamScrubTaskProcessorImpl) TryScheduleScrub(
	ctx context.Context,
	streamId StreamId,
	force bool,
) (bool, error) {
	log := dlog.FromCtx(ctx).With("Func", "TryScheduleScrub").With("streamId", streamId)
	// Note: This check ensures we are only scrubbing channels. If we ever scrub spaces,
	// we'll need to make sure we kick the user from all channels in the space before
	// kicking them out of the space.
	if !ValidChannelStreamId(&streamId) {
		return false, nil
	}

	stream, view, err := tp.cache.GetStream(ctx, streamId)
	if err != nil {
		log.Warn("Unable to get stream from cache")
		return false, err
	}

	if !force && time.Since(stream.LastScrubbedTime()) < tp.config.Scrubbing.ScrubEligibleDuration {
		return false, nil
	}

	task := &streamScrubTask{channelId: streamId, spaceId: *view.StreamParentId(), taskProcessor: tp}
	_, alreadyScheduled := tp.pendingTasks.LoadOrStore(streamId, task)
	if !alreadyScheduled {
		log.Info("Scheduling scrub for stream", "lastScrubbedTime", stream.LastScrubbedTime())
		tp.workerPool.Submit(func() {
			task.process()
			tp.pendingTasks.Delete(task.channelId)
			stream.MarkScrubbed(ctx)
		})
	}

	return !alreadyScheduled, nil
}
