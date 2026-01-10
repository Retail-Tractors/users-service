FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Expose service port
EXPOSE 3003

# Start the service
CMD ["npm", "start"]
