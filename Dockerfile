FROM node:lts-alpine as base

WORKDIR /home/node/app

COPY package.json ./

USER node

RUN npm i

COPY . .

FROM base as production

ENV NODE_PATH=./build

USER node

RUN npm run build