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
)

// Enum value maps for ValidationResult.
var (
	ValidationResult_name = map[int32]string{
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

type InitialGroupInfoRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	GroupInfoMessage      []byte `protobuf:"bytes,1,opt,name=group_info_message,json=groupInfoMessage,proto3" json:"group_info_message,omitempty"`
	ExternalGroupSnapshot []byte `protobuf:"bytes,2,opt,name=external_group_snapshot,json=externalGroupSnapshot,proto3" json:"external_group_snapshot,omitempty"`
}

func (x *InitialGroupInfoRequest) Reset() {
	*x = InitialGroupInfoRequest{}
	mi := &file_mls_tools_proto_msgTypes[0]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *InitialGroupInfoRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*InitialGroupInfoRequest) ProtoMessage() {}

func (x *InitialGroupInfoRequest) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use InitialGroupInfoRequest.ProtoReflect.Descriptor instead.
func (*InitialGroupInfoRequest) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{0}
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

	Result ValidationResult `protobuf:"varint,1,opt,name=result,proto3,enum=mls_tools.ValidationResult" json:"result,omitempty"`
}

func (x *InitialGroupInfoResponse) Reset() {
	*x = InitialGroupInfoResponse{}
	mi := &file_mls_tools_proto_msgTypes[1]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *InitialGroupInfoResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*InitialGroupInfoResponse) ProtoMessage() {}

func (x *InitialGroupInfoResponse) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use InitialGroupInfoResponse.ProtoReflect.Descriptor instead.
func (*InitialGroupInfoResponse) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{1}
}

func (x *InitialGroupInfoResponse) GetResult() ValidationResult {
	if x != nil {
		return x.Result
	}
	return ValidationResult_UNKNOWN
}

type Commit struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Commit                  []byte `protobuf:"bytes,1,opt,name=commit,proto3" json:"commit,omitempty"`
	UpdatedGroupInfoMessage []byte `protobuf:"bytes,2,opt,name=updated_group_info_message,json=updatedGroupInfoMessage,proto3,oneof" json:"updated_group_info_message,omitempty"`
}

func (x *Commit) Reset() {
	*x = Commit{}
	mi := &file_mls_tools_proto_msgTypes[2]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *Commit) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Commit) ProtoMessage() {}

func (x *Commit) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use Commit.ProtoReflect.Descriptor instead.
func (*Commit) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{2}
}

func (x *Commit) GetCommit() []byte {
	if x != nil {
		return x.Commit
	}
	return nil
}

func (x *Commit) GetUpdatedGroupInfoMessage() []byte {
	if x != nil {
		return x.UpdatedGroupInfoMessage
	}
	return nil
}

type ExternalJoinRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	ExternalGroupSnapshot           []byte    `protobuf:"bytes,1,opt,name=external_group_snapshot,json=externalGroupSnapshot,proto3" json:"external_group_snapshot,omitempty"`
	Commits                         []*Commit `protobuf:"bytes,2,rep,name=commits,proto3" json:"commits,omitempty"`
	ProposedExternalJoinInfoMessage []byte    `protobuf:"bytes,3,opt,name=proposed_external_join_info_message,json=proposedExternalJoinInfoMessage,proto3" json:"proposed_external_join_info_message,omitempty"`
	ProposedExternalJoinCommit      []byte    `protobuf:"bytes,4,opt,name=proposed_external_join_commit,json=proposedExternalJoinCommit,proto3" json:"proposed_external_join_commit,omitempty"`
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

func (x *ExternalJoinRequest) GetCommits() []*Commit {
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

type ExternalJoinResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Result ValidationResult `protobuf:"varint,1,opt,name=result,proto3,enum=mls_tools.ValidationResult" json:"result,omitempty"`
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

type InfoRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *InfoRequest) Reset() {
	*x = InfoRequest{}
	mi := &file_mls_tools_proto_msgTypes[5]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *InfoRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*InfoRequest) ProtoMessage() {}

func (x *InfoRequest) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use InfoRequest.ProtoReflect.Descriptor instead.
func (*InfoRequest) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{5}
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
	mi := &file_mls_tools_proto_msgTypes[6]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *InfoResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*InfoResponse) ProtoMessage() {}

func (x *InfoResponse) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use InfoResponse.ProtoReflect.Descriptor instead.
func (*InfoResponse) Descriptor() ([]byte, []int) {
	return file_mls_tools_proto_rawDescGZIP(), []int{6}
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

var File_mls_tools_proto protoreflect.FileDescriptor

var file_mls_tools_proto_rawDesc = []byte{
	0x0a, 0x0f, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x70, 0x72, 0x6f, 0x74,
	0x6f, 0x12, 0x09, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x22, 0x7f, 0x0a, 0x17,
	0x49, 0x6e, 0x69, 0x74, 0x69, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f,
	0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x2c, 0x0a, 0x12, 0x67, 0x72, 0x6f, 0x75, 0x70,
	0x5f, 0x69, 0x6e, 0x66, 0x6f, 0x5f, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x18, 0x01, 0x20,
	0x01, 0x28, 0x0c, 0x52, 0x10, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x4d, 0x65,
	0x73, 0x73, 0x61, 0x67, 0x65, 0x12, 0x36, 0x0a, 0x17, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61,
	0x6c, 0x5f, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x5f, 0x73, 0x6e, 0x61, 0x70, 0x73, 0x68, 0x6f, 0x74,
	0x18, 0x02, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x15, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c,
	0x47, 0x72, 0x6f, 0x75, 0x70, 0x53, 0x6e, 0x61, 0x70, 0x73, 0x68, 0x6f, 0x74, 0x22, 0x4f, 0x0a,
	0x18, 0x49, 0x6e, 0x69, 0x74, 0x69, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66,
	0x6f, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x33, 0x0a, 0x06, 0x72, 0x65, 0x73,
	0x75, 0x6c, 0x74, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0e, 0x32, 0x1b, 0x2e, 0x6d, 0x6c, 0x73, 0x5f,
	0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x56, 0x61, 0x6c, 0x69, 0x64, 0x61, 0x74, 0x69, 0x6f, 0x6e,
	0x52, 0x65, 0x73, 0x75, 0x6c, 0x74, 0x52, 0x06, 0x72, 0x65, 0x73, 0x75, 0x6c, 0x74, 0x22, 0x81,
	0x01, 0x0a, 0x06, 0x43, 0x6f, 0x6d, 0x6d, 0x69, 0x74, 0x12, 0x16, 0x0a, 0x06, 0x63, 0x6f, 0x6d,
	0x6d, 0x69, 0x74, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x06, 0x63, 0x6f, 0x6d, 0x6d, 0x69,
	0x74, 0x12, 0x40, 0x0a, 0x1a, 0x75, 0x70, 0x64, 0x61, 0x74, 0x65, 0x64, 0x5f, 0x67, 0x72, 0x6f,
	0x75, 0x70, 0x5f, 0x69, 0x6e, 0x66, 0x6f, 0x5f, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x18,
	0x02, 0x20, 0x01, 0x28, 0x0c, 0x48, 0x00, 0x52, 0x17, 0x75, 0x70, 0x64, 0x61, 0x74, 0x65, 0x64,
	0x47, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x4d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65,
	0x88, 0x01, 0x01, 0x42, 0x1d, 0x0a, 0x1b, 0x5f, 0x75, 0x70, 0x64, 0x61, 0x74, 0x65, 0x64, 0x5f,
	0x67, 0x72, 0x6f, 0x75, 0x70, 0x5f, 0x69, 0x6e, 0x66, 0x6f, 0x5f, 0x6d, 0x65, 0x73, 0x73, 0x61,
	0x67, 0x65, 0x22, 0x8b, 0x02, 0x0a, 0x13, 0x45, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x4a,
	0x6f, 0x69, 0x6e, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x36, 0x0a, 0x17, 0x65, 0x78,
	0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x5f, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x5f, 0x73, 0x6e, 0x61,
	0x70, 0x73, 0x68, 0x6f, 0x74, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x15, 0x65, 0x78, 0x74,
	0x65, 0x72, 0x6e, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x53, 0x6e, 0x61, 0x70, 0x73, 0x68,
	0x6f, 0x74, 0x12, 0x2b, 0x0a, 0x07, 0x63, 0x6f, 0x6d, 0x6d, 0x69, 0x74, 0x73, 0x18, 0x02, 0x20,
	0x03, 0x28, 0x0b, 0x32, 0x11, 0x2e, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e,
	0x43, 0x6f, 0x6d, 0x6d, 0x69, 0x74, 0x52, 0x07, 0x63, 0x6f, 0x6d, 0x6d, 0x69, 0x74, 0x73, 0x12,
	0x4c, 0x0a, 0x23, 0x70, 0x72, 0x6f, 0x70, 0x6f, 0x73, 0x65, 0x64, 0x5f, 0x65, 0x78, 0x74, 0x65,
	0x72, 0x6e, 0x61, 0x6c, 0x5f, 0x6a, 0x6f, 0x69, 0x6e, 0x5f, 0x69, 0x6e, 0x66, 0x6f, 0x5f, 0x6d,
	0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x18, 0x03, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x1f, 0x70, 0x72,
	0x6f, 0x70, 0x6f, 0x73, 0x65, 0x64, 0x45, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x4a, 0x6f,
	0x69, 0x6e, 0x49, 0x6e, 0x66, 0x6f, 0x4d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x12, 0x41, 0x0a,
	0x1d, 0x70, 0x72, 0x6f, 0x70, 0x6f, 0x73, 0x65, 0x64, 0x5f, 0x65, 0x78, 0x74, 0x65, 0x72, 0x6e,
	0x61, 0x6c, 0x5f, 0x6a, 0x6f, 0x69, 0x6e, 0x5f, 0x63, 0x6f, 0x6d, 0x6d, 0x69, 0x74, 0x18, 0x04,
	0x20, 0x01, 0x28, 0x0c, 0x52, 0x1a, 0x70, 0x72, 0x6f, 0x70, 0x6f, 0x73, 0x65, 0x64, 0x45, 0x78,
	0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x4a, 0x6f, 0x69, 0x6e, 0x43, 0x6f, 0x6d, 0x6d, 0x69, 0x74,
	0x22, 0x4b, 0x0a, 0x14, 0x45, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x4a, 0x6f, 0x69, 0x6e,
	0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x33, 0x0a, 0x06, 0x72, 0x65, 0x73, 0x75,
	0x6c, 0x74, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0e, 0x32, 0x1b, 0x2e, 0x6d, 0x6c, 0x73, 0x5f, 0x74,
	0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x56, 0x61, 0x6c, 0x69, 0x64, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x52,
	0x65, 0x73, 0x75, 0x6c, 0x74, 0x52, 0x06, 0x72, 0x65, 0x73, 0x75, 0x6c, 0x74, 0x22, 0x0d, 0x0a,
	0x0b, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x22, 0x3c, 0x0a, 0x0c,
	0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x1a, 0x0a, 0x08,
	0x67, 0x72, 0x61, 0x66, 0x66, 0x69, 0x74, 0x69, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08,
	0x67, 0x72, 0x61, 0x66, 0x66, 0x69, 0x74, 0x69, 0x12, 0x10, 0x0a, 0x03, 0x67, 0x69, 0x74, 0x18,
	0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x03, 0x67, 0x69, 0x74, 0x2a, 0x8d, 0x02, 0x0a, 0x10, 0x56,
	0x61, 0x6c, 0x69, 0x64, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x52, 0x65, 0x73, 0x75, 0x6c, 0x74, 0x12,
	0x0b, 0x0a, 0x07, 0x55, 0x4e, 0x4b, 0x4e, 0x4f, 0x57, 0x4e, 0x10, 0x00, 0x12, 0x09, 0x0a, 0x05,
	0x56, 0x41, 0x4c, 0x49, 0x44, 0x10, 0x01, 0x12, 0x16, 0x0a, 0x12, 0x49, 0x4e, 0x56, 0x41, 0x4c,
	0x49, 0x44, 0x5f, 0x47, 0x52, 0x4f, 0x55, 0x50, 0x5f, 0x49, 0x4e, 0x46, 0x4f, 0x10, 0x02, 0x12,
	0x1a, 0x0a, 0x16, 0x49, 0x4e, 0x56, 0x41, 0x4c, 0x49, 0x44, 0x5f, 0x45, 0x58, 0x54, 0x45, 0x52,
	0x4e, 0x41, 0x4c, 0x5f, 0x47, 0x52, 0x4f, 0x55, 0x50, 0x10, 0x03, 0x12, 0x20, 0x0a, 0x1c, 0x49,
	0x4e, 0x56, 0x41, 0x4c, 0x49, 0x44, 0x5f, 0x45, 0x58, 0x54, 0x45, 0x52, 0x4e, 0x41, 0x4c, 0x5f,
	0x47, 0x52, 0x4f, 0x55, 0x50, 0x5f, 0x45, 0x50, 0x4f, 0x43, 0x48, 0x10, 0x04, 0x12, 0x27, 0x0a,
	0x23, 0x49, 0x4e, 0x56, 0x41, 0x4c, 0x49, 0x44, 0x5f, 0x45, 0x58, 0x54, 0x45, 0x52, 0x4e, 0x41,
	0x4c, 0x5f, 0x47, 0x52, 0x4f, 0x55, 0x50, 0x5f, 0x4d, 0x49, 0x53, 0x53, 0x49, 0x4e, 0x47, 0x5f,
	0x54, 0x52, 0x45, 0x45, 0x10, 0x05, 0x12, 0x1c, 0x0a, 0x18, 0x49, 0x4e, 0x56, 0x41, 0x4c, 0x49,
	0x44, 0x5f, 0x47, 0x52, 0x4f, 0x55, 0x50, 0x5f, 0x49, 0x4e, 0x46, 0x4f, 0x5f, 0x45, 0x50, 0x4f,
	0x43, 0x48, 0x10, 0x06, 0x12, 0x30, 0x0a, 0x2c, 0x49, 0x4e, 0x56, 0x41, 0x4c, 0x49, 0x44, 0x5f,
	0x47, 0x52, 0x4f, 0x55, 0x50, 0x5f, 0x49, 0x4e, 0x46, 0x4f, 0x5f, 0x4d, 0x49, 0x53, 0x53, 0x49,
	0x4e, 0x47, 0x5f, 0x50, 0x55, 0x42, 0x5f, 0x4b, 0x45, 0x59, 0x5f, 0x45, 0x58, 0x54, 0x45, 0x4e,
	0x53, 0x49, 0x4f, 0x4e, 0x10, 0x07, 0x12, 0x12, 0x0a, 0x0e, 0x49, 0x4e, 0x56, 0x41, 0x4c, 0x49,
	0x44, 0x5f, 0x43, 0x4f, 0x4d, 0x4d, 0x49, 0x54, 0x10, 0x08, 0x32, 0xf2, 0x01, 0x0a, 0x03, 0x4d,
	0x6c, 0x73, 0x12, 0x39, 0x0a, 0x04, 0x49, 0x6e, 0x66, 0x6f, 0x12, 0x16, 0x2e, 0x6d, 0x6c, 0x73,
	0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x71, 0x75, 0x65,
	0x73, 0x74, 0x1a, 0x17, 0x2e, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x49,
	0x6e, 0x66, 0x6f, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x00, 0x12, 0x5d, 0x0a,
	0x10, 0x49, 0x6e, 0x69, 0x74, 0x69, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66,
	0x6f, 0x12, 0x22, 0x2e, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x49, 0x6e,
	0x69, 0x74, 0x69, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65,
	0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x23, 0x2e, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c,
	0x73, 0x2e, 0x49, 0x6e, 0x69, 0x74, 0x69, 0x61, 0x6c, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x49, 0x6e,
	0x66, 0x6f, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x00, 0x12, 0x51, 0x0a, 0x0c,
	0x45, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x4a, 0x6f, 0x69, 0x6e, 0x12, 0x1e, 0x2e, 0x6d,
	0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x45, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61,
	0x6c, 0x4a, 0x6f, 0x69, 0x6e, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x1f, 0x2e, 0x6d,
	0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2e, 0x45, 0x78, 0x74, 0x65, 0x72, 0x6e, 0x61,
	0x6c, 0x4a, 0x6f, 0x69, 0x6e, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x00, 0x42,
	0x0d, 0x5a, 0x0b, 0x2e, 0x2f, 0x6d, 0x6c, 0x73, 0x5f, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x62, 0x06,
	0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
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
var file_mls_tools_proto_msgTypes = make([]protoimpl.MessageInfo, 7)
var file_mls_tools_proto_goTypes = []any{
	(ValidationResult)(0),            // 0: mls_tools.ValidationResult
	(*InitialGroupInfoRequest)(nil),  // 1: mls_tools.InitialGroupInfoRequest
	(*InitialGroupInfoResponse)(nil), // 2: mls_tools.InitialGroupInfoResponse
	(*Commit)(nil),                   // 3: mls_tools.Commit
	(*ExternalJoinRequest)(nil),      // 4: mls_tools.ExternalJoinRequest
	(*ExternalJoinResponse)(nil),     // 5: mls_tools.ExternalJoinResponse
	(*InfoRequest)(nil),              // 6: mls_tools.InfoRequest
	(*InfoResponse)(nil),             // 7: mls_tools.InfoResponse
}
var file_mls_tools_proto_depIdxs = []int32{
	0, // 0: mls_tools.InitialGroupInfoResponse.result:type_name -> mls_tools.ValidationResult
	3, // 1: mls_tools.ExternalJoinRequest.commits:type_name -> mls_tools.Commit
	0, // 2: mls_tools.ExternalJoinResponse.result:type_name -> mls_tools.ValidationResult
	6, // 3: mls_tools.Mls.Info:input_type -> mls_tools.InfoRequest
	1, // 4: mls_tools.Mls.InitialGroupInfo:input_type -> mls_tools.InitialGroupInfoRequest
	4, // 5: mls_tools.Mls.ExternalJoin:input_type -> mls_tools.ExternalJoinRequest
	7, // 6: mls_tools.Mls.Info:output_type -> mls_tools.InfoResponse
	2, // 7: mls_tools.Mls.InitialGroupInfo:output_type -> mls_tools.InitialGroupInfoResponse
	5, // 8: mls_tools.Mls.ExternalJoin:output_type -> mls_tools.ExternalJoinResponse
	6, // [6:9] is the sub-list for method output_type
	3, // [3:6] is the sub-list for method input_type
	3, // [3:3] is the sub-list for extension type_name
	3, // [3:3] is the sub-list for extension extendee
	0, // [0:3] is the sub-list for field type_name
}

func init() { file_mls_tools_proto_init() }
func file_mls_tools_proto_init() {
	if File_mls_tools_proto != nil {
		return
	}
	file_mls_tools_proto_msgTypes[2].OneofWrappers = []any{}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_mls_tools_proto_rawDesc,
			NumEnums:      1,
			NumMessages:   7,
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
