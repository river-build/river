import { ChannelMessage, ChannelProperties, } from '@river-build/proto';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { bin_toHexString } from '@river-build/dlog';
import { isDefined } from './check';
import { addressFromUserId, streamIdAsBytes } from './id';
export function isLocalEvent(event) {
    return event.localEvent !== undefined;
}
export function isRemoteEvent(event) {
    return event.remoteEvent !== undefined;
}
export function isDecryptedEvent(event) {
    return event.decryptedContent !== undefined && event.remoteEvent !== undefined;
}
export function isConfirmedEvent(event) {
    return (isRemoteEvent(event) &&
        event.confirmedEventNum !== undefined &&
        event.miniblockNum !== undefined);
}
export function makeRemoteTimelineEvent(params) {
    return {
        hashStr: params.parsedEvent.hashStr,
        creatorUserId: params.parsedEvent.creatorUserId,
        eventNum: params.eventNum,
        createdAtEpochMs: params.parsedEvent.event.createdAtEpochMs,
        remoteEvent: params.parsedEvent,
        miniblockNum: params.miniblockNum,
        confirmedEventNum: params.confirmedEventNum,
    };
}
export function isCiphertext(text) {
    const cipherRegex = /^[A-Za-z0-9+/]{16,}$/;
    // suffices to check prefix of chars for ciphertext
    // since obj.text when of the form EncryptedData is assumed to
    // be either plaintext or ciphertext not a base64 string or
    // something ciphertext-like.
    const maxPrefixCheck = 16;
    return cipherRegex.test(text.slice(0, maxPrefixCheck));
}
export const takeKeccakFingerprintInHex = (buf, n) => {
    const hash = bin_toHexString(keccak256(buf));
    return hash.slice(0, n);
};
export const make_MemberPayload_Membership = (value) => {
    return {
        case: 'memberPayload',
        value: {
            content: {
                case: 'membership',
                value,
            },
        },
    };
};
export const make_UserPayload_Inception = (value) => {
    return {
        case: 'userPayload',
        value: {
            content: {
                case: 'inception',
                value,
            },
        },
    };
};
export const make_UserPayload_UserMembership = (value) => {
    return {
        case: 'userPayload',
        value: {
            content: {
                case: 'userMembership',
                value,
            },
        },
    };
};
export const make_UserPayload_UserMembershipAction = (value) => {
    return {
        case: 'userPayload',
        value: {
            content: {
                case: 'userMembershipAction',
                value,
            },
        },
    };
};
export const make_SpacePayload_Inception = (value) => {
    return {
        case: 'spacePayload',
        value: {
            content: {
                case: 'inception',
                value,
            },
        },
    };
};
export const make_MemberPayload_DisplayName = (value) => {
    return {
        case: 'memberPayload',
        value: {
            content: {
                case: 'displayName',
                value: value,
            },
        },
    };
};
export const make_MemberPayload_Username = (value) => {
    return {
        case: 'memberPayload',
        value: {
            content: {
                case: 'username',
                value: value,
            },
        },
    };
};
export const make_MemberPayload_EnsAddress = (value) => {
    return {
        case: 'memberPayload',
        value: {
            content: {
                case: 'ensAddress',
                value: value,
            },
        },
    };
};
export const make_MemberPayload_Nft = (value) => {
    return {
        case: 'memberPayload',
        value: {
            content: {
                case: 'nft',
                value: value,
            },
        },
    };
};
export const make_ChannelMessage_Post_Content_Text = (body, mentions) => {
    const mentionsPayload = mentions !== undefined ? mentions : [];
    return new ChannelMessage({
        payload: {
            case: 'post',
            value: {
                content: {
                    case: 'text',
                    value: {
                        body,
                        mentions: mentionsPayload,
                    },
                },
            },
        },
    });
};
export const make_ChannelMessage_Post_Content_GM = (typeUrl, value) => {
    return new ChannelMessage({
        payload: {
            case: 'post',
            value: {
                content: {
                    case: 'gm',
                    value: {
                        typeUrl,
                        value,
                    },
                },
            },
        },
    });
};
export const make_ChannelMessage_Reaction = (refEventId, reaction) => {
    return new ChannelMessage({
        payload: {
            case: 'reaction',
            value: {
                refEventId,
                reaction,
            },
        },
    });
};
export const make_ChannelMessage_Edit = (refEventId, post) => {
    return new ChannelMessage({
        payload: {
            case: 'edit',
            value: {
                refEventId,
                post,
            },
        },
    });
};
export const make_ChannelMessage_Redaction = (refEventId, reason) => {
    return new ChannelMessage({
        payload: {
            case: 'redaction',
            value: {
                refEventId,
                reason,
            },
        },
    });
};
export const make_ChannelProperties = (channelName, channelTopic) => {
    return new ChannelProperties({ name: channelName, topic: channelTopic });
};
export const make_ChannelPayload_Inception = (value) => {
    return {
        case: 'channelPayload',
        value: {
            content: {
                case: 'inception',
                value,
            },
        },
    };
};
export const make_DMChannelPayload_Inception = (value) => {
    return {
        case: 'dmChannelPayload',
        value: {
            content: {
                case: 'inception',
                value,
            },
        },
    };
};
export const make_MemberPayload_Membership2 = (value) => {
    return make_MemberPayload_Membership({
        userAddress: addressFromUserId(value.userId),
        op: value.op,
        initiatorAddress: addressFromUserId(value.initiatorId),
        streamParentId: value.streamParentId ? streamIdAsBytes(value.streamParentId) : undefined,
    });
};
export const make_GDMChannelPayload_Inception = (value) => {
    return {
        case: 'gdmChannelPayload',
        value: {
            content: {
                case: 'inception',
                value,
            },
        },
    };
};
export const make_GDMChannelPayload_ChannelProperties = (value) => {
    return {
        case: 'gdmChannelPayload',
        value: {
            content: {
                case: 'channelProperties',
                value: value,
            },
        },
    };
};
export const make_UserSettingsPayload_Inception = (value) => {
    return {
        case: 'userSettingsPayload',
        value: {
            content: {
                case: 'inception',
                value,
            },
        },
    };
};
export const make_UserSettingsPayload_FullyReadMarkers = (value) => {
    return {
        case: 'userSettingsPayload',
        value: {
            content: {
                case: 'fullyReadMarkers',
                value,
            },
        },
    };
};
export const make_UserSettingsPayload_UserBlock = (value) => {
    return {
        case: 'userSettingsPayload',
        value: {
            content: {
                case: 'userBlock',
                value,
            },
        },
    };
};
export const make_UserDeviceKeyPayload_Inception = (value) => {
    return {
        case: 'userDeviceKeyPayload',
        value: {
            content: {
                case: 'inception',
                value,
            },
        },
    };
};
export const make_UserInboxPayload_Inception = (value) => {
    return {
        case: 'userInboxPayload',
        value: {
            content: {
                case: 'inception',
                value,
            },
        },
    };
};
export const make_UserInboxPayload_GroupEncryptionSessions = (value) => {
    return {
        case: 'userInboxPayload',
        value: {
            content: {
                case: 'groupEncryptionSessions',
                value,
            },
        },
    };
};
export const make_UserInboxPayload_Ack = (value) => {
    return {
        case: 'userInboxPayload',
        value: {
            content: {
                case: 'ack',
                value,
            },
        },
    };
};
export const make_UserDeviceKeyPayload_EncryptionDevice = (value) => {
    return {
        case: 'userDeviceKeyPayload',
        value: {
            content: {
                case: 'encryptionDevice',
                value,
            },
        },
    };
};
export const make_SpacePayload_Channel = (value) => {
    return {
        case: 'spacePayload',
        value: {
            content: {
                case: 'channel',
                value,
            },
        },
    };
};
export const getUserPayload_Membership = (event) => {
    if (!isDefined(event)) {
        return undefined;
    }
    if ('event' in event) {
        event = event.event;
    }
    if (event.payload?.case === 'userPayload') {
        if (event.payload.value.content.case === 'userMembership') {
            return event.payload.value.content.value;
        }
    }
    return undefined;
};
export const getChannelPayload = (event) => {
    if (!isDefined(event)) {
        return undefined;
    }
    if ('event' in event) {
        event = event.event;
    }
    if (event.payload?.case === 'spacePayload') {
        if (event.payload.value.content.case === 'channel') {
            return event.payload.value.content.value;
        }
    }
    return undefined;
};
export const make_ChannelPayload_Message = (value) => {
    return {
        case: 'channelPayload',
        value: {
            content: {
                case: 'message',
                value,
            },
        },
    };
};
export const make_ChannelPayload_Redaction = (eventId) => {
    return {
        case: 'channelPayload',
        value: {
            content: {
                case: 'redaction',
                value: {
                    eventId,
                },
            },
        },
    };
};
export const make_MemberPayload_KeyFulfillment = (value) => {
    return {
        case: 'memberPayload',
        value: {
            content: {
                case: 'keyFulfillment',
                value,
            },
        },
    };
};
export const make_MemberPayload_KeySolicitation = (content) => {
    return {
        case: 'memberPayload',
        value: {
            content: {
                case: 'keySolicitation',
                value: content,
            },
        },
    };
};
export const make_DMChannelPayload_Message = (value) => {
    return {
        case: 'dmChannelPayload',
        value: {
            content: {
                case: 'message',
                value,
            },
        },
    };
};
export const make_GDMChannelPayload_Message = (value) => {
    return {
        case: 'gdmChannelPayload',
        value: {
            content: {
                case: 'message',
                value,
            },
        },
    };
};
export const getMessagePayload = (event) => {
    if (!isDefined(event)) {
        return undefined;
    }
    if ('event' in event) {
        event = event.event;
    }
    if (event.payload?.case === 'channelPayload') {
        if (event.payload.value.content.case === 'message') {
            return event.payload.value.content.value;
        }
    }
    return undefined;
};
export const getMessagePayloadContent = (event) => {
    const payload = getMessagePayload(event);
    if (!payload) {
        return undefined;
    }
    return ChannelMessage.fromJsonString(payload.ciphertext);
};
export const getMessagePayloadContent_Text = (event) => {
    const content = getMessagePayloadContent(event);
    if (!content) {
        return undefined;
    }
    if (content.payload.case !== 'post') {
        throw new Error('Expected post message');
    }
    if (content.payload.value.content.case !== 'text') {
        throw new Error('Expected text message');
    }
    return content.payload.value.content.value;
};
export const make_MediaPayload_Inception = (value) => {
    return {
        case: 'mediaPayload',
        value: {
            content: {
                case: 'inception',
                value,
            },
        },
    };
};
export const make_MediaPayload_Chunk = (value) => {
    return {
        case: 'mediaPayload',
        value: {
            content: {
                case: 'chunk',
                value,
            },
        },
    };
};
export const getMiniblockHeader = (event) => {
    if (!isDefined(event)) {
        return undefined;
    }
    if ('event' in event) {
        event = event.event;
    }
    if (event.payload.case === 'miniblockHeader') {
        return event.payload.value;
    }
    return undefined;
};
export const getRefEventIdFromChannelMessage = (message) => {
    switch (message.payload.case) {
        case 'edit':
        case 'reaction':
        case 'redaction':
            return message.payload.value.refEventId;
        case 'post':
            return message.payload.value.threadId;
        default:
            return undefined;
    }
};
//# sourceMappingURL=types.js.map