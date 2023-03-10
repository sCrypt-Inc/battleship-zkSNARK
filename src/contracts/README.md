# Integrating frontend

We will introduce how to integrate the front end, including connecting wallets, deploying contracts, and calling contracts.


## Initialize the contract class

Use the contract artifact file to initialize the contract class at the front end. 

```ts
import { ZkBattleship } from './contracts/zkBattleship';
import artifact from './contracts/zkBattleship.json';
ZkBattleship.init(artifact);
```

## Connect wallet

`Signer` is the class that accesses the private key. Private keys can sign transactions to authorize users to perform certain actions.

`Provider` is an abstraction for operations on the blockchain, such as broadcasting transactions. Usually not involved in signing transactions.


Call the `getConnectedTarget()` interface of the signer to request to connect to the wallet.

```ts
try {
    const provider = new WhatsonchainProvider(bsv.Networks.testnet);
    const signer = new SensiletSigner(provider);
    await signer.getConnectedTarget();
} catch (error) {
    console.error("connect wallet failed", error);
}
```


## Deploying contract

Instantiate the contract and call `deploy()` to deploy the contract.

```ts
    const balance = 1000
    const instance = new ZkBattleship().markAsGenesis();
    await instance.connect(signer);
    const tx = await instance.deploy(balance);
```

## Calling contract

Calling the contract requires the following work:

1. Create a new contract instance via the `.next()` method of the current instance. Update the state of the new instance state.

2. Call the methods public method on the contract instance to send the transaction to execute the contract on the blockchain.


```ts
// create the next instance from the current
let nextInstance = instance.next();
// apply updates on the next instance locally
nextInstance.count++;
// call the method of current instance to apply the updates on chain
const { tx: tx_i } = await instance.methods.increment(
    {
    next: {
        instance: nextInstance,
        balance
    }
    } as MethodCallOptions<ZkBattleship>
);
```

## Learn sCrypt

If you want to learn more about sCrypt, go [here](https://learn.scrypt.io/en).