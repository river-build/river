package utils

import (
	"strings"

	"github.com/ethereum/go-ethereum/common"
)

// FacetDiff represents the differences between origin and target facets
type FacetDiff struct {
	Facet
	OriginBytecodeHash    string         `json:",omitempty"`
	TargetBytecodeHash    string         `json:",omitempty"`
	TargetContractAddress common.Address `json:",omitempty"`
}

type MergedFacet struct {
	Facet
	BytecodeHashes []string
}

// CompareFacets compares origin and target Facet arrays and returns the differences
func CompareFacets(origin, target map[string][]Facet) map[string][]FacetDiff {
	differences := make(map[string][]FacetDiff)

	for diamondName, originFacets := range origin {
		targetFacets, exists := target[diamondName]
		if !exists {
			// If the diamond doesn't exist in target, add all origin facets
			differences[diamondName] = convertToFacetDiff(originFacets)
			continue
		}

		// Merge target facets with the same ContractName
		mergedTargetFacets := mergeFacets(targetFacets)

		var diamondDifferences []FacetDiff
		// compare each origin facet set for each diamond with target facets
		for _, o := range originFacets {
			found := false
			for _, t := range mergedTargetFacets {
				// find match by facetName
				if t.ContractName == o.ContractName {
					found = true
					diffSelectors := getDifferentSelectors(o.SelectorsHex, t.SelectorsHex)
					bytecodeChanged := false
					for _, targetHash := range t.BytecodeHashes {
						if o.BytecodeHash != targetHash {
							bytecodeChanged = true
							break
						}
					}
					if len(diffSelectors) > 0 || bytecodeChanged {
						diamondDifferences = append(diamondDifferences, FacetDiff{
							Facet: Facet{
								FacetAddress: o.FacetAddress,
								SelectorsHex: diffSelectors,
								ContractName: o.ContractName,
							},
							OriginBytecodeHash:    o.BytecodeHash,
							TargetBytecodeHash:    strings.Join(t.BytecodeHashes, ","),
							TargetContractAddress: t.FacetAddress,
						})
					}
					break
				}
			}
			if !found {
				// Contract doesn't exist in target, add all selectors
				diamondDifferences = append(diamondDifferences, FacetDiff{
					Facet: Facet{
						FacetAddress: o.FacetAddress,
						SelectorsHex: o.SelectorsHex,
						ContractName: o.ContractName,
					},
					OriginBytecodeHash:    o.BytecodeHash,
					TargetBytecodeHash:    "",
					TargetContractAddress: common.Address{},
				})
			}
		}

		if len(diamondDifferences) > 0 {
			differences[diamondName] = diamondDifferences
		}
	}

	return differences
}

// convertToFacetDiff converts a slice of Facet to a slice of FacetDiff
func convertToFacetDiff(facets []Facet) []FacetDiff {
	diffs := make([]FacetDiff, len(facets))
	for i, f := range facets {
		diffs[i] = FacetDiff{
			Facet: Facet{
				FacetAddress: f.FacetAddress,
				SelectorsHex: f.SelectorsHex,
				ContractName: f.ContractName,
			},
			OriginBytecodeHash:    f.BytecodeHash,
			TargetBytecodeHash:    "",
			TargetContractAddress: common.Address{},
		}
	}
	return diffs
}

// getDifferentSelectors returns selectors from origin that are not in target
func getDifferentSelectors(origin, target []string) []string {
	targetSet := make(map[string]struct{})
	for _, t := range target {
		targetSet[t] = struct{}{}
	}

	var different []string
	for _, o := range origin {
		if _, exists := targetSet[o]; !exists {
			different = append(different, o)
		}
	}

	return different
}

// mergeFacets combines facets with the same ContractName
func mergeFacets(facets []Facet) []MergedFacet {
	mergedFacets := make(map[string]MergedFacet)

	for _, facet := range facets {
		if existing, ok := mergedFacets[facet.ContractName]; ok {
			// Merge SelectorsHex
			existing.SelectorsHex = append(existing.SelectorsHex, facet.SelectorsHex...)
			// Append BytecodeHash
			existing.BytecodeHashes = append(existing.BytecodeHashes, facet.BytecodeHash)
			mergedFacets[facet.ContractName] = existing
		} else {
			mergedFacets[facet.ContractName] = MergedFacet{
				Facet:          facet,
				BytecodeHashes: []string{facet.BytecodeHash},
			}
		}
	}

	// Convert map to slice
	result := make([]MergedFacet, 0, len(mergedFacets))
	for _, facet := range mergedFacets {
		result = append(result, facet)
	}

	return result
}
