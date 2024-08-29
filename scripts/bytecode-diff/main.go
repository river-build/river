package main

import (
	"fmt"
	"log"
	"os"

	"bytecode-diff/utils"

	"github.com/joho/godotenv"
	"github.com/spf13/cobra"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	var rpcURL string
	var facetSourcePath string
	var compiledFacetsPath string
	var sourceDiffDir string
	var sourceDiff bool
	var reportOutDir string

	rootCmd := &cobra.Command{
		Use:   "bytecode-diff",
		Short: "A tool to retrieve and display contract bytecode diff for Base",
		Run: func(cmd *cobra.Command, args []string) {
			if rpcURL == "" {
				rpcURL = os.Getenv("BASE_RPC_URL")
				if rpcURL == "" {
					log.Fatal("RPC URL not provided. Set it using --rpc flag or BASE_RPC_URL environment variable")
				}
			}

			if sourceDiff {
				fmt.Println("Running diff for facet path recursively onl compiled facet contracts:", facetSourcePath, compiledFacetsPath)
				if err := executeSourceDiff(cmd, facetSourcePath, compiledFacetsPath, sourceDiffDir); err != nil {
					log.Fatalf("Error executing source diff: %v", err)
				}
			}
		},
	}
	rootCmd.Flags().StringVarP(&rpcURL, "rpc", "r", "", "Base RPC provider URL")
	rootCmd.Flags().BoolVarP(&sourceDiff, "source-diff-only", "s", false, "Run source code diff")
	rootCmd.Flags().StringVar(&sourceDiffDir, "source-diff-log", "source-diffs", "Path to diff log file")
	rootCmd.Flags().StringVar(&compiledFacetsPath, "compiled-facets", "", "Path to compiled facets")
	rootCmd.Flags().StringVar(&facetSourcePath, "facets", "", "Path to facet source files")
	rootCmd.Flags().BoolP("verbose", "v", false, "Enable verbose output")
	rootCmd.Flags().StringVar(&reportOutDir, "report-out-dir", "deployed-diffs", "Path to report output directory")

	rootCmd.PreRun = func(cmd *cobra.Command, args []string) {
		if sourceDiff {
			envSourceDiffDir := os.Getenv("SOURCE_DIFF_DIR")
			if envSourceDiffDir != "" {
				sourceDiffDir = envSourceDiffDir
			}

			if sourceDiffDir == "" {
				sourceDiffDir = cmd.Flag("source-diff-log").Value.String()
			}

			facetSourcePath = os.Getenv("FACET_SOURCE_PATH")
			if facetSourcePath == "" {
				facetSourcePath = cmd.Flag("facets").Value.String()
			}
			if facetSourcePath == "" {
				log.Fatal("Facet source path is missing. Set it using --facets flag or FACET_SOURCE_PATH environment variable")
			}

			compiledFacetsPath = os.Getenv("COMPILED_FACETS_PATH")
			fmt.Println("Compiled facets path:", compiledFacetsPath)
			if compiledFacetsPath == "" {
				compiledFacetsPath = cmd.Flag("compiled-facets").Value.String()
			}
			if compiledFacetsPath == "" {
				log.Fatal("Compiled facets path is missing. Set it using --compiled-facets flag " +
					"or COMPILED_FACETS_PATH environment variable")
			}

			envReportOutDir := os.Getenv("REPORT_OUT_DIR")
			if envReportOutDir != "" {
				reportOutDir = envReportOutDir
			}
			if reportOutDir == "" {
				reportOutDir = cmd.Flag("report-out-dir").Value.String()
			}
			if reportOutDir == "" {
				log.Fatal("Report out directory is missing. Set it using --report-out-dir flag " +
					"or REPORT_OUT_DIR environment variable")
			}
		}
	}

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

}

func executeSourceDiff(cmd *cobra.Command, facetSourcePath, compiledFacetsPath string, reportOutDir string) error {
	facetFiles, err := utils.GetFacetFiles(facetSourcePath)
	if err != nil {
		return fmt.Errorf("error getting facet files: %v", err)
	}
	fmt.Println("Facet files length:", len(facetFiles))

	compiledHashes, err := utils.GetCompiledFacetHashes(compiledFacetsPath, facetFiles)
	if err != nil {
		return fmt.Errorf("error getting compiled facet hashes for path %s: %v", compiledFacetsPath, err)
	}

	verbose, _ := cmd.Flags().GetBool("verbose")
	if verbose {
		fmt.Println("Compiled Facet Hashe len:", len(compiledHashes))
		for file, hash := range compiledHashes {
			fmt.Printf("%s: %s\n", file, hash)
		}
	}

	err = utils.CreateFacetHashesReport(compiledFacetsPath, compiledHashes, reportOutDir, verbose)
	if err != nil {
		return fmt.Errorf("error creating facet hashes report: %v", err)
	}

	return nil
}
