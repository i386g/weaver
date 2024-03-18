#!/bin/bash

echo "--> Removing .env file."
rm -f ./.env

echo "--> Removing .env file symlinks."
rm -f ./server/.env

echo "--> Creating .env file."
TELEGRAM_BOT_TOKEN=$(openssl rand -hex 32)
echo "TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN" >> .env

echo "--> Creating .env file symlinks."
ln ./.env ./server/.env

echo "--> Reading .env file."
cat ./.env

