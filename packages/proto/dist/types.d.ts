import { PlainMessage } from '@bufbuild/protobuf';
import { Snapshot, StreamEvent } from './gen/protocol_pb';
import { FullyReadMarkers_Content } from './gen/payloads_pb';
export type SnapshotCaseType = Snapshot['content']['case'];
export type SnapshotValueType = Snapshot['content']['value'];
export type PayloadCaseType = StreamEvent['payload']['case'];
export type PayloadValueType = StreamEvent['payload']['value'];
export type FullyReadMarker = PlainMessage<FullyReadMarkers_Content>;
//# sourceMappingURL=types.d.ts.map