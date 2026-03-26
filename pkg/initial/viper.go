package initial

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

func Viper(module string) {
	viper.SetEnvPrefix("mono")
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	viper.SetConfigFile("config/config.yaml")
	viper.ReadInConfig()

	viper.SetConfigFile(fmt.Sprintf("config/%s/config.yaml", module))
	viper.MergeInConfig()
}
