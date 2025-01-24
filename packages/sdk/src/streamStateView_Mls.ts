import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent'
import TypedEmitter from 'typed-emitter'
import { ConfirmedTimelineEvent, RemoteTimelineEvent } from './types'
import { StreamEncryptionEvents, StreamStateEvents } from './streamEvents'
import {
    MemberPayload_KeyPackage,
    MemberPayload_Snapshot_Mls,
    MemberPayload_Snapshot_Mls_Member,
} from '@river-build/proto'
import { check } from '@river-build/dlog'
import { PlainMessage } from '@bufbuild/protobuf'
import { logNever } from './check'
import { bytesToHex } from 'ethereum-cryptography/utils'
import { userIdFromAddress } from './id'

export class StreamStateView_Mls extends StreamStateView_AbstractContent {
    readonly streamId: string
    externalGroupSnapshot?: Uint8Array
    groupInfoMessage?: Uint8Array
    members: { [key: string]: PlainMessage<MemberPayload_Snapshot_Mls_Member> } = {}
    epochSecrets: { [key: string]: Uint8Array } = {}
    pendingKeyPackages: { [key: string]: PlainMessage<MemberPayload_KeyPackage> } = {}
    welcomeMessagesMiniblockNum: { [key: string]: bigint } = {}

    constructor(streamId: string) {
        super()
        this.streamId = streamId
    }

    applySnapshot(content: MemberPayload_Snapshot_Mls): void {
        // Clone the protobuf to prevent mangling it
        const cloned = content.clone()
        this.externalGroupSnapshot = cloned.externalGroupSnapshot
        this.groupInfoMessage = cloned.groupInfoMessage
        this.members = cloned.members
        this.epochSecrets = cloned.epochSecrets
        this.pendingKeyPackages = cloned.pendingKeyPackages
        this.welcomeMessagesMiniblockNum = cloned.welcomeMessagesMiniblockNum
    }

    appendEvent(
        event: RemoteTimelineEvent,
        _cleartext: Uint8Array | string | undefined,
        _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined,
        _stateEmitter: TypedEmitter<StreamStateEvents> | undefined,
    ): void {
        check(event.remoteEvent.event.payload.value?.content.case == 'mls')
        const mlsEvent = event.remoteEvent.event.payload.value.content.value
        switch (mlsEvent.content.case) {
            case 'initializeGroup':
                this.externalGroupSnapshot = mlsEvent.content.value.externalGroupSnapshot
                this.groupInfoMessage = mlsEvent.content.value.groupInfoMessage
                this.addSignaturePublicKey(
                    event.creatorUserId,
                    mlsEvent.content.value.clone().signaturePublicKey,
                )
                break
            case 'externalJoin':
                this.addSignaturePublicKey(
                    event.creatorUserId,
                    mlsEvent.content.value.clone().signaturePublicKey,
                )
                break
            case 'epochSecrets':
                for (const secret of mlsEvent.content.value.secrets) {
                    if (!this.epochSecrets[secret.epoch.toString()]) {
                        this.epochSecrets[secret.epoch.toString()] = secret.clone().secret
                    }
                }
                break
            case 'keyPackage':
                this.pendingKeyPackages[bytesToHex(mlsEvent.content.value.signaturePublicKey)] =
                    mlsEvent.content.value.clone()
                break
            case 'welcomeMessage':
                for (const signatureKey of mlsEvent.content.value.signaturePublicKeys) {
                    const keyPackage = this.pendingKeyPackages[bytesToHex(signatureKey)]
                    if (keyPackage) {
                        this.addSignaturePublicKey(
                            userIdFromAddress(keyPackage.userAddress),
                            keyPackage.signaturePublicKey,
                        )
                    }
                    delete this.pendingKeyPackages[bytesToHex(signatureKey)]
                }
                break
            case undefined:
                break
            default:
                logNever(mlsEvent.content)
        }
    }

    prependEvent(
        _event: RemoteTimelineEvent,
        _cleartext: Uint8Array | string | undefined,
        _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined,
        _stateEmitter: TypedEmitter<StreamStateEvents> | undefined,
    ): void {
        //
    }

    onConfirmedEvent(
        event: ConfirmedTimelineEvent,
        stateEmitter: TypedEmitter<StreamStateEvents> | undefined,
        encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined,
    ): void {
        super.onConfirmedEvent(event, stateEmitter, encryptionEmitter)
        if (event.remoteEvent.event.payload.value?.content.case !== 'mls') {
            return
        }

        const payload = event.remoteEvent.event.payload.value.content.value
        switch (payload.content.case) {
            case 'welcomeMessage':
                for (const key of payload.content.value.signaturePublicKeys) {
                    const signatureKey = bytesToHex(key)
                    this.welcomeMessagesMiniblockNum[signatureKey] = event.miniblockNum
                }
                break
            case undefined:
                break
            default:
                break
        }
    }

    addSignaturePublicKey(userId: string, signaturePublicKey: Uint8Array): void {
        if (!this.members[userId]) {
            this.members[userId] = {
                signaturePublicKeys: [],
            }
        }
        this.members[userId].signaturePublicKeys.push(signaturePublicKey)
    }
}
