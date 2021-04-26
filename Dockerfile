FROM node:latest
WORKDIR /usr/app
COPY package.json .
RUN npm i -g typescript
RUN npm install
COPY . .