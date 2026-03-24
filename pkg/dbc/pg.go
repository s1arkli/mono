package dbc

import (
	"fmt"

	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	pgDB *gorm.DB
)

func InitPgsql() {
	dsn := fmt.Sprintf("host=localhost user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Shanghai",
		viper.GetString("pgsql.user"), viper.GetString("pgsql.pwd"), viper.GetString("pgsql.db"), viper.GetString("pgsql.port"))
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	pgDB = db
}

func GetDB() *gorm.DB {
	return pgDB
}
