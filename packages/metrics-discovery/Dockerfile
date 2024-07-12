FROM node:lts-alpine3.20

COPY . /river
WORKDIR /river

RUN npm -g uninstall yarn && corepack enable

WORKDIR /river/packages/metrics-discovery

CMD ["sleep", "infinity"]
