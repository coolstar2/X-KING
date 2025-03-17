FROM node:20

# Set working directory
WORKDIR /app

# Clone repository
RUN git clone https://github.com/KING-DAVIDX/X-KING.git .

# Clean npm cache and remove node_modules in a single layer
RUN npm cache clean --force && rm -rf node_modules

# Install dependencies using npm ci for consistency
RUN npm ci

# Set a non-root user for better security
RUN useradd -m appuser && chown -R appuser /app
USER appuser

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]