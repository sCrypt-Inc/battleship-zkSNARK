#!/bin/sh
set -e

mkdir -p public/zk

cd circuits

circom battleship.circom --r1cs --wasm
npx snarkjs powersoftau new bn128 12 pot12_0000.ptau
npx snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -e="$(openssl rand -base64 20)"
npx snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau
npx snarkjs groth16 setup battleship.r1cs pot12_final.ptau battleship_0000.zkey
npx snarkjs zkey contribute battleship_0000.zkey battleship_0001.zkey --name="Second contribution" -e="$(openssl rand -base64 20)"
npx snarkjs zkey contribute battleship_0001.zkey circuit_final.zkey --name="Third contribution" -e="$(openssl rand -base64 20)"

npx snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

npx snarkjs zkey export scryptverifier circuit_final.zkey

cp battleship_js/battleship.wasm circuit_final.zkey verification_key.json ../public/zk/
cp ../node_modules/snarkjs-scrypt/build/snarkjs.min.js ../public/zk/

cp -f verifier/src/contracts/snark.ts ../src/contracts/snark.ts

cd ../
echo "compile contract ..."
npm run compile

cp -f artifacts/zkBattleship.json src/contracts/zkBattleship.json

echo "setup successfull!"
