#!/usr/bin/env bash

# $1 notify type
CHAT_ID=${CHAT_ID}
BOT=${BOT}

COMMIT_MESSAGE="$(git log --format=%B -n 1)"
SERVER_NAME="${CIRCLE_BRANCH}"
if [[ "${CIRCLE_BRANCH}" == *"master"* ]]; then
	SERVER_NAME="dev"
fi

if [ "$1" == "start" ]; then
	TYPE="Starting"
elif [ "$1" == "end" ]; then
   TYPE="Finished"
else
   TYPE="[ERRORED](${CIRCLE_BUILD_URL})"
fi

ORIGIN_URL=`git config --get remote.origin.url`; \
URL_REMOVE_FIRST="${ORIGIN_URL#git@github.com:}"; \
URL_REMOVE_LAST="${URL_REMOVE_FIRST%.git}"; \
URL_TO_COMMIT="https://github.com/${URL_REMOVE_LAST}/commit/${CIRCLE_SHA1}"

OUTPUT_MESSAGE="${TYPE}
Deploy by *${CIRCLE_USERNAME}*
Repo: *${CIRCLE_PROJECT_REPONAME}*
Commit: [${COMMIT_MESSAGE}](${URL_TO_COMMIT})
Server: *${SERVER_NAME}*"

curl -G "https://api.telegram.org/bot${BOT}/sendMessage" \
	--data-urlencode "disable_web_page_preview=1" \
	--data-urlencode "disable_notification=1" \
	--data-urlencode "parse_mode=markdown" \
	--data-urlencode "chat_id=${CHAT_ID}" \
	--data-urlencode "text=${OUTPUT_MESSAGE}"
