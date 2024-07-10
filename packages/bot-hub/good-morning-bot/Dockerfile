FROM node:20-alpine

WORKDIR /app

RUN corepack enable
RUN yarn set version 3.8.0

COPY package.json .
COPY yarn.lock .
COPY .yarnrc.yml .

RUN apk add --no-cache bash

RUN yarn install

COPY . .

RUN yarn build

EXPOSE 80

CMD ["./scripts/run.sh"]
