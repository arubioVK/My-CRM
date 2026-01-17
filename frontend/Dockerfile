FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
# We will install dependencies in the container start or build
RUN npm ci --legacy-peer-deps

COPY . .

CMD ["npm", "run", "dev", "--", "--host"]
