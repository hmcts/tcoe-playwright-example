FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /playwright/

COPY package.json ./

RUN corepack enable && \
  yarn install && \
  npx playwright install --with-deps && \
  npx playwright install chrome

COPY . .

ENTRYPOINT [ "/bin/bash", "-l", "-c" ]
