# 构建基础镜像，相当于一个装了golang环境的精简型linux
FROM golang:1.25

# 在容器内的根目录下/app内是程序的工作目录
WORKDIR /app

# 会根据dockerignore文件进行拷贝项目，为后续编译打基础。
# 两个 . 分别是本地项目的原目录，后者是容器的目标目录
COPY ../.. .

# run后面是在容器的工作目录下执行的命令，是在docker build构建的时候执行的命令
RUN go build -o gatewayService ./gateway

# 是每次docker run的时候执行的命令
CMD ["./gatewayService","api"]