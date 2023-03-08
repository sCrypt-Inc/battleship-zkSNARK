import { assert, SmartContract, Utils, method, hash256, prop, FixedArray, PubKeyHash, toByteString } from 'scrypt-ts'
import { Verifier, Proof, VerifyingKey } from './verifier'

export class BattleShip extends SmartContract {
    @prop()
    playerPKH: PubKeyHash

    @prop()
    computerPKH: PubKeyHash

    @prop()
    playerBoardHash: FixedArray<bigint, 2>

    @prop()
    computerBoardHash: FixedArray<bigint, 2>

    @prop(true)
    successfulPlayerHits: bigint

    @prop(true)
    successfulComputerHits: bigint

    @prop(true)
    playerTurn: boolean

    @prop()
    vk: VerifyingKey

    constructor(
        playerPKH: PubKeyHash,
        computerPKH: PubKeyHash,
        playerBoardHash: FixedArray<bigint, 2>,
        computerBoardHash: FixedArray<bigint, 2>,
        vk: VerifyingKey
    ) {
        super(...arguments)
        this.playerPKH = playerPKH
        this.computerPKH = computerPKH
        this.playerBoardHash = playerBoardHash
        this.computerBoardHash = computerBoardHash
        this.successfulPlayerHits = 0n
        this.successfulComputerHits = 0n
        this.playerTurn = true
        this.vk = vk
    }

    @method()
    public move(
        x: bigint,
        y: bigint,
        hit: bigint,
        proof: Proof
    ) {
        const verifier = new Verifier(this.vk)

        let h0 = 0n
        let h1 = 0n
        if (this.playerTurn) {
            h0 = this.computerBoardHash[0]
            h1 = this.computerBoardHash[1]
        } else {
            h0 = this.playerBoardHash[0]
            h1 = this.playerBoardHash[1]
            if (hit == 1n) {
                this.successfulComputerHits++
            }
        }

        let inputs: FixedArray<bigint, 5> = [h0, h1, x, y, hit]
        verifier.verifyProof(inputs, proof)

        this.playerTurn = !this.playerTurn

        let outputs = toByteString('')
        let amount = this.ctx.utxo.value
        if (this.successfulPlayerHits == 17n) {
            let script = Utils.buildPublicKeyHashScript(this.computerPKH)
            outputs = Utils.buildOutput(script, amount)
        } else {
            let script = this.getStateScript()
            outputs = Utils.buildOutput(script, amount)
        }

        // ensure outputs are actually from the spending transaction as expected
        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

}
