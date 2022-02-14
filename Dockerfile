FROM node:12-alpine3.12

# Create app directory
WORKDIR /usr/app

RUN apk add --no-cache git

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install 
# RUN npm ci --only=production

# Bundle app source
COPY . .

CMD [ "npx", "ts-node", "src/index.ts" ]
