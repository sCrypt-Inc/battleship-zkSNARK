#!/bin/sh

# Exit if any subcommand fails
set -e

mkdir -p out

mkdir -p public/zk

cd circuits

zokrates --version
zokrates compile --debug -i battleship.zok
zokrates setup
zokrates export-verifier-scrypt

# mv output files to public folder
cp out abi.json verification.key proving.key ../public/zk/


cd ..
cp -f circuits/verifier/src/contracts/verifier.ts src/contracts/verifier.ts

npx scrypt-cli compile
