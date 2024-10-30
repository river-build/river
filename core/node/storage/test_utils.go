package storage

import (
	"io/fs"
)

type ReadDirFileFS interface {
	fs.FS
	fs.ReadDirFS
	fs.ReadFileFS
}

// LayeredFS represents a filesystem that combines two embed.FS instances,
// with the primary taking precedence over the fallback
type LayeredFS struct {
	primary  ReadDirFileFS
	fallback ReadDirFileFS
}

var _ ReadDirFileFS = (*LayeredFS)(nil)

// New creates a new LayeredFS with the given primary and fallback filesystems
func NewLayeredFS(primary, fallback ReadDirFileFS) *LayeredFS {
	return &LayeredFS{
		primary:  primary,
		fallback: fallback,
	}
}

// Open implements fs.FS interface
func (l *LayeredFS) Open(name string) (fs.File, error) {
	// Try to open from primary first
	if file, err := l.primary.Open(name); err == nil {
		return file, nil
	}

	// If not found in primary, try fallback
	return l.fallback.Open(name)
}

// ReadFile reads the named file from the layered filesystem
func (l *LayeredFS) ReadFile(name string) ([]byte, error) {
	// Try to read from primary first
	if data, err := l.primary.ReadFile(name); err == nil {
		return data, nil
	}

	// If not found in primary, try fallback
	return l.fallback.ReadFile(name)
}

// ReadDir reads the named directory from the layered filesystem
func (l *LayeredFS) ReadDir(name string) ([]fs.DirEntry, error) {
	// Get entries from both filesystems
	primaryEntries, primaryErr := l.primary.ReadDir(name)
	fallbackEntries, fallbackErr := l.fallback.ReadDir(name)

	// If both failed, return the primary error
	if primaryErr != nil && fallbackErr != nil {
		return nil, primaryErr
	}

	// Create a map to deduplicate entries
	entriesMap := make(map[string]fs.DirEntry)

	// Add fallback entries first
	if fallbackErr == nil {
		for _, entry := range fallbackEntries {
			entriesMap[entry.Name()] = entry
		}
	}

	// Override with primary entries
	if primaryErr == nil {
		for _, entry := range primaryEntries {
			entriesMap[entry.Name()] = entry
		}
	}

	// Convert map back to slice
	result := make([]fs.DirEntry, 0, len(entriesMap))
	for _, entry := range entriesMap {
		result = append(result, entry)
	}

	return result, nil
}
