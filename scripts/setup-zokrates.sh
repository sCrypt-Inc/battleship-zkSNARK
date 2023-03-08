#!/bin/bash

# Exit if any subcommand fails
set -e

mkdir -p out

mkdir -p public/zk

cd circuits

zokrates compile --debug -i battleship.zok

zokrates setup

zokrates export-verifier-scrypt

cd ..
cp -f circuits/verifier/src/contracts/verifier.ts contracts/src/contracts/verifier.ts
cd contracts/
npm run compile
cp scrypts/src/contracts/battleship.json ../public/battleship.json
cd ..


cd ..

# mv output files to public folder
cp out abi.json verification.key proving.key ../public/zk/

cd ..
