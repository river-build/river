package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	u "bytecode-diff/utils"

	"github.com/joho/godotenv"
	"github.com/spf13/cobra"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	supportedEnvironments := []string{"alpha", "gamma", "omega"}
	var rpcURL string
	var facetSourcePath string
	var compiledFacetsPath string
	var sourceDiffDir string
	var sourceDiff bool
	var reportOutDir string
	var originEnvironment, targetEnvironment string
	var deploymentsPath string

	rootCmd := &cobra.Command{
		Use:   "bytecode-diff [origin_environment] [target_environment]",
		Short: "A tool to retrieve and display contract bytecode diff for Base",
		Args: func(cmd *cobra.Command, args []string) error {
			if sourceDiff {
				if len(args) != 0 {
					return fmt.Errorf("no positional arguments expected when --source-diff-only is set")
				}
			} else {
				if len(args) != 2 {
					return fmt.Errorf("exactly two arguments required when --source-diff-only is not set, [origin_environment], [target_environment]")
				}
			}
			return nil
		},
		PreRun: func(cmd *cobra.Command, args []string) {
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
					log.Fatal("Compiled facets path is missing. Set it using --compiled-facets flag or COMPILED_FACETS_PATH environment variable")
				}

				envReportOutDir := os.Getenv("REPORT_OUT_DIR")
				if envReportOutDir != "" {
					reportOutDir = envReportOutDir
				}
				if reportOutDir == "" {
					reportOutDir = cmd.Flag("report-out-dir").Value.String()
				}
				if reportOutDir == "" {
					log.Fatal("Report out directory is missing. Set it using --report-out-dir flag or REPORT_OUT_DIR environment variable")
				}
				return
			}

			envDeploymentsPath := os.Getenv("DEPLOYMENTS_PATH")
			if envDeploymentsPath != "" {
				deploymentsPath = envDeploymentsPath
			}
			if deploymentsPath == "" {
				deploymentsPath = cmd.Flag("deployments").Value.String()
			}
			if deploymentsPath == "" {
				log.Fatal("Deployments path is missing. Set it using --deployments flag or DEPLOYMENTS_PATH environment variable")
			}
		},
		Run: func(cmd *cobra.Command, args []string) {

			if sourceDiff {

				fmt.Println("Running diff for facet path recursively onl compiled facet contracts:", facetSourcePath, compiledFacetsPath)

				if err := executeSourceDiff(cmd, facetSourcePath, compiledFacetsPath, sourceDiffDir); err != nil {
					log.Fatalf("Error executing source diff: %v", err)
				}
			} else {

				originEnvironment, targetEnvironment = args[0], args[1]
				for _, environment := range []string{originEnvironment, targetEnvironment} {
					if !u.Contains(supportedEnvironments, environment) {
						log.Fatalf("Environment %s not supported. Environment can be one of alpha, gamma, or omega.", environment)
					}
				}

				fmt.Printf("Origin Environment: %s, Target Environment: %s\n", originEnvironment, targetEnvironment)

				if rpcURL == "" {
					rpcURL = os.Getenv("BASE_RPC_URL")
					if rpcURL == "" {
						log.Fatal("RPC URL not provided. Set it using --rpc flag or BASE_RPC_URL environment variable")
					}
				}

				fmt.Println("Running diff for environment:", originEnvironment, targetEnvironment)

				if err := executeEnvrionmentDiff(cmd, deploymentsPath, originEnvironment, targetEnvironment, reportOutDir); err != nil {
					log.Fatalf("Error executing environment diff: %v", err)
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
	rootCmd.Flags().StringVar(&deploymentsPath, "deployments", "../../contracts/deployments", "Path to deployments directory")

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

}

func executeSourceDiff(cmd *cobra.Command, facetSourcePath, compiledFacetsPath string, reportOutDir string) error {
	facetFiles, err := u.GetFacetFiles(facetSourcePath)
	if err != nil {
		fmt.Println("facetSourcePath", facetSourcePath)
		fmt.Println("compiledFacetsPath", compiledFacetsPath)
		return fmt.Errorf("error getting facet files: %v", err)
	}
	fmt.Println("Facet files length:", len(facetFiles))

	compiledHashes, err := u.GetCompiledFacetHashes(compiledFacetsPath, facetFiles)
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

	err = u.CreateFacetHashesReport(compiledFacetsPath, compiledHashes, reportOutDir, verbose)
	if err != nil {
		return fmt.Errorf("error creating facet hashes report: %v", err)
	}

	return nil
}

func executeEnvrionmentDiff(cmd *cobra.Command, deploymentsPath, originEnvironment, targetEnvironment string, reportOutDir string) error {
	verbose, _ := cmd.Flags().GetBool("verbose")
	// walk environment diamonds and get all facet addresses from DiamondLoupe facet view
	var baseDiamonds = []u.Diamond{
		u.BaseRegistry,
		u.Space,
		u.SpaceFactory,
		u.SpaceOwner,
	}
	originDeploymentsPath := filepath.Join(deploymentsPath, originEnvironment)
	originDiamonds, err := u.GetDiamondAddresses(originDeploymentsPath, baseDiamonds, verbose)
	if err != nil {
		return fmt.Errorf("error getting diamond addresses for origin environment: %v", err)
	}
	if verbose {
		for diamond, addresses := range originDiamonds {
			fmt.Printf("Origin Diamond: %s, Addresses: %v\n", diamond, addresses)
		}
	}

	targetDeploymentsPath := filepath.Join(deploymentsPath, targetEnvironment)
	targetDiamonds, err := u.GetDiamondAddresses(targetDeploymentsPath, baseDiamonds, verbose)
	if err != nil {
		return fmt.Errorf("error getting diamond addresses for target environment: %v", err)
	}
	if verbose {
		for diamond, addresses := range targetDiamonds {
			fmt.Printf("Target Diamond: %s, Addresses: %v\n", diamond, addresses)
		}
	}

	// getCode for all facet addresses over base rpc url and compare with compiled hashes

	// create report
	fmt.Println("Report out dir:", reportOutDir)
	return nil
}
