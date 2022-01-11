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

  echo "MAILGUN_API_KEY=$MAIL_API_KEY" >>.env
  echo "MAILGUN_API_DOMAIN=$MAIL_API_DOMAIN" >>.env

  echo "Environments was loaded!"
}

function deploy() {
  load_env

  rsync -avz -e "${SSH_PARAMS}" "${PATH_CIRCLE}" circleci@"$1":"$2" --delete --exclude='tmp' \
    --include="dist/***" \
    --include="static/***" \
    --include="upload/***" \
    --include="node_modules/***" \
    --include="*.js" \
    --include=".env" \
    --include=".env.*" \
    --include="*.json" \
    --include="yarn.lock" \
    --exclude='*'

  # Go-to dir
  SSH_COMMAND="cd $2 && "

  # Copy the Yandex.Cloud certificate
  SSH_COMMAND+="mkdir -p certs && "
  SSH_COMMAND+='wget "https://storage.yandexcloud.net/cloud-certs/CA.pem" -O certs/root.crt && '

  # Cleanup `tmp` folder
  SSH_COMMAND+="find $(pwd)/upload -type f -atime +7 -delete && "

  # Run command
  SSH_COMMAND+="pm2 restart api --update-env"

  bash -c "$SSH_PARAMS -t circleci@$1 \"$SSH_COMMAND \""
}

# if [ "${CIRCLE_BRANCH}" == "development" ]; then
deploy "62.84.118.81" "/var/www/api-backend"
# fi

# TODO: Temporarily run same IP from master
# if [ "${CIRCLE_BRANCH}" == "master" ]; then
#   deploy "178.154.229.105" "/var/www/api-backend"
# fi
