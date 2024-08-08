package main

// Add test commands and execute cobra root command from cmd

import (
	"github.com/river-build/river/core/cmd"
	_ "github.com/river-build/river/core/cmd/testcmd"
)

func main() {
	cmd.Execute()
}
