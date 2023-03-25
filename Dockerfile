# Use the official Node.js 18 image.
# https://hub.docker.com/_/node
FROM node:18-bullseye-slim
# Create and change to the app directory.
WORKDIR /usr/src/app
# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./
# Install production dependencies.
RUN npm install --only=production
# Copy local code to the container image.
COPY . .
# Build JS app
RUN npm run build
# Clean up src files
RUN rm -r src
# Run the web service on container startup.
CMD [ "npm", "run", "start:prod" ]