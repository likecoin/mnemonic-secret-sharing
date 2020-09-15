FROM node:12-alpine
WORKDIR /app
COPY package.json package-lock.json index.js utils.js recover.js /app/
RUN npm install
CMD node index.js
