# syntax=docker/dockerfile:1

# Minimal Nginx image that ships our config.
# Certbot writes certs into the named volume; Nginx reads them from there.
FROM nginx:1.27-alpine

# Remove the default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our configs
COPY nginx.conf      /etc/nginx/nginx.conf
COPY conf.d/         /etc/nginx/conf.d/

# Create the Certbot webroot directory used for ACME challenges
RUN mkdir -p /var/www/certbot

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
