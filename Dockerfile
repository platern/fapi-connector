FROM node:16
WORKDIR /usr/src/app
COPY . .
RUN yarn install
RUN yarn config set user root && \
    yarn global add json-dereference-cli
EXPOSE 5001
CMD ["yarn", "start", "dev"]