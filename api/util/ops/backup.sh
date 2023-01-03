#!/bin/bash

/opt/spicy.golf/api/util/arango/dump.sh > /var/log/spicygolf/backup-`date +\%Y\%m\%d`.log 2>&1
