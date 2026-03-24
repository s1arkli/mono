package dal

import (
	"fmt"

	"gorm.io/gen"
	"gorm.io/gorm"
)

func Gen(db *gorm.DB, module string) {
	g := gen.NewGenerator(gen.Config{
		OutPath: fmt.Sprintf("./service/%s/internal/infra/dal", module), // 生成代码输出目录
		Mode: gen.WithDefaultQuery | // 生成默认 Query 对象
			gen.WithQueryInterface, // 生成接口
		FieldNullable: true,
		FieldSignable: true,
	})

	//数据库类型转换
	g.WithDataTypeMap(map[string]func(columnType gorm.ColumnType) string{
		"tinyint": func(columnType gorm.ColumnType) string {
			return "int32"
		},
		"json": func(columnType gorm.ColumnType) string {
			return "datatypes.JSON"
		},
	})

	g.UseDB(db)
	g.ApplyBasic(g.GenerateAllTable()...)
	g.Execute()
}
