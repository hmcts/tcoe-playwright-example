FROM mcr.microsoft.com/playwright:v1.51.1-noble

WORKDIR /playwright/

COPY package.json ./

RUN corepack enable
RUN yarn install
RUN yarn playwright install --with-deps
RUN yarn playwright install chromium

COPY . .

ENTRYPOINT [ "/bin/bash", "-l", "-c" ]
