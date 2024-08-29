package utils

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
	"gopkg.in/yaml.v2"
)

const (
	dirPermissions  = 0o755
	filePermissions = 0o644
)

type Data struct {
	Updated  map[string]string `yaml:"updated"`
	Existing map[string]string `yaml:"existing"`
}

type FacetFile struct {
	Path     string
	Filename string
}

func GetFacetFiles(facetSourcePath string) ([]FacetFile, error) {
	var facetFiles []FacetFile

	err := filepath.Walk(facetSourcePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if strings.Contains(path, "facets") {
			if !info.IsDir() && strings.HasSuffix(info.Name(), ".sol") && !strings.HasPrefix(info.Name(), "I") {
				facetFiles = append(facetFiles, FacetFile{
					Path:     path,
					Filename: info.Name(),
				})
			}
		}

		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("error walking the path %v: %v", facetSourcePath, err)
	}

	return facetFiles, nil
}

func GetCompiledFacetHashes(path string, files []FacetFile) (map[string]string, error) {
	result := make(map[string]string)

	for _, files := range files {
		rootPath := filepath.Join(path, files.Filename)
		err := filepath.Walk(rootPath, func(currentPath string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if !info.IsDir() && strings.HasSuffix(info.Name(), ".bin") {
				if data, err := os.ReadFile(currentPath); err == nil {
					hash := crypto.Keccak256Hash(data).Hex()
					originalFilename := strings.TrimSuffix(info.Name(), ".bin")
					result[originalFilename] = hash
				}
			}

			return nil
		})
		if err != nil {
			return nil, err
		}
	}

	return result, nil
}

func CreateFacetHashesReport(
	compiledFacetsPath string,
	compiledHashes map[string]string,
	yamlOutputDir string,
	verbose bool,
) error {
	// Get current git commit hash
	cmd := exec.Command("git", "rev-parse", "--short", "HEAD")
	commitHashRaw, err := cmd.Output()
	if err != nil {
		return fmt.Errorf("error getting git commit hash: %v", err)
	}
	commitHash := strings.TrimSpace(string(commitHashRaw))

	// Get current date in MMDDYYYY format
	currentDate := time.Now().UTC().Format("01022006")

	latestFile, err := getLatestYamlFile(yamlOutputDir, commitHash)
	if err != nil {
		return err
	}

	var updatedHashes, existingHashes map[string]string

	if latestFile == "" {
		existingHashes = compiledHashes
		updatedHashes = make(map[string]string)
	} else {
		var previousData Data
		data, err := os.ReadFile(latestFile)
		if err != nil {
			return err
		}
		err = yaml.Unmarshal(data, &previousData)
		if err != nil {
			return err
		}

		// Combine previous Updated and Existing into a single map for comparison
		previousHashes := make(map[string]string)
		for k, v := range previousData.Updated {
			previousHashes[k] = v
		}
		for k, v := range previousData.Existing {
			previousHashes[k] = v
		}

		updatedHashes, existingHashes = categorizeHashes(compiledHashes, previousHashes)
	}

	report := Data{
		Updated:  updatedHashes,
		Existing: existingHashes,
	}

	return writeYamlReport(yamlOutputDir, report, commitHash, currentDate, verbose)
}

func writeYamlReport(yamlOutputDir string, report Data, commitHash, currentDate string, verbose bool) error {
	yamlContent, err := yaml.Marshal(report)
	if err != nil {
		return fmt.Errorf("error marshaling YAML content: %v", err)
	}

	// Convert relative path to absolute path
	absYamlOutputDir, err := filepath.Abs(yamlOutputDir)
	if err != nil {
		return fmt.Errorf("error getting absolute path: %v", err)
	}

	filename := fmt.Sprintf("%s_%s.yaml", commitHash, currentDate)
	fullPath := filepath.Join(absYamlOutputDir, filename)

	// Check if file already exists
	if _, err := os.Stat(fullPath); err == nil {
		// File exists, generate a unique name
		for i := 1; ; i++ {
			newFilename := fmt.Sprintf("%s_%s_%d.yaml", commitHash, currentDate, i)
			fullPath = filepath.Join(absYamlOutputDir, newFilename)
			if _, err := os.Stat(fullPath); os.IsNotExist(err) {
				break
			}
		}
	}

	// Ensure the output directory exists
	err = os.MkdirAll(absYamlOutputDir, dirPermissions)
	if err != nil {
		return fmt.Errorf("error creating output directory: %v", err)
	}

	// Write YAML file
	err = os.WriteFile(fullPath, yamlContent, filePermissions)
	if err != nil {
		return fmt.Errorf("error writing YAML file: %v", err)
	}

	if verbose {
		fmt.Printf("YAML file created: %s\n", fullPath)
	}

	return nil
}

func getLatestYamlFile(dir string, currentCommitHash string) (string, error) {
	// Convert to absolute path
	absDir, err := filepath.Abs(dir)
	if err != nil {
		return "", fmt.Errorf("error getting absolute path: %v", err)
	}

	// Check if directory exists
	if _, err := os.Stat(absDir); os.IsNotExist(err) {
		// Directory doesn't exist, return empty string without error
		return "", nil
	}

	files, err := os.ReadDir(absDir)
	if err != nil {
		return "", fmt.Errorf("error reading directory: %v", err)
	}

	var yamlFiles []os.DirEntry
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".yaml") {
			yamlFiles = append(yamlFiles, file)
		}
	}

	if len(yamlFiles) == 0 {
		// No YAML files found, return empty string without error
		return "", nil
	}

	sort.Slice(yamlFiles, func(i, j int) bool {
		nameParts1 := strings.Split(strings.TrimSuffix(yamlFiles[i].Name(), ".yaml"), "_")
		nameParts2 := strings.Split(strings.TrimSuffix(yamlFiles[j].Name(), ".yaml"), "_")

		if len(nameParts1) < 2 || len(nameParts2) < 2 {
			return false
		}

		date1, _ := strconv.Atoi(nameParts1[1])
		date2, _ := strconv.Atoi(nameParts2[1])

		if date1 != date2 {
			return date1 > date2
		}

		if len(nameParts1) == 3 && len(nameParts2) == 3 {
			num1, _ := strconv.Atoi(nameParts1[2])
			num2, _ := strconv.Atoi(nameParts2[2])

			return num1 > num2
		}

		return len(nameParts1) > len(nameParts2)
	})

	for _, file := range yamlFiles {
		commitHash := strings.Split(file.Name(), "_")[0]
		if commitHash != currentCommitHash {
			return filepath.Join(absDir, file.Name()), nil
		}
	}

	return "", nil // No file with a different commit hash found
}

func categorizeHashes(
	compiledHashes, previousHashes map[string]string,
) (updatedHashes, existingHashes map[string]string) {
	updatedHashes = make(map[string]string)
	existingHashes = make(map[string]string)

	for contract, hash := range compiledHashes {
		if prevHash, exists := previousHashes[contract]; !exists || prevHash != hash {
			updatedHashes[contract] = hash
		} else {
			existingHashes[contract] = hash
		}
	}

	return updatedHashes, existingHashes
}
