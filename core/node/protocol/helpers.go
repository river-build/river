package protocol

import "github.com/ethereum/go-ethereum/common"

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
