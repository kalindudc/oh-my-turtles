# Use a multi-stage build to create a production build of the React app
FROM node:16 AS builder

WORKDIR /app

# Install dependencies and build the React app
COPY client/package.json client/yarn.lock client/tsconfig.json ./client/
RUN cd client && yarn install
COPY client/ ./client/
RUN cd client && yarn build

# Copy the server files and install dependencies
COPY package.json yarn.lock tsconfig.json ./
RUN yarn install

# Copy the server source code
COPY src/ ./src/

# Build the server code
RUN yarn build

# Use a smaller base image for the final build
FROM node:14

WORKDIR /app

# Copy the built server and public directory
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/build ./client/build
COPY package.json yarn.lock ./

# Install production dependencies
RUN yarn install --production

# Expose the port and start the server
EXPOSE 8080
ENTRYPOINT ["node", "dist/index.js"]
