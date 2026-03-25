package cmd

import (
	"github.com/spf13/cobra"

	"mono/gateway/initial"
	"mono/pkg/dal"
	"mono/service/user/pkg"
)

func init() {
	rootCmd.AddCommand(dalCmd)
}

var dalCmd = &cobra.Command{
	Use:   "dal",
	Short: "dal",
	Run: func(cmd *cobra.Command, args []string) {
		initial.Viper(pkg.Module)
		initial.Postgres()
		dal.Gen(initial.GetDB(), pkg.Module)
	},
}
