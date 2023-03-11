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

cd verifier

cp ../../src/contracts/zkBattleship.ts src/contracts/

git init
npm i
npm run build && npm run apply-optim


echo "const distModule = require('./dist/src/contracts/zkBattleship.js'); ( async () => { await distModule.BattleShip.compile(); })()"  > compile.js

node compile.js

cd ../../
cp -f circuits/verifier/src/contracts/verifier.ts src/contracts/verifier.ts
cp -f circuits/verifier/scrypts/src/contracts/zkBattleship.json src/contracts/zkBattleship.json
