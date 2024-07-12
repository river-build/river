FROM node:lts-alpine3.20

COPY . /river
WORKDIR /river

RUN npm -g uninstall yarn && corepack enable
RUN yarn install
RUN yarn build:metrics-discovery

WORKDIR /river/packages/metrics-discovery

CMD [ "yarn", "start"]
