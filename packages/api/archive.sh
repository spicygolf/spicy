#!/bin/bash

VERSION=$1

rm sg_api-${VERSION}.zip

zip -r sg_api-${VERSION}.zip \
  .env.production \
  README.md \
  config.js \
  ecosystem.config.js \
  index.js \
  package.json \
  src \
  test \
  yarn.lock
