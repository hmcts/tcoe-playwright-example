FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /playwright/

COPY package.json ./

RUN corepack enable
RUN yarn install

COPY . .

ENTRYPOINT [ "/bin/bash", "-l", "-c" ]
