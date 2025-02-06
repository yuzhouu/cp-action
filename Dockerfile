FROM alpine:latest

# 安装 Git
RUN apk add --no-cache git

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY . .

# 设置入口点脚本
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]