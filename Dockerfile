FROM node:20

RUN git clonehttps://github.com/KING-DAVIDX/X-KING.git /root/KING-DAVIDX

# Clear npm cache and remove node_modules directories
RUN npm cache clean --force
RUN rm -rf /root/KING-DAVIDX/node_modules

# Install dependencies
WORKDIR /root/KING-DAVIDX
RUN npm install

# Add additional Steps To Run...
EXPOSE 3000
CMD ["npm","start" ]
# IF YOU ARE MODIFYING THIS BOT DONT CHANGE THIS  RUN rm -rf /root/STAR-KING0/node_modules
