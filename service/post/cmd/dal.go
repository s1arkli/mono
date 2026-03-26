package cmd

import (
	"github.com/spf13/cobra"

	"mono/pkg/dal"
	"mono/pkg/initial"
	"mono/service/post/pkg"
)

func init() {
	rootCmd.AddCommand(dalCmd)
}

var dalCmd = &cobra.Command{
	Use: "dal",
	Run: func(cmd *cobra.Command, args []string) {
		initial.Viper(pkg.Module)
		initial.Postgres()
		dal.Gen(initial.GetDB(), pkg.Module)
	},
}
