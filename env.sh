#!/bin/bash

echo "--> Removing .env file."
rm -f ./.env

echo "--> Removing .env file symlinks."
rm -f ./server/.env

echo "--> Creating .env file."
echo "POSTGRES_HOST=postgres" >> .env
echo "POSTGRES_PORT=5432" >> .env
echo "POSTGRES_DB=postgres" >> .env
echo "POSTGRES_USER=postgres" >> .env
echo "POSTGRES_PASSWORD=postgres" >> .env
echo "TELEGRAM_BOT_TOKEN=" >> .env


echo "--> Creating .env file symlinks."
ln ./.env ./server/.env

echo "--> Reading .env file."
cat ./.env

