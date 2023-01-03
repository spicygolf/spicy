#!/bin/bash

PWD=`pwd`

cd /opt/spicy.golf/api || exit

/usr/local/bin/node util/ghin --clubs > /var/log/spicygolf/ghin-`date +\%Y\%m\%d`.log 2>&1

cd ${PWD} || exit
