# Insight UI

This repository contains the user-interface for [Insight](https://github.com/followthemoney/insight/).

### Development

Copy over `.env.example` to `.env`:
```
cp ./.env.example ./.env
```

As we are using [mkcert] to encrypt the local development environment, make sure
to include it's CA certificate in the NodeJS CA certificate store:
```
export NODE_EXTRA_CA_CERTS=~/.local/share/mkcert/rootCA.pem
```
