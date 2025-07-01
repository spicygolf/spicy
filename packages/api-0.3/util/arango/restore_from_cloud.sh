#!/bin/zsh

SCRIPT=`basename "$0"`

usage ()
{
  echo "Usage: ${SCRIPT} yyyymmdd"
  exit
}

if [ "$#" -ne 1 ]
then
  usage
fi

DT="$1"

rm -rf ./tmp/spicygolf/dump
rm -rf ./spicygolf-${DT}.tar.bz2

gsutil cp gs://spicy-golf-prod-backups/spicygolf-${DT}.tar.bz2 .
tar jxvf ./spicygolf-${DT}.tar.bz2

arangorestore \
  --input-directory tmp/spicygolf/dump \
  --server.database dg \
  --server.username dg \
  --threads 1

arangosh \
  --server.database dg \
  --server.username dg \
  --javascript.execute graph.js
