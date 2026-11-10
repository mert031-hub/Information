# 1) React arayüzünü derle
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2) Çalışma imajı: Express hem API'yi hem derlenmiş arayüzü sunar
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8787
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY --from=build /app/dist ./dist
EXPOSE 8787
CMD ["node", "server/index.js"]
