import { Members } from './collections/members'
import { MemberMembership } from './models/membership'
import { MemberDisplayName } from './models/metadata/displayName'
import { MemberEnsAddress } from './models/metadata/ensAddress'
import { MemberNft } from './models/metadata/nft'
import { MemberUsername } from './models/metadata/username'
import { RiverChain } from './models/riverChain'
import { RiverConnection } from './riverConnection'
import { Channel } from './models/channel'
import { Space } from './models/space'
import { Spaces } from './collections/spaces'
import { UserMetadata } from './models/userMetadata'
import { UserInbox } from './models/userInbox'
import { UserMemberships } from './models/userMemberships'
import { UserSettings } from './models/userSettings'
import { User } from './collections/user'
import { Gdms } from './collections/gdms'
import { Gdm } from './models/gdm'

export const DB_VERSION = 1
export const DB_MODELS = [
    Channel,
    Space,
    Spaces,
    RiverChain,
    RiverConnection,
    User,
    UserMetadata,
    UserInbox,
    UserMemberships,
    UserSettings,
    Members,
    MemberUsername,
    MemberDisplayName,
    MemberEnsAddress,
    MemberNft,
    MemberMembership,
    Gdms,
    Gdm,
]
