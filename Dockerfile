FROM node:latest
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm i -g typescript
RUN npm i -g ts-node
RUN npm install -g concurrently
RUN npm install
COPY . .