const { existsSync, readFileSync, writeFileSync } = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

const { compileContract: compileContractImpl, bsv } = require('scryptlib');

const inputSatoshis = 100000
const dummyTxId = randomBytes(32).toString('hex');

const axios = require('axios')
const API_PREFIX = 'https://api.whatsonchain.com/v1/bsv/test'

function compileContract(fileName, options) {
    const filePath = path.join(__dirname, 'contracts', fileName)
    const out = path.join(__dirname, 'out')

    const result = compileContractImpl(filePath, options ? options : {
        out: out
    });
    if (result.errors.length > 0) {
        console.log(`Compile contract ${filePath} failed: `, result.errors)
        throw result.errors;
    }

    return result;
}

function loadDesc(fileName) {
    let filePath = '';
    if (!fileName.endsWith(".json")) {
        filePath = path.join(__dirname, `out/${fileName}_desc.json`);
        if (!existsSync(filePath)) {
            filePath = path.join(__dirname, `out/${fileName}_debug_desc.json`);

            if (!existsSync(filePath)) {
                filePath = path.join(__dirname, `out/${fileName}_release_desc.json`);
            }
        }
    } else {
        filePath = path.join(__dirname, `out/${fileName}`);
    }

    if (!existsSync(filePath)) {
        throw new Error(`Description file ${filePath} not exist!\nIf You already run 'npm run watch', maybe fix the compile error first!`)
    }
    return JSON.parse(readFileSync(filePath).toString());
}

function newTx() {
    const utxo = {
        txId: dummyTxId,
        outputIndex: 0,
        script: '',   // placeholder
        satoshis: inputSatoshis
    };
    return new bsv.Transaction().from(utxo);
}



async function sendTx(tx) {

	const txhex = tx.toString();

	const size = Math.max(1, txhex.length / 2 / 1024); //KB
	const time = Math.max(100000, 1000 * size);
	
	const {
        data
    } = await axios({
        method: 'post',
        url: `https://testnet-mapi.gorillapool.io/mapi/tx`,
        data: Buffer.from(txhex, 'hex'),
        headers: {
            'Accept': 'text/plain',
			'Content-Type': 'application/octet-stream'
        },
        timeout: time,
        maxBodyLength: Infinity
    });

    const payload = JSON.parse(data.payload)
    if(payload.returnResult === 'success') {
        return payload.txid;
    } else if(payload.returnResult === 'failure') {
        console.error('sendTx error:', txhex)
        throw new Error(payload.resultDescription)
    }

	throw new Error('sendTx error')
}


async function fetchUtxos(address) {
    // step 1: fetch utxos
    let {
        data: utxos
    } = await axios.get(`${API_PREFIX}/address/${address}/unspent`)

    return utxos.map((utxo) => ({
        txId: utxo.tx_hash,
        outputIndex: utxo.tx_pos,
        satoshis: utxo.value,
        script: bsv.Script.buildPublicKeyHashOut(address).toHex(),
    }))
}

async function deployContract(contract, amount) {
    const { privateKey } = require('./privateKey');
    const address = privateKey.toAddress()
    const tx = new bsv.Transaction()

    tx.from(await fetchUtxos(address))
        .addOutput(new bsv.Transaction.Output({
            script: contract.lockingScript,
            satoshis: amount,
        }))
        .change(address)
        .sign(privateKey)

    await sendTx(tx)
    return tx
}

//create an input spending from prevTx's output, with empty script
function createInputFromPrevTx(tx, outputIndex) {
    const outputIdx = outputIndex || 0
    return new bsv.Transaction.Input({
      prevTxId: tx.id,
      outputIndex: outputIdx,
      script: new bsv.Script(), // placeholder
      output: tx.outputs[outputIdx]
    })
  }

  
module.exports = {
    compileContract,
    loadDesc,
    newTx,
    inputSatoshis,
    deployContract,
    fetchUtxos,
    sendTx,
    createInputFromPrevTx
}

