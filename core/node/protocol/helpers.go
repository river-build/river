package protocol

import (
	"bytes"

	"github.com/ethereum/go-ethereum/common"
)

func (e *StreamEvent) GetStreamSettings() *StreamSettings {
	if e == nil {
		return nil
	}
	i := e.GetInceptionPayload()
	if i == nil {
		return nil
	}
	return i.GetSettings()
}

// NodeAddresses returns the addresses of the nodes in the CreationCookie.
func (cc *CreationCookie) NodeAddresses() []common.Address {
	if cc == nil {
		return nil
	}

	addresses := make([]common.Address, len(cc.Nodes))
	for i, node := range cc.Nodes {
		addresses[i] = common.BytesToAddress(node)
	}

	return addresses
}

// RemoteNodeAddresses returns the addresses of the nodes in the CreationCookie, excluding the local node.
func (cc *CreationCookie) RemoteNodeAddresses(local common.Address) []common.Address {
	if cc == nil {
		return nil
	}

	addresses := make([]common.Address, 0, len(cc.Nodes))
	for _, node := range cc.Nodes {
		if bytes.Equal(node, local.Bytes()) {
			continue
		}

		addresses = append(addresses, common.BytesToAddress(node))
	}

	return addresses
}

// IsLocal returns true if the given address is in the CreationCookie.Nodes list.
func (cc *CreationCookie) IsLocal(addr common.Address) bool {
	if cc == nil {
		return false
	}

	for _, a := range cc.NodeAddresses() {
		if a.Cmp(addr) == 0 {
			return true
		}
	}

	return false
}
