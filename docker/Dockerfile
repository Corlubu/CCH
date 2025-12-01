FROM debian:12

WORKDIR /app

RUN DEBIAN_FRONTEND=noninteractive apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install --yes curl wget && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash && \
    DEBIAN_FRONTEND=noninteractive apt-get install --yes nodejs && \
    DEBIAN_FRONTEND=noninteractive apt-get install --yes wget build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev vim less iputils-ping sudo libsecret-1-0 command-not-found rsync man-db netcat-openbsd dnsutils procps lsof tini && \
    DEBIAN_FRONTEND=noninteractive apt-get update

RUN npm install -g pnpm
RUN pnpm set store-dir /app/node_modules/.pnpm-store

# Copy package files first for better Docker layer caching
COPY package.json pnpm-lock.yaml ./

# Copy prisma schema before install so that prisma generate can run
COPY prisma ./prisma

# Copy src directory and tsr config before install so that tsr generate can run
COPY src ./src
COPY tsr.config.json ./

# Install dependencies (this runs postinstall which includes prisma generate and tsr generate)
RUN pnpm install

# Copy the rest of the application code
COPY . .
