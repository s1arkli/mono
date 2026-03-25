package initial

import (
	"fmt"

	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	pgDB *gorm.DB
)

func Postgres() {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Shanghai", viper.GetString("host"),
		viper.GetString("pgsql.user"), viper.GetString("pgsql.pwd"), viper.GetString("db"), viper.GetString("pgsql.port"))
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	pgDB = db
}

func GetDB() *gorm.DB {
	return pgDB
}

func CloseDB() {
	if pgDB != nil {
		sdb, _ := pgDB.DB()
		sdb.Close()
	}
}
