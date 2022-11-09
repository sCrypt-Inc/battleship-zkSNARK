const { expect } = require('chai');
const snarkjs = require("snarkjs-scrypt");

const { buildContractClass, bsv, PubKeyHash, toHex, Int, getPreimage, PubKey, signTx } = require('scryptlib');

const { loadDesc, newTx, inputSatoshis, shipHash} = require('../helper');

const privateKeyPlayer = new bsv.PrivateKey.fromRandom('testnet')
const publicKeyPlayer = bsv.PublicKey.fromPrivateKey(privateKeyPlayer)

const privateKeyComputer = new bsv.PrivateKey.fromRandom('testnet')
const publicKeyComputer = bsv.PublicKey.fromPrivateKey(privateKeyComputer)

const playerShips = [
  [7, 1, 1],
  [1, 1, 0],
  [1, 4, 1],
  [3, 5, 0],
  [6, 8, 0],
];


const computerShips = [
  [7, 1, 1],
  [1, 1, 0],
  [1, 4, 1],
  [3, 5, 0],
  [6, 8, 0],
]


describe('Test sCrypt contract BattleShip In Javascript', () => {
  let battleShip, result

  before(async () => {
    const BattleShip = buildContractClass(loadDesc('battleship'));

    const yourhash = await shipHash(playerShips);
    const computerhash = await shipHash(computerShips);
    battleShip = new BattleShip(new PubKey(toHex(publicKeyPlayer)),
      new PubKey(toHex(publicKeyComputer)),
      new Int(yourhash), new Int(computerhash), 0, 0, true, new Array(100).fill(false),new Array(100).fill(false))
  });

  function coordsToIndex(x, y) {
    return y * 10 + x;
  }


  async function testMove(contract, ships, x, y, yourturn, newStates) {
    console.log('generating proof ...')

    const { proof, publicSignals } = await snarkjs.groth16.fullProve({
      "boardHash": await shipHash(ships),
      "guess": [
          x,
          y
      ],
      "ships": ships
  }, "./circuits/battleship_js/battleship.wasm", "./circuits/circuit_final.zkey");


    const hit = publicSignals[0] === "1" ? true : false;
    console.log('hit', hit)
    const tx = newTx();

    tx.addOutput(new bsv.Transaction.Output({
      script: contract.getNewStateScript(newStates),
      satoshis: inputSatoshis
    }))

    const sig = signTx(tx, yourturn ? privateKeyPlayer : privateKeyComputer, contract.lockingScript, inputSatoshis)

    const preimage = getPreimage(tx, contract.lockingScript, inputSatoshis);

    const context = { tx, inputIndex: 0, inputSatoshis: inputSatoshis }

    const Proof = contract.getTypeClassByType("Proof");
    const G1Point = contract.getTypeClassByType("G1Point");
    const G2Point = contract.getTypeClassByType("G2Point");
    const FQ2 = contract.getTypeClassByType("FQ2");

    console.log('calling contract move() function ...')
    const result = contract.move(sig, x, y, hit , new Proof({
      a: new G1Point({
        x: new Int(proof.pi_a[0]),
        y: new Int(proof.pi_a[1]),
      }),
      b: new G2Point({
        x: new FQ2({
          x: new Int(proof.pi_b[0][0]),
          y: new Int(proof.pi_b[0][1]),
        }),
        y: new FQ2({
          x: new Int(proof.pi_b[1][0]),
          y: new Int(proof.pi_b[1][1]),
        })
      }),
      c: new G1Point({
        x: new Int(proof.pi_c[0]),
        y: new Int(proof.pi_c[1]),
      })

    }), inputSatoshis, preimage).verify(context)

    contract.successfulYourHits = newStates.successfulYourHits;
    contract.successfulComputerHits = newStates.successfulComputerHits;
    contract.yourTurn = newStates.yourTurn;
    contract.yourHits = newStates.yourHits;
    contract.computerHits = newStates.computerHits;

    return result;
  }


  it('should success when player move x=1, y=1, hit=true', async () => {

    const yourHits =  new Array(100).fill(false);
    const computerHits =  new Array(100).fill(false);
    
    yourHits[coordsToIndex(1,1)] = true;
    
    result = await testMove(battleShip, playerShips, 1, 1, true, {
      successfulYourHits: 1,
      successfulComputerHits: 0,
      yourTurn: false,
      yourHits: yourHits,
      computerHits: computerHits
    })

    // eslint-disable-next-line no-unused-expressions
    expect(result.success, result.error).to.be.true

  }).timeout(2000000);;


  it('should success when computer move x=0, y=0, hit=false', async () => {

    const yourHits =  new Array(100).fill(false);
    const computerHits =  new Array(100).fill(false);

    yourHits[coordsToIndex(1,1)] = true;
    computerHits[coordsToIndex(0,0)] = true;

    result = await testMove(battleShip, playerShips, 0, 0, false,  {
      successfulYourHits: 1,
      successfulComputerHits: 0,
      yourTurn: true,
      yourHits: yourHits,
      computerHits: computerHits
    })

    // eslint-disable-next-line no-unused-expressions
    expect(result.success, result.error).to.be.true

  }).timeout(2000000);


});

