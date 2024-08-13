
#!/bin/bash
# Provisioning file for Vagrant
#
# Install the Django app
#

set -e

# Source configuration
THIS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
. ${THIS_DIR}/setup_config.sh

cd ${INSTALL_DIR}

## This is useful in case you want to make a real deployment,
## the development version will just use the code from the
## development folder of the user
if [ ${FETCH_FROM_GIT:-"0"} != "0" ]; then
    git clone --single-branch --branch modernize https://github.com/qgis/QGID-Plugins-Website.git .
else
    if [ ! -e /var/qgis_plugins/qgis-app ]; then
    ln -s /vagrant/qgis-app/ /var/qgis_plugins/
    fi
fi

if [ -e ${INSTALL_DIR}/venv ]; then
    rm -rf ${INSTALL_DIR}/venv
fi

python3 -m venv ${INSTALL_DIR}/venv
. ${INSTALL_DIR}/venv/bin/activate
pip3 install wheel
# Not really necessary, but useful for development:
pip3 install ipython
pip3 install -r qgis-app/REQUIREMENTS_plugins.txt
cp ${THIS_DIR}/settings_local_vagrant.py ${INSTALL_DIR}/qgis-app
for var in DB_NAME DB_USER DB_PASSWORD MEDIA_ROOT; do
    sed -i -e "s@##${var}##@${!var}@" ${INSTALL_DIR}/qgis-app/settings_local_vagrant.py
done

# Required for Whoosh indexing
mkdir ${INSTALL_DIR}/qgis-app/whoosh_index
chown -R www-data.www-data ${INSTALL_DIR}/qgis-app/whoosh_index
# Fix permissions on Whoosh index parent folder
chmod 777 ${INSTALL_DIR}/qgis-app

cd ${INSTALL_DIR}/qgis-app
rm -rf /vagrant/qgis-app/static_media
python manage.py migrate --settings=settings_local_vagrant
python manage.py collectstatic -c --settings=settings_local_vagrant
