export type DerivedKeys = {
    secretKey: Uint8Array
    publicKey: Uint8Array
}

export class EpochKey {
    private constructor(
        public readonly streamId: string,
        public readonly epoch: bigint,
        public readonly openEpochSecret?: Uint8Array,
        public readonly sealedEpochSecret?: Uint8Array,
        public readonly derivedKeys?: DerivedKeys,
        public readonly announced?: boolean,
    ) {}

    public static fromSealedEpochSecret(
        streamId: string,
        epoch: bigint,
        sealedEpochSecret: Uint8Array,
    ): EpochKey {
        return new EpochKey(streamId, epoch, undefined, sealedEpochSecret, undefined, true)
    }

    public static fromOpenEpochSecret(
        streamId: string,
        epoch: bigint,
        openEpochSecret: Uint8Array,
        derivedKeys: DerivedKeys,
    ): EpochKey {
        return new EpochKey(streamId, epoch, openEpochSecret, undefined, derivedKeys, false)
    }
}
