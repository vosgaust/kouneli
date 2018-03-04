FROM node:carbon-alpine

ADD package.json /app/package.json
WORKDIR /app
RUN npm install -q --only=prod

ADD . /app

CMD ["npm", "start"]
