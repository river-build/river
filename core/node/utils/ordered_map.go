package utils

type OrderedMap[K comparable, V comparable] struct {
	Map    map[K]V
	Values []V
}

func NewOrderedMap[K comparable, V comparable](reserve int) *OrderedMap[K, V] {
	return &OrderedMap[K, V]{
		Map:    make(map[K]V, reserve),
		Values: make([]V, 0, reserve),
	}
}

func OrderedMapFromMap[K comparable, V comparable](m map[K]V) *OrderedMap[K, V] {
	a := make([]V, 0, len(m))
	for _, v := range m {
		a = append(a, v)
	}
	return &OrderedMap[K, V]{
		Map:    m,
		Values: a,
	}
}

func OrderMapFromArray[K comparable, V comparable](a []V, key func(V) K) *OrderedMap[K, V] {
	m := make(map[K]V, len(a))
	for _, v := range a {
		m[key(v)] = v
	}
	return &OrderedMap[K, V]{
		Map:    m,
		Values: a,
	}
}

func (m *OrderedMap[K, V]) Get(key K) (V, bool) {
	v, ok := m.Map[key]
	return v, ok
}

func (m *OrderedMap[K, V]) Has(key K) bool {
	_, ok := m.Map[key]
	return ok
}

func (m *OrderedMap[K, V]) Len() int {
	return len(m.Values)
}

// Returns true if key is inserted, false if duplicate is detected.
func (m *OrderedMap[K, V]) Set(key K, value V) bool {
	_, ok := m.Map[key]
	if ok {
		// TODO: harden caller not to get into this codepath
		// panic("key already exists")
		return false
	}
	m.Map[key] = value
	m.Values = append(m.Values, value)
	return true
}

// Copy returns a deep copy of the map.
func (m *OrderedMap[K, V]) Copy(extraCapacity int) *OrderedMap[K, V] {
	newMap := make(map[K]V, len(m.Map)+extraCapacity)
	for k, v := range m.Map {
		newMap[k] = v
	}
	return &OrderedMap[K, V]{
		Map:    newMap,
		Values: append(make([]V, 0, len(m.Values)+extraCapacity), m.Values...),
	}
}

func (m *OrderedMap[K, V]) Delete(key K) {
	val, ok := m.Map[key]
	if !ok {
		panic("key does not exist")
	}
	delete(m.Map, key)
	for i, v := range m.Values {
		if v == val {
			m.Values = append(m.Values[:i], m.Values[i+1:]...)
			break
		}
	}
}
