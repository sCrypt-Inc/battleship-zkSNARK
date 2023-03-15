import { initialize } from 'zokrates-js';


export class ZKProvider {
  static instance;

  provider: any;
  program: any;
  abi: any;
  proving_key: any;
  verification_key: any;

  constructor(provider, program, abi, proving_key, verification_key) {
    this.provider = provider;
    this.program = program;
    this.abi = abi;
    this.proving_key = proving_key;
    this.verification_key = verification_key;
  }

  static async init() {
    // console.log('ZKP init...')
    if (ZKProvider.instance) return ZKProvider;
    try {
      const defaultProvider = await initialize();

      let zokratesProvider = defaultProvider.withOptions({
        backend: "bellman",
        curve: "bn128",
        scheme: "g16"
      });
      let program = await fetch('/zk/out').then(resp => resp.arrayBuffer()).then(data => new Uint8Array(data));
      let abi = await fetch('/zk/abi.json').then(resp => resp.json());
      let proving_key = await fetch('/zk/proving.key').then(resp => resp.arrayBuffer()).then(data => new Uint8Array(data));
      let verification_key = await fetch('/zk/verification.key').then(resp => resp.json());
      ZKProvider.instance = new ZKProvider(
        zokratesProvider,
        program,
        abi,
        proving_key,
        verification_key
      )
      // console.log('ZKP initialized.')
      return ZKProvider;
    } catch (error) {
      console.log('init ZKProvider fail', error)
    }
  }

  static computeWitness(args) {
    if (!ZKProvider.instance) {
      throw Error('Uninitilized ZKProvider, call `ZKProvider.init()` first!');
    }
    return new Promise(resolve => {
      resolve(
        ZKProvider.instance.provider.computeWitness(
          {
            program: ZKProvider.instance.program,
            abi: ZKProvider.instance.abi
          },
          args)
      );
    })
  }

  static generateProof(witness) {
    if (!ZKProvider.instance) {
      throw Error('Uninitilized ZKProvider, call `ZKProvider.init()` first!');
    }
    return new Promise(resolve => {
      resolve(
        ZKProvider.instance.provider.generateProof(
          ZKProvider.instance.program,
          witness,
          ZKProvider.instance.proving_key
        )
      );
    });
  }

  static verify(proof) {
    if (!ZKProvider.instance) {
      throw Error('Uninitilized ZKProvider, call `ZKProvider.init()` first!');
    }
    return new Promise(resolve => {
      resolve(
        ZKProvider.instance.provider.verify(
          ZKProvider.instance.verification_key,
          proof
        )
      );
    });
  }
}

// run zero knowledge proof
export function runZKP(privateInputs, publicInputs) {
  return ZKProvider
    .init()
    .then(() => {
      // computer witness for fire result
      return ZKProvider.computeWitness(privateInputs.concat(publicInputs))
    })
    .then(async ({ witness, output }: any) => {
      const proof = await ZKProvider.generateProof(witness);
      output = output === 'true' ? true : false;
      return { proof, output }
    })
    .then(async ({ proof, output }: any) => {
      const isVerified = await ZKProvider.verify(proof) as boolean;
      console.log('verify proof:', isVerified)
      return { isVerified, proof, output };
    })
}