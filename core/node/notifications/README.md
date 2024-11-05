# Notification service

## Introduction
The notification service allows users to set personal notification related settings and
tracks DM, GDM and Space channels for events that users want to receive a notification for.

### External interfaces
- API, allows users to set personal notification related preferences
- Database, stores notification related preferences
- Metrics, monitor the state of the notification service
- Logging, uses the same logging architecture as the River stream and xchain node

### Client API
The client API is a gRPC based interface that offers 2 services:
- authentication, allows the user to generate a JWT session token that must be used when
using the user settings API
- user settings, allows the user to set personal notification related settings

#### Authentication
Before the user settings API can be used users need to obtain a session token through the
authentication service. They need to request a challenge, sign it and use the signed challenge
to obtain a session token.

The session token is a JWT with the standard claims set:
- `sub`, holds the user id
- `aud`, set to `ns`
- `iss`, set to `ns`
- `exp`, UNIX epoch timestamp until JWT is valid

#### User settings
Provides functionality to set and manage notification related settings.
Every call expected the session token to be passed through the `Authorization` header.
If the session token is missing or invalid `Err_UNAUTHENTICATED` (code=16) is returned.

## Run service
The river node has can be run in notification mode with the `notifications` sub command.

It reads the streams from the stream registry contract and for streams that it needs to track
it starts a stream sync session. It monitors these sync session and when a session goes down
(for instance due to a node restart) and tries periodically to restart the sync session.

### Metrics
The notification service offers the following prometheus metrics:
- `river_notification_total_streams`, number of streams that must be tracked,
labeled by type=[`dm`, `gdm`, `space_channel`, `user_settings`]
- `river_notification_tracked_streams`, number of streams that are currently tracked,
  labeled by type=[`dm`, `gdm`, `space_channel`, `user_settings`]
- `river_notification_sync_down`, number of streams that are reported as down by remote
- `river_notification_sync_ping`, number of pings send, grouped by status=[`failure`, `success`]
- `river_notification_sync_pong`, number of pongs received
- `river_notification_sync_sessions_active`, number of sync sessions active
- `river_notification_sync_update`, number of stream updates received, grouped by reset=[`true`, `false`]
- `river_notification_stream_session_inflight`, number of SyncStreams requests for which no response is received yet
- `river_notification_stream_ping_inflight`, number of pings requests for which no response is received yet
- `river_notification_webpush_send`, number of web push notifications send, grouped by result=[`success`, `failure`]
- `river_notification_apn_send`, number of APN notifications send, grouped by result=[`success`, `failure`]

## Configuration
As the notification service is implemented as a subcommand in the existing River stream node it
uses the same configuration options to configure the API and database. In addition, it requires
the following notification specific configuration:

Client API authentication:
- `notifications.simulate`, when set to true the notification service won't send a notification
but only writes a log statement for which events it will send a notification and to whom. With
simulate set to true APN and WebPush settings are not required.
- `notifications.subscription_expiration_duration`, if a device hasn't seen within the last
`subscription_expiration_duration` stop sending notifications to it (default=90 days)
- `notifications.authentication.session_token.lifetime`, how long an issued session token is valid (default=30m)
- `notifications.authentication.session_token.key.algorithm`, only `HS256` is supported currently
- `notifications.authentication.session_token.key.key`, 256 bit random key (in hex format, no 0x prefix)

To generate a `notifications.authentication.session_token.key.key`:
```shell
$ openssl rand -hex 32
bec97df03d2c3515aa2a5eb87ee1834838186a5f08fa88558667bcdd0d2dde01
```

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
