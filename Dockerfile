FROM node:alpine

WORKDIR /app

COPY ./tsconfig.json .
COPY ./package.json .
COPY ./package-lock.json .

RUN [ "npm", "install" ]

COPY ./src ./src
COPY ./prisma ./prisma
RUN [ "npm", "run", "build" ]

CMD [ "npm", "run", "start:migrate" ]