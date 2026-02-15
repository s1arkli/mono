package cmd

import (
	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"

	"auth/gateway/initial"
	"auth/gateway/router"
)

func init() {
	rootCmd.AddCommand(apiCmd)
}

var apiCmd = &cobra.Command{
	Use:   "api",
	Short: "api",
	Run: func(cmd *cobra.Command, args []string) {
		r := gin.Default()

		initial.Viper()
		router.Api(r)

		_ = r.Run(initial.GatewayConfig.GetString(":" + "api.port"))
	},
}
