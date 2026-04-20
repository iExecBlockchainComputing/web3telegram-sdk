FROM node:22-alpine3.22
ARG WEB3TELEGRAM_IPFS_GATEWAY
ENV WEB3TELEGRAM_IPFS_GATEWAY=$WEB3TELEGRAM_IPFS_GATEWAY
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY ./src .
ENTRYPOINT [ "node", "--disable-wasm-trap-handler", "/app/app.js" ]
