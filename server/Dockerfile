FROM node:alpine
WORKDIR /src/app
COPY package.json .
COPY package-lock.json .
RUN npm ci
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
