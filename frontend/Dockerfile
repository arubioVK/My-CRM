FROM node:20-alpine

WORKDIR /app

COPY package.json .
# We will install dependencies in the container start or build
RUN npm install

COPY . .

CMD ["npm", "run", "dev", "--", "--host"]
