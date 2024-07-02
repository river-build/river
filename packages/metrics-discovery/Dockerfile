FROM node:lts-alpine3.20

COPY . /river
WORKDIR /river

RUN yarn install
RUN yarn build:metrics-discovery
RUN corepack enable

WORKDIR /river/packages/metrics-discovery

CMD [ "yarn", "start"]
