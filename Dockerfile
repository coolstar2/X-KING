FROM node:20

# Clone your bot's repository
RUN git clone https://github.com/KING-DAVIDX/X-KING.git /root/X-KING

# Set working directory
WORKDIR /root/X-KING

# Install dependencies
RUN npm install

# Expose port 3000
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]