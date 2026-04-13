package initial

import (
	"os"

	"go.uber.org/zap"
)

var sugar *zap.SugaredLogger

func Zap(env string) error {
	var cfg zap.Config

	//创建日志目录
	if err := os.MkdirAll("./logs", 0755); err != nil {
		return err
	}

	switch env {
	case "dev":
		cfg = zap.NewDevelopmentConfig()
	case "prod":
		cfg = zap.NewProductionConfig()
	default:
		cfg = zap.NewProductionConfig()
	}

	// 加上文件输出路径
	cfg.OutputPaths = []string{"stdout", "./logs/app.log"}

	log, err := cfg.Build()
	if err != nil {
		return err
	}

	sugar = log.Sugar()
	return nil
}

func GetLogger() *zap.SugaredLogger {
	return sugar
}
