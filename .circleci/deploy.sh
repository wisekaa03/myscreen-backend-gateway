#!/usr/bin/env bash
set -e

# $1 server url
# $2 dest directory
PATH_CIRCLE='./'
SSH_PARAMS="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

function load_env() {
  rm -rf .env
  touch .env

  echo "Loading environments"

  # Server config
  echo "PORT=$SERVER_PORT" >>.env
  echo "API_PATH=$API_PATH" >>.env
  echo "FRONTEND_URL=$FRONTEND_URL" >>.env
  echo "FILES_UPLOAD=$FILES_UPLOAD" >>.env
  echo "LOG_LEVEL=$LOG_LEVEL" >>.env

  # PostgreSQL Credentials
  echo "DB_DATABASE=$POSTGRES_DB" >>.env
  echo "DB_USERNAME=$POSTGRES_USERNAME" >>.env
  echo "DB_PASSWORD=$POSTGRES_PASSWORD" >>.env
  echo "DB_PORT=$POSTGRES_PORT" >>.env
  echo "DB_HOST=$POSTGRES_HOST" >>.env

  # JWT Credentials
  echo "JWT_ACCESS_TOKEN=$JWT_ACCESS_TOKEN" >>.env
  echo "JWT_ACCESS_EXPIRES=$JWT_ACCESS_EXPIRES" >>.env
  echo "JWT_REFRESH_TOKEN=$JWT_REFRESH_TOKEN" >>.env
  echo "JWT_REFRESH_EXPIRES=$JWT_REFRESH_EXPIRES" >>.env

  # Logstash config
  # echo "KIBANA_URL=$KIBANA_URL" >>.env
  # echo "KIBANA_PORT=$KIBANA_PORT" >>.env

  # Secrets
  echo "AWS_HOST=$AWS_HOST" >>.env
  echo "AWS_ACCESS_KEY=$AWS_ACCESS_KEY" >>.env
  echo "AWS_SECRET_KEY=$AWS_SECRET_KEY" >>.env
  echo "AWS_REGION=$AWS_REGION" >>.env
  echo "AWS_BUCKET=$AWS_BUCKET" >>.env

  echo "MAIL_DOMAIN=$MAIL_DOMAIN" >>.env
  echo "MAIL_KEY_SELECTOR=$MAIL_KEY_SELECTOR" >>.env
  echo "MAIL_PRIVATE_KEY=$MAIL_PRIVATE_KEY" >>.env
  echo "MAIL_HOST=$MAIL_HOST" >>.env
  echo "MAIL_PORT=$MAIL_PORT" >>.env
  echo "MAIL_FROM=$MAIL_FROM" >>.env
  echo "MAIL_USER=$MAIL_USER" >>.env
  echo "MAIL_PASS=$MAIL_PASS" >>.env

  echo "Environments was loaded!"
}

function deploy() {
  load_env

  rsync -avz -e "${SSH_PARAMS}" "${PATH_CIRCLE}" circleci@"$1":"$2" --delete \
    --exclude="node_modules/**/LICENSE" \
    --exclude="node_modules/**/license" \
    --exclude="node_modules/**/LICENSE.txt" \
    --exclude="node_modules/**/*.lock" \
    --exclude="node_modules/**.ts" \
    --exclude="node_modules/**.md" \
    --exclude="node_modules/**.map" \
    --exclude="dist/**.ts" \
    --exclude="dist/**.map" \
    --include="dist/***" \
    --include="templates/***" \
    --include="static/***" \
    --include="upload/***" \
    --include="node_modules/***" \
    --include=".env" \
    --include="ecosystem.config.js" \
    --include="package.json" \
    --include="yarn.lock" \
    --exclude='*'

  # Go-to dir
  SSH_COMMAND="cd $2 && "

  # Copy the Yandex.Cloud certificate
  SSH_COMMAND+="mkdir -p certs && "
  SSH_COMMAND+='wget "https://storage.yandexcloud.net/cloud-certs/CA.pem" -O certs/root.crt && '

  # Cleanup `upload` folder
  SSH_COMMAND+="find $2/upload -type f -atime +7 -delete && "

  # Run command
  SSH_COMMAND+="yarn pm2:start"

  bash -c "$SSH_PARAMS -t circleci@$1 \"$SSH_COMMAND\""
}

# if [ "${CIRCLE_BRANCH}" == "development" ]; then
deploy "62.84.118.81" "/var/www/api-backend"
# fi

# TODO: Temporarily run same IP from master
# if [ "${CIRCLE_BRANCH}" == "master" ]; then
#   deploy "178.154.229.105" "/var/www/api-backend"
# fi
