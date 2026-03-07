FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx tsc -p tsconfig.build.json

EXPOSE 3000

CMD ["node", "dist/src/scripts/startup.js"]
