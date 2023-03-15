import { assert, SmartContract, Utils, method, hash160, hash256, prop, FixedArray, PubKey, toByteString, Sig } from 'scrypt-ts'
import { Verifier, Proof, VerifyingKey, G16BN256 } from './verifier'

export class BattleShip extends SmartContract {
    @prop()
    player: PubKey

    @prop()
    computer: PubKey

    @prop()
    playerBoardHash: bigint

    @prop()
    computerBoardHash: bigint

    @prop(true)
    successfulPlayerHits: bigint

    @prop(true)
    successfulComputerHits: bigint

    @prop(true)
    playerTurn: boolean

    @prop(true)
    playerHits: FixedArray<boolean, 100>

    @prop(true)
    computerHits: FixedArray<boolean, 100>

    @prop()
    vk: VerifyingKey

    constructor(
        player: PubKey,
        computer: PubKey,
        playerBoardHash: bigint,
        computerBoardHash: bigint,
        playerHits: FixedArray<boolean, 100>,
        computerHits: FixedArray<boolean, 100>,
        vk: VerifyingKey
    ) {
        super(...arguments)
        this.player = player
        this.computer = computer
        this.playerBoardHash = playerBoardHash
        this.computerBoardHash = computerBoardHash
        this.successfulPlayerHits = 0n
        this.successfulComputerHits = 0n
        this.playerTurn = true
        this.playerHits = playerHits
        this.computerHits = computerHits
        this.vk = vk
    }

    @method()
    static coordsToIndex(x: bigint, y: bigint): bigint {
        return y * 10n + x
    }

    @method()
    public move(
        sig: Sig,
        x: bigint,
        y: bigint,
        hit: boolean,
        proof: Proof,
        amount: bigint
    ) {
        let inputs: FixedArray<bigint, 4> = [
            hit ? 1n : 0n,
            this.playerTurn ? this.computerBoardHash : this.playerBoardHash,
            x, y
        ]

        //const verifier = new Verifier(this.vk)
        //verifier.verifyProof(inputs, proof)
        assert(G16BN256.verify(this.vk, inputs, proof) == true, 'Verify proof failed.')

        const pubKey = this.playerTurn ? this.player : this.computer
        assert(this.checkSig(sig, pubKey))

        // TODO: This can be done way more efficiently using integers and bitwise ops
        //       instead of arrays.
        let coordIdx = BattleShip.coordsToIndex(x, y)
        for (let i = 0; i < 100; i++) {
            if (i == Number(coordIdx)) {
                if (this.playerTurn) {
                    assert(!this.playerHits[i])
                    this.playerHits[i] = true
                    if (hit) {
                        this.successfulPlayerHits++
                    }
                } else {
                    assert(!this.computerHits[i])
                    this.computerHits[i] = true
                    if (hit) {
                        this.successfulComputerHits++
                    }
                }
            }
        }

        this.playerTurn = !this.playerTurn

        let outputs = toByteString('')
        if (this.successfulPlayerHits == 17n) {
            let script = Utils.buildPublicKeyHashScript(hash160(this.player))
            outputs = Utils.buildOutput(script, amount)
        } else if (this.successfulComputerHits == 17n) {
            let script = Utils.buildPublicKeyHashScript(hash160(this.computer))
            outputs = Utils.buildOutput(script, amount)
        } else {
            let script = this.getStateScript()
            outputs = Utils.buildOutput(script, amount)
        }

        // Make sure the transaction contains the expected outputs.
        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

}
