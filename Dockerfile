FROM node:16-alpine as base

WORKDIR /home/node/app

COPY package.json ./

RUN npm i

RUN npm install -g nodemon

COPY . .
