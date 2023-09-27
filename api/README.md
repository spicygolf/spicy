# Spicy Golf API

Node, Hapi, Apollo GraphQL Server API layer for Spicy Golf mobile app and website.

## Development Setup

 * Install Bun, ArangoDB
 * Install XCode
 * Install command-line developer tools

         xcode-select --install

 * Install dependencies

        bun install

 * Setup a database, with username and password: all with the names/values of `dg`
 * To seed the development database, ask someone for an arangodb dump of PROD or DEV db.

 * Add `.env` and `src/config.js` to the project root folder.  Ask someone for them.
 * Start up the API

        bun run start:dev

## Production Setup

TODO: devops much?

 * Install NodeJS, ArangoDB
   * `systemctl start arangodb3`
   * `systemctl enable arangodb3`
 * `su - golf` - everything under the 'golf' user
 * Install google-cloud-sdk - https://cloud.google.com/sdk/docs/install#rpm
   * update yum/dnf with Cloud SDK repo information
   * `yum install google-cloud-sdk`
   * copy json creds file to `/home/golf/.gcloud/` and change to 444 golf:golf
   * `gcloud auth activate-service-account spicy-golf-prod-backups@spicy-golf-prod-275814.iam.gserviceaccount.com --key-file=./.gcloud/spicy-golf-prod-74605bebfada.json`
 * cron symlink
   * `ln -s /opt/spicy.golf/api/util/ops /home/golf/`
   * `cp /opt/spicy.golf/api/util/ops/spicygolf.cron /etc/cron.d/`
   * `chmod 644 /etc/cron.d/spicygolf.cron`
   * `chown root:root /etc/cron.d/spicygolf.cron`
 * enable chrony
   * `systemctl start chronyd`
   * `systemctl enable chronyd`
 * nginx config (in repo `util/ops/nginx`), Dalton's magic to get Arango Web access limited to Brad's home IP)
   * some of it is in 'puppet-games' repo gitlab/boorad

