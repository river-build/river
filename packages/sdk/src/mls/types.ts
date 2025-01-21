import { PlainMessage } from '@bufbuild/protobuf'
import {
    MemberPayload_Mls,
    MemberPayload_Mls_EpochSecrets,
    MemberPayload_Mls_ExternalJoin,
    MemberPayload_Mls_InitializeGroup,
    MemberPayload_Mls_WelcomeMessage,
    MemberPayload_Snapshot_Mls,
} from '@river-build/proto'

type ConfirmedMetadata = {
    confirmedEventNum: bigint
    miniblockNum: bigint
    eventId: string
}

// export type MlsSnapshot = PlainMessage<MemberPayload_Snapshot_Mls> & ConfirmedMetadata
export type MlsSnapshot = PlainMessage<MemberPayload_Snapshot_Mls>
export type MlsConfirmedEvent = PlainMessage<MemberPayload_Mls>['content'] & ConfirmedMetadata

export type InitializeGroup = {
    case: 'initializeGroup'
    value: PlainMessage<MemberPayload_Mls_InitializeGroup>
}

export type ExternalJoin = {
    case: 'externalJoin'
    value: PlainMessage<MemberPayload_Mls_ExternalJoin>
}

export type ConfirmedInitializeGroup = InitializeGroup & ConfirmedMetadata

export type MlsEventWithCommit =
    | {
          case: 'externalJoin'
          value: PlainMessage<MemberPayload_Mls_ExternalJoin>
      }
    | {
          case: 'welcomeMessage'
          value: PlainMessage<MemberPayload_Mls_WelcomeMessage>
      }

export type ConfirmedMlsEventWithCommit = MlsEventWithCommit & ConfirmedMetadata

export type EpochSecrets = {
    case: 'epochSecrets'
    value: PlainMessage<MemberPayload_Mls_EpochSecrets>
}

export type ConfirmedEpochSecrets = EpochSecrets & ConfirmedMetadata
