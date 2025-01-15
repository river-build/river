package cmd

import (
	"bufio"
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	xc "github.com/river-build/river/core/xchain/client_simulator"
	"github.com/river-build/river/core/xchain/util"

	"github.com/spf13/cobra"

	"github.com/river-build/river/core/node/dlog"
)

func keyboardInput(input chan rune) {
	// Create a new reader to read from standard input
	reader := bufio.NewReader(os.Stdin)

	log.Println("Press:")
	log.Println(" - 'q' to Exit")
	log.Println(" - 'a' to simulate ERC20")
	log.Println(" - 'b' to simulate ERC721")
	log.Println(" - 'c' to simulate custom IsEntitled")
	log.Println(" - 'd' to toggle custom IsEntitled")

	for {
		// Read a single character
		char, _, err := reader.ReadRune()
		if err != nil {
			log.Fatal(err)
		}
		input <- char
	}
}

func runClientSimulator() error {
	bc := context.Background()
	pid := os.Getpid()

	log := dlog.FromCtx(bc).With("pid", pid)
	log.Infow("Main started")
	input := make(chan rune)

	go func() {
		keyboardInput(input)
	}()

	wallet, err := util.LoadWallet(bc)
	if err != nil {
		log.Errorw("error finding wallet")
		return err
	}

	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

out:

	for {
		log.Infow("Main Loop")
		select {
		case char := <-input:
			log.Infow("Input", "char", char)
			switch char {
			case 'a':
				go xc.RunClientSimulator(bc, cmdConfig, wallet, xc.ERC20)
			case 'b':
				go xc.RunClientSimulator(bc, cmdConfig, wallet, xc.ERC721)
			case 'q':
				log.Infow("Quit Exit")
				break out
			}

		case <-interrupt:
			log.Infow("Main Interrupted")
			break out
		}
	}

	log.Infow("Shutdown")
	return nil
}

func init() {
	cmd := &cobra.Command{
		Use:   "run-cs",
		Short: "Runs the client simulator",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runClientSimulator()
		},
	}

	rootCmd.AddCommand(cmd)
}
