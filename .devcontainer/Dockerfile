FROM jzohrab/lute3:latest

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends  \ 
        mecab mecab-ipadic-utf8; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*; \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# RUN mkdir /usr/local/nvm
# ENV NVM_DIR /usr/local/nvm
# ENV NODE_VERSION 20.17.0
# RUN curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash \
#     && . $NVM_DIR/nvm.sh \
#     && nvm install $NODE_VERSION \
#     && nvm alias default $NODE_VERSION \
#     && nvm use default

# ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
# ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH
