#!/bin/bash
# SSL Certificate Auto-Renewal Script for myralix.com
# Let's Encrypt certificates expire every 90 days

certbot renew --quiet --deploy-hook "systemctl reload apache2"
