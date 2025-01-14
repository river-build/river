// Code generated by mockery. DO NOT EDIT.

package mocks

import (
	context "context"

	connect "connectrpc.com/connect"

	mock "github.com/stretchr/testify/mock"

	protocol "github.com/river-build/river/core/node/protocol"
)

// MockStreamServiceClient is an autogenerated mock type for the StreamServiceClient type
type MockStreamServiceClient struct {
	mock.Mock
}

// AddEvent provides a mock function with given fields: _a0, _a1
func (_m *MockStreamServiceClient) AddEvent(_a0 context.Context, _a1 *connect.Request[protocol.AddEventRequest]) (*connect.Response[protocol.AddEventResponse], error) {
	ret := _m.Called(_a0, _a1)

	if len(ret) == 0 {
		panic("no return value specified for AddEvent")
	}

	var r0 *connect.Response[protocol.AddEventResponse]
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.AddEventRequest]) (*connect.Response[protocol.AddEventResponse], error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.AddEventRequest]) *connect.Response[protocol.AddEventResponse]); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*connect.Response[protocol.AddEventResponse])
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *connect.Request[protocol.AddEventRequest]) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// AddMediaEvent provides a mock function with given fields: _a0, _a1
func (_m *MockStreamServiceClient) AddMediaEvent(_a0 context.Context, _a1 *connect.Request[protocol.AddMediaEventRequest]) (*connect.Response[protocol.AddMediaEventResponse], error) {
	ret := _m.Called(_a0, _a1)

	if len(ret) == 0 {
		panic("no return value specified for AddMediaEvent")
	}

	var r0 *connect.Response[protocol.AddMediaEventResponse]
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.AddMediaEventRequest]) (*connect.Response[protocol.AddMediaEventResponse], error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.AddMediaEventRequest]) *connect.Response[protocol.AddMediaEventResponse]); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*connect.Response[protocol.AddMediaEventResponse])
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *connect.Request[protocol.AddMediaEventRequest]) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// AddStreamToSync provides a mock function with given fields: _a0, _a1
func (_m *MockStreamServiceClient) AddStreamToSync(_a0 context.Context, _a1 *connect.Request[protocol.AddStreamToSyncRequest]) (*connect.Response[protocol.AddStreamToSyncResponse], error) {
	ret := _m.Called(_a0, _a1)

	if len(ret) == 0 {
		panic("no return value specified for AddStreamToSync")
	}

	var r0 *connect.Response[protocol.AddStreamToSyncResponse]
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.AddStreamToSyncRequest]) (*connect.Response[protocol.AddStreamToSyncResponse], error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.AddStreamToSyncRequest]) *connect.Response[protocol.AddStreamToSyncResponse]); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*connect.Response[protocol.AddStreamToSyncResponse])
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *connect.Request[protocol.AddStreamToSyncRequest]) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// CancelSync provides a mock function with given fields: _a0, _a1
func (_m *MockStreamServiceClient) CancelSync(_a0 context.Context, _a1 *connect.Request[protocol.CancelSyncRequest]) (*connect.Response[protocol.CancelSyncResponse], error) {
	ret := _m.Called(_a0, _a1)

	if len(ret) == 0 {
		panic("no return value specified for CancelSync")
	}

	var r0 *connect.Response[protocol.CancelSyncResponse]
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.CancelSyncRequest]) (*connect.Response[protocol.CancelSyncResponse], error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.CancelSyncRequest]) *connect.Response[protocol.CancelSyncResponse]); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*connect.Response[protocol.CancelSyncResponse])
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *connect.Request[protocol.CancelSyncRequest]) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// CreateMediaStream provides a mock function with given fields: _a0, _a1
func (_m *MockStreamServiceClient) CreateMediaStream(_a0 context.Context, _a1 *connect.Request[protocol.CreateMediaStreamRequest]) (*connect.Response[protocol.CreateMediaStreamResponse], error) {
	ret := _m.Called(_a0, _a1)

	if len(ret) == 0 {
		panic("no return value specified for CreateMediaStream")
	}

	var r0 *connect.Response[protocol.CreateMediaStreamResponse]
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.CreateMediaStreamRequest]) (*connect.Response[protocol.CreateMediaStreamResponse], error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.CreateMediaStreamRequest]) *connect.Response[protocol.CreateMediaStreamResponse]); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*connect.Response[protocol.CreateMediaStreamResponse])
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *connect.Request[protocol.CreateMediaStreamRequest]) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// CreateStream provides a mock function with given fields: _a0, _a1
func (_m *MockStreamServiceClient) CreateStream(_a0 context.Context, _a1 *connect.Request[protocol.CreateStreamRequest]) (*connect.Response[protocol.CreateStreamResponse], error) {
	ret := _m.Called(_a0, _a1)

	if len(ret) == 0 {
		panic("no return value specified for CreateStream")
	}

	var r0 *connect.Response[protocol.CreateStreamResponse]
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.CreateStreamRequest]) (*connect.Response[protocol.CreateStreamResponse], error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.CreateStreamRequest]) *connect.Response[protocol.CreateStreamResponse]); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*connect.Response[protocol.CreateStreamResponse])
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *connect.Request[protocol.CreateStreamRequest]) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// GetLastMiniblockHash provides a mock function with given fields: _a0, _a1
func (_m *MockStreamServiceClient) GetLastMiniblockHash(_a0 context.Context, _a1 *connect.Request[protocol.GetLastMiniblockHashRequest]) (*connect.Response[protocol.GetLastMiniblockHashResponse], error) {
	ret := _m.Called(_a0, _a1)

	if len(ret) == 0 {
		panic("no return value specified for GetLastMiniblockHash")
	}

	var r0 *connect.Response[protocol.GetLastMiniblockHashResponse]
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.GetLastMiniblockHashRequest]) (*connect.Response[protocol.GetLastMiniblockHashResponse], error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.GetLastMiniblockHashRequest]) *connect.Response[protocol.GetLastMiniblockHashResponse]); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*connect.Response[protocol.GetLastMiniblockHashResponse])
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *connect.Request[protocol.GetLastMiniblockHashRequest]) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// GetMiniblocks provides a mock function with given fields: _a0, _a1
func (_m *MockStreamServiceClient) GetMiniblocks(_a0 context.Context, _a1 *connect.Request[protocol.GetMiniblocksRequest]) (*connect.Response[protocol.GetMiniblocksResponse], error) {
	ret := _m.Called(_a0, _a1)

	if len(ret) == 0 {
		panic("no return value specified for GetMiniblocks")
	}

	var r0 *connect.Response[protocol.GetMiniblocksResponse]
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.GetMiniblocksRequest]) (*connect.Response[protocol.GetMiniblocksResponse], error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.GetMiniblocksRequest]) *connect.Response[protocol.GetMiniblocksResponse]); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*connect.Response[protocol.GetMiniblocksResponse])
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *connect.Request[protocol.GetMiniblocksRequest]) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// GetStream provides a mock function with given fields: _a0, _a1
func (_m *MockStreamServiceClient) GetStream(_a0 context.Context, _a1 *connect.Request[protocol.GetStreamRequest]) (*connect.Response[protocol.GetStreamResponse], error) {
	ret := _m.Called(_a0, _a1)

	if len(ret) == 0 {
		panic("no return value specified for GetStream")
	}

	var r0 *connect.Response[protocol.GetStreamResponse]
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.GetStreamRequest]) (*connect.Response[protocol.GetStreamResponse], error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.GetStreamRequest]) *connect.Response[protocol.GetStreamResponse]); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*connect.Response[protocol.GetStreamResponse])
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *connect.Request[protocol.GetStreamRequest]) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// GetStreamEx provides a mock function with given fields: _a0, _a1
func (_m *MockStreamServiceClient) GetStreamEx(_a0 context.Context, _a1 *connect.Request[protocol.GetStreamExRequest]) (*connect.ServerStreamForClient[protocol.GetStreamExResponse], error) {
	ret := _m.Called(_a0, _a1)

	if len(ret) == 0 {
		panic("no return value specified for GetStreamEx")
	}

	var r0 *connect.ServerStreamForClient[protocol.GetStreamExResponse]
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.GetStreamExRequest]) (*connect.ServerStreamForClient[protocol.GetStreamExResponse], error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.GetStreamExRequest]) *connect.ServerStreamForClient[protocol.GetStreamExResponse]); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*connect.ServerStreamForClient[protocol.GetStreamExResponse])
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *connect.Request[protocol.GetStreamExRequest]) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// Info provides a mock function with given fields: _a0, _a1
func (_m *MockStreamServiceClient) Info(_a0 context.Context, _a1 *connect.Request[protocol.InfoRequest]) (*connect.Response[protocol.InfoResponse], error) {
	ret := _m.Called(_a0, _a1)

	if len(ret) == 0 {
		panic("no return value specified for Info")
	}

	var r0 *connect.Response[protocol.InfoResponse]
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.InfoRequest]) (*connect.Response[protocol.InfoResponse], error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.InfoRequest]) *connect.Response[protocol.InfoResponse]); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*connect.Response[protocol.InfoResponse])
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *connect.Request[protocol.InfoRequest]) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// ModifySync provides a mock function with given fields: _a0, _a1
func (_m *MockStreamServiceClient) ModifySync(_a0 context.Context, _a1 *connect.Request[protocol.ModifySyncRequest]) (*connect.Response[protocol.ModifySyncResponse], error) {
	ret := _m.Called(_a0, _a1)

	if len(ret) == 0 {
		panic("no return value specified for ModifySync")
	}

	var r0 *connect.Response[protocol.ModifySyncResponse]
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.ModifySyncRequest]) (*connect.Response[protocol.ModifySyncResponse], error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.ModifySyncRequest]) *connect.Response[protocol.ModifySyncResponse]); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*connect.Response[protocol.ModifySyncResponse])
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *connect.Request[protocol.ModifySyncRequest]) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// PingSync provides a mock function with given fields: _a0, _a1
func (_m *MockStreamServiceClient) PingSync(_a0 context.Context, _a1 *connect.Request[protocol.PingSyncRequest]) (*connect.Response[protocol.PingSyncResponse], error) {
	ret := _m.Called(_a0, _a1)

	if len(ret) == 0 {
		panic("no return value specified for PingSync")
	}

	var r0 *connect.Response[protocol.PingSyncResponse]
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.PingSyncRequest]) (*connect.Response[protocol.PingSyncResponse], error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.PingSyncRequest]) *connect.Response[protocol.PingSyncResponse]); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*connect.Response[protocol.PingSyncResponse])
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *connect.Request[protocol.PingSyncRequest]) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// RemoveStreamFromSync provides a mock function with given fields: _a0, _a1
func (_m *MockStreamServiceClient) RemoveStreamFromSync(_a0 context.Context, _a1 *connect.Request[protocol.RemoveStreamFromSyncRequest]) (*connect.Response[protocol.RemoveStreamFromSyncResponse], error) {
	ret := _m.Called(_a0, _a1)

	if len(ret) == 0 {
		panic("no return value specified for RemoveStreamFromSync")
	}

	var r0 *connect.Response[protocol.RemoveStreamFromSyncResponse]
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.RemoveStreamFromSyncRequest]) (*connect.Response[protocol.RemoveStreamFromSyncResponse], error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.RemoveStreamFromSyncRequest]) *connect.Response[protocol.RemoveStreamFromSyncResponse]); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*connect.Response[protocol.RemoveStreamFromSyncResponse])
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *connect.Request[protocol.RemoveStreamFromSyncRequest]) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// SyncStreams provides a mock function with given fields: _a0, _a1
func (_m *MockStreamServiceClient) SyncStreams(_a0 context.Context, _a1 *connect.Request[protocol.SyncStreamsRequest]) (*connect.ServerStreamForClient[protocol.SyncStreamsResponse], error) {
	ret := _m.Called(_a0, _a1)

	if len(ret) == 0 {
		panic("no return value specified for SyncStreams")
	}

	var r0 *connect.ServerStreamForClient[protocol.SyncStreamsResponse]
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.SyncStreamsRequest]) (*connect.ServerStreamForClient[protocol.SyncStreamsResponse], error)); ok {
		return rf(_a0, _a1)
	}
	if rf, ok := ret.Get(0).(func(context.Context, *connect.Request[protocol.SyncStreamsRequest]) *connect.ServerStreamForClient[protocol.SyncStreamsResponse]); ok {
		r0 = rf(_a0, _a1)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*connect.ServerStreamForClient[protocol.SyncStreamsResponse])
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, *connect.Request[protocol.SyncStreamsRequest]) error); ok {
		r1 = rf(_a0, _a1)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// NewMockStreamServiceClient creates a new instance of MockStreamServiceClient. It also registers a testing interface on the mock and a cleanup function to assert the mocks expectations.
// The first argument is typically a *testing.T value.
func NewMockStreamServiceClient(t interface {
	mock.TestingT
	Cleanup(func())
}) *MockStreamServiceClient {
	mock := &MockStreamServiceClient{}
	mock.Mock.Test(t)

	t.Cleanup(func() { mock.AssertExpectations(t) })

	return mock
}
