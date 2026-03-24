package cmd

import (
	"github.com/spf13/cobra"

	"mono/gateway/initial"
	"mono/pkg/dal"
	"mono/pkg/dbc"
)

func init() {
	rootCmd.AddCommand(dalCmd)
}

var dalCmd = &cobra.Command{
	Use: "dal",
	Run: func(cmd *cobra.Command, args []string) {
		initial.Viper("service/post/config.yaml")
		dbc.InitPgsql()
		dal.Gen(dbc.GetDB(), "post")
	},
}
