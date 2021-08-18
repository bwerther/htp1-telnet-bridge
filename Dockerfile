FROM node:lts-alpine as base

WORKDIR /home/node/app

COPY package.json ./

USER node

RUN npm i

RUN npm install -g nodemon

COPY . .

FROM base as production

ENV NODE_PATH=./build

USER node

RUN npm run build