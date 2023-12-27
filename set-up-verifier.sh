#!/bin/sh

# Exit if any subcommand fails
set -e

mkdir -p out

mkdir -p public/zk

cd circuits

zokrates --version
zokrates compile -i battleship.zok

echo "setup ..."

zokrates setup

echo "export ..."

zokrates export-verifier-scrypt

cp -f verifier/src/contracts/snark.ts src/contracts/snark.ts

# mv output files to public folder
cp out abi.json verification.key proving.key ../public/zk/

cd ../

echo "compile contract ..."
npm run compile