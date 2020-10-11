#!/bin/bash

# cp -r /build-dir/node_modules/ /usr/src/app/
# cp -r /build-dir/node_modules /usr/src/app/

# mkdir -p /root/.google/
# cp /usr/src/app/config/google-auth.json /root/.google/

exec pm2-runtime start ecosystem.config.js