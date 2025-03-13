FROM node:20

RUN git clone https://github.com/KING-DAVIDX/X-KING.git /root/KING-DAVIDX

# Clear npm cache and remove node_modules directories
RUN npm cache clean --force
RUN rm -rf /root/X-KING/node_modules

# Install dependencies
WORKDIR /root/KING-DAVIDX
RUN npm install

# Add additional Steps To Run...
EXPOSE 3000
CMD ["npm","start" ]
