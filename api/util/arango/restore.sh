#!/bin/bash

arangorestore \
  --input-directory dump \
  --server.database dg \
  --server.username dg \
  --threads 1
