FROM node:22-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
