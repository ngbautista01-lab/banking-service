FROM node:20-bookworm-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

RUN npx tsc -p tsconfig.build.json

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/scripts/startup.js"]
