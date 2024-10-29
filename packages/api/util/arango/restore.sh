#!/bin/bash

arangorestore \
  --input-directory tmp/spicygolf/dump \
  --server.database dg \
  --server.username dg \
  --threads 1

arangosh \
  --server.database dg \
  --server.username dg \
  --javascript.execute graph.js
