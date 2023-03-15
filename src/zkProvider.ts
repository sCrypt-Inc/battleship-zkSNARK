
export class ZKProvider {
  static instance;

  program: any;
  proving_key: any;
  verification_key: any;

  constructor(program, proving_key, verification_key) {
    this.program = program;
    this.proving_key = proving_key;
    this.verification_key = verification_key;
  }

  static async init() {
    // console.log('ZKP init...')
    if (ZKProvider.instance) return ZKProvider;
    try {
      let verification_key = await fetch('/zk/verification_key.json').then(resp => resp.json());
      ZKProvider.instance = new ZKProvider(
        "/zk/battleship.wasm",
        "/zk/circuit_final.zkey",
        verification_key
      );
      console.log('ZKP initialized.')
      return ZKProvider;
    } catch (error) {
      console.log('init ZKProvider fail', error)
    }
  }

  static generateProof(witness) {
    if (!ZKProvider.instance) {
      throw Error('Uninitilized ZKProvider, call `ZKProvider.init()` first!');
    }
    return new Promise(async resolve => {
      const { proof, publicSignals } =
        await window['snarkjs'].groth16.fullProve(witness, ZKProvider.instance.program, ZKProvider.instance.proving_key);
      resolve({ proof, publicSignals, isHit: publicSignals[0] === "1" });
    });
  }

  static verify({ proof, publicSignals }) {
    if (!ZKProvider.instance) {
      throw Error('Uninitilized ZKProvider, call `ZKProvider.init()` first!');
    }
    return new Promise(async resolve => {
      const res = await window['snarkjs'].groth16.verify(ZKProvider.instance.verification_key, publicSignals, proof);
      resolve(res);
    });
  }
}

export function runZKP(privateInputs, publicInputs) {
  return ZKProvider
    .init()
    .then(async () => {
      return ZKProvider.generateProof({
        "boardHash": publicInputs[0],
        "guess": publicInputs.slice(1),
        "ships": privateInputs
      });
    })
    .then(async ({ proof, publicSignals, isHit }: any) => {
      const isVerified = await ZKProvider.verify({ proof, publicSignals });
      return { isVerified, proof, isHit };
    })
    .catch(e => {
      console.error('runZKP error:', e)
      return {
        isVerified: false
      }
    })
}
