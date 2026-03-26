proto:
	protoc --go_out=./pb --go_opt=paths=source_relative \
	--go-grpc_out=./pb --go-grpc_opt=paths=source_relative \
	--proto_path=./protos \
	protos/*.proto

doc:
	swag init --dir ./gateway/service -g doc.go --parseDependency --output ./gateway/doc/app

auth_dal:
	go run service/auth/main.go dal
post_dal:
	go run service/post/main.go dal
user_dal:
	go run service/user/main.go dal

run: proto doc
	docker-compose up --build

stop:
	docker-compose down

clean:
	docker-compose down -v