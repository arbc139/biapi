# bio-api-backend

> Bio API web backend project

## Version
Node 8

## Hosting Setup

```bash
# Open backend server on localhost:${PORT}
# Basically, recommends to use '5000' PORT.
PORT=${PORT} npm start
```

## SSL
directory 'ssl' is https related.
Please make private key and update public key before build up.
```bash
# Make private key
openssl genrsa -out ssl/key.pem 1024
# Make public key
openssl req -x509 -new -key ssl/key.pem > ssl/cert.pem
```
