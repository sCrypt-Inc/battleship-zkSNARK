import { bsv, AbstractContract} from 'scryptlib';
import { UTXO, wallet, SignType } from './wallet';
import axios from 'axios';

const WEB3_VERSION = '0.0.2';


export class web3 {

  static wallet: wallet;

  static setWallet(wallet: wallet) {
    web3.wallet = wallet;
  }


  static version() {
    return WEB3_VERSION;
  }


  static loadContractDesc(url: string): Promise<any> {
    return axios.get(url, {
      timeout: 10000
    }).then(res => {
      return res.data;
    });
  }


  static async getChangeAddress(): Promise<string> {
    return web3.wallet.getRawChangeAddress();
  }


  static async sendRawTx(rawTx: string): Promise<string> {
    return web3.wallet.sendRawTransaction(rawTx);
  }


  static async deploy(contract: AbstractContract, amountInContract: number): Promise<string> {
    const wallet = web3.wallet

    const changeAddress = await web3.wallet.getRawChangeAddress();

    return wallet.listUnspent(amountInContract, {
      purpose: 'listUnspent'
    }).then(async (utxos: UTXO[]) => {
      if(utxos.length === 0) {
        throw new Error('Insufficient balance!')
      }
      const tx = new bsv.Transaction();
      tx.from([utxos[0]])
        .addOutput(new bsv.Transaction.Output({
          script: contract.lockingScript,
          satoshis: amountInContract,
        }))
        .change(changeAddress);

        const unlockScript = await wallet.signRawTransaction(tx.toString(), utxos[0].script, utxos[0].satoshis, 0, SignType.ALL);

        tx.inputs[0].setScript(bsv.Script.fromHex(unlockScript));

        return tx.toString();
    }).then(async (rawTx: string) => {
      await web3.sendRawTx(rawTx);
      return rawTx;
    })
  }

  static async call(contractUtxo: UTXO,
    cbBuildTx: (tx: bsv.Transaction) => Promise<void>,
  ): Promise<string> {
    const tx = new bsv.Transaction();

    const prevLockingScript = bsv.Script.fromHex(contractUtxo.script);
    tx.addInput(new bsv.Transaction.Input({
      prevTxId: contractUtxo.txId,
      outputIndex: contractUtxo.outputIndex,
      script: new bsv.Script(), // placeholder
      output: new bsv.Transaction.Output({
        script: prevLockingScript,
        satoshis: contractUtxo.satoshis,
      })
    }));
    await cbBuildTx(tx);
    const rawTx = tx.toString();
    await web3.sendRawTx(rawTx);
    return rawTx;
  }
}