FROM node:lts-alpine as base

WORKDIR /home/node/app

COPY package.json ./

RUN npm i

RUN npm install -g nodemon

COPY . .

FROM base as production

ENV NODE_PATH=./build

RUN npm run build