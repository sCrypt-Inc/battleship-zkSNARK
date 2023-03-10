import { toHex, bsv } from "scrypt-ts";
import { Network } from "./web3";


export const Player = {
  Computer: 'computer',
  You: 'you'
};

// store alice and bob's Privkey
export const PlayerPrivkey = {
  get: (player: any) => {
    return localStorage.getItem(player);
  },
  set: (player: any, key: any) => {
    localStorage.setItem(player, key);
  },
};

// store alice and bob's PublicKey, readonly
export const PlayerPublicKey = {
  get: (player: any) => {
    const key = PlayerPrivkey.get(player);
    if (key) {
      const privateKey = bsv.PrivateKey.fromWIF(key);
      const publicKey = bsv.PublicKey.fromPrivateKey(privateKey);
      return toHex(publicKey);
    }
    throw new Error('Key not found.')
  }
};

export const PlayerPKH = {
  get: (player: any) => {
    const key = PlayerPrivkey.get(player);
    if (key) {
      const privateKey = bsv.PrivateKey.fromWIF(key);
      const publicKey = bsv.PublicKey.fromPrivateKey(privateKey);
      const pkh = bsv.crypto.Hash.sha256ripemd160(publicKey.toBuffer())
      return toHex(pkh);
    }
    throw new Error('Key not found.')
  }
};

// store alice and bob's PublicKey Address, readonly
export const PlayerAddress = {
  get: (player: any) => {
    const key = PlayerPrivkey.get(player);
    if (key) {
      const privateKey = bsv.PrivateKey.fromWIF(key);
      return privateKey.toAddress().toString();
    }
    throw new Error('Key not found.')
  }
};

// store current player
export const CurrentPlayer = {
  get: () => {
    return localStorage[`player`] || Player.Computer;
  },
  set: (player: any) => {
    localStorage.setItem(`player`, player);
  },
};

// Randomly generated alice and bob privateKey
export const initPlayer = () => {

  const alice = PlayerPrivkey.get(Player.Computer);

  if (!alice) {
    const aliceKey = bsv.PrivateKey.fromRandom();
    PlayerPrivkey.set(Player.Computer, aliceKey.toWIF())
  }

  const bob = PlayerPrivkey.get(Player.You);

  if (!bob) {
    const bobKey = bsv.PrivateKey.fromRandom();
    PlayerPrivkey.set(Player.You, bobKey.toWIF())
  }
}

// store game data
export const GameData = {
  get: () => {
    const gameStr = localStorage[`game`];
    return gameStr ? JSON.parse(gameStr) : {};
  },
  set: (game: any) => {
    localStorage.setItem(`game`, JSON.stringify(game));
  },
  update: (game: any) => {
    const now = GameData.get();
    localStorage.setItem(`game`, JSON.stringify(Object.assign(now, game)));
  },
  clear: () => {
    localStorage.setItem(`game`, JSON.stringify({}));
  },
};


// store all utxos related to the contract
export const ContractUtxos = {
  add: (rawTx: any, player: any, index = 0) => {
    const tx = new bsv.Transaction(rawTx);
    const utxos = ContractUtxos.get();
    const utxo = {
      utxo: {
        txId: tx.id,
        outputIndex: 0,
        satoshis: tx.outputs[0].satoshis
      },
      index: index,
      player: player,
    };
    utxos.push(utxo)
    ContractUtxos.set(utxos)
    console.log('save: utxo:', utxo.utxo.txId)
    return utxo;
  },
  get: () => {
    const utxosStr = localStorage[`utxos`];
    return utxosStr ? JSON.parse(utxosStr) : [];
  },

  getComputerUtxoByIndex: (index: any) => {
    const utxos = ContractUtxos.get();
    return utxos.find((utxo: any) => {
      return utxo.index === index && !utxo.player;
    })
  },

  getPlayerUtxoByIndex: (index: any) => {
    const utxos = ContractUtxos.get();
    return utxos.find((utxo: any) => {
      return utxo.index === index && utxo.player;
    })
  },
  set: (utxos: any) => {
    localStorage.setItem(`utxos`, JSON.stringify(utxos));
  },
  clear: () => {
    localStorage.setItem(`utxos`, JSON.stringify([]));
  },
  getlast: () => {
    const utxos = ContractUtxos.get();
    return utxos[utxos.length - 1];
  },

  getdeploy: () => {
    const utxos = ContractUtxos.get();
    return utxos[0];
  },
};


export const CurrentNetwork = {
  get: () => {
    return localStorage[`network`] === 'main' ? Network.Mainnet : Network.Testnet;
  },
  switch: () => {
    const network = CurrentNetwork.get();
    localStorage.setItem(`network`, network === Network.Mainnet ? 'test' : 'main');
  },
};
