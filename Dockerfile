# Stage 1: Build React/Vite SPA
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Optional build-time API Base URL (defaults to /api proxy if unset)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build static production bundles
RUN npm run build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Clear default nginx static files
RUN rm -rf ./*

# Copy built SPA artifacts from build stage
COPY --from=build /app/dist .

# Copy custom Nginx configuration (handles SPA routing and /api proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
