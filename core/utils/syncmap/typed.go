package syncmap

import (
	"sync"
)

type Typed[K any, V any] struct {
	sync.Map
}

func (m *Typed[K, V]) CompareAndDelete(key K, old V) (deleted bool) {
	return m.Map.CompareAndDelete(key, old)
}

func (m *Typed[K, V]) CompareAndSwap(key K, old, new V) (swapped bool) {
	return m.Map.CompareAndSwap(key, old, new)
}

func (m *Typed[K, V]) Delete(key K) {
	m.Map.Delete(key)
}

func (m *Typed[K, V]) Load(key K) (V, bool) {
	v, ok := m.Map.Load(key)
	if !ok {
		var zero V
		return zero, false
	}
	return v.(V), ok
}

func (m *Typed[K, V]) LoadOrStore(key K, value V) (V, bool) {
	v, loaded := m.Map.LoadOrStore(key, value)
	return v.(V), loaded
}

func (m *Typed[K, V]) Range(f func(key K, value V) bool) {
	m.Map.Range(func(key, value any) bool {
		return f(key.(K), value.(V))
	})
}

func (m *Typed[K, V]) Store(key K, value V) {
	m.Map.Store(key, value)
}

func (m *Typed[K, V]) Swap(key K, value V) (V, bool) {
	v, loaded := m.Map.Swap(key, value)
	if loaded {
		return v.(V), loaded
	}
	var zero V
	return zero, false
}
