#!/bin/sh
set -e

mkdir -p public/zk

cd circuits

circom battleship.circom --r1cs --wasm
snarkjs powersoftau new bn128 12 pot12_0000.ptau
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -e="$(openssl rand -base64 20)"
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau
snarkjs groth16 setup battleship.r1cs pot12_final.ptau battleship_0000.zkey
snarkjs zkey contribute battleship_0000.zkey battleship_0001.zkey --name="Second contribution" -e="$(openssl rand -base64 20)"
snarkjs zkey contribute battleship_0001.zkey circuit_final.zkey --name="Third contribution" -e="$(openssl rand -base64 20)"

snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

snarkjs zkey export scryptverifier circuit_final.zkey

cd verifier/
cp ../../src/contracts/zkBattleship.ts src/contracts/

git init
npm i
npm run build && npm run apply-optim

echo "const distModule = require('./dist/src/contracts/zkBattleship.js'); ( async () => { await distModule.BattleShip.compile(); })()"  > compile.js

node compile.js

cd ../


cp battleship_js/battleship.wasm circuit_final.zkey verification_key.json ../public/zk/
cp ../node_modules/snarkjs-scrypt/build/snarkjs.min.js ../public/zk/

cd ../
cp -f circuits/verifier/src/contracts/verifier.ts src/contracts/verifier.ts
cp -f circuits/verifier/scrypts/src/contracts/zkBattleship.json src/contracts/zkBattleship.json

echo "setup successfull!"
