package cmd

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"mono/gateway/initial"
	"mono/gateway/router"
	"mono/gateway/service/auth"
	"mono/gateway/service/post"
)

func init() {
	rootCmd.AddCommand(apiCmd)
}

var apiCmd = &cobra.Command{
	Use:   "api",
	Short: "api",
	Run: func(cmd *cobra.Command, args []string) {
		r := gin.Default()

		initial.Viper("./gateway/config.yaml")
		auth.InitAuthClient()
		post.InitPostClient()

		router.Api(r)

		port := viper.GetString("api.port")
		_ = r.Run(fmt.Sprintf(":%s", port))
	},
}
