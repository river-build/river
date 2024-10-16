# Notification service

## Architecture
The river node has can be run in notification mode with the `notification` sub command.
In this mode the service boots up and instantiates a `notifications.StreamTracker` instance.
This streams track loads DM, GDM and Channels from the streams contract and divides these
streams over N (config option) buckets. Each bucket is assigned to a worker, 
`notifications.StreamsTrackerWorker`.

Each worker starts a stream sync session and starts processing stream updates and resubscribes
when an stream down is received. Updates are passed to a `events.TrackedNotificationStreamView`
instance that is created when the first update for a stream is received. This view handles
the events and calls when needed (not for all events, e.g. block updates) a notification
processor with the update. This processor uses the user notification processor to determine
to who a notification must be sent for the event.

Important is that when subscribing a stream a sync reset is forced. This reset ensures that the
view can be constructed from the latest snapshot ensuring a coherent overview of the streams
current state.

## Configuration
Apple Push Notifications settings:
- `notifications.apn.app_bundle_id`
- `notifications.apn.expiration`
- `notifications.apn.key_id`
- `notifications.apn.team_id`
- `notifications.apn.auth_key`

Web Push Vapid settings:
- `notifications.webpush.vapid.private_key`
- `notifications.webpush.vapid.auth_key`
- `notifications.webpush.vapid.public_key`
- `notifications.webpush.vapid.subject`
