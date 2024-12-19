// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.35.2
// 	protoc        v5.29.1
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

type MlsValidationResponse_ValidationResult int32

const (
	MlsValidationResponse_UNKNOWN                                      MlsValidationResponse_ValidationResult = 0
	MlsValidationResponse_VALID                                        MlsValidationResponse_ValidationResult = 1
	MlsValidationResponse_INVALID_GROUP_INFO                           MlsValidationResponse_ValidationResult = 2
	MlsValidationResponse_INVALID_EXTERNAL_GROUP                       MlsValidationResponse_ValidationResult = 3
	MlsValidationResponse_INVALID_EXTERNAL_GROUP_EPOCH                 MlsValidationResponse_ValidationResult = 4
	MlsValidationResponse_INVALID_EXTERNAL_GROUP_MISSING_TREE          MlsValidationResponse_ValidationResult = 5
	MlsValidationResponse_INVALID_GROUP_INFO_EPOCH                     MlsValidationResponse_ValidationResult = 6
	MlsValidationResponse_INVALID_GROUP_INFO_MISSING_PUB_KEY_EXTENSION MlsValidationResponse_ValidationResult = 7
	MlsValidationResponse_INVALID_COMMIT                               MlsValidationResponse_ValidationResult = 8
)

// Enum value maps for MlsValidationResponse_ValidationResult.
var (
	MlsValidationResponse_ValidationResult_name = map[int32]string{
		0: "UNKNOWN",
		1: "VALID",
		2: "INVALID_GROUP_INFO",
		3: "INVALID_EXTERNAL_GROUP",
		4: "INVALID_EXTERNAL_GROUP_EPOCH",
		5: "INVALID_EXTERNAL_GROUP_MISSING_TREE",
		6: "INVALID_GROUP_INFO_EPOCH",
		7: "INVALID_GROUP_INFO_MISSING_PUB_KEY_EXTENSION",
		8: "INVALID_COMMIT",
	}
	MlsValidationResponse_ValidationResult_value = map[string]int32{
		"UNKNOWN":                                      0,
		"VALID":                                        1,
		"INVALID_GROUP_INFO":                           2,
		"INVALID_EXTERNAL_GROUP":                       3,
		"INVALID_EXTERNAL_GROUP_EPOCH":                 4,
		"INVALID_EXTERNAL_GROUP_MISSING_TREE":          5,
		"INVALID_GROUP_INFO_EPOCH":                     6,
		"INVALID_GROUP_INFO_MISSING_PUB_KEY_EXTENSION": 7,
		"INVALID_COMMIT":                               8,
	}
)

func (x MlsValidationResponse_ValidationResult) Enum() *MlsValidationResponse_ValidationResult {
	p := new(MlsValidationResponse_ValidationResult)
	*p = x
	return p
}

func (x MlsValidationResponse_ValidationResult) String() string {
	return protoimpl.X.EnumStringOf(x.Descriptor(), protoreflect.EnumNumber(x))
}

func (MlsValidationResponse_ValidationResult) Descriptor() protoreflect.EnumDescriptor {
	return file_mls_tools_proto_enumTypes[0].Descriptor()
}

func (MlsValidationResponse_ValidationResult) Type() protoreflect.EnumType {
	return &file_mls_tools_proto_enumTypes[0]
}

func (x MlsValidationResponse_ValidationResult) Number() protoreflect.EnumNumber {
	return protoreflect.EnumNumber(x)
}

// Deprecated: Use MlsValidationResponse_ValidationResult.Descriptor instead.
func (MlsValidationResponse_ValidationResult) EnumDescriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{1, 0}
}

type MlsValidationRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	// Types that are assignable to Payload:
	//
	//	*MlsValidationRequest_Passthrough_
	//	*MlsValidationRequest_InitialGroupInfoRequest_
	//	*MlsValidationRequest_ExternalJoinRequest_
	Payload isMlsValidationRequest_Payload `protobuf_oneof:"payload"`
}

func (x *MlsValidationRequest) Reset() {
	*x = MlsValidationRequest{}
	mi := &file_mls_tools_proto_msgTypes[0]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *MlsValidationRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*MlsValidationRequest) ProtoMessage() {}

func (x *MlsValidationRequest) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use MlsValidationRequest.ProtoReflect.Descriptor instead.
func (*MlsValidationRequest) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{0}
}

func (m *MlsValidationRequest) GetPayload() isMlsValidationRequest_Payload {
	if m != nil {
		return m.Payload
	}
	return nil
}

func (x *MlsValidationRequest) GetPassthrough() *MlsValidationRequest_Passthrough {
	if x, ok := x.GetPayload().(*MlsValidationRequest_Passthrough_); ok {
		return x.Passthrough
	}
	return nil
}

func (x *MlsValidationRequest) GetInitialGroupInfoRequest() *MlsValidationRequest_InitialGroupInfoRequest {
	if x, ok := x.GetPayload().(*MlsValidationRequest_InitialGroupInfoRequest_); ok {
		return x.InitialGroupInfoRequest
	}
	return nil
}

func (x *MlsValidationRequest) GetExternalJoinRequest() *MlsValidationRequest_ExternalJoinRequest {
	if x, ok := x.GetPayload().(*MlsValidationRequest_ExternalJoinRequest_); ok {
		return x.ExternalJoinRequest
	}
	return nil
}

type isMlsValidationRequest_Payload interface {
	isMlsValidationRequest_Payload()
}

type MlsValidationRequest_Passthrough_ struct {
	Passthrough *MlsValidationRequest_Passthrough `protobuf:"bytes,1,opt,name=passthrough,proto3,oneof"`
}

type MlsValidationRequest_InitialGroupInfoRequest_ struct {
	InitialGroupInfoRequest *MlsValidationRequest_InitialGroupInfoRequest `protobuf:"bytes,2,opt,name=initial_group_info_request,json=initialGroupInfoRequest,proto3,oneof"`
}

type MlsValidationRequest_ExternalJoinRequest_ struct {
	ExternalJoinRequest *MlsValidationRequest_ExternalJoinRequest `protobuf:"bytes,3,opt,name=external_join_request,json=externalJoinRequest,proto3,oneof"`
}

func (*MlsValidationRequest_Passthrough_) isMlsValidationRequest_Payload() {}

func (*MlsValidationRequest_InitialGroupInfoRequest_) isMlsValidationRequest_Payload() {}

func (*MlsValidationRequest_ExternalJoinRequest_) isMlsValidationRequest_Payload() {}

type MlsValidationResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Result MlsValidationResponse_ValidationResult `protobuf:"varint,1,opt,name=result,proto3,enum=mls_tools.MlsValidationResponse_ValidationResult" json:"result,omitempty"`
}

func (x *MlsValidationResponse) Reset() {
	*x = MlsValidationResponse{}
	mi := &file_mls_tools_proto_msgTypes[1]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *MlsValidationResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*MlsValidationResponse) ProtoMessage() {}

func (x *MlsValidationResponse) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use MlsValidationResponse.ProtoReflect.Descriptor instead.
func (*MlsValidationResponse) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{1}
}

func (x *MlsValidationResponse) GetResult() MlsValidationResponse_ValidationResult {
	if x != nil {
		return x.Result
	}
	return MlsValidationResponse_UNKNOWN
}

type InitialGroupInfoRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	GroupInfoMessage      []byte `protobuf:"bytes,1,opt,name=group_info_message,json=groupInfoMessage,proto3" json:"group_info_message,omitempty"`
	ExternalGroupSnapshot []byte `protobuf:"bytes,2,opt,name=external_group_snapshot,json=externalGroupSnapshot,proto3" json:"external_group_snapshot,omitempty"`
}

func (x *InitialGroupInfoRequest) Reset() {
	*x = InitialGroupInfoRequest{}
	mi := &file_mls_tools_proto_msgTypes[2]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *InitialGroupInfoRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*InitialGroupInfoRequest) ProtoMessage() {}

func (x *InitialGroupInfoRequest) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use InitialGroupInfoRequest.ProtoReflect.Descriptor instead.
func (*InitialGroupInfoRequest) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{2}
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
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *InitialGroupInfoResponse) Reset() {
	*x = InitialGroupInfoResponse{}
	mi := &file_mls_tools_proto_msgTypes[3]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *InitialGroupInfoResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*InitialGroupInfoResponse) ProtoMessage() {}

func (x *InitialGroupInfoResponse) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use InitialGroupInfoResponse.ProtoReflect.Descriptor instead.
func (*InitialGroupInfoResponse) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{3}
}

type InfoRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *InfoRequest) Reset() {
	*x = InfoRequest{}
	mi := &file_mls_tools_proto_msgTypes[4]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *InfoRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*InfoRequest) ProtoMessage() {}

func (x *InfoRequest) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use InfoRequest.ProtoReflect.Descriptor instead.
func (*InfoRequest) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{4}
}

type InfoResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Graffiti string `protobuf:"bytes,1,opt,name=graffiti,proto3" json:"graffiti,omitempty"`
	Git      string `protobuf:"bytes,2,opt,name=git,proto3" json:"git,omitempty"`
}

func (x *InfoResponse) Reset() {
	*x = InfoResponse{}
	mi := &file_mls_tools_proto_msgTypes[5]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *InfoResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*InfoResponse) ProtoMessage() {}

func (x *InfoResponse) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use InfoResponse.ProtoReflect.Descriptor instead.
func (*InfoResponse) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{5}
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

// for testing purposes, always returns valid
type MlsValidationRequest_Passthrough struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *MlsValidationRequest_Passthrough) Reset() {
	*x = MlsValidationRequest_Passthrough{}
	mi := &file_mls_tools_proto_msgTypes[6]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *MlsValidationRequest_Passthrough) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*MlsValidationRequest_Passthrough) ProtoMessage() {}

func (x *MlsValidationRequest_Passthrough) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use MlsValidationRequest_Passthrough.ProtoReflect.Descriptor instead.
func (*MlsValidationRequest_Passthrough) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{0, 0}
}

type MlsValidationRequest_InitialGroupInfoRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	GroupInfoMessage      []byte `protobuf:"bytes,1,opt,name=group_info_message,json=groupInfoMessage,proto3" json:"group_info_message,omitempty"`
	ExternalGroupSnapshot []byte `protobuf:"bytes,2,opt,name=external_group_snapshot,json=externalGroupSnapshot,proto3" json:"external_group_snapshot,omitempty"`
}

func (x *MlsValidationRequest_InitialGroupInfoRequest) Reset() {
	*x = MlsValidationRequest_InitialGroupInfoRequest{}
	mi := &file_mls_tools_proto_msgTypes[7]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *MlsValidationRequest_InitialGroupInfoRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*MlsValidationRequest_InitialGroupInfoRequest) ProtoMessage() {}

func (x *MlsValidationRequest_InitialGroupInfoRequest) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use MlsValidationRequest_InitialGroupInfoRequest.ProtoReflect.Descriptor instead.
func (*MlsValidationRequest_InitialGroupInfoRequest) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{0, 1}
}

func (x *MlsValidationRequest_InitialGroupInfoRequest) GetGroupInfoMessage() []byte {
	if x != nil {
		return x.GroupInfoMessage
	}
	return nil
}

func (x *MlsValidationRequest_InitialGroupInfoRequest) GetExternalGroupSnapshot() []byte {
	if x != nil {
		return x.ExternalGroupSnapshot
	}
	return nil
}

type MlsValidationRequest_ExternalJoinRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	ExternalGroupSnapshot           []byte   `protobuf:"bytes,1,opt,name=external_group_snapshot,json=externalGroupSnapshot,proto3" json:"external_group_snapshot,omitempty"`
	Commits                         [][]byte `protobuf:"bytes,2,rep,name=commits,proto3" json:"commits,omitempty"`
	ProposedExternalJoinInfoMessage []byte   `protobuf:"bytes,3,opt,name=proposed_external_join_info_message,json=proposedExternalJoinInfoMessage,proto3" json:"proposed_external_join_info_message,omitempty"`
	ProposedExternalJoinCommit      []byte   `protobuf:"bytes,4,opt,name=proposed_external_join_commit,json=proposedExternalJoinCommit,proto3" json:"proposed_external_join_commit,omitempty"`
}

func (x *MlsValidationRequest_ExternalJoinRequest) Reset() {
	*x = MlsValidationRequest_ExternalJoinRequest{}
	mi := &file_mls_tools_proto_msgTypes[8]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *MlsValidationRequest_ExternalJoinRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*MlsValidationRequest_ExternalJoinRequest) ProtoMessage() {}

func (x *MlsValidationRequest_ExternalJoinRequest) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use MlsValidationRequest_ExternalJoinRequest.ProtoReflect.Descriptor instead.
func (*MlsValidationRequest_ExternalJoinRequest) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{0, 2}
}

func (x *MlsValidationRequest_ExternalJoinRequest) GetExternalGroupSnapshot() []byte {
	if x != nil {
		return x.ExternalGroupSnapshot
	}
	return nil
}

func (x *MlsValidationRequest_ExternalJoinRequest) GetCommits() [][]byte {
	if x != nil {
		return x.Commits
	}
	return nil
}

func (x *MlsValidationRequest_ExternalJoinRequest) GetProposedExternalJoinInfoMessage() []byte {
	if x != nil {
		return x.ProposedExternalJoinInfoMessage
	}
	return nil
}

func (x *MlsValidationRequest_ExternalJoinRequest) GetProposedExternalJoinCommit() []byte {
	if x != nil {
		return x.ProposedExternalJoinCommit
	}
	return nil
}

var File_mls_tools_proto protoreflect.FileDescriptor

var file_mls_tools_proto_rawDesc = []byte{
	0x0a, 0x0f, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x70, 0x72, 0x6f, 0x74,
	0x6f, 0x12, 0x09, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x22, 0xe0, 0x05, 0x0a,
	0x14, 0x4d, 0x6c, 0x73, 0x56, 0x61, 0x6c, 0x69, 0x64, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x52, 0x65,
	0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x4f, 0x0a, 0x0b, 0x70, 0x61, 0x73, 0x73, 0x74, 0x68, 0x72,
	0x6f, 0x75, 0x67, 0x68, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x2b, 0x2e, 0x6d, 0x6c, 0x73,
	0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x4d, 0x6c, 0x73, 0x56, 0x61, 0x6c, 0x69, 0x64, 0x61,
	0x74, 0x69, 0x6f, 0x6e, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x2e, 0x50, 0x61, 0x73, 0x73,
	0x74, 0x68, 0x72, 0x6f, 0x75, 0x67, 0x68, 0x48, 0x00, 0x52, 0x0b, 0x70, 0x61, 0x73, 0x73, 0x74,
	0x68, 0x72, 0x6f, 0x75, 0x67, 0x68, 0x12, 0x76, 0x0a, 0x1a, 0x69, 0x6e, 0x69, 0x74, 0x69, 0x61,
	0x6c, 0x5f, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x5f, 0x69, 0x6e, 0x66, 0x6f, 0x5f, 0x72, 0x65, 0x71,
	0x75, 0x65, 0x73, 0x74, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x37, 0x2e, 0x6d, 0x6c, 0x73,
	0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x4d, 0x6c, 0x73, 0x56, 0x61, 0x6c, 0x69, 0x64, 0x61,
	0x74, 0x69, 0x6f, 0x6e, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x2e, 0x49, 0x6e, 0x69, 0x74,
	0x69, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x71, 0x75,
	0x65, 0x73, 0x74, 0x48, 0x00, 0x52, 0x17, 0x69, 0x6e, 0x69, 0x74, 0x69, 0x61, 0x6c, 0x47, 0x72,
	0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x69,
	0x0a, 0x15, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x5f, 0x6a, 0x6f, 0x69, 0x6e, 0x5f,
	0x72, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x18, 0x03, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x33, 0x2e,
	0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x4d, 0x6c, 0x73, 0x56, 0x61, 0x6c,
	0x69, 0x64, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x2e, 0x45,
	0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x4a, 0x6f, 0x69, 0x6e, 0x52, 0x65, 0x71, 0x75, 0x65,
	0x73, 0x74, 0x48, 0x00, 0x52, 0x13, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x4a, 0x6f,
	0x69, 0x6e, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x0d, 0x0a, 0x0b, 0x50, 0x61, 0x73,
	0x73, 0x74, 0x68, 0x72, 0x6f, 0x75, 0x67, 0x68, 0x1a, 0x7f, 0x0a, 0x17, 0x49, 0x6e, 0x69, 0x74,
	0x69, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x71, 0x75,
	0x65, 0x73, 0x74, 0x12, 0x2c, 0x0a, 0x12, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x5f, 0x69, 0x6e, 0x66,
	0x6f, 0x5f, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0c, 0x52,
	0x10, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x4d, 0x65, 0x73, 0x73, 0x61, 0x67,
	0x65, 0x12, 0x36, 0x0a, 0x17, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x5f, 0x67, 0x72,
	0x6f, 0x75, 0x70, 0x5f, 0x73, 0x6e, 0x61, 0x70, 0x73, 0x68, 0x6f, 0x74, 0x18, 0x02, 0x20, 0x01,
	0x28, 0x0c, 0x52, 0x15, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75,
	0x70, 0x53, 0x6e, 0x61, 0x70, 0x73, 0x68, 0x6f, 0x74, 0x1a, 0xf8, 0x01, 0x0a, 0x13, 0x45, 0x78,
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
	0x6d, 0x6d, 0x69, 0x74, 0x42, 0x09, 0x0a, 0x07, 0x70, 0x61, 0x79, 0x6c, 0x6f, 0x61, 0x64, 0x22,
	0xf2, 0x02, 0x0a, 0x15, 0x4d, 0x6c, 0x73, 0x56, 0x61, 0x6c, 0x69, 0x64, 0x61, 0x74, 0x69, 0x6f,
	0x6e, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x49, 0x0a, 0x06, 0x72, 0x65, 0x73,
	0x75, 0x6c, 0x74, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0e, 0x32, 0x31, 0x2e, 0x6d, 0x6c, 0x73, 0x5f,
	0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x4d, 0x6c, 0x73, 0x56, 0x61, 0x6c, 0x69, 0x64, 0x61, 0x74,
	0x69, 0x6f, 0x6e, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x2e, 0x56, 0x61, 0x6c, 0x69,
	0x64, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x52, 0x65, 0x73, 0x75, 0x6c, 0x74, 0x52, 0x06, 0x72, 0x65,
	0x73, 0x75, 0x6c, 0x74, 0x22, 0x8d, 0x02, 0x0a, 0x10, 0x56, 0x61, 0x6c, 0x69, 0x64, 0x61, 0x74,
	0x69, 0x6f, 0x6e, 0x52, 0x65, 0x73, 0x75, 0x6c, 0x74, 0x12, 0x0b, 0x0a, 0x07, 0x55, 0x4e, 0x4b,
	0x4e, 0x4f, 0x57, 0x4e, 0x10, 0x00, 0x12, 0x09, 0x0a, 0x05, 0x56, 0x41, 0x4c, 0x49, 0x44, 0x10,
	0x01, 0x12, 0x16, 0x0a, 0x12, 0x49, 0x4e, 0x56, 0x41, 0x4c, 0x49, 0x44, 0x5f, 0x47, 0x52, 0x4f,
	0x55, 0x50, 0x5f, 0x49, 0x4e, 0x46, 0x4f, 0x10, 0x02, 0x12, 0x1a, 0x0a, 0x16, 0x49, 0x4e, 0x56,
	0x41, 0x4c, 0x49, 0x44, 0x5f, 0x45, 0x58, 0x54, 0x45, 0x52, 0x4e, 0x41, 0x4c, 0x5f, 0x47, 0x52,
	0x4f, 0x55, 0x50, 0x10, 0x03, 0x12, 0x20, 0x0a, 0x1c, 0x49, 0x4e, 0x56, 0x41, 0x4c, 0x49, 0x44,
	0x5f, 0x45, 0x58, 0x54, 0x45, 0x52, 0x4e, 0x41, 0x4c, 0x5f, 0x47, 0x52, 0x4f, 0x55, 0x50, 0x5f,
	0x45, 0x50, 0x4f, 0x43, 0x48, 0x10, 0x04, 0x12, 0x27, 0x0a, 0x23, 0x49, 0x4e, 0x56, 0x41, 0x4c,
	0x49, 0x44, 0x5f, 0x45, 0x58, 0x54, 0x45, 0x52, 0x4e, 0x41, 0x4c, 0x5f, 0x47, 0x52, 0x4f, 0x55,
	0x50, 0x5f, 0x4d, 0x49, 0x53, 0x53, 0x49, 0x4e, 0x47, 0x5f, 0x54, 0x52, 0x45, 0x45, 0x10, 0x05,
	0x12, 0x1c, 0x0a, 0x18, 0x49, 0x4e, 0x56, 0x41, 0x4c, 0x49, 0x44, 0x5f, 0x47, 0x52, 0x4f, 0x55,
	0x50, 0x5f, 0x49, 0x4e, 0x46, 0x4f, 0x5f, 0x45, 0x50, 0x4f, 0x43, 0x48, 0x10, 0x06, 0x12, 0x30,
	0x0a, 0x2c, 0x49, 0x4e, 0x56, 0x41, 0x4c, 0x49, 0x44, 0x5f, 0x47, 0x52, 0x4f, 0x55, 0x50, 0x5f,
	0x49, 0x4e, 0x46, 0x4f, 0x5f, 0x4d, 0x49, 0x53, 0x53, 0x49, 0x4e, 0x47, 0x5f, 0x50, 0x55, 0x42,
	0x5f, 0x4b, 0x45, 0x59, 0x5f, 0x45, 0x58, 0x54, 0x45, 0x4e, 0x53, 0x49, 0x4f, 0x4e, 0x10, 0x07,
	0x12, 0x12, 0x0a, 0x0e, 0x49, 0x4e, 0x56, 0x41, 0x4c, 0x49, 0x44, 0x5f, 0x43, 0x4f, 0x4d, 0x4d,
	0x49, 0x54, 0x10, 0x08, 0x22, 0x7f, 0x0a, 0x17, 0x49, 0x6e, 0x69, 0x74, 0x69, 0x61, 0x6c, 0x47,
	0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12,
	0x2c, 0x0a, 0x12, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x5f, 0x69, 0x6e, 0x66, 0x6f, 0x5f, 0x6d, 0x65,
	0x73, 0x73, 0x61, 0x67, 0x65, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x10, 0x67, 0x72, 0x6f,
	0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x4d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x12, 0x36, 0x0a,
	0x17, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x5f, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x5f,
	0x73, 0x6e, 0x61, 0x70, 0x73, 0x68, 0x6f, 0x74, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x15,
	0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x53, 0x6e, 0x61,
	0x70, 0x73, 0x68, 0x6f, 0x74, 0x22, 0x1a, 0x0a, 0x18, 0x49, 0x6e, 0x69, 0x74, 0x69, 0x61, 0x6c,
	0x47, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73,
	0x65, 0x22, 0x0d, 0x0a, 0x0b, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74,
	0x22, 0x3c, 0x0a, 0x0c, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65,
	0x12, 0x1a, 0x0a, 0x08, 0x67, 0x72, 0x61, 0x66, 0x66, 0x69, 0x74, 0x69, 0x18, 0x01, 0x20, 0x01,
	0x28, 0x09, 0x52, 0x08, 0x67, 0x72, 0x61, 0x66, 0x66, 0x69, 0x74, 0x69, 0x12, 0x10, 0x0a, 0x03,
	0x67, 0x69, 0x74, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x03, 0x67, 0x69, 0x74, 0x32, 0x9f,
	0x01, 0x0a, 0x03, 0x4d, 0x73, 0x6c, 0x12, 0x39, 0x0a, 0x04, 0x49, 0x6e, 0x66, 0x6f, 0x12, 0x16,
	0x2e, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x49, 0x6e, 0x66, 0x6f, 0x52,
	0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x17, 0x2e, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f,
	0x6c, 0x73, 0x2e, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22,
	0x00, 0x12, 0x5d, 0x0a, 0x10, 0x49, 0x6e, 0x69, 0x74, 0x69, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75,
	0x70, 0x49, 0x6e, 0x66, 0x6f, 0x12, 0x22, 0x2e, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c,
	0x73, 0x2e, 0x49, 0x6e, 0x69, 0x74, 0x69, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e,
	0x66, 0x6f, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x23, 0x2e, 0x6d, 0x6c, 0x73, 0x5f,
	0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x49, 0x6e, 0x69, 0x74, 0x69, 0x61, 0x6c, 0x47, 0x72, 0x6f,
	0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x00,
	0x42, 0x0d, 0x5a, 0x0b, 0x2e, 0x2f, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x62,
	0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
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
var file_mls_tools_proto_msgTypes = make([]protoimpl.MessageInfo, 9)
var file_mls_tools_proto_goTypes = []any{
	(MlsValidationResponse_ValidationResult)(0),          // 0: mls_tools.MlsValidationResponse.ValidationResult
	(*MlsValidationRequest)(nil),                         // 1: mls_tools.MlsValidationRequest
	(*MlsValidationResponse)(nil),                        // 2: mls_tools.MlsValidationResponse
	(*InitialGroupInfoRequest)(nil),                      // 3: mls_tools.InitialGroupInfoRequest
	(*InitialGroupInfoResponse)(nil),                     // 4: mls_tools.InitialGroupInfoResponse
	(*InfoRequest)(nil),                                  // 5: mls_tools.InfoRequest
	(*InfoResponse)(nil),                                 // 6: mls_tools.InfoResponse
	(*MlsValidationRequest_Passthrough)(nil),             // 7: mls_tools.MlsValidationRequest.Passthrough
	(*MlsValidationRequest_InitialGroupInfoRequest)(nil), // 8: mls_tools.MlsValidationRequest.InitialGroupInfoRequest
	(*MlsValidationRequest_ExternalJoinRequest)(nil),     // 9: mls_tools.MlsValidationRequest.ExternalJoinRequest
}
var file_mls_tools_proto_depIdxs = []int32{
	7, // 0: mls_tools.MlsValidationRequest.passthrough:type_name -> mls_tools.MlsValidationRequest.Passthrough
	8, // 1: mls_tools.MlsValidationRequest.initial_group_info_request:type_name -> mls_tools.MlsValidationRequest.InitialGroupInfoRequest
	9, // 2: mls_tools.MlsValidationRequest.external_join_request:type_name -> mls_tools.MlsValidationRequest.ExternalJoinRequest
	0, // 3: mls_tools.MlsValidationResponse.result:type_name -> mls_tools.MlsValidationResponse.ValidationResult
	5, // 4: mls_tools.Msl.Info:input_type -> mls_tools.InfoRequest
	3, // 5: mls_tools.Msl.InitialGroupInfo:input_type -> mls_tools.InitialGroupInfoRequest
	6, // 6: mls_tools.Msl.Info:output_type -> mls_tools.InfoResponse
	4, // 7: mls_tools.Msl.InitialGroupInfo:output_type -> mls_tools.InitialGroupInfoResponse
	6, // [6:8] is the sub-list for method output_type
	4, // [4:6] is the sub-list for method input_type
	4, // [4:4] is the sub-list for extension type_name
	4, // [4:4] is the sub-list for extension extendee
	0, // [0:4] is the sub-list for field type_name
}

func init() { file_mls_tools_proto_init() }
func file_mls_tools_proto_init() {
	if File_mls_tools_proto != nil {
		return
	}
	file_mls_tools_proto_msgTypes[0].OneofWrappers = []any{
		(*MlsValidationRequest_Passthrough_)(nil),
		(*MlsValidationRequest_InitialGroupInfoRequest_)(nil),
		(*MlsValidationRequest_ExternalJoinRequest_)(nil),
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_mls_tools_proto_rawDesc,
			NumEnums:      1,
			NumMessages:   9,
			NumExtensions: 0,
			NumServices:   1,
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
