FROM node:10.16-alpine
WORKDIR /opt/mre

COPY package*.json ./
RUN ["npm", "install", "--unsafe-perm"]
RUN ["npm", "install", "stevenvergenz/forwarded-from#69523e6"]
COPY adapter.js ./node_modules/@microsoft/mixed-reality-extension-sdk/built/adapters/multipeer/

COPY tsconfig.json ./
COPY src ./src/
RUN ["npm", "run", "build"]

COPY public ./public/

EXPOSE 3901/tcp
CMD ["npm", "start"]