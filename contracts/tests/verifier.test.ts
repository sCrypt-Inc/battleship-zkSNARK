import { expect } from 'chai'
import { Verifier, G1Point, Proof, VERIFYING_KEY_DATA, BN256, BN256Pairing, VerifyingKey } from '../src/contracts/verifier'
import { FixedArray } from 'scrypt-ts'

describe('Test G16 on BN256', () => {
    
    let verifier = undefined

    before(async () => {
        await Verifier.compile()
        // Construct VerifyingKey struct with pre-calculated miller(beta, alpha)
        let alpha = BN256.createCurvePoint(VERIFYING_KEY_DATA.alpha)
        let beta = BN256.createTwistPoint(VERIFYING_KEY_DATA.beta)
        let millerb1a1 = BN256Pairing.miller(beta, alpha)
        
        let vk: VerifyingKey = {
           millerb1a1: millerb1a1,
           gamma: VERIFYING_KEY_DATA.gamma,
           delta: VERIFYING_KEY_DATA.delta,
           gammaAbc: VERIFYING_KEY_DATA.gammaAbc
        }
        
        verifier = new Verifier(vk)
    })

    it('should pass verify proof', () => {
        // TODO: Insert proof values here:
        const proof: Proof = {
            a: {
                x: 2871896182868903265224901571126401280418983559224353574821104893482102519959n,
                y: 15255493609430470445750562500036258182873385927405493725957325381764798851848n,
            },
            b: {
                x: {
                    x: 4106783681406361412496599488200601355616682316356024569690948889391112098674n,
                    y: 12945907005668979930207189413837879767804711624534172571843718858447671368688n,
                },
                y: {
                    x: 6859927931368979092170338137192098972741558822506314612616962062412132061184n,
                    y: 14699897488143612012441710532498536466532859491125922665571291313287937513854n,
                },
            },
            c: {
                x: 6301465966096925220558727948853541413036878842774331354392740057627284076857n,
                y: 19433116520632989908816885238019390813872695670287055367095459840048378161864n,
            },
        }

        // TODO: Insert public param values here (don't forget to adjust arr size):
        const inputs: FixedArray<bigint, 2> = [ 10n, 113579n ]

        const result = verifier.verify((self) => {
            self.verifyProof(inputs, proof)
        })
        expect(result.success, result.error).to.be.true
    })
})
