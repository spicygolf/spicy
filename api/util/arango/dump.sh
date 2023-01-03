#!/bin/bash

SCRIPT_DIR=`dirname ${0}`
SCRIPT_FILE=`basename ${0}`
DUMP_DIR="/tmp/spicygolf/dump"
BACKUP_DIR="/var/bak/spicygolf"
BACKUP_FILE="spicygolf-`date +%Y%m%d`.tar.bz2"
GS_BACKUP_BUCKET_URL="gs://spicy-golf-prod-backups"

echo "running backup: ${SCRIPT_DIR}/${SCRIPT_FILE}"
echo "dumping to    : ${DUMP_DIR}"
echo "backing up to : ${BACKUP_DIR}/${BACKUP_FILE}"

if [ -d "${DUMP_DIR}" ]; then rm -Rf ${DUMP_DIR}; fi
mkdir -p ${DUMP_DIR}
if [ -f "${BACKUP_DIR}/$BACKUP_FILE" ]; then rm -f ${BACKUP_DIR}/$BACKUP_FILE; fi

arangodump \
  --server.database dg \
  --server.username dg \
  --server.password dg \
  --output-directory ${DUMP_DIR}

tar jcvf ${BACKUP_DIR}/$BACKUP_FILE ${DUMP_DIR}

gsutil cp ${BACKUP_DIR}/$BACKUP_FILE ${GS_BACKUP_BUCKET_URL}
