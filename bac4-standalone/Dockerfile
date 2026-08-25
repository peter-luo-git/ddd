FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --registry=https://registry.npmmirror.com

COPY . .

# 用哪个后端地址由 docker-compose 里的 VITE_API_BASE 环境变量注入
EXPOSE 5173
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]
