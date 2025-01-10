// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.36.2
// 	protoc        v4.23.4
// source: mls_tools.proto

package mls_tools

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type ValidationResult int32

const (
	ValidationResult_UNKNOWN                                      ValidationResult = 0
	ValidationResult_VALID                                        ValidationResult = 1
	ValidationResult_INVALID_GROUP_INFO                           ValidationResult = 2
	ValidationResult_INVALID_EXTERNAL_GROUP                       ValidationResult = 3
	ValidationResult_INVALID_EXTERNAL_GROUP_EPOCH                 ValidationResult = 4
	ValidationResult_INVALID_EXTERNAL_GROUP_MISSING_TREE          ValidationResult = 5
	ValidationResult_INVALID_GROUP_INFO_EPOCH                     ValidationResult = 6
	ValidationResult_INVALID_GROUP_INFO_MISSING_PUB_KEY_EXTENSION ValidationResult = 7
	ValidationResult_INVALID_COMMIT                               ValidationResult = 8
	ValidationResult_INVALID_GROUP_INFO_GROUP_ID_MISMATCH         ValidationResult = 9
	ValidationResult_INVALID_EXTERNAL_GROUP_TOO_MANY_MEMBERS      ValidationResult = 10
	ValidationResult_INVALID_PUBLIC_SIGNATURE_KEY                 ValidationResult = 11
)

// Enum value maps for ValidationResult.
var (
	ValidationResult_name = map[int32]string{
		0:  "UNKNOWN",
		1:  "VALID",
		2:  "INVALID_GROUP_INFO",
		3:  "INVALID_EXTERNAL_GROUP",
		4:  "INVALID_EXTERNAL_GROUP_EPOCH",
		5:  "INVALID_EXTERNAL_GROUP_MISSING_TREE",
		6:  "INVALID_GROUP_INFO_EPOCH",
		7:  "INVALID_GROUP_INFO_MISSING_PUB_KEY_EXTENSION",
		8:  "INVALID_COMMIT",
		9:  "INVALID_GROUP_INFO_GROUP_ID_MISMATCH",
		10: "INVALID_EXTERNAL_GROUP_TOO_MANY_MEMBERS",
		11: "INVALID_PUBLIC_SIGNATURE_KEY",
	}
	ValidationResult_value = map[string]int32{
		"UNKNOWN":                                      0,
		"VALID":                                        1,
		"INVALID_GROUP_INFO":                           2,
		"INVALID_EXTERNAL_GROUP":                       3,
		"INVALID_EXTERNAL_GROUP_EPOCH":                 4,
		"INVALID_EXTERNAL_GROUP_MISSING_TREE":          5,
		"INVALID_GROUP_INFO_EPOCH":                     6,
		"INVALID_GROUP_INFO_MISSING_PUB_KEY_EXTENSION": 7,
		"INVALID_COMMIT":                               8,
		"INVALID_GROUP_INFO_GROUP_ID_MISMATCH":         9,
		"INVALID_EXTERNAL_GROUP_TOO_MANY_MEMBERS":      10,
		"INVALID_PUBLIC_SIGNATURE_KEY":                 11,
	}
)

func (x ValidationResult) Enum() *ValidationResult {
	p := new(ValidationResult)
	*p = x
	return p
}

func (x ValidationResult) String() string {
	return protoimpl.X.EnumStringOf(x.Descriptor(), protoreflect.EnumNumber(x))
}

func (ValidationResult) Descriptor() protoreflect.EnumDescriptor {
	return file_mls_tools_proto_enumTypes[0].Descriptor()
}

func (ValidationResult) Type() protoreflect.EnumType {
	return &file_mls_tools_proto_enumTypes[0]
}

func (x ValidationResult) Number() protoreflect.EnumNumber {
	return protoreflect.EnumNumber(x)
}

// Deprecated: Use ValidationResult.Descriptor instead.
func (ValidationResult) EnumDescriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{0}
}

type MlsRequest struct {
	state protoimpl.MessageState `protogen:"open.v1"`
	// Types that are valid to be assigned to Content:
	//
	//	*MlsRequest_InitialGroupInfo
	//	*MlsRequest_ExternalJoin
	//	*MlsRequest_SnapshotExternalGroup
	Content       isMlsRequest_Content `protobuf_oneof:"content"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *MlsRequest) Reset() {
	*x = MlsRequest{}
	mi := &file_mls_tools_proto_msgTypes[0]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *MlsRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*MlsRequest) ProtoMessage() {}

func (x *MlsRequest) ProtoReflect() protoreflect.Message {
	mi := &file_mls_tools_proto_msgTypes[0]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use MlsRequest.ProtoReflect.Descriptor instead.
func (*MlsRequest) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{0}
}

func (x *MlsRequest) GetContent() isMlsRequest_Content {
	if x != nil {
		return x.Content
	}
	return nil
}

func (x *MlsRequest) GetInitialGroupInfo() *InitialGroupInfoRequest {
	if x != nil {
		if x, ok := x.Content.(*MlsRequest_InitialGroupInfo); ok {
			return x.InitialGroupInfo
		}
	}
	return nil
}

func (x *MlsRequest) GetExternalJoin() *ExternalJoinRequest {
	if x != nil {
		if x, ok := x.Content.(*MlsRequest_ExternalJoin); ok {
			return x.ExternalJoin
		}
	}
	return nil
}

func (x *MlsRequest) GetSnapshotExternalGroup() *SnapshotExternalGroupRequest {
	if x != nil {
		if x, ok := x.Content.(*MlsRequest_SnapshotExternalGroup); ok {
			return x.SnapshotExternalGroup
		}
	}
	return nil
}

type isMlsRequest_Content interface {
	isMlsRequest_Content()
}

type MlsRequest_InitialGroupInfo struct {
	InitialGroupInfo *InitialGroupInfoRequest `protobuf:"bytes,1,opt,name=initial_group_info,json=initialGroupInfo,proto3,oneof"`
}

type MlsRequest_ExternalJoin struct {
	ExternalJoin *ExternalJoinRequest `protobuf:"bytes,2,opt,name=external_join,json=externalJoin,proto3,oneof"`
}

type MlsRequest_SnapshotExternalGroup struct {
	SnapshotExternalGroup *SnapshotExternalGroupRequest `protobuf:"bytes,3,opt,name=snapshot_external_group,json=snapshotExternalGroup,proto3,oneof"`
}

func (*MlsRequest_InitialGroupInfo) isMlsRequest_Content() {}

func (*MlsRequest_ExternalJoin) isMlsRequest_Content() {}

func (*MlsRequest_SnapshotExternalGroup) isMlsRequest_Content() {}

type InitialGroupInfoRequest struct {
	state                 protoimpl.MessageState `protogen:"open.v1"`
	SignaturePublicKey    []byte                 `protobuf:"bytes,1,opt,name=signature_public_key,json=signaturePublicKey,proto3" json:"signature_public_key,omitempty"`
	GroupInfoMessage      []byte                 `protobuf:"bytes,2,opt,name=group_info_message,json=groupInfoMessage,proto3" json:"group_info_message,omitempty"`
	ExternalGroupSnapshot []byte                 `protobuf:"bytes,3,opt,name=external_group_snapshot,json=externalGroupSnapshot,proto3" json:"external_group_snapshot,omitempty"`
	unknownFields         protoimpl.UnknownFields
	sizeCache             protoimpl.SizeCache
}

func (x *InitialGroupInfoRequest) Reset() {
	*x = InitialGroupInfoRequest{}
	mi := &file_mls_tools_proto_msgTypes[1]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *InitialGroupInfoRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*InitialGroupInfoRequest) ProtoMessage() {}

func (x *InitialGroupInfoRequest) ProtoReflect() protoreflect.Message {
	mi := &file_mls_tools_proto_msgTypes[1]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use InitialGroupInfoRequest.ProtoReflect.Descriptor instead.
func (*InitialGroupInfoRequest) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{1}
}

func (x *InitialGroupInfoRequest) GetSignaturePublicKey() []byte {
	if x != nil {
		return x.SignaturePublicKey
	}
	return nil
}

func (x *InitialGroupInfoRequest) GetGroupInfoMessage() []byte {
	if x != nil {
		return x.GroupInfoMessage
	}
	return nil
}

func (x *InitialGroupInfoRequest) GetExternalGroupSnapshot() []byte {
	if x != nil {
		return x.ExternalGroupSnapshot
	}
	return nil
}

type InitialGroupInfoResponse struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Result        ValidationResult       `protobuf:"varint,1,opt,name=result,proto3,enum=mls_tools.ValidationResult" json:"result,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *InitialGroupInfoResponse) Reset() {
	*x = InitialGroupInfoResponse{}
	mi := &file_mls_tools_proto_msgTypes[2]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *InitialGroupInfoResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*InitialGroupInfoResponse) ProtoMessage() {}

func (x *InitialGroupInfoResponse) ProtoReflect() protoreflect.Message {
	mi := &file_mls_tools_proto_msgTypes[2]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use InitialGroupInfoResponse.ProtoReflect.Descriptor instead.
func (*InitialGroupInfoResponse) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{2}
}

func (x *InitialGroupInfoResponse) GetResult() ValidationResult {
	if x != nil {
		return x.Result
	}
	return ValidationResult_UNKNOWN
}

type ExternalJoinRequest struct {
	state                           protoimpl.MessageState `protogen:"open.v1"`
	ExternalGroupSnapshot           []byte                 `protobuf:"bytes,1,opt,name=external_group_snapshot,json=externalGroupSnapshot,proto3" json:"external_group_snapshot,omitempty"`
	Commits                         [][]byte               `protobuf:"bytes,2,rep,name=commits,proto3" json:"commits,omitempty"`
	ProposedExternalJoinInfoMessage []byte                 `protobuf:"bytes,3,opt,name=proposed_external_join_info_message,json=proposedExternalJoinInfoMessage,proto3" json:"proposed_external_join_info_message,omitempty"`
	ProposedExternalJoinCommit      []byte                 `protobuf:"bytes,4,opt,name=proposed_external_join_commit,json=proposedExternalJoinCommit,proto3" json:"proposed_external_join_commit,omitempty"`
	SignaturePublicKey              []byte                 `protobuf:"bytes,5,opt,name=signature_public_key,json=signaturePublicKey,proto3" json:"signature_public_key,omitempty"`
	unknownFields                   protoimpl.UnknownFields
	sizeCache                       protoimpl.SizeCache
}

func (x *ExternalJoinRequest) Reset() {
	*x = ExternalJoinRequest{}
	mi := &file_mls_tools_proto_msgTypes[3]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *ExternalJoinRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ExternalJoinRequest) ProtoMessage() {}

func (x *ExternalJoinRequest) ProtoReflect() protoreflect.Message {
	mi := &file_mls_tools_proto_msgTypes[3]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ExternalJoinRequest.ProtoReflect.Descriptor instead.
func (*ExternalJoinRequest) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{3}
}

func (x *ExternalJoinRequest) GetExternalGroupSnapshot() []byte {
	if x != nil {
		return x.ExternalGroupSnapshot
	}
	return nil
}

func (x *ExternalJoinRequest) GetCommits() [][]byte {
	if x != nil {
		return x.Commits
	}
	return nil
}

func (x *ExternalJoinRequest) GetProposedExternalJoinInfoMessage() []byte {
	if x != nil {
		return x.ProposedExternalJoinInfoMessage
	}
	return nil
}

func (x *ExternalJoinRequest) GetProposedExternalJoinCommit() []byte {
	if x != nil {
		return x.ProposedExternalJoinCommit
	}
	return nil
}

func (x *ExternalJoinRequest) GetSignaturePublicKey() []byte {
	if x != nil {
		return x.SignaturePublicKey
	}
	return nil
}

type ExternalJoinResponse struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Result        ValidationResult       `protobuf:"varint,1,opt,name=result,proto3,enum=mls_tools.ValidationResult" json:"result,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *ExternalJoinResponse) Reset() {
	*x = ExternalJoinResponse{}
	mi := &file_mls_tools_proto_msgTypes[4]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *ExternalJoinResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ExternalJoinResponse) ProtoMessage() {}

func (x *ExternalJoinResponse) ProtoReflect() protoreflect.Message {
	mi := &file_mls_tools_proto_msgTypes[4]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ExternalJoinResponse.ProtoReflect.Descriptor instead.
func (*ExternalJoinResponse) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{4}
}

func (x *ExternalJoinResponse) GetResult() ValidationResult {
	if x != nil {
		return x.Result
	}
	return ValidationResult_UNKNOWN
}

type SnapshotExternalGroupRequest struct {
	state                 protoimpl.MessageState                     `protogen:"open.v1"`
	ExternalGroupSnapshot []byte                                     `protobuf:"bytes,1,opt,name=external_group_snapshot,json=externalGroupSnapshot,proto3" json:"external_group_snapshot,omitempty"`
	GroupInfoMessage      []byte                                     `protobuf:"bytes,2,opt,name=group_info_message,json=groupInfoMessage,proto3" json:"group_info_message,omitempty"`
	Commits               []*SnapshotExternalGroupRequest_CommitInfo `protobuf:"bytes,3,rep,name=commits,proto3" json:"commits,omitempty"`
	unknownFields         protoimpl.UnknownFields
	sizeCache             protoimpl.SizeCache
}

func (x *SnapshotExternalGroupRequest) Reset() {
	*x = SnapshotExternalGroupRequest{}
	mi := &file_mls_tools_proto_msgTypes[5]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *SnapshotExternalGroupRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*SnapshotExternalGroupRequest) ProtoMessage() {}

func (x *SnapshotExternalGroupRequest) ProtoReflect() protoreflect.Message {
	mi := &file_mls_tools_proto_msgTypes[5]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use SnapshotExternalGroupRequest.ProtoReflect.Descriptor instead.
func (*SnapshotExternalGroupRequest) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{5}
}

func (x *SnapshotExternalGroupRequest) GetExternalGroupSnapshot() []byte {
	if x != nil {
		return x.ExternalGroupSnapshot
	}
	return nil
}

func (x *SnapshotExternalGroupRequest) GetGroupInfoMessage() []byte {
	if x != nil {
		return x.GroupInfoMessage
	}
	return nil
}

func (x *SnapshotExternalGroupRequest) GetCommits() []*SnapshotExternalGroupRequest_CommitInfo {
	if x != nil {
		return x.Commits
	}
	return nil
}

type SnapshotExternalGroupResponse struct {
	state                 protoimpl.MessageState `protogen:"open.v1"`
	ExternalGroupSnapshot []byte                 `protobuf:"bytes,1,opt,name=external_group_snapshot,json=externalGroupSnapshot,proto3" json:"external_group_snapshot,omitempty"`
	GroupInfoMessage      []byte                 `protobuf:"bytes,2,opt,name=group_info_message,json=groupInfoMessage,proto3" json:"group_info_message,omitempty"`
	unknownFields         protoimpl.UnknownFields
	sizeCache             protoimpl.SizeCache
}

func (x *SnapshotExternalGroupResponse) Reset() {
	*x = SnapshotExternalGroupResponse{}
	mi := &file_mls_tools_proto_msgTypes[6]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *SnapshotExternalGroupResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*SnapshotExternalGroupResponse) ProtoMessage() {}

func (x *SnapshotExternalGroupResponse) ProtoReflect() protoreflect.Message {
	mi := &file_mls_tools_proto_msgTypes[6]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use SnapshotExternalGroupResponse.ProtoReflect.Descriptor instead.
func (*SnapshotExternalGroupResponse) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{6}
}

func (x *SnapshotExternalGroupResponse) GetExternalGroupSnapshot() []byte {
	if x != nil {
		return x.ExternalGroupSnapshot
	}
	return nil
}

func (x *SnapshotExternalGroupResponse) GetGroupInfoMessage() []byte {
	if x != nil {
		return x.GroupInfoMessage
	}
	return nil
}

type InfoRequest struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *InfoRequest) Reset() {
	*x = InfoRequest{}
	mi := &file_mls_tools_proto_msgTypes[7]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *InfoRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*InfoRequest) ProtoMessage() {}

func (x *InfoRequest) ProtoReflect() protoreflect.Message {
	mi := &file_mls_tools_proto_msgTypes[7]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use InfoRequest.ProtoReflect.Descriptor instead.
func (*InfoRequest) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{7}
}

type InfoResponse struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Graffiti      string                 `protobuf:"bytes,1,opt,name=graffiti,proto3" json:"graffiti,omitempty"`
	Git           string                 `protobuf:"bytes,2,opt,name=git,proto3" json:"git,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *InfoResponse) Reset() {
	*x = InfoResponse{}
	mi := &file_mls_tools_proto_msgTypes[8]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *InfoResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*InfoResponse) ProtoMessage() {}

func (x *InfoResponse) ProtoReflect() protoreflect.Message {
	mi := &file_mls_tools_proto_msgTypes[8]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use InfoResponse.ProtoReflect.Descriptor instead.
func (*InfoResponse) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{8}
}

func (x *InfoResponse) GetGraffiti() string {
	if x != nil {
		return x.Graffiti
	}
	return ""
}

func (x *InfoResponse) GetGit() string {
	if x != nil {
		return x.Git
	}
	return ""
}

// commits may or may not be accompanied by a new group_info_message
type SnapshotExternalGroupRequest_CommitInfo struct {
	state            protoimpl.MessageState `protogen:"open.v1"`
	Commit           []byte                 `protobuf:"bytes,1,opt,name=commit,proto3" json:"commit,omitempty"`
	GroupInfoMessage []byte                 `protobuf:"bytes,2,opt,name=group_info_message,json=groupInfoMessage,proto3,oneof" json:"group_info_message,omitempty"`
	unknownFields    protoimpl.UnknownFields
	sizeCache        protoimpl.SizeCache
}

func (x *SnapshotExternalGroupRequest_CommitInfo) Reset() {
	*x = SnapshotExternalGroupRequest_CommitInfo{}
	mi := &file_mls_tools_proto_msgTypes[9]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *SnapshotExternalGroupRequest_CommitInfo) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*SnapshotExternalGroupRequest_CommitInfo) ProtoMessage() {}

func (x *SnapshotExternalGroupRequest_CommitInfo) ProtoReflect() protoreflect.Message {
	mi := &file_mls_tools_proto_msgTypes[9]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use SnapshotExternalGroupRequest_CommitInfo.ProtoReflect.Descriptor instead.
func (*SnapshotExternalGroupRequest_CommitInfo) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{5, 0}
}

func (x *SnapshotExternalGroupRequest_CommitInfo) GetCommit() []byte {
	if x != nil {
		return x.Commit
	}
	return nil
}

func (x *SnapshotExternalGroupRequest_CommitInfo) GetGroupInfoMessage() []byte {
	if x != nil {
		return x.GroupInfoMessage
	}
	return nil
}

var File_mls_tools_proto protoreflect.FileDescriptor

var file_mls_tools_proto_rawDesc = []byte{
	0x0a, 0x0f, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x70, 0x72, 0x6f, 0x74,
	0x6f, 0x12, 0x09, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x22, 0x95, 0x02, 0x0a,
	0x0a, 0x4d, 0x6c, 0x73, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x52, 0x0a, 0x12, 0x69,
	0x6e, 0x69, 0x74, 0x69, 0x61, 0x6c, 0x5f, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x5f, 0x69, 0x6e, 0x66,
	0x6f, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x22, 0x2e, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f,
	0x6f, 0x6c, 0x73, 0x2e, 0x49, 0x6e, 0x69, 0x74, 0x69, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70,
	0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x48, 0x00, 0x52, 0x10, 0x69,
	0x6e, 0x69, 0x74, 0x69, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x12,
	0x45, 0x0a, 0x0d, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x5f, 0x6a, 0x6f, 0x69, 0x6e,
	0x18, 0x02, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x1e, 0x2e, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f,
	0x6c, 0x73, 0x2e, 0x45, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x4a, 0x6f, 0x69, 0x6e, 0x52,
	0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x48, 0x00, 0x52, 0x0c, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e,
	0x61, 0x6c, 0x4a, 0x6f, 0x69, 0x6e, 0x12, 0x61, 0x0a, 0x17, 0x73, 0x6e, 0x61, 0x70, 0x73, 0x68,
	0x6f, 0x74, 0x5f, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x5f, 0x67, 0x72, 0x6f, 0x75,
	0x70, 0x18, 0x03, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x27, 0x2e, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f,
	0x6f, 0x6c, 0x73, 0x2e, 0x53, 0x6e, 0x61, 0x70, 0x73, 0x68, 0x6f, 0x74, 0x45, 0x78, 0x74, 0x65,
	0x72, 0x6e, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74,
	0x48, 0x00, 0x52, 0x15, 0x73, 0x6e, 0x61, 0x70, 0x73, 0x68, 0x6f, 0x74, 0x45, 0x78, 0x74, 0x65,
	0x72, 0x6e, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x42, 0x09, 0x0a, 0x07, 0x63, 0x6f, 0x6e,
	0x74, 0x65, 0x6e, 0x74, 0x22, 0xb1, 0x01, 0x0a, 0x17, 0x49, 0x6e, 0x69, 0x74, 0x69, 0x61, 0x6c,
	0x47, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74,
	0x12, 0x30, 0x0a, 0x14, 0x73, 0x69, 0x67, 0x6e, 0x61, 0x74, 0x75, 0x72, 0x65, 0x5f, 0x70, 0x75,
	0x62, 0x6c, 0x69, 0x63, 0x5f, 0x6b, 0x65, 0x79, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x12,
	0x73, 0x69, 0x67, 0x6e, 0x61, 0x74, 0x75, 0x72, 0x65, 0x50, 0x75, 0x62, 0x6c, 0x69, 0x63, 0x4b,
	0x65, 0x79, 0x12, 0x2c, 0x0a, 0x12, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x5f, 0x69, 0x6e, 0x66, 0x6f,
	0x5f, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x10,
	0x67, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x4d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65,
	0x12, 0x36, 0x0a, 0x17, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x5f, 0x67, 0x72, 0x6f,
	0x75, 0x70, 0x5f, 0x73, 0x6e, 0x61, 0x70, 0x73, 0x68, 0x6f, 0x74, 0x18, 0x03, 0x20, 0x01, 0x28,
	0x0c, 0x52, 0x15, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70,
	0x53, 0x6e, 0x61, 0x70, 0x73, 0x68, 0x6f, 0x74, 0x22, 0x4f, 0x0a, 0x18, 0x49, 0x6e, 0x69, 0x74,
	0x69, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x73, 0x70,
	0x6f, 0x6e, 0x73, 0x65, 0x12, 0x33, 0x0a, 0x06, 0x72, 0x65, 0x73, 0x75, 0x6c, 0x74, 0x18, 0x01,
	0x20, 0x01, 0x28, 0x0e, 0x32, 0x1b, 0x2e, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73,
	0x2e, 0x56, 0x61, 0x6c, 0x69, 0x64, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x52, 0x65, 0x73, 0x75, 0x6c,
	0x74, 0x52, 0x06, 0x72, 0x65, 0x73, 0x75, 0x6c, 0x74, 0x22, 0xaa, 0x02, 0x0a, 0x13, 0x45, 0x78,
	0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x4a, 0x6f, 0x69, 0x6e, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73,
	0x74, 0x12, 0x36, 0x0a, 0x17, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x5f, 0x67, 0x72,
	0x6f, 0x75, 0x70, 0x5f, 0x73, 0x6e, 0x61, 0x70, 0x73, 0x68, 0x6f, 0x74, 0x18, 0x01, 0x20, 0x01,
	0x28, 0x0c, 0x52, 0x15, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75,
	0x70, 0x53, 0x6e, 0x61, 0x70, 0x73, 0x68, 0x6f, 0x74, 0x12, 0x18, 0x0a, 0x07, 0x63, 0x6f, 0x6d,
	0x6d, 0x69, 0x74, 0x73, 0x18, 0x02, 0x20, 0x03, 0x28, 0x0c, 0x52, 0x07, 0x63, 0x6f, 0x6d, 0x6d,
	0x69, 0x74, 0x73, 0x12, 0x4c, 0x0a, 0x23, 0x70, 0x72, 0x6f, 0x70, 0x6f, 0x73, 0x65, 0x64, 0x5f,
	0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x5f, 0x6a, 0x6f, 0x69, 0x6e, 0x5f, 0x69, 0x6e,
	0x66, 0x6f, 0x5f, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x18, 0x03, 0x20, 0x01, 0x28, 0x0c,
	0x52, 0x1f, 0x70, 0x72, 0x6f, 0x70, 0x6f, 0x73, 0x65, 0x64, 0x45, 0x78, 0x74, 0x65, 0x72, 0x6e,
	0x61, 0x6c, 0x4a, 0x6f, 0x69, 0x6e, 0x49, 0x6e, 0x66, 0x6f, 0x4d, 0x65, 0x73, 0x73, 0x61, 0x67,
	0x65, 0x12, 0x41, 0x0a, 0x1d, 0x70, 0x72, 0x6f, 0x70, 0x6f, 0x73, 0x65, 0x64, 0x5f, 0x65, 0x78,
	0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x5f, 0x6a, 0x6f, 0x69, 0x6e, 0x5f, 0x63, 0x6f, 0x6d, 0x6d,
	0x69, 0x74, 0x18, 0x04, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x1a, 0x70, 0x72, 0x6f, 0x70, 0x6f, 0x73,
	0x65, 0x64, 0x45, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x4a, 0x6f, 0x69, 0x6e, 0x43, 0x6f,
	0x6d, 0x6d, 0x69, 0x74, 0x12, 0x30, 0x0a, 0x14, 0x73, 0x69, 0x67, 0x6e, 0x61, 0x74, 0x75, 0x72,
	0x65, 0x5f, 0x70, 0x75, 0x62, 0x6c, 0x69, 0x63, 0x5f, 0x6b, 0x65, 0x79, 0x18, 0x05, 0x20, 0x01,
	0x28, 0x0c, 0x52, 0x12, 0x73, 0x69, 0x67, 0x6e, 0x61, 0x74, 0x75, 0x72, 0x65, 0x50, 0x75, 0x62,
	0x6c, 0x69, 0x63, 0x4b, 0x65, 0x79, 0x22, 0x4b, 0x0a, 0x14, 0x45, 0x78, 0x74, 0x65, 0x72, 0x6e,
	0x61, 0x6c, 0x4a, 0x6f, 0x69, 0x6e, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x33,
	0x0a, 0x06, 0x72, 0x65, 0x73, 0x75, 0x6c, 0x74, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0e, 0x32, 0x1b,
	0x2e, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x56, 0x61, 0x6c, 0x69, 0x64,
	0x61, 0x74, 0x69, 0x6f, 0x6e, 0x52, 0x65, 0x73, 0x75, 0x6c, 0x74, 0x52, 0x06, 0x72, 0x65, 0x73,
	0x75, 0x6c, 0x74, 0x22, 0xc2, 0x02, 0x0a, 0x1c, 0x53, 0x6e, 0x61, 0x70, 0x73, 0x68, 0x6f, 0x74,
	0x45, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x52, 0x65, 0x71,
	0x75, 0x65, 0x73, 0x74, 0x12, 0x36, 0x0a, 0x17, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c,
	0x5f, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x5f, 0x73, 0x6e, 0x61, 0x70, 0x73, 0x68, 0x6f, 0x74, 0x18,
	0x01, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x15, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x47,
	0x72, 0x6f, 0x75, 0x70, 0x53, 0x6e, 0x61, 0x70, 0x73, 0x68, 0x6f, 0x74, 0x12, 0x2c, 0x0a, 0x12,
	0x67, 0x72, 0x6f, 0x75, 0x70, 0x5f, 0x69, 0x6e, 0x66, 0x6f, 0x5f, 0x6d, 0x65, 0x73, 0x73, 0x61,
	0x67, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x10, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x49,
	0x6e, 0x66, 0x6f, 0x4d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x12, 0x4c, 0x0a, 0x07, 0x63, 0x6f,
	0x6d, 0x6d, 0x69, 0x74, 0x73, 0x18, 0x03, 0x20, 0x03, 0x28, 0x0b, 0x32, 0x32, 0x2e, 0x6d, 0x6c,
	0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x53, 0x6e, 0x61, 0x70, 0x73, 0x68, 0x6f, 0x74,
	0x45, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x52, 0x65, 0x71,
	0x75, 0x65, 0x73, 0x74, 0x2e, 0x43, 0x6f, 0x6d, 0x6d, 0x69, 0x74, 0x49, 0x6e, 0x66, 0x6f, 0x52,
	0x07, 0x63, 0x6f, 0x6d, 0x6d, 0x69, 0x74, 0x73, 0x1a, 0x6e, 0x0a, 0x0a, 0x43, 0x6f, 0x6d, 0x6d,
	0x69, 0x74, 0x49, 0x6e, 0x66, 0x6f, 0x12, 0x16, 0x0a, 0x06, 0x63, 0x6f, 0x6d, 0x6d, 0x69, 0x74,
	0x18, 0x01, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x06, 0x63, 0x6f, 0x6d, 0x6d, 0x69, 0x74, 0x12, 0x31,
	0x0a, 0x12, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x5f, 0x69, 0x6e, 0x66, 0x6f, 0x5f, 0x6d, 0x65, 0x73,
	0x73, 0x61, 0x67, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0c, 0x48, 0x00, 0x52, 0x10, 0x67, 0x72,
	0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x4d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x88, 0x01,
	0x01, 0x42, 0x15, 0x0a, 0x13, 0x5f, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x5f, 0x69, 0x6e, 0x66, 0x6f,
	0x5f, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x22, 0x85, 0x01, 0x0a, 0x1d, 0x53, 0x6e, 0x61,
	0x70, 0x73, 0x68, 0x6f, 0x74, 0x45, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x47, 0x72, 0x6f,
	0x75, 0x70, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x36, 0x0a, 0x17, 0x65, 0x78,
	0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x5f, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x5f, 0x73, 0x6e, 0x61,
	0x70, 0x73, 0x68, 0x6f, 0x74, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x15, 0x65, 0x78, 0x74,
	0x65, 0x72, 0x6e, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x53, 0x6e, 0x61, 0x70, 0x73, 0x68,
	0x6f, 0x74, 0x12, 0x2c, 0x0a, 0x12, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x5f, 0x69, 0x6e, 0x66, 0x6f,
	0x5f, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x10,
	0x67, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x4d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65,
	0x22, 0x0d, 0x0a, 0x0b, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x22,
	0x3c, 0x0a, 0x0c, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12,
	0x1a, 0x0a, 0x08, 0x67, 0x72, 0x61, 0x66, 0x66, 0x69, 0x74, 0x69, 0x18, 0x01, 0x20, 0x01, 0x28,
	0x09, 0x52, 0x08, 0x67, 0x72, 0x61, 0x66, 0x66, 0x69, 0x74, 0x69, 0x12, 0x10, 0x0a, 0x03, 0x67,
	0x69, 0x74, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x03, 0x67, 0x69, 0x74, 0x2a, 0x86, 0x03,
	0x0a, 0x10, 0x56, 0x61, 0x6c, 0x69, 0x64, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x52, 0x65, 0x73, 0x75,
	0x6c, 0x74, 0x12, 0x0b, 0x0a, 0x07, 0x55, 0x4e, 0x4b, 0x4e, 0x4f, 0x57, 0x4e, 0x10, 0x00, 0x12,
	0x09, 0x0a, 0x05, 0x56, 0x41, 0x4c, 0x49, 0x44, 0x10, 0x01, 0x12, 0x16, 0x0a, 0x12, 0x49, 0x4e,
	0x56, 0x41, 0x4c, 0x49, 0x44, 0x5f, 0x47, 0x52, 0x4f, 0x55, 0x50, 0x5f, 0x49, 0x4e, 0x46, 0x4f,
	0x10, 0x02, 0x12, 0x1a, 0x0a, 0x16, 0x49, 0x4e, 0x56, 0x41, 0x4c, 0x49, 0x44, 0x5f, 0x45, 0x58,
	0x54, 0x45, 0x52, 0x4e, 0x41, 0x4c, 0x5f, 0x47, 0x52, 0x4f, 0x55, 0x50, 0x10, 0x03, 0x12, 0x20,
	0x0a, 0x1c, 0x49, 0x4e, 0x56, 0x41, 0x4c, 0x49, 0x44, 0x5f, 0x45, 0x58, 0x54, 0x45, 0x52, 0x4e,
	0x41, 0x4c, 0x5f, 0x47, 0x52, 0x4f, 0x55, 0x50, 0x5f, 0x45, 0x50, 0x4f, 0x43, 0x48, 0x10, 0x04,
	0x12, 0x27, 0x0a, 0x23, 0x49, 0x4e, 0x56, 0x41, 0x4c, 0x49, 0x44, 0x5f, 0x45, 0x58, 0x54, 0x45,
	0x52, 0x4e, 0x41, 0x4c, 0x5f, 0x47, 0x52, 0x4f, 0x55, 0x50, 0x5f, 0x4d, 0x49, 0x53, 0x53, 0x49,
	0x4e, 0x47, 0x5f, 0x54, 0x52, 0x45, 0x45, 0x10, 0x05, 0x12, 0x1c, 0x0a, 0x18, 0x49, 0x4e, 0x56,
	0x41, 0x4c, 0x49, 0x44, 0x5f, 0x47, 0x52, 0x4f, 0x55, 0x50, 0x5f, 0x49, 0x4e, 0x46, 0x4f, 0x5f,
	0x45, 0x50, 0x4f, 0x43, 0x48, 0x10, 0x06, 0x12, 0x30, 0x0a, 0x2c, 0x49, 0x4e, 0x56, 0x41, 0x4c,
	0x49, 0x44, 0x5f, 0x47, 0x52, 0x4f, 0x55, 0x50, 0x5f, 0x49, 0x4e, 0x46, 0x4f, 0x5f, 0x4d, 0x49,
	0x53, 0x53, 0x49, 0x4e, 0x47, 0x5f, 0x50, 0x55, 0x42, 0x5f, 0x4b, 0x45, 0x59, 0x5f, 0x45, 0x58,
	0x54, 0x45, 0x4e, 0x53, 0x49, 0x4f, 0x4e, 0x10, 0x07, 0x12, 0x12, 0x0a, 0x0e, 0x49, 0x4e, 0x56,
	0x41, 0x4c, 0x49, 0x44, 0x5f, 0x43, 0x4f, 0x4d, 0x4d, 0x49, 0x54, 0x10, 0x08, 0x12, 0x28, 0x0a,
	0x24, 0x49, 0x4e, 0x56, 0x41, 0x4c, 0x49, 0x44, 0x5f, 0x47, 0x52, 0x4f, 0x55, 0x50, 0x5f, 0x49,
	0x4e, 0x46, 0x4f, 0x5f, 0x47, 0x52, 0x4f, 0x55, 0x50, 0x5f, 0x49, 0x44, 0x5f, 0x4d, 0x49, 0x53,
	0x4d, 0x41, 0x54, 0x43, 0x48, 0x10, 0x09, 0x12, 0x2b, 0x0a, 0x27, 0x49, 0x4e, 0x56, 0x41, 0x4c,
	0x49, 0x44, 0x5f, 0x45, 0x58, 0x54, 0x45, 0x52, 0x4e, 0x41, 0x4c, 0x5f, 0x47, 0x52, 0x4f, 0x55,
	0x50, 0x5f, 0x54, 0x4f, 0x4f, 0x5f, 0x4d, 0x41, 0x4e, 0x59, 0x5f, 0x4d, 0x45, 0x4d, 0x42, 0x45,
	0x52, 0x53, 0x10, 0x0a, 0x12, 0x20, 0x0a, 0x1c, 0x49, 0x4e, 0x56, 0x41, 0x4c, 0x49, 0x44, 0x5f,
	0x50, 0x55, 0x42, 0x4c, 0x49, 0x43, 0x5f, 0x53, 0x49, 0x47, 0x4e, 0x41, 0x54, 0x55, 0x52, 0x45,
	0x5f, 0x4b, 0x45, 0x59, 0x10, 0x0b, 0x42, 0x0d, 0x5a, 0x0b, 0x2e, 0x2f, 0x6d, 0x6c, 0x73, 0x5f,
	0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_mls_tools_proto_rawDescOnce sync.Once
	file_mls_tools_proto_rawDescData = file_mls_tools_proto_rawDesc
)

func file_mls_tools_proto_rawDescGZIP() []byte {
	file_mls_tools_proto_rawDescOnce.Do(func() {
		file_mls_tools_proto_rawDescData = protoimpl.X.CompressGZIP(file_mls_tools_proto_rawDescData)
	})
	return file_mls_tools_proto_rawDescData
}

var file_mls_tools_proto_enumTypes = make([]protoimpl.EnumInfo, 1)
var file_mls_tools_proto_msgTypes = make([]protoimpl.MessageInfo, 10)
var file_mls_tools_proto_goTypes = []any{
	(ValidationResult)(0),                           // 0: mls_tools.ValidationResult
	(*MlsRequest)(nil),                              // 1: mls_tools.MlsRequest
	(*InitialGroupInfoRequest)(nil),                 // 2: mls_tools.InitialGroupInfoRequest
	(*InitialGroupInfoResponse)(nil),                // 3: mls_tools.InitialGroupInfoResponse
	(*ExternalJoinRequest)(nil),                     // 4: mls_tools.ExternalJoinRequest
	(*ExternalJoinResponse)(nil),                    // 5: mls_tools.ExternalJoinResponse
	(*SnapshotExternalGroupRequest)(nil),            // 6: mls_tools.SnapshotExternalGroupRequest
	(*SnapshotExternalGroupResponse)(nil),           // 7: mls_tools.SnapshotExternalGroupResponse
	(*InfoRequest)(nil),                             // 8: mls_tools.InfoRequest
	(*InfoResponse)(nil),                            // 9: mls_tools.InfoResponse
	(*SnapshotExternalGroupRequest_CommitInfo)(nil), // 10: mls_tools.SnapshotExternalGroupRequest.CommitInfo
}
var file_mls_tools_proto_depIdxs = []int32{
	2,  // 0: mls_tools.MlsRequest.initial_group_info:type_name -> mls_tools.InitialGroupInfoRequest
	4,  // 1: mls_tools.MlsRequest.external_join:type_name -> mls_tools.ExternalJoinRequest
	6,  // 2: mls_tools.MlsRequest.snapshot_external_group:type_name -> mls_tools.SnapshotExternalGroupRequest
	0,  // 3: mls_tools.InitialGroupInfoResponse.result:type_name -> mls_tools.ValidationResult
	0,  // 4: mls_tools.ExternalJoinResponse.result:type_name -> mls_tools.ValidationResult
	10, // 5: mls_tools.SnapshotExternalGroupRequest.commits:type_name -> mls_tools.SnapshotExternalGroupRequest.CommitInfo
	6,  // [6:6] is the sub-list for method output_type
	6,  // [6:6] is the sub-list for method input_type
	6,  // [6:6] is the sub-list for extension type_name
	6,  // [6:6] is the sub-list for extension extendee
	0,  // [0:6] is the sub-list for field type_name
}

func init() { file_mls_tools_proto_init() }
func file_mls_tools_proto_init() {
	if File_mls_tools_proto != nil {
		return
	}
	file_mls_tools_proto_msgTypes[0].OneofWrappers = []any{
		(*MlsRequest_InitialGroupInfo)(nil),
		(*MlsRequest_ExternalJoin)(nil),
		(*MlsRequest_SnapshotExternalGroup)(nil),
	}
	file_mls_tools_proto_msgTypes[9].OneofWrappers = []any{}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_mls_tools_proto_rawDesc,
			NumEnums:      1,
			NumMessages:   10,
			NumExtensions: 0,
			NumServices:   0,
		},
		GoTypes:           file_mls_tools_proto_goTypes,
		DependencyIndexes: file_mls_tools_proto_depIdxs,
		EnumInfos:         file_mls_tools_proto_enumTypes,
		MessageInfos:      file_mls_tools_proto_msgTypes,
	}.Build()
	File_mls_tools_proto = out.File
	file_mls_tools_proto_rawDesc = nil
	file_mls_tools_proto_goTypes = nil
	file_mls_tools_proto_depIdxs = nil
}
