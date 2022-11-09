

const { buildContractClass, PubKey, bsv,  Int,  buildTypeClasses, toHex, getPreimage, signTx } = require('scryptlib');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { initialize } = require('zokrates-js');
const { buildMimc7 } = require('circomlibjs');
const { loadDesc,deployContract, createInputFromPrevTx, fetchUtxos, sendTx} = require('./helper');
const { privateKey } = require('./privateKey');

bsv.Transaction.FEE_PER_KB = 0.0001;

const playerShips = [
  [7, 1, 1],
  [1, 1, 0],
  [1, 4, 1],
  [3, 5, 0],
  [6, 8, 0],
];


async function zokratesProof(ships, x, y) {

  const defaultProvider = await initialize();

  let zokratesProvider = defaultProvider.withOptions({ 
    backend: "bellman",
    curve: "bn128",
    scheme: "g16"
});

  const program = fs.readFileSync(path.join(__dirname, 'circuits', 'out'));
  let abi = JSON.parse(fs.readFileSync(path.join(__dirname, 'circuits', 'abi.json')).toString());


  // computation
  const { witness, output } = zokratesProvider.computeWitness({
    program: program,
    abi: abi
  }, await shipsToWitness(ships, x, y));

  const provingkey = fs.readFileSync(path.join(__dirname, 'circuits', 'proving.key')).toJSON().data
  const verificationkey = JSON.parse(fs.readFileSync(path.join(__dirname, 'circuits', 'verification.key')).toString())

  const proof = zokratesProvider.generateProof(program, witness, provingkey);

  // or verify off-chain
  const isVerified = zokratesProvider.verify(verificationkey, proof);

  console.log('zokrates isVerified:' + isVerified)

  return {
    proof,
    output
  };
}


async function run() {

  console.log('zokrates generating proof ...')

  const {proof, output}  = await zokratesProof(playerShips, 0, 0);

  console.log('compiling contract ...')

  const Verifier = buildContractClass(loadDesc('verifier'));

  const { Proof, G1Point, G2Point, FQ2 } = buildTypeClasses(Verifier);
  const verifier = new Verifier();

  console.log("Simulate a verification call ...");

  const unlockCall = verifier.unlock(proof.inputs.map(input => new Int(input)),
    new Proof({
      a: new G1Point({
        x: new Int(proof.proof.a[0]),
        y: new Int(proof.proof.a[1]),
      }),
      b: new G2Point({
        x: new FQ2({
          x: new Int(proof.proof.b[0][0]),
          y: new Int(proof.proof.b[0][1]),
        }),
        y: new FQ2({
          x: new Int(proof.proof.b[1][0]),
          y: new Int(proof.proof.b[1][1]),
        })
      }),
      c: new G1Point({
        x: new Int(proof.proof.c[0]),
        y: new Int(proof.proof.c[1]),
      })
    })
  );

  //const result = unlockCall.verify();

  //assert.ok(result.success, result.error)

  console.log("Verification OK");


  console.log('start deploying zkSNARK verifier ... ')
  const tx = await deployContract(verifier, 1000);
  console.log('deployed txid:     ', tx.id)

  const unlockingTx = new bsv.Transaction();
  unlockingTx.addInput(createInputFromPrevTx(tx))
  .change(privateKey.toAddress())
  .setInputScript(0, (_) => {
      return unlockCall.toScript();
  })
  .seal()

  
  // unlock
  console.log('start calling zkSNARK verifier ... ')
  await sendTx(unlockingTx)

  console.log('unlocking txid:     ', unlockingTx.id)

  console.log('Succeeded on testnet')

}




async function deploy() {

  const privateKeyPlayer = new bsv.PrivateKey.fromRandom('testnet');

  const publicKeyPlayer = bsv.PublicKey.fromPrivateKey(privateKeyPlayer);
  const pkhPlayer = bsv.crypto.Hash.sha256ripemd160(publicKeyPlayer.toBuffer());
  const addressPlayer = privateKeyPlayer.toAddress();


  const privateKeyComputer = new bsv.PrivateKey.fromRandom('testnet');

  const publicKeyComputer = bsv.PublicKey.fromPrivateKey(privateKeyComputer);
  const pkhComputer = bsv.crypto.Hash.sha256ripemd160(publicKeyComputer.toBuffer());
  const addressComputer = privateKeyComputer.toAddress();


  console.log('generating proof ...')

  const {proof, output}  = await zokratesProof(playerShips, 6, 8, true);


  const Battleship = buildContractClass(loadDesc('battleship'));

  const { Proof, G1Point, G2Point, FQ2 } = buildTypeClasses(Battleship);

  const playerHash = await hashShips(playerShips);
  const computerHash = await hashShips(playerShips);

  const battleship = new Battleship(new PubKey(toHex(publicKeyPlayer)),
    new PubKey(toHex(publicKeyComputer)),
    new Int(playerHash), new Int(computerHash), 0, 0, true);

  console.log("deploying  ...");
  const initAmount = 1000;
  const deployTx = await deployContract(battleship, initAmount);

  console.log("deployed:", deployTx.id);

  const newLockingScript = battleship.getNewStateScript({
      successfulYourHits: output ? 1 : 0,
      successfulComputerHits: 0,
      yourTurn: false })


  const unlockingTx = new bsv.Transaction();

  unlockingTx.addInput(createInputFromPrevTx(deployTx))
  unlockingTx.setOutput(0, (tx) => {
    const amount = initAmount- tx.getEstimateFee();

    if(amount < 1) {
      throw new Error('Not enough funds.')
    }

    return new bsv.Transaction.Output({
      script: newLockingScript,
      satoshis: amount,
    })
  })
  .setInputScript(0, (tx, output) => {
    const preimage = getPreimage(tx, output.script, output.satoshis)
    const currentTurn = true;
    const privateKey = currentTurn ? privateKeyPlayer : publicKeyComputer;
    const sig = signTx(tx, privateKey, output.script, output.satoshis)
    let amount = initAmount - tx.getEstimateFee();

    return battleship.move(sig, 6, 8, true, new Proof({
      a: new G1Point({
        x: new Int(proof.proof.a[0]),
        y: new Int(proof.proof.a[1]),
      }),
      b: new G2Point({
        x: new FQ2({
          x: new Int(proof.proof.b[0][0]),
          y: new Int(proof.proof.b[0][1]),
        }),
        y: new FQ2({
          x: new Int(proof.proof.b[1][0]),
          y: new Int(proof.proof.b[1][1]),
        })
      }),
      c: new G1Point({
        x: new Int(proof.proof.c[0]),
        y: new Int(proof.proof.c[1]),
      })
    }), amount, preimage).toScript();

  })
  .change(privateKey.toAddress())
  .seal();

  console.log("unlocking ...")
  await sendTx(unlockingTx)

  console.log("unlockingTx OK", unlockingTx.id);

}


async function  shipsToWitness(ships, x, y) {
  let witness = [];

  for (let i = 0; i < ships.length; i++) {
    const ship = ships[i];
    witness.push(...ship.map(n => n.toString()));
  }

  const hash = await hashShips(ships)

  witness.push(hash)
  witness.push(x.toString())
  witness.push(y.toString())

  console.log('withness', witness.join(' '))
  return witness;
}

function reverseHex(r) {
  return Buffer.from(r, 'hex').reverse().toString('hex')
}

async function hashShips(placedShips) {

  let shipPreimage = 0n;
  for (let i = 0; i < placedShips.length; i++) {
    const ship = placedShips[i];
    // eslint-disable-next-line no-undef
    shipPreimage += BigInt(ship[0] * Math.pow(16, i * 3) + ship[1] * Math.pow(16, i * 3 + 1) + ship[2] * Math.pow(16, i * 3 + 2));
  }

  const mimc7 = await buildMimc7();
  return mimc7.F.toString(mimc7.hash(shipPreimage, 0));
}



if(process.argv.includes('--run')) {
  run().then(() => {
    process.exit(0);
  })
  .catch(e => {
    if(e.response) {
      console.error('error: ', e.response.data)
    } else {
      console.error('error: ', e)
    }
  })
}

if(process.argv.includes('--deploy')) {
  deploy().then(() => {
    process.exit(0);
  })
  .catch(e => {
    if(e.response) {
      console.error('error: ', e.response.data)
    } else {
      console.error('error: ', e)
    }
  })
}

module.exports = {
  shipsToWitness,
  hashShips,
  reverseHex,
  zokratesProof
}

