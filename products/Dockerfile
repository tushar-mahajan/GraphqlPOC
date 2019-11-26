FROM node:10-alpine

RUN apk --no-cache add \
  bash \
  curl

WORKDIR /src

ADD . /src

RUN npm install

CMD node index.js
