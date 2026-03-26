FROM golang:1.25 AS builder

# 声明变量，支持多个微服务的docker build
ARG SERVICE

WORKDIR /app

# 在依赖不变的情况下，不会重复下载依赖。原理是docker是按行进行缓存，哪一行之前的没变就不会重新执行。
COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 go build -o app ./${SERVICE}

FROM alpine:3.20

RUN apk add --no-cache tzdata

WORKDIR /app

COPY --from=builder /app/app .
COPY --from=builder /app/config ./config