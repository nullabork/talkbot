FROM python:2.7
LABEL Name="TalkbotLatest"
# Replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
# make sure apt is up to date
RUN apt-get update --fix-missing
RUN apt-get install -y git gunzip curl build-essential libssl-dev libprotobuf-dev protobuf-compiler cmake

ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 12.13.0

RUN mkdir -p $NVM_DIR
# Install nvm with node and npm
RUN curl https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash \
    && source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

RUN npm config set python python2.7
RUN npm config set msvs_version 2015

RUN npm install pm2 -g
RUN npm install node-gyp -g

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
RUN curl -o latest.zip https://github.com/nullabork/talkbot/archive/betabot.zip
RUN unzip latest.zip -d /usr/src/app

RUN ls /usr/src/app

RUN npm install
RUN npm rebuild

# EXPOSE 80
# EXPOSE 443

# CMD ["pm2-runtime", "start", "ecosystem.config.js", "--only", "docker"]