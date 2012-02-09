#!/bin/sh
# Copyright (C) 2011 Citrix Systems, Inc.  All rights reserved
#     
# This software is licensed under the GNU General Public License v3 or later.
# 
# It is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or any later version.
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
# 
# Version 3.0.0.2012-02-09T01:27:42Z

set -e

usage() {
  echo "$0 <VM uuid>"
  echo " -- fakes the presence of PV tools in <VM uuid>"
  echo " -- NB the VM must be either paused or running on localhost"
}
 
fake(){
  local uuid=$1
  domid=$(xe vm-list uuid=${uuid} params=dom-id --minimal)
  xenstore-write /local/domain/${domid}/attr/PVAddons/MajorVersion ${major} \
                 /local/domain/${domid}/attr/PVAddons/MinorVersion ${minor} \
                 /local/domain/${domid}/attr/PVAddons/MicroVersion ${micro} \
                 /local/domain/${domid}/data/updated 1
}

VERSION_RE="\([[:digit:]]\{1,3\}\.\)\{2\}[[:digit:]]\{1,3\}"

uuid=$(xe vm-list uuid=$1 params=uuid --minimal)
if [ $? -ne 0 ]; then
  echo "Argument should be a VM uuid"
  usage
  exit 1
fi

# use the INSTALLATION_UUID from here:
. /etc/xensource-inventory

product_version=$(xe host-list params=software-version uuid="$INSTALLATION_UUID" | \
        sed -n -e 's/product_version: \('${VERSION_RE}'\).*/\1/' \
               -e 's/^.*\('${VERSION_RE}'\)/\1/p')

if [ $? -ne 0 ]; then
  echo "Failed to get product version"
  exit 1
fi

major=$(echo $product_version | cut -f 1 -d .)
minor=$(echo $product_version | cut -f 2 -d .)
micro=$(echo $product_version | cut -f 3 -d .)

# Check the VM is running on this host
resident_on=$(xe vm-list uuid=${uuid} params=resident-on --minimal)
if [ "${resident_on}" != "${INSTALLATION_UUID}" ]; then
  echo "VM must be resident on this host"
  exit 2
fi

power_state=$(xe vm-list uuid=${uuid} params=power-state --minimal)
case "${power_state}" in
  running)
    fake $uuid
    ;;
  paused)
    fake $uuid
    ;;
  *)
    echo "VM must be either running or paused"
    exit 3
    ;;
esac


