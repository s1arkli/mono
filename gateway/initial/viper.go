package initial

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/viper"
)

var GatewayConfig *viper.Viper

func Viper() {
	GatewayConfig = viper.New()
	GatewayConfig.SetEnvPrefix("app_GatewayConfig")
	GatewayConfig.AutomaticEnv()
	GatewayConfig.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	cwd, _ := os.Getwd()
	cfgPath := filepath.Join(cwd, "config.yaml")

	//<ConfigPath>/<ConfigName>.<ConfigType>
	GatewayConfig.SetConfigName("config")
	GatewayConfig.SetConfigType("yaml")
	GatewayConfig.AddConfigPath(cwd) // 加上这行

	check(cfgPath)
}

func check(cfgPath string) {
	err := GatewayConfig.ReadInConfig()
	if err != nil {
		var configFileNotFoundError viper.ConfigFileNotFoundError
		if errors.As(err, &configFileNotFoundError) {
			GatewayConfig.Set("port", 9595)

			//config not found
			//create config file
			if err = GatewayConfig.WriteConfigAs(cfgPath); err != nil {
				fmt.Println(err)
				os.Exit(1)
			}
		} else {
			//failed to parse config file
			fmt.Println(err)
			os.Exit(1)
		}
	}
}
