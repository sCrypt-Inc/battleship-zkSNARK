const snarkjs = require("snarkjs");
const fs = require("fs");
const { buildMimc7 } = require("circomlibjs");
const { buildContractClass, buildTypeClasses, Int } = require("scryptlib/dist");
const { loadDesc } = require("./helper");
const assert = require('assert');

const shipHash = async (ships) => {
    let multiplier = 1n;
    const shipPreimage =
        ships.reduce(
            (res, ship, i) => {
                const val = ships[i][0] + (ships[i][1] * 16) + (ships[i][2] * 16 * 16)
                const r = res + BigInt(val) * multiplier;
                multiplier *= BigInt(16 ** 3);
                return r;
            },
            BigInt(0)
        );
    console.log('shipPreimage', shipPreimage)
    const mimc7 = await buildMimc7();
    return mimc7.F.toString(mimc7.hash([shipPreimage], 0));
}


async function run() {

    const ships = [
        [
         0,
         1,
         1
        ],
        [
         0,
         9,
         1
        ],
        [
         9,
         2,
         0
        ],
        [
         0,
         4,
         1
        ],
        [
         1,
         2,
         0
        ]
       ]
    const hash = await shipHash(ships)

    console.log('hash', hash)
    const { proof, publicSignals } = await snarkjs.groth16.fullProve({
        "boardHash": "11753096322956887640039826940861488168455965873255808204545955793616927219960",
        "guess": [
            4,
            2
        ],
        "ships": ships
    }, "./circuits/battleship_js/battleship.wasm", "./circuits/circuit_final.zkey");

    console.log("Proof: ");
    console.log(JSON.stringify(proof, null, 1));
    console.log("publicSignals: ", publicSignals);

    const vKey = JSON.parse(fs.readFileSync("./circuits/verification_key.json"));

    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    if (res === true) {
        console.log("snarkjs Verification OK");

        const Verifier = buildContractClass(loadDesc('verifier'));

        const { Proof, G1Point, G2Point, FQ2 } = buildTypeClasses(Verifier);
        const verifier = new Verifier();

        console.log("Simulate a verification call ...");

        const unlockCall = verifier.unlock(publicSignals.map(input => new Int(input)),
          new Proof({
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
          })
        );
      
        const result = unlockCall.verify();
      
        assert.ok(result.success, result.error)
      
        console.log("Verification OK");

    } else {
        console.log("Invalid proof");
    }

}

run().then(() => {
    process.exit(0);
});