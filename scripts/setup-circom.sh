#!/bin/sh
set -e

mkdir -p public/zk

cd circuits

CONTRACTS="battleship"

for contract in $CONTRACTS; do
  echo "compiling circuit: circuits/${contract}.circom"
  circom ${contract}.circom --r1cs --wasm
  snarkjs powersoftau new bn128 12 pot12_0000.ptau
  snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -e="$(openssl rand -base64 20)"
  snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau
  snarkjs groth16 setup ${contract}.r1cs pot12_final.ptau ${contract}_0000.zkey
  snarkjs zkey contribute ${contract}_0000.zkey ${contract}_0001.zkey --name="Second contribution" -e="$(openssl rand -base64 20)"
  snarkjs zkey contribute ${contract}_0001.zkey circuit_final.zkey --name="Third contribution" -e="$(openssl rand -base64 20)"
  
  snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

  snarkjs zkey export scryptverifier circuit_final.zkey ../contracts/verifier.scrypt

  cp ${contract}_js/${contract}.wasm circuit_final.zkey verification_key.json ../public/zk/
  cp ../node_modules/snarkjs/build/snarkjs.min.js ../public/zk/
  
  cd ..
  echo "compiling ./contracts/battleship.scrypt ..."
  npx scryptlib ./contracts/battleship.scrypt
  cp ./out/battleship_desc.json ./public/battleship_debug_desc.json
  echo "setup successfully!"

done
