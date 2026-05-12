# ===========================================
# Stage 1: Build the React (Vite) Application
# ===========================================
 
# latest node LTS version with Alpine Linux (very lightweight)
ARG NODE_VERSION=25-alpine3.22

# Wir bauen die Build stage und nennen sie "builder"
# das image erbt dann alles von node:25-alpine3.22, also node, npm, alpine linux etc.
# müssen wir dann nicht alles installieren
FROM node:${NODE_VERSION} AS builder
 
# Set the working directory inside the container
WORKDIR /app
 
# Copy package-related files first to leverage Docker's caching mechanism
COPY package.json package-lock.json ./
 
# Install project dependencies using npm ci (ensures a clean, reproducible install) (steht für clean install)
RUN --mount=type=cache,target=/root/.npm npm ci
 
# Copy the rest of the application source code into the container
COPY . .
 
# Build the React.js application (outputs to /app/dist)
RUN npm run build
 


# Finales Image enthält nur den Dist-Ordner und den `serve`-Server, um die statischen Dateien zu hosten
# Der ganze Build-Kram (node, npm, source files etc.) ist nicht mehr drin => kleineres Image
# generell baut Docker immer nur die letzte Stage als Image

 
# ======================================
# Stage 2: Serve static files with nginx
# ======================================

FROM nginx:1.30.0-alpine AS runner
 
# Kopiere dist-Ordner aus der builder stage in den nginx html Ordner
COPY --link --from=builder /app/dist /usr/share/nginx/html

# Kopiere die angepasste nginx Konfiguration, damit nginx die statischen Dateien korrekt serviert
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the outside world
EXPOSE 80

# Start nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]