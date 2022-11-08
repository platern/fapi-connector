FROM node:16

# node config files
COPY package.json .
COPY tsconfig.json .

# Platern Clients config
COPY config config

# code artefacts
COPY openapi.yaml .
RUN mkdir gen
COPY yarn.lock .
COPY src src
COPY ./prisma prisma

# main setup
RUN yarn install
RUN yarn config set user root && \
    yarn global add json-dereference-cli
EXPOSE 8000
RUN ls -lrt
CMD ["npm", "start", "dev"]