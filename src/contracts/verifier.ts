
import { and, assert, SmartContract, SmartContractLib, method, lshift, prop, FixedArray } from 'scrypt-ts'

export type FQ = bigint

export type FQ2 = {
    x: FQ
    y: FQ
}

export type FQ6 = {
    x: FQ2
    y: FQ2
    z: FQ2
}

// FQ12 implements the field of size p¹² as a quadratic extension of FQ6
// where ω²=τ.
export type FQ12 = {
    x: FQ6
    y: FQ6
}

export type CurvePoint = {
    x: FQ
    y: FQ
    z: FQ
    t: FQ
}

export type TwistPoint = {
    x: FQ2
    y: FQ2
    z: FQ2
    t: FQ2
}

// These two are just to make it easier for users to interface with the code
// by not having them to deal with z and t coords.
//
export type G1Point = {
    x: FQ
    y: FQ
}

export type G2Point = {
    x: FQ2
    y: FQ2
}

export class BN256 extends SmartContractLib {
    // Curve bits:
    @prop()
    static readonly CURVE_BITS: bigint = 256n
    @prop()
    static readonly CURVE_BITS_P8: bigint = 264n // +8 bits
    @prop()
    static readonly CURVE_BITS_P8_DIV12: bigint = 88n

    // Key int size:
    @prop()
    static readonly S: bigint = 33n // 32 bytes plus sign byte

    // Upper bound of the eGCD mod inverse loop:
    @prop()
    static readonly UB: bigint = 368n

    // Generator of G1:
    @prop()
    static readonly G1: CurvePoint = {
        x: 1n,
        y: 2n,
        z: 1n,
        t: 1n,
    }

    // Generator of G2:
    @prop()
    static readonly G2: TwistPoint = {
        x: {
            x: 11559732032986387107991004021392285783925812861821192530917403151452391805634n,
            y: 10857046999023057135944570762232829481370756359578518086990519993285655852781n,
        },
        y: {
            x: 4082367875863433681332203403145435568316851327593401208105741076214120093531n,
            y: 8495653923123431417604973247489272438418190587263600148770280649306958101930n,
        },
        z: {
            x: 0n,
            y: 1n,
        },
        t: {
            x: 0n,
            y: 1n,
        },
    }

    @prop()
    static readonly FQ2Zero: FQ2 = {
        x: 0n,
        y: 0n,
    }

    @prop()
    static readonly FQ2One: FQ2 = {
        x: 0n,
        y: 1n,
    }

    @prop()
    static readonly FQ6Zero: FQ6 = {
        x: BN256.FQ2Zero,
        y: BN256.FQ2Zero,
        z: BN256.FQ2Zero,
    }

    @prop()
    static readonly FQ6One: FQ6 = {
        x: BN256.FQ2Zero,
        y: BN256.FQ2Zero,
        z: BN256.FQ2One,
    }

    @prop()
    static readonly FQ12Zero: FQ12 = {
        x: BN256.FQ6Zero,
        y: BN256.FQ6Zero,
    }

    @prop()
    static readonly FQ12One: FQ12 = {
        x: BN256.FQ6Zero,
        y: BN256.FQ6One,
    }

    // Curve field modulus:
    @prop()
    static readonly P: bigint =
        21888242871839275222246405745257275088696311157297823662689037894645226208583n

    // xiToPMinus1Over6 is ξ^((p-1)/6) where ξ = i+9.
    @prop()
    static readonly xiToPMinus1Over6: FQ2 = {
        x: 16469823323077808223889137241176536799009286646108169935659301613961712198316n,
        y: 8376118865763821496583973867626364092589906065868298776909617916018768340080n,
    }

    // xiTo2PMinus2Over3 is ξ^((2p-2)/3) where ξ = i+9.
    @prop()
    static readonly xiTo2PMinus2Over3: FQ2 = {
        x: 19937756971775647987995932169929341994314640652964949448313374472400716661030n,
        y: 2581911344467009335267311115468803099551665605076196740867805258568234346338n,
    }

    // xiToPMinus1Over2 is ξ^((p-1)/2) where ξ = i+9.
    @prop()
    static readonly xiToPMinus1Over2: FQ2 = {
        x: 3505843767911556378687030309984248845540243509899259641013678093033130930403n,
        y: 2821565182194536844548159561693502659359617185244120367078079554186484126554n,
    }

    // xiToPMinus1Over3 is ξ^((p-1)/3) where ξ = i+9.
    @prop()
    static readonly xiToPMinus1Over3: FQ2 = {
        x: 10307601595873709700152284273816112264069230130616436755625194854815875713954n,
        y: 21575463638280843010398324269430826099269044274347216827212613867836435027261n,
    }

    // xiTo2PSquaredMinus2Over3 is ξ^((2p²-2)/3) where ξ = i+9 (a cubic root of unity, mod p).
    @prop()
    static readonly xiTo2PSquaredMinus2Over3: FQ =
        2203960485148121921418603742825762020974279258880205651966n

    // xiToPSquaredMinus1Over3 is ξ^((p²-1)/3) where ξ = i+9.
    @prop()
    static readonly xiToPSquaredMinus1Over3: FQ =
        21888242871839275220042445260109153167277707414472061641714758635765020556616n

    // xiToPSquaredMinus1Over6 is ξ^((1p²-1)/6) where ξ = i+9 (a cubic root of -1, mod p).
    @prop()
    static readonly xiToPSquaredMinus1Over6: FQ =
        21888242871839275220042445260109153167277707414472061641714758635765020556617n

    @method()
    static compareFQ2(a: FQ2, b: FQ2): boolean {
        return a.x == b.x && a.y == b.y
    }

    @method()
    static compareFQ6(a: FQ6, b: FQ6): boolean {
        return (
            a.x.x == b.x.x &&
            a.x.y == b.x.y &&
            a.y.x == b.y.x &&
            a.y.y == b.y.y &&
            a.z.x == b.z.x &&
            a.z.y == b.z.y
        )
    }

    @method()
    static compareFQ12(a: FQ12, b: FQ12): boolean {
        return (
            a.x.x.x == b.x.x.x &&
            a.x.x.y == b.x.x.y &&
            a.x.y.x == b.x.y.x &&
            a.x.y.y == b.x.y.y &&
            a.x.z.x == b.x.z.x &&
            a.x.z.y == b.x.z.y &&
            a.y.x.x == b.y.x.x &&
            a.y.x.y == b.y.x.y &&
            a.y.y.x == b.y.y.x &&
            a.y.y.y == b.y.y.y &&
            a.y.z.x == b.y.z.x &&
            a.y.z.y == b.y.z.y
        )
    }

    @method()
    static compareCurvePoints(a: CurvePoint, b: CurvePoint): boolean {
        return a.x == b.x && a.y == b.y && a.z == b.z && a.t == b.t
    }

    @method()
    static compareTwistPoints(a: TwistPoint, b: TwistPoint): boolean {
        return (
            a.x.x == b.x.x &&
            a.x.y == b.x.y &&
            a.y.x == b.y.x &&
            a.y.y == b.y.y &&
            a.z.x == b.z.x &&
            a.z.y == b.z.y &&
            a.t.x == b.t.x &&
            a.t.y == b.t.y
        )
    }

    @method()
    static modReduce(x: bigint, modulus: bigint): bigint {
        const res = x % modulus
        return res < 0 ? res + modulus : res
    }

    @method()
    static modFQ2(t0: FQ2): FQ2 {
        t0.x = BN256.modReduce(t0.x, BN256.P)
        t0.y = BN256.modReduce(t0.y, BN256.P)
        return t0
    }

    @method()
    static modFQ12(t0: FQ12): FQ12 {
        t0.x.x.x = BN256.modReduce(t0.x.x.x, BN256.P)
        t0.x.x.y = BN256.modReduce(t0.x.x.y, BN256.P)
        t0.x.y.x = BN256.modReduce(t0.x.y.x, BN256.P)
        t0.x.y.y = BN256.modReduce(t0.x.y.y, BN256.P)
        t0.x.z.x = BN256.modReduce(t0.x.z.x, BN256.P)
        t0.x.z.y = BN256.modReduce(t0.x.z.y, BN256.P)
        t0.y.x.x = BN256.modReduce(t0.y.x.x, BN256.P)
        t0.y.x.y = BN256.modReduce(t0.y.x.y, BN256.P)
        t0.y.y.x = BN256.modReduce(t0.y.y.x, BN256.P)
        t0.y.y.y = BN256.modReduce(t0.y.y.y, BN256.P)
        t0.y.z.x = BN256.modReduce(t0.y.z.x, BN256.P)
        t0.y.z.y = BN256.modReduce(t0.y.z.y, BN256.P)
        return t0
    }

    @method()
    static modCurvePoint(t0: CurvePoint): CurvePoint {
        t0.x = BN256.modReduce(t0.x, BN256.P)
        t0.y = BN256.modReduce(t0.y, BN256.P)
        t0.z = BN256.modReduce(t0.z, BN256.P)
        t0.t = BN256.modReduce(t0.t, BN256.P)
        return t0
    }

    @method()
    static modTwistPoint(t0: TwistPoint): TwistPoint {
        t0.x.x = BN256.modReduce(t0.x.x, BN256.P)
        t0.x.y = BN256.modReduce(t0.x.y, BN256.P)
        t0.y.x = BN256.modReduce(t0.y.x, BN256.P)
        t0.y.y = BN256.modReduce(t0.y.y, BN256.P)
        t0.z.x = BN256.modReduce(t0.z.x, BN256.P)
        t0.z.y = BN256.modReduce(t0.z.y, BN256.P)
        t0.t.x = BN256.modReduce(t0.t.x, BN256.P)
        t0.t.y = BN256.modReduce(t0.t.y, BN256.P)
        return t0
    }

    @method()
    static mulFQ2(a: FQ2, b: FQ2): FQ2 {
        const tx = a.x * b.y
        const t = b.x * a.y
        const tx_2 = tx + t

        const ty = a.y * b.y
        const t_2 = a.x * b.x
        const ty_2 = ty - t_2

        return {
            x: BN256.modReduce(tx_2, BN256.P),
            y: BN256.modReduce(ty_2, BN256.P),
        }
    }

    @method()
    static mulXiFQ2(a: FQ2): FQ2 {
        // (xi+y)(i+3) = (9x+y)i+(9y-x)
        const tx = lshift(a.x, 3n) + a.x + a.y
        const ty = lshift(a.y, 3n) + a.y - a.x

        return {
            x: BN256.modReduce(tx, BN256.P),
            y: BN256.modReduce(ty, BN256.P),
        }
    }

    @method()
    static mulScalarFQ2(a: FQ2, scalar: bigint): FQ2 {
        return {
            x: BN256.modReduce(a.x * scalar, BN256.P),
            y: BN256.modReduce(a.y * scalar, BN256.P),
        }
    }

    @method()
    static addFQ2(a: FQ2, b: FQ2): FQ2 {
        const res: FQ2 = {
            x: BN256.modReduce(a.x + b.x, BN256.P),
            y: BN256.modReduce(a.y + b.y, BN256.P),
        }
        return res
    }

    @method()
    static subFQ2(a: FQ2, b: FQ2): FQ2 {
        const res: FQ2 = {
            x: BN256.modReduce(a.x - b.x, BN256.P),
            y: BN256.modReduce(a.y - b.y, BN256.P),
        }
        return res
    }

    @method()
    static negFQ2(a: FQ2): FQ2 {
        const res: FQ2 = {
            x: BN256.modReduce(a.x * -1n, BN256.P),
            y: BN256.modReduce(a.y * -1n, BN256.P),
        }
        return res
    }

    @method()
    static conjugateFQ2(a: FQ2): FQ2 {
        const res: FQ2 = {
            x: BN256.modReduce(a.x * -1n, BN256.P),
            y: BN256.modReduce(a.y, BN256.P),
        }
        return res
    }

    @method()
    static doubleFQ2(a: FQ2): FQ2 {
        const res: FQ2 = {
            x: BN256.modReduce(a.x * 2n, BN256.P),
            y: BN256.modReduce(a.y * 2n, BN256.P),
        }
        return res
    }

    @method()
    static squareFQ2(a: FQ2): FQ2 {
        const tx = a.y - a.x
        const ty = a.x + a.y
        const ty_2 = ty * tx

        const tx_2 = a.x * a.y * 2n

        const res: FQ2 = {
            x: BN256.modReduce(tx_2, BN256.P),
            y: BN256.modReduce(ty_2, BN256.P),
        }
        return res
    }

    @method()
    static modInverseBranchlessP(x: bigint): bigint {
        // This will get substituted by optimized ASM code at transpilation stage.
        // The bellow code is ran while executing in a JS context.
        return BN256.modInverseEGCD(x, BN256.P)
    }

    @method()
    static modInverseEGCD(x: bigint, m: bigint): bigint {
        // This will get substituted by optimized ASM code at transpilation stage.
        x = BN256.modReduce(x, BN256.P)

        let t = 0n
        let newt = 1n
        let r = m
        let newr = x

        let quotient = 0n
        let tmp = 0n
        for (let i = 0; i < BN256.UB; i++) {
            if (newr != 0n) {
                quotient = r / newr

                tmp = newt
                newt = t - quotient * newt
                t = tmp

                tmp = newr
                newr = r - quotient * newr
                r = tmp
            }
        }

        if (t < 0) {
            t = t + m
        }

        return t
    }

    @method()
    static inverseFQ2(a: FQ2): FQ2 {
        const t2 = a.y * a.y
        const t1 = a.x * a.x + t2

        const inv = BN256.modInverseBranchlessP(t1)

        const axNeg = a.x * -1n

        const res: FQ2 = {
            x: BN256.modReduce(axNeg * inv, BN256.P),
            y: BN256.modReduce(a.y * inv, BN256.P),
        }
        return res
    }

    @method()
    static mulFQ6(a: FQ6, b: FQ6): FQ6 {
        // "Multiplication and Squaring on Pairing-Friendly Fields"
        // Section 4, Karatsuba method.
        // http://eprint.iacr.org/2006/471.pdf

        const v0 = BN256.mulFQ2(a.z, b.z)
        const v1 = BN256.mulFQ2(a.y, b.y)
        const v2 = BN256.mulFQ2(a.x, b.x)

        let t0 = BN256.addFQ2(a.x, a.y)
        let t1 = BN256.addFQ2(b.x, b.y)
        let tz = BN256.mulFQ2(t0, t1)

        tz = BN256.subFQ2(tz, v1)
        tz = BN256.subFQ2(tz, v2)
        tz = BN256.mulXiFQ2(tz)
        tz = BN256.addFQ2(tz, v0)

        t0 = BN256.addFQ2(a.y, a.z)
        t1 = BN256.addFQ2(b.y, b.z)

        let ty = BN256.mulFQ2(t0, t1)
        ty = BN256.subFQ2(ty, v0)
        ty = BN256.subFQ2(ty, v1)
        t0 = BN256.mulXiFQ2(v2)
        ty = BN256.addFQ2(ty, t0)

        t0 = BN256.addFQ2(a.x, a.z)
        t1 = BN256.addFQ2(b.x, b.z)
        let tx = BN256.mulFQ2(t0, t1)
        tx = BN256.subFQ2(tx, v0)
        tx = BN256.addFQ2(tx, v1)
        tx = BN256.subFQ2(tx, v2)

        const res: FQ6 = {
            x: tx,
            y: ty,
            z: tz,
        }
        return res
    }

    @method()
    static doubleFQ6(a: FQ6): FQ6 {
        const res: FQ6 = {
            x: BN256.doubleFQ2(a.x),
            y: BN256.doubleFQ2(a.y),
            z: BN256.doubleFQ2(a.z),
        }
        return res
    }

    @method()
    static mulScalarFQ6(a: FQ6, scalar: FQ2): FQ6 {
        const res: FQ6 = {
            x: BN256.mulFQ2(a.x, scalar),
            y: BN256.mulFQ2(a.y, scalar),
            z: BN256.mulFQ2(a.z, scalar),
        }
        return res
    }

    @method()
    static addFQ6(a: FQ6, b: FQ6): FQ6 {
        const res: FQ6 = {
            x: BN256.addFQ2(a.x, b.x),
            y: BN256.addFQ2(a.y, b.y),
            z: BN256.addFQ2(a.z, b.z),
        }
        return res
    }

    @method()
    static subFQ6(a: FQ6, b: FQ6): FQ6 {
        const res: FQ6 = {
            x: BN256.subFQ2(a.x, b.x),
            y: BN256.subFQ2(a.y, b.y),
            z: BN256.subFQ2(a.z, b.z),
        }
        return res
    }

    @method()
    static negFQ6(a: FQ6): FQ6 {
        const res: FQ6 = {
            x: BN256.negFQ2(a.x),
            y: BN256.negFQ2(a.y),
            z: BN256.negFQ2(a.z),
        }
        return res
    }

    @method()
    static squareFQ6(a: FQ6): FQ6 {
        const v0 = BN256.squareFQ2(a.z)
        const v1 = BN256.squareFQ2(a.y)
        const v2 = BN256.squareFQ2(a.x)

        let c0 = BN256.addFQ2(a.x, a.y)
        c0 = BN256.squareFQ2(c0)
        c0 = BN256.subFQ2(c0, v1)
        c0 = BN256.subFQ2(c0, v2)
        c0 = BN256.mulXiFQ2(c0)
        c0 = BN256.addFQ2(c0, v0)

        let c1 = BN256.addFQ2(a.y, a.z)
        c1 = BN256.squareFQ2(c1)
        c1 = BN256.subFQ2(c1, v0)
        c1 = BN256.subFQ2(c1, v1)
        const xiV2 = BN256.mulXiFQ2(v2)
        c1 = BN256.addFQ2(c1, xiV2)

        let c2 = BN256.addFQ2(a.x, a.z)
        c2 = BN256.squareFQ2(c2)
        c2 = BN256.subFQ2(c2, v0)
        c2 = BN256.addFQ2(c2, v1)
        c2 = BN256.subFQ2(c2, v2)

        const res: FQ6 = {
            x: c2,
            y: c1,
            z: c0,
        }
        return res
    }

    @method()
    static mulTauFQ6(a: FQ6): FQ6 {
        // MulTau computes τ·(aτ²+bτ+c) = bτ²+cτ+aξ
        const res: FQ6 = {
            x: a.y,
            y: a.z,
            z: BN256.mulXiFQ2(a.x),
        }
        return res
    }

    @method()
    static inverseFQ6(a: FQ6): FQ6 {
        // See "Implementing cryptographic pairings", M. Scott, section 3.2.
        // ftp://136.206.11.249/pub/crypto/pairings.pdf

        // Here we can give a short explanation of how it works: let j be a cubic root of
        // unity in GF(p²) so that 1+j+j²=0.
        // Then (xτ² + yτ + z)(xj²τ² + yjτ + z)(xjτ² + yj²τ + z)
        // = (xτ² + yτ + z)(Cτ²+Bτ+A)
        // = (x³ξ²+y³ξ+z³-3ξxyz) = F is an element of the base field (the norm).
        //
        // On the other hand (xj²τ² + yjτ + z)(xjτ² + yj²τ + z)
        // = τ²(y²-ξxz) + τ(ξx²-yz) + (z²-ξxy)
        //
        // So that's why A = (z²-ξxy), B = (ξx²-yz), C = (y²-ξxz)

        let A = BN256.squareFQ2(a.z)
        let t1 = BN256.mulFQ2(a.x, a.y)
        t1 = BN256.mulXiFQ2(t1)
        A = BN256.subFQ2(A, t1)

        let B = BN256.squareFQ2(a.x)
        B = BN256.mulXiFQ2(B)
        t1 = BN256.mulFQ2(a.y, a.z)
        B = BN256.subFQ2(B, t1)

        let C = BN256.squareFQ2(a.y)
        t1 = BN256.mulFQ2(a.x, a.z)
        C = BN256.subFQ2(C, t1)

        let F = BN256.mulFQ2(C, a.y)
        F = BN256.mulXiFQ2(F)
        t1 = BN256.mulFQ2(A, a.z)
        F = BN256.addFQ2(F, t1)
        t1 = BN256.mulFQ2(B, a.x)
        t1 = BN256.mulXiFQ2(t1)
        F = BN256.addFQ2(F, t1)

        F = BN256.inverseFQ2(F)

        const res: FQ6 = {
            x: BN256.mulFQ2(C, F),
            y: BN256.mulFQ2(B, F),
            z: BN256.mulFQ2(A, F),
        }
        return res
    }

    @method()
    static mulScalarFQ12(a: FQ12, scalar: FQ6): FQ12 {
        const res: FQ12 = {
            x: BN256.mulFQ6(a.x, scalar),
            y: BN256.mulFQ6(a.y, scalar),
        }
        return res
    }

    @method()
    static inverseFQ12(a: FQ12): FQ12 {
        // See "Implementing cryptographic pairings", M. Scott, section 3.2.
        // ftp://136.206.11.249/pub/crypto/pairings.pdf

        const t1 = BN256.squareFQ6(a.x)
        const t2 = BN256.squareFQ6(a.y)
        const t1_2 = BN256.mulTauFQ6(t1)
        const t1_3 = BN256.subFQ6(t2, t1_2)
        const t2_2 = BN256.inverseFQ6(t1_3)

        const e: FQ12 = {
            x: BN256.negFQ6(a.x),
            y: a.y,
        }

        return BN256.mulScalarFQ12(e, t2_2)
    }

    @method()
    static mulFQ12(a: FQ12, b: FQ12): FQ12 {
        // This will get substituted by optimized ASM code at transpilation stage.
        const tx = BN256.mulFQ6(a.x, b.y)
        const t = BN256.mulFQ6(b.x, a.y)
        const tx2 = BN256.addFQ6(tx, t)

        const ty = BN256.mulFQ6(a.y, b.y)
        const t2 = BN256.mulFQ6(a.x, b.x)
        const t3 = BN256.mulTauFQ6(t2)

        const res: FQ12 = {
            x: tx2,
            y: BN256.addFQ6(ty, t3),
        }
        return res
    }

    @method()
    static frobeniusFQ6(a: FQ6): FQ6 {
        const res: FQ6 = {
            x: BN256.mulFQ2(BN256.conjugateFQ2(a.x), BN256.xiTo2PMinus2Over3),
            y: BN256.mulFQ2(BN256.conjugateFQ2(a.y), BN256.xiToPMinus1Over3),
            z: BN256.conjugateFQ2(a.z),
        }
        return res
    }

    @method()
    static frobeniusP2FQ6(a: FQ6): FQ6 {
        // FrobeniusP2 computes (xτ²+yτ+z)^(p²) = xτ^(2p²) + yτ^(p²) + z
        const res: FQ6 = {
            // τ^(2p²) = τ²τ^(2p²-2) = τ²ξ^((2p²-2)/3)
            x: BN256.mulScalarFQ2(a.x, BN256.xiTo2PSquaredMinus2Over3),
            // τ^(p²) = ττ^(p²-1) = τξ^((p²-1)/3)
            y: BN256.mulScalarFQ2(a.y, BN256.xiToPSquaredMinus1Over3),
            z: a.z,
        }
        return res
    }

    @method()
    static mulGFP(a: FQ6, b: bigint): FQ6 {
        return {
            x: BN256.mulScalarFQ2(a.x, b),
            y: BN256.mulScalarFQ2(a.y, b),
            z: BN256.mulScalarFQ2(a.z, b),
        }
    }

    @method()
    static conjugateFQ12(a: FQ12): FQ12 {
        const res: FQ12 = {
            x: BN256.negFQ6(a.x),
            y: a.y,
        }
        return res
    }

    @method()
    static frobeniusFQ12(a: FQ12): FQ12 {
        // Frobenius computes (xω+y)^p = x^p ω·ξ^((p-1)/6) + y^p
        return {
            x: BN256.mulScalarFQ6(
                BN256.frobeniusFQ6(a.x),
                BN256.xiToPMinus1Over6
            ),
            y: BN256.frobeniusFQ6(a.y),
        }
    }

    @method()
    static frobeniusP2FQ12(a: FQ12): FQ12 {
        // FrobeniusP2 computes (xω+y)^p² = x^p² ω·ξ^((p²-1)/6) + y^p²
        return {
            x: BN256.mulGFP(
                BN256.frobeniusP2FQ6(a.x),
                BN256.xiToPSquaredMinus1Over6
            ),
            y: BN256.frobeniusP2FQ6(a.y),
        }
    }

    @method()
    static squareFQ12(a: FQ12): FQ12 {
        // This will get substituted by optimized ASM code at transpilation stage.
        // Complex squaring algorithm
        const v0 = BN256.mulFQ6(a.x, a.y)

        const t = BN256.mulTauFQ6(a.x)
        const t2 = BN256.addFQ6(a.y, t)
        const ty = BN256.addFQ6(a.x, a.y)
        const ty2 = BN256.mulFQ6(ty, t2)
        const ty3 = BN256.subFQ6(ty2, v0)
        const t3 = BN256.mulTauFQ6(v0)

        const ty4 = BN256.subFQ6(ty3, t3)

        const res: FQ12 = {
            x: BN256.doubleFQ6(v0),
            y: ty4,
        }
        return res
    }

    @method()
    static expFQ12_u(a: FQ12): FQ12 {
        // u is the BN parameter that determines the prime.
        // u = 4965661367192848881;
        const sum = BN256.FQ12One

        // Unrolled loop. Reference impl.:
        // https://github.com/ethereum/go-ethereum/blob/bd6879ac518431174a490ba42f7e6e822dcb3ee1/crypto/bn256/google/gfp12.go#L138
        let sum0 = BN256.squareFQ12(sum)
        sum0 = BN256.modFQ12(sum0)
        const sum1 = BN256.mulFQ12(sum0, a)
        const sum2 = BN256.squareFQ12(sum1)
        const sum3 = BN256.squareFQ12(sum2)
        const sum4 = BN256.squareFQ12(sum3)
        const sum5 = BN256.squareFQ12(sum4)
        const sum6 = BN256.mulFQ12(sum5, a)
        const sum7 = BN256.squareFQ12(sum6)
        const sum8 = BN256.squareFQ12(sum7)
        const sum9 = BN256.squareFQ12(sum8)
        let sum10 = BN256.mulFQ12(sum9, a)
        sum10 = BN256.modFQ12(sum10)
        const sum11 = BN256.squareFQ12(sum10)
        const sum12 = BN256.mulFQ12(sum11, a)
        const sum13 = BN256.squareFQ12(sum12)
        const sum14 = BN256.mulFQ12(sum13, a)
        const sum15 = BN256.squareFQ12(sum14)
        const sum16 = BN256.squareFQ12(sum15)
        const sum17 = BN256.mulFQ12(sum16, a)
        const sum18 = BN256.squareFQ12(sum17)
        const sum19 = BN256.squareFQ12(sum18)
        let sum20 = BN256.squareFQ12(sum19)
        sum20 = BN256.modFQ12(sum20)
        const sum21 = BN256.mulFQ12(sum20, a)
        const sum22 = BN256.squareFQ12(sum21)
        const sum23 = BN256.mulFQ12(sum22, a)
        const sum24 = BN256.squareFQ12(sum23)
        const sum25 = BN256.squareFQ12(sum24)
        const sum26 = BN256.squareFQ12(sum25)
        const sum27 = BN256.mulFQ12(sum26, a)
        const sum28 = BN256.squareFQ12(sum27)
        const sum29 = BN256.squareFQ12(sum28)
        let sum30 = BN256.squareFQ12(sum29)
        sum30 = BN256.modFQ12(sum30)
        const sum31 = BN256.mulFQ12(sum30, a)
        const sum32 = BN256.squareFQ12(sum31)
        const sum33 = BN256.squareFQ12(sum32)
        const sum34 = BN256.mulFQ12(sum33, a)
        const sum35 = BN256.squareFQ12(sum34)
        const sum36 = BN256.squareFQ12(sum35)
        const sum37 = BN256.mulFQ12(sum36, a)
        const sum38 = BN256.squareFQ12(sum37)
        const sum39 = BN256.mulFQ12(sum38, a)
        let sum40 = BN256.squareFQ12(sum39)
        sum40 = BN256.modFQ12(sum40)
        const sum41 = BN256.squareFQ12(sum40)
        const sum42 = BN256.mulFQ12(sum41, a)
        const sum43 = BN256.squareFQ12(sum42)
        const sum44 = BN256.squareFQ12(sum43)
        const sum45 = BN256.squareFQ12(sum44)
        const sum46 = BN256.squareFQ12(sum45)
        const sum47 = BN256.mulFQ12(sum46, a)
        const sum48 = BN256.squareFQ12(sum47)
        const sum49 = BN256.squareFQ12(sum48)
        let sum50 = BN256.squareFQ12(sum49)
        sum50 = BN256.modFQ12(sum50)
        const sum51 = BN256.mulFQ12(sum50, a)
        const sum52 = BN256.squareFQ12(sum51)
        const sum53 = BN256.squareFQ12(sum52)
        const sum54 = BN256.mulFQ12(sum53, a)
        const sum55 = BN256.squareFQ12(sum54)
        const sum56 = BN256.squareFQ12(sum55)
        const sum57 = BN256.squareFQ12(sum56)
        const sum58 = BN256.mulFQ12(sum57, a)
        const sum59 = BN256.squareFQ12(sum58)
        let sum60 = BN256.mulFQ12(sum59, a)
        sum60 = BN256.modFQ12(sum60)
        const sum61 = BN256.squareFQ12(sum60)
        const sum62 = BN256.squareFQ12(sum61)
        const sum63 = BN256.mulFQ12(sum62, a)
        const sum64 = BN256.squareFQ12(sum63)
        const sum65 = BN256.squareFQ12(sum64)
        const sum66 = BN256.squareFQ12(sum65)
        const sum67 = BN256.mulFQ12(sum66, a)
        const sum68 = BN256.squareFQ12(sum67)
        const sum69 = BN256.squareFQ12(sum68)
        let sum70 = BN256.squareFQ12(sum69)
        sum70 = BN256.modFQ12(sum70)
        const sum71 = BN256.squareFQ12(sum70)
        const sum72 = BN256.squareFQ12(sum71)
        const sum73 = BN256.mulFQ12(sum72, a)
        const sum74 = BN256.squareFQ12(sum73)
        const sum75 = BN256.squareFQ12(sum74)
        const sum76 = BN256.squareFQ12(sum75)
        const sum77 = BN256.mulFQ12(sum76, a)
        const sum78 = BN256.squareFQ12(sum77)
        const sum79 = BN256.mulFQ12(sum78, a)
        let sum80 = BN256.squareFQ12(sum79)
        sum80 = BN256.modFQ12(sum80)
        const sum81 = BN256.mulFQ12(sum80, a)
        const sum82 = BN256.squareFQ12(sum81)
        const sum83 = BN256.mulFQ12(sum82, a)
        const sum84 = BN256.squareFQ12(sum83)
        const sum85 = BN256.mulFQ12(sum84, a)
        const sum86 = BN256.squareFQ12(sum85)
        const sum87 = BN256.squareFQ12(sum86)
        const sum88 = BN256.squareFQ12(sum87)
        const sum89 = BN256.squareFQ12(sum88)
        let sum90 = BN256.mulFQ12(sum89, a)
        sum90 = BN256.modFQ12(sum90)

        return sum90
    }

    @method()
    static expFQ12(a: FQ12, power: bigint): FQ12 {
        let sum = BN256.FQ12One
        let t = BN256.FQ12One

        let firstOne = false

        for (let i = 0; i < BN256.CURVE_BITS_P8; i++) {
            if (firstOne) {
                t = BN256.modFQ12(BN256.squareFQ12(sum))
            }

            const shifted = lshift(
                1n,
                BigInt(Number(BN256.CURVE_BITS_P8) - 1 - i)
            )

            if (and(power, shifted) != 0n) {
                firstOne = true
                sum = BN256.mulFQ12(t, a)
            } else {
                sum = t
            }
        }

        return sum
    }

    @method()
    static doubleG1Point(a: G1Point): G1Point {
        const res = BN256.doubleCurvePoint(BN256.createCurvePoint(a))
        return BN256.getG1Point(res)
    }

    @method()
    static doubleCurvePoint(a: CurvePoint): CurvePoint {
        // This will get substituted by optimized ASM code at transpilation stage.
        // See http://hyperelliptic.org/EFD/g1p/auto-code/shortw/jacobian-0/doubling/dbl-2009-l.op3
        const res: CurvePoint = {
            x: 0n,
            y: 0n,
            z: 0n,
            t: 0n,
        }

        const A = BN256.modReduce(a.x * a.x, BN256.P)
        const B = BN256.modReduce(a.y * a.y, BN256.P)
        const C = BN256.modReduce(B * B, BN256.P)

        let t = a.x + B
        let t2 = BN256.modReduce(t * t, BN256.P)
        t = t2 - A
        t2 = t - C

        const d = t2 * 2n
        t = A * 2n
        const e = t + A
        const f = BN256.modReduce(e * e, BN256.P)

        t = d * 2n
        res.x = f - t

        t = C * 2n
        t2 = t * 2n
        t = t2 * 2n
        res.y = d - res.x
        t2 = BN256.modReduce(e * res.y, BN256.P)
        res.y = t2 - t

        const prod = a.y * a.z
        res.z = BN256.modReduce(prod, BN256.P) * 2n

        return res
    }

    @method()
    static addG1Points(a: G1Point, b: G1Point): G1Point {
        const res = BN256.addCurvePoints(
            BN256.createCurvePoint(a),
            BN256.createCurvePoint(b)
        )
        return BN256.getG1Point(res)
    }

    @method()
    static addCurvePoints(a: CurvePoint, b: CurvePoint): CurvePoint {
        return BN256._addCurvePoints(BN256.P, a, b)
    }

    @method()
    static _addCurvePoints(
        P: bigint,
        a: CurvePoint,
        b: CurvePoint
    ): CurvePoint {
        // This will get substituted by optimized ASM code at transpilation stage.
        // See http://hyperelliptic.org/EFD/g1p/auto-code/shortw/jacobian-0/addition/add-2007-bl.op3
        let res: CurvePoint = {
            x: 0n,
            y: 0n,
            z: 0n,
            t: 0n,
        }

        if (a.z == 0n) {
            res = b
        } else if (b.z == 0n) {
            res = a
        } else {
            // Normalize the points by replacing a = [x1:y1:z1] and b = [x2:y2:z2]
            // by [u1:s1:z1·z2] and [u2:s2:z1·z2]
            // where u1 = x1·z2², s1 = y1·z2³ and u1 = x2·z1², s2 = y2·z1³

            const z12 = BN256.modReduce(a.z * a.z, P)
            const z22 = BN256.modReduce(b.z * b.z, P)

            const u1 = BN256.modReduce(a.x * z22, P)
            const u2 = BN256.modReduce(b.x * z12, P)

            let t = BN256.modReduce(b.z * z22, P)
            const s1 = BN256.modReduce(a.y * t, P)

            t = BN256.modReduce(a.z * z12, P)
            const s2 = BN256.modReduce(b.y * t, P)

            // Compute x = (2h)²(s²-u1-u2)
            // where s = (s2-s1)/(u2-u1) is the slope of the line through
            // (u1,s1) and (u2,s2). The extra factor 2h = 2(u2-u1) comes from the value of z below.
            // This is also:
            // 4(s2-s1)² - 4h²(u1+u2) = 4(s2-s1)² - 4h³ - 4h²(2u1)
            //                        = r² - j - 2v
            // with the notations below.

            const h = u2 - u1
            const xEqual = h == 0n

            t = h * 2n
            // i = 4h²
            const i = BN256.modReduce(t * t, P)
            // j = 4h³
            const j = BN256.modReduce(h * i, P)

            t = s2 - s1
            const yEqual = t == 0n

            if (xEqual && yEqual) {
                res = BN256.doubleCurvePoint(a)
            } else {
                const r = t + t
                const v = BN256.modReduce(u1 * i, P)

                // t4 = 4(s2-s1)²
                let t4 = BN256.modReduce(r * r, P)
                let t6 = t4 - j
                t = v * 2n

                res.x = t6 - t

                // Set y = -(2h)³(s1 + s*(x/4h²-u1))
                // This is also
                // y = - 2·s1·j - (s2-s1)(2x - 2i·u1) = r(v-x) - 2·s1·j
                t = v - res.x
                t4 = BN256.modReduce(s1 * j, P)
                t6 = t4 * 2n
                t4 = BN256.modReduce(r * t, P)
                res.y = t4 - t6

                // Set z = 2(u2-u1)·z1·z2 = 2h·z1·z2
                t = a.z + b.z
                t4 = BN256.modReduce(t * t, P)
                t = t4 - z12
                t4 = t - z22
                res.z = BN256.modReduce(t4 * h, P)
            }
        }

        return res
    }

    @method()
    static mulG1Point(a: G1Point, m: bigint): G1Point {
        const res = BN256.mulCurvePoint(BN256.createCurvePoint(a), m)
        return BN256.getG1Point(res)
    }

    @method()
    static mulCurvePoint(a: CurvePoint, m: bigint): CurvePoint {
        let res: CurvePoint = {
            x: 0n,
            y: 1n,
            z: 0n,
            t: 0n,
        }

        if (m != 0n) {
            // Double and add method.
            // Lowest bit to highest.
            let t: CurvePoint = {
                x: 0n,
                y: 0n,
                z: 0n,
                t: 0n,
            }
            let sum: CurvePoint = {
                x: 0n,
                y: 0n,
                z: 0n,
                t: 0n,
            }

            let firstOne = false

            for (let k = 0; k < BN256.CURVE_BITS_P8_DIV12; k++) {
                sum = BN256.modCurvePoint(sum)
                for (let j = 0; j < 3; j++) {
                    if (firstOne) {
                        t = BN256.doubleCurvePoint(sum)
                    }
                    const shifted = lshift(
                        1n,
                        BigInt(Number(BN256.CURVE_BITS_P8) - 1 - (3 * k + j))
                    )
                    if (and(m, shifted) != 0n) {
                        firstOne = true
                        sum = BN256.addCurvePoints(t, a)
                    } else {
                        sum = t
                    }
                }
            }
            res = sum
        }

        return res
    }

    @method()
    static makeAffineCurvePoint(a: CurvePoint): CurvePoint {
        // MakeAffine converts a to affine form. If c is ∞, then it sets
        // a to 0 : 1 : 0.

        let res = a
        if (BN256.modReduce(a.z, BN256.P) != 1n) {
            if (a.z == 0n) {
                res = {
                    x: 0n,
                    y: 1n,
                    z: 0n,
                    t: 0n,
                }
            } else {
                const zInv = BN256.modInverseBranchlessP(a.z)
                const t = BN256.modReduce(a.y * zInv, BN256.P)
                const zInv2 = BN256.modReduce(zInv * zInv, BN256.P)
                const ay = BN256.modReduce(t * zInv2, BN256.P)
                const ax = BN256.modReduce(a.x * zInv2, BN256.P)

                res = {
                    x: ax,
                    y: ay,
                    z: 1n,
                    t: 1n,
                }
            }
        }

        return res
    }

    @method()
    static negCurvePoint(a: CurvePoint): CurvePoint {
        const res: CurvePoint = {
            x: a.x,
            y: -a.y,
            z: a.z,
            t: 0n,
        }
        return res
    }

    @method()
    static isInfCurvePoint(a: CurvePoint): boolean {
        return a.z == 0n
    }

    @method()
    static createCurvePoint(ccp: G1Point): CurvePoint {
        let res: CurvePoint = {
            x: ccp.x,
            y: ccp.y,
            z: 1n,
            t: 1n,
        }
        if (ccp.x == 0n && ccp.y == 0n) {
            res = {
                x: 0n,
                y: 1n,
                z: 0n,
                t: 0n,
            }
        }
        return res
    }

    @method()
    static getG1Point(cp: CurvePoint): G1Point {
        const acp = BN256.makeAffineCurvePoint(cp)
        let res: G1Point = {
            x: acp.x,
            y: acp.y,
        }
        if (acp.x == 0n && acp.y == 1n && acp.z == 0n && acp.t == 0n) {
            res = {
                x: 0n,
                y: 0n,
            }
        }
        return res
    }

    @method()
    static doubleG2Point(a: G2Point): G2Point {
        const res = BN256.doubleTwistPoint(BN256.createTwistPoint(a))

        return BN256.getG2Point(res)
    }

    @method()
    static doubleTwistPoint(a: TwistPoint): TwistPoint {
        // See http://hyperelliptic.org/EFD/g1p/auto-code/shortw/jacobian-0/doubling/dbl-2009-l.op3

        const res: TwistPoint = {
            x: BN256.FQ2Zero,
            y: BN256.FQ2Zero,
            z: BN256.FQ2Zero,
            t: BN256.FQ2Zero,
        }

        const A = BN256.squareFQ2(a.x)
        const B = BN256.squareFQ2(a.y)
        const C = BN256.squareFQ2(B)

        let t = BN256.addFQ2(a.x, B)
        let t2 = BN256.squareFQ2(t)
        t = BN256.subFQ2(t2, A)
        t2 = BN256.subFQ2(t, C)

        const d = BN256.mulScalarFQ2(t2, 2n)
        t = BN256.mulScalarFQ2(A, 2n)
        const e = BN256.addFQ2(t, A)
        const f = BN256.squareFQ2(e)

        t = BN256.mulScalarFQ2(d, 2n)
        res.x = BN256.subFQ2(f, t)

        t = BN256.mulScalarFQ2(C, 2n)
        t2 = BN256.mulScalarFQ2(t, 2n)
        t = BN256.mulScalarFQ2(t2, 2n)
        res.y = BN256.subFQ2(d, res.x)
        t2 = BN256.mulFQ2(e, res.y)
        res.y = BN256.subFQ2(t2, t)

        res.z = BN256.mulScalarFQ2(BN256.mulFQ2(a.y, a.z), 2n)

        return res
    }

    @method()
    static addG2Points(a: G2Point, b: G2Point): G2Point {
        const res = BN256.addTwistPoints(
            BN256.createTwistPoint(a),
            BN256.createTwistPoint(b)
        )

        return BN256.getG2Point(res)
    }

    @method()
    static addTwistPoints(a: TwistPoint, b: TwistPoint): TwistPoint {
        let res: TwistPoint = {
            x: BN256.FQ2Zero,
            y: BN256.FQ2Zero,
            z: BN256.FQ2Zero,
            t: a.t,
        }

        if (a.z == BN256.FQ2Zero) {
            res = b
        } else if (b.z == BN256.FQ2Zero) {
            res = a
        } else {
            // See http://hyperelliptic.org/EFD/g1p/auto-code/shortw/jacobian-0/addition/add-2007-bl.op3

            // Normalize the points by replacing a = [x1:y1:z1] and b = [x2:y2:z2]
            // by [u1:s1:z1·z2] and [u2:s2:z1·z2]
            // where u1 = x1·z2², s1 = y1·z2³ and u1 = x2·z1², s2 = y2·z1³

            const z12 = BN256.squareFQ2(a.z)
            const z22 = BN256.squareFQ2(b.z)

            const u1 = BN256.mulFQ2(a.x, z22)
            const u2 = BN256.mulFQ2(b.x, z12)

            let t = BN256.mulFQ2(b.z, z22)
            const s1 = BN256.mulFQ2(a.y, t)

            t = BN256.mulFQ2(a.z, z12)
            const s2 = BN256.mulFQ2(b.y, t)

            // Compute x = (2h)²(s²-u1-u2)
            // where s = (s2-s1)/(u2-u1) is the slope of the line through
            // (u1,s1) and (u2,s2). The extra factor 2h = 2(u2-u1) comes from the value of z below.
            // This is also:
            // 4(s2-s1)² - 4h²(u1+u2) = 4(s2-s1)² - 4h³ - 4h²(2u1)
            //                        = r² - j - 2v
            // with the notations below.

            const h = BN256.subFQ2(u2, u1)
            const xEqual = h == BN256.FQ2Zero

            t = BN256.mulScalarFQ2(h, 2n)
            // i = 4h²
            const i = BN256.squareFQ2(t)
            // j = 4h³
            const j = BN256.mulFQ2(h, i)

            t = BN256.subFQ2(s2, s1)
            const yEqual = t == BN256.FQ2Zero
            if (xEqual && yEqual) {
                res = BN256.doubleTwistPoint(a)
            } else {
                const r = BN256.mulScalarFQ2(t, 2n)
                const v = BN256.mulFQ2(u1, i)

                // t4 = 4(s2-s1)²
                let t4 = BN256.squareFQ2(r)
                let t6 = BN256.subFQ2(t4, j)
                t = BN256.mulScalarFQ2(v, 2n)

                res.x = BN256.subFQ2(t6, t)

                // Set y = -(2h)³(s1 + s*(x/4h²-u1))
                // This is also
                // y = - 2·s1·j - (s2-s1)(2x - 2i·u1) = r(v-x) - 2·s1·j
                t = BN256.subFQ2(v, res.x)
                t4 = BN256.mulFQ2(s1, j)
                t6 = BN256.mulScalarFQ2(t4, 2n)
                t4 = BN256.mulFQ2(r, t)
                res.y = BN256.subFQ2(t4, t6)

                // Set z = 2(u2-u1)·z1·z2 = 2h·z1·z2
                t = BN256.addFQ2(a.z, b.z)
                t4 = BN256.squareFQ2(t)
                t = BN256.subFQ2(t4, z12)
                t4 = BN256.subFQ2(t, z22)
                res.z = BN256.mulFQ2(t4, h)
            }
        }

        return res
    }

    @method()
    static makeAffineTwistPoint(a: TwistPoint): TwistPoint {
        let res = a
        if (a.z.x != 0n || a.z.y != 1n) {
            if (a.z == BN256.FQ2Zero) {
                res = {
                    x: BN256.FQ2Zero,
                    y: BN256.FQ2One,
                    z: BN256.FQ2Zero,
                    t: BN256.FQ2Zero,
                }
            } else {
                const zInv = BN256.inverseFQ2(a.z)
                let t = BN256.mulFQ2(a.y, zInv)
                const zInv2 = BN256.squareFQ2(zInv)
                res.y = BN256.mulFQ2(t, zInv2)
                t = BN256.mulFQ2(a.x, zInv2)
                res.x = t

                const zTmp: FQ2 = { x: 0n, y: 1n }
                res.z = zTmp
                res.t = zTmp
            }
        }

        return res
    }

    @method()
    static negTwistPoint(a: TwistPoint): TwistPoint {
        const res: TwistPoint = {
            x: a.x,
            y: BN256.subFQ2(BN256.FQ2Zero, a.y),
            z: a.z,
            t: BN256.FQ2Zero,
        }
        return res
    }

    @method()
    static isInfTwistPoint(a: TwistPoint): boolean {
        return a.z.x == BN256.FQ2Zero.x && a.z.y == BN256.FQ2Zero.y
    }

    @method()
    static createTwistPoint(ctp: G2Point): TwistPoint {
        // Output x and y coords from ZoKrates need to be swaped to work correctly.
        const x: FQ2 = {
            x: ctp.x.y,
            y: ctp.x.x,
        }
        const y: FQ2 = {
            x: ctp.y.y,
            y: ctp.y.x,
        }

        let res: TwistPoint = {
            x: x,
            y: y,
            z: BN256.FQ2One,
            t: BN256.FQ2One,
        }

        if (ctp.x == BN256.FQ2Zero && ctp.y == BN256.FQ2Zero) {
            res = {
                x: BN256.FQ2Zero,
                y: BN256.FQ2One,
                z: BN256.FQ2Zero,
                t: BN256.FQ2Zero,
            }
        }
        return res
    }

    @method()
    static getG2Point(tp: TwistPoint): G2Point {
        const atp = BN256.makeAffineTwistPoint(tp)
        let res: G2Point = {
            x: atp.x,
            y: atp.y,
        }

        if (
            atp.x == BN256.FQ2Zero &&
            atp.y == BN256.FQ2One &&
            atp.z == BN256.FQ2Zero &&
            atp.t == BN256.FQ2Zero
        ) {
            res = {
                x: BN256.FQ2Zero,
                y: BN256.FQ2Zero,
            }
        }
        return res
    }
}



export type LineFuncRes = {
    a: FQ2
    b: FQ2
    c: FQ2
    rOut: TwistPoint
}

export class BN256Pairing extends SmartContractLib {
    @method()
    static compareLineFuncRes(a: LineFuncRes, b: LineFuncRes): boolean {
        return (
            a.a.x == b.a.x &&
            a.a.y == b.a.y &&
            a.b.x == b.b.x &&
            a.b.y == b.b.y &&
            a.c.x == b.c.x &&
            a.c.y == b.c.y &&
            a.rOut.x.x == b.rOut.x.x &&
            a.rOut.x.y == b.rOut.x.y &&
            a.rOut.y.x == b.rOut.y.x &&
            a.rOut.y.y == b.rOut.y.y &&
            a.rOut.z.x == b.rOut.z.x &&
            a.rOut.z.y == b.rOut.z.y &&
            a.rOut.t.x == b.rOut.t.x &&
            a.rOut.t.y == b.rOut.t.y
        )
    }

    @method()
    static modLineFuncRes(l: LineFuncRes): LineFuncRes {
        l.a = BN256.modFQ2(l.a)
        l.b = BN256.modFQ2(l.b)
        l.c = BN256.modFQ2(l.c)
        l.rOut.x = BN256.modFQ2(l.rOut.x)
        l.rOut.y = BN256.modFQ2(l.rOut.y)
        l.rOut.z = BN256.modFQ2(l.rOut.z)
        l.rOut.t = BN256.modFQ2(l.rOut.t)
        return l
    }

    @method()
    static lineFuncAdd(
        r: TwistPoint,
        p: TwistPoint,
        q: CurvePoint,
        r2: FQ2
    ): LineFuncRes {
        // This will get substituted by optimized ASM code at transpilation stage.

        // See the mixed addition algorithm from "Faster Computation of the
        // Tate Pairing", http://arxiv.org/pdf/0904.0854v3.pdf

        const B = BN256.mulFQ2(p.x, r.t)
        let D = BN256.addFQ2(p.y, r.z)
        D = BN256.squareFQ2(D)
        D = BN256.subFQ2(D, r2)
        D = BN256.subFQ2(D, r.t)
        D = BN256.mulFQ2(D, r.t)

        const H = BN256.subFQ2(B, r.x)
        const I = BN256.squareFQ2(H)

        let E = BN256.addFQ2(I, I)
        E = BN256.addFQ2(E, E)

        const J = BN256.mulFQ2(H, E)

        let L1 = BN256.subFQ2(D, r.y)
        L1 = BN256.subFQ2(L1, r.y)

        const V = BN256.mulFQ2(r.x, E)

        let rOutX = BN256.squareFQ2(L1)
        rOutX = BN256.subFQ2(rOutX, J)
        rOutX = BN256.subFQ2(rOutX, V)
        rOutX = BN256.subFQ2(rOutX, V)

        let rOutZ = BN256.addFQ2(r.z, H)
        rOutZ = BN256.squareFQ2(rOutZ)
        rOutZ = BN256.subFQ2(rOutZ, r.t)
        rOutZ = BN256.subFQ2(rOutZ, I)

        let t = BN256.subFQ2(V, rOutX)
        t = BN256.mulFQ2(t, L1)
        let t2 = BN256.mulFQ2(r.y, J)
        t2 = BN256.addFQ2(t2, t2)
        const rOutY = BN256.subFQ2(t, t2)

        const rOutT = BN256.squareFQ2(rOutZ)

        t = BN256.addFQ2(p.y, rOutZ)
        t = BN256.squareFQ2(t)
        t = BN256.subFQ2(t, r2)
        t = BN256.subFQ2(t, rOutT)

        t2 = BN256.mulFQ2(L1, p.x)
        t2 = BN256.addFQ2(t2, t2)
        const a = BN256.subFQ2(t2, t)

        let c = BN256.mulScalarFQ2(rOutZ, q.y)
        c = BN256.addFQ2(c, c)

        let b = BN256.subFQ2(BN256.FQ2Zero, L1)
        b = BN256.mulScalarFQ2(b, q.x)
        b = BN256.addFQ2(b, b)

        const rOut: TwistPoint = {
            x: rOutX,
            y: rOutY,
            z: rOutZ,
            t: rOutT,
        }

        return {
            a: a,
            b: b,
            c: c,
            rOut: rOut,
        }
    }

    @method()
    static lineFuncDouble(r: TwistPoint, q: CurvePoint): LineFuncRes {
        // See the doubling algorithm for a=0 from "Faster Computation of the
        // Tate Pairing", http://arxiv.org/pdf/0904.0854v3.pdf

        const A = BN256.squareFQ2(r.x)
        const B = BN256.squareFQ2(r.y)
        const C = BN256.squareFQ2(B)

        let D = BN256.addFQ2(r.x, B)
        D = BN256.squareFQ2(D)
        D = BN256.subFQ2(D, A)
        D = BN256.subFQ2(D, C)
        D = BN256.addFQ2(D, D)

        let E = BN256.addFQ2(A, A)
        E = BN256.addFQ2(E, A)

        const G = BN256.squareFQ2(E)

        let rOutX = BN256.subFQ2(G, D)
        rOutX = BN256.subFQ2(rOutX, D)

        let rOutZ = BN256.addFQ2(r.y, r.z)
        rOutZ = BN256.squareFQ2(rOutZ)
        rOutZ = BN256.subFQ2(rOutZ, B)
        rOutZ = BN256.subFQ2(rOutZ, r.t)

        let rOutY = BN256.subFQ2(D, rOutX)
        rOutY = BN256.mulFQ2(rOutY, E)
        let t = BN256.addFQ2(C, C)
        t = BN256.addFQ2(t, t)
        t = BN256.addFQ2(t, t)
        rOutY = BN256.subFQ2(rOutY, t)

        const rOutT = BN256.squareFQ2(rOutZ)

        t = BN256.mulFQ2(E, r.t)
        t = BN256.addFQ2(t, t)
        let b = BN256.subFQ2(BN256.FQ2Zero, t)
        b = BN256.mulScalarFQ2(b, q.x)

        let a = BN256.addFQ2(r.x, E)
        a = BN256.squareFQ2(a)
        a = BN256.subFQ2(a, A)
        a = BN256.subFQ2(a, G)
        t = BN256.addFQ2(B, B)
        t = BN256.addFQ2(t, t)
        a = BN256.subFQ2(a, t)

        let c = BN256.mulFQ2(rOutZ, r.t)
        c = BN256.addFQ2(c, c)
        c = BN256.mulScalarFQ2(c, q.y)

        const rOut: TwistPoint = {
            x: rOutX,
            y: rOutY,
            z: rOutZ,
            t: rOutT,
        }

        return {
            a: a,
            b: b,
            c: c,
            rOut: rOut,
        }
    }

    @method()
    static mulLine(ret: FQ12, a: FQ2, b: FQ2, c: FQ2): FQ12 {
        let a2: FQ6 = {
            x: BN256.FQ2Zero,
            y: a,
            z: b,
        }
        a2 = BN256.mulFQ6(a2, ret.x)
        const t3 = BN256.mulScalarFQ6(ret.y, c)

        const t = BN256.addFQ2(b, c)
        const t2: FQ6 = {
            x: BN256.FQ2Zero,
            y: a,
            z: t,
        }

        let resX = BN256.addFQ6(ret.x, ret.y)
        let resY = t3

        resX = BN256.mulFQ6(resX, t2)
        resX = BN256.subFQ6(resX, a2)
        resX = BN256.subFQ6(resX, resY)
        a2 = BN256.mulTauFQ6(a2)
        resY = BN256.addFQ6(resY, a2)

        return {
            x: resX,
            y: resY,
        }
    }

    @method()
    static miller(q: TwistPoint, p: CurvePoint): FQ12 {
        let ret = BN256.FQ12One

        const aAffine = BN256.makeAffineTwistPoint(q)
        const bAffine = BN256.makeAffineCurvePoint(p)

        const minusA = BN256.negTwistPoint(aAffine)

        let r = aAffine

        let r2 = BN256.squareFQ2(aAffine.y)

        // sixuPlus2NAF is 6u+2 in non-adjacent form.
        // Unrolled loop to get rid of in-loop branching. Reference impl.:
        // https://github.com/ethereum/go-ethereum/blob/bd6879ac518431174a490ba42f7e6e822dcb3ee1/crypto/bn256/google/optate.go#L213
        // var sixuPlus2NAF = {}int8{0, 0, 0, 1, 0, 1, 0, -1, 0, 0, 1, -1, 0, 0, 1, 0,
        //                           0, 1, 1, 0, -1, 0, 0, 1, 0, -1, 0, 0, 0, 0, 1, 1,
        //                           1, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, -1, 0, 0, 1,
        //                           1, 0, 0, -1, 0, 0, 0, 1, 1, 0, -1, 0, 0, 1, 0, 1, 1}

        //---- 1
        let lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 1
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- -1
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, minusA, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 1
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 1
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- -1
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, minusA, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 1
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 1
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- -1
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, minusA, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 1
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- -1
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, minusA, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 1
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 1
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 1
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- -1
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, minusA, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 1
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- -1
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, minusA, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 1
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 1
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 1
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- -1
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, minusA, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 1
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- -1
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, minusA, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 1
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 1
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        lfr = BN256Pairing.lineFuncAdd(r, aAffine, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut
        //---- 0
        r = BN256.modTwistPoint(r)
        ret = BN256.modFQ12(ret)
        lfr = BN256Pairing.lineFuncDouble(r, bAffine)
        ret = BN256.squareFQ12(ret)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        // In order to calculate Q1 we have to convert q from the sextic twist
        // to the full GF(p^12) group, apply the Frobenius there, and convert
        // back.
        //
        // The twist isomorphism is (x', y') -> (xω², yω³). If we consider just
        // x for a moment, then after applying the Frobenius, we have x̄ω^(2p)
        // where x̄ is the conjugate of x. If we are going to apply the inverse
        // isomorphism we need a value with a single coefficient of ω² so we
        // rewrite this as x̄ω^(2p-2)ω². ξ⁶ = ω and, due to the construction of
        // p, 2p-2 is a multiple of six. Therefore we can rewrite as
        // x̄ξ^((p-1)/3)ω² and applying the inverse isomorphism eliminates the
        // ω².
        //
        // A similar argument can be made for the y value.

        let q1x = BN256.conjugateFQ2(aAffine.x)
        q1x = BN256.mulFQ2(q1x, BN256.xiToPMinus1Over3)
        let q1y = BN256.conjugateFQ2(aAffine.y)
        q1y = BN256.mulFQ2(q1y, BN256.xiToPMinus1Over2)

        const q1: TwistPoint = {
            x: q1x,
            y: q1y,
            z: { x: 0n, y: 1n },
            t: { x: 0n, y: 1n },
        }

        // For Q2 we are applying the p² Frobenius. The two conjugations cancel
        // out and we are left only with the factors from the isomorphism. In
        // the case of x, we end up with a pure number which is why
        // xiToPSquaredMinus1Over3 is ∈ GF(p). With y we get a factor of -1. We
        // ignore this to end up with -Q2.

        const minusQ2x = BN256.mulScalarFQ2(
            aAffine.x,
            BN256.xiToPSquaredMinus1Over3
        )
        const minusQ2: TwistPoint = {
            x: minusQ2x,
            y: aAffine.y,
            z: { x: 0n, y: 1n },
            t: { x: 0n, y: 1n },
        }

        r2 = BN256.squareFQ2(q1.y)
        lfr = BN256Pairing.lineFuncAdd(r, q1, bAffine, r2)
        ret = BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c)
        r = lfr.rOut

        r2 = BN256.squareFQ2(minusQ2.y)
        lfr = BN256Pairing.lineFuncAdd(r, minusQ2, bAffine, r2)
        return BN256.modFQ12(BN256Pairing.mulLine(ret, lfr.a, lfr.b, lfr.c))
    }

    @method()
    static finalExponentiation(a: FQ12): FQ12 {
        let t1: FQ12 = {
            x: BN256.negFQ6(a.x),
            y: a.y,
        }

        const inv = BN256.inverseFQ12(a)
        t1 = BN256.mulFQ12(t1, inv)

        const t2 = BN256.frobeniusP2FQ12(t1)
        t1 = BN256.mulFQ12(t1, t2)

        let fp = BN256.frobeniusFQ12(t1)
        let fp2 = BN256.frobeniusP2FQ12(t1)
        let fp3 = BN256.frobeniusFQ12(fp2)
        fp = BN256.modFQ12(fp)
        fp2 = BN256.modFQ12(fp2)
        fp3 = BN256.modFQ12(fp3)

        const fu = BN256.expFQ12_u(t1)
        const fu2 = BN256.expFQ12_u(fu)
        const fu3 = BN256.expFQ12_u(fu2)

        let y3 = BN256.frobeniusFQ12(fu)
        const fu2p = BN256.frobeniusFQ12(fu2)
        const fu3p = BN256.frobeniusFQ12(fu3)
        const y2 = BN256.frobeniusP2FQ12(fu2)

        let y0 = BN256.mulFQ12(fp, fp2)
        y0 = BN256.mulFQ12(y0, fp3)

        const y1 = BN256.conjugateFQ12(t1)
        const y5 = BN256.conjugateFQ12(fu2)
        y3 = BN256.conjugateFQ12(y3)
        let y4 = BN256.mulFQ12(fu, fu2p)
        y4 = BN256.conjugateFQ12(y4)

        let y6 = BN256.mulFQ12(fu3, fu3p)
        y6 = BN256.conjugateFQ12(y6)

        let t0 = BN256.squareFQ12(y6)
        t0 = BN256.modFQ12(t0)
        t0 = BN256.mulFQ12(t0, y4)
        t0 = BN256.mulFQ12(t0, y5)
        t1 = BN256.mulFQ12(y3, y5)
        t1 = BN256.mulFQ12(t1, t0)
        t0 = BN256.mulFQ12(t0, y2)
        t1 = BN256.squareFQ12(t1)
        t1 = BN256.mulFQ12(t1, t0)
        t1 = BN256.squareFQ12(t1)
        t0 = BN256.mulFQ12(t1, y1)
        t1 = BN256.mulFQ12(t1, y0)
        t0 = BN256.squareFQ12(t0)
        t0 = BN256.mulFQ12(t0, t1)
        t0 = BN256.modFQ12(t0)

        return t0
    }

    @method()
    static _pair(g1: CurvePoint, g2: TwistPoint): FQ12 {
        const e = BN256Pairing.miller(g2, g1)
        let ret = BN256Pairing.finalExponentiation(e)

        if (BN256.isInfTwistPoint(g2) || BN256.isInfCurvePoint(g1)) {
            ret = BN256.FQ12One
        }

        return ret
    }

    @method()
    static pair(g1: G1Point, g2: G2Point): FQ12 {
        return BN256Pairing._pair(
            BN256.createCurvePoint(g1),
            BN256.createTwistPoint(g2)
        )
    }

    @method()
    static _pairCheckP4Precalc(
        a0: CurvePoint,
        b0: TwistPoint,
        millerBetaAlpha: FQ12,
        a2: CurvePoint,
        b2: TwistPoint,
        a3: CurvePoint,
        b3: TwistPoint
    ): boolean {
        a0 = BN256.makeAffineCurvePoint(a0)
        a2 = BN256.makeAffineCurvePoint(a2)
        a3 = BN256.makeAffineCurvePoint(a3)

        let acc = millerBetaAlpha

        if (!BN256.isInfCurvePoint(a0) && !BN256.isInfTwistPoint(b0)) {
            acc = BN256.mulFQ12(acc, BN256Pairing.miller(b0, a0))
        }
        acc = BN256.modFQ12(acc)
        if (!BN256.isInfCurvePoint(a2) && !BN256.isInfTwistPoint(b2)) {
            acc = BN256.mulFQ12(acc, BN256Pairing.miller(b2, a2))
        }
        acc = BN256.modFQ12(acc)
        if (!BN256.isInfCurvePoint(a3) && !BN256.isInfTwistPoint(b3)) {
            acc = BN256.mulFQ12(acc, BN256Pairing.miller(b3, a3))
        }
        acc = BN256.modFQ12(acc)

        acc = BN256Pairing.finalExponentiation(acc)

        return BN256.compareFQ12(acc, BN256.FQ12One)
    }

    @method()
    static pairCheckP4Precalc(
        a0: G1Point,
        b0: G2Point,
        millerBetaAlpha: FQ12,
        a2: G1Point,
        b2: G2Point,
        a3: G1Point,
        b3: G2Point
    ): boolean {
        return BN256Pairing._pairCheckP4Precalc(
            BN256.createCurvePoint(a0),
            BN256.createTwistPoint(b0),
            millerBetaAlpha,
            BN256.createCurvePoint(a2),
            BN256.createTwistPoint(b2),
            BN256.createCurvePoint(a3),
            BN256.createTwistPoint(b3)
        )
    }

    @method()
    static _pairCheckP2Precalc(
        a0: CurvePoint,
        b0: TwistPoint,
        a1: CurvePoint,
        b1: TwistPoint
    ): boolean {
        let acc = BN256.FQ12One

        a0 = BN256.makeAffineCurvePoint(a0)
        a1 = BN256.makeAffineCurvePoint(a1)

        if (!BN256.isInfCurvePoint(a0) && !BN256.isInfTwistPoint(b0)) {
            acc = BN256.mulFQ12(acc, BN256Pairing.miller(b0, a0))
        }

        if (!BN256.isInfCurvePoint(a1) && !BN256.isInfTwistPoint(b1)) {
            acc = BN256.mulFQ12(acc, BN256Pairing.miller(b1, a1))
        }

        acc = BN256Pairing.finalExponentiation(acc)

        return acc == BN256.FQ12One
    }

    @method()
    static pairCheckP2Precalc(
        a0: G1Point,
        b0: G2Point,
        a1: G1Point,
        b1: G2Point
    ): boolean {
        return BN256Pairing._pairCheckP2Precalc(
            BN256.createCurvePoint(a0),
            BN256.createTwistPoint(b0),
            BN256.createCurvePoint(a1),
            BN256.createTwistPoint(b1)
        )
    }
}
 


const gammaAbc: FixedArray<G1Point, 5> = [{
                x: 10815225642535783486657699954287078649229318771787029650818948956580983690738n,
                y: 2351133806798333729854631628371924323037296504555535926158777285448141813509n
            },{
                x: 15415412581248699815612093095047845408543097549624296409530741177776678844794n,
                y: 9745769625987934871739955376200402491282311010517747534392219596730290607244n
            },{
                x: 8086029458870389170569054505501500033101330306680947747859170305094472618616n,
                y: 21580613432335039946069686338296206254837687716419868648036036111637278391177n
            },{
                x: 64211522279143213595921553133633088096099768788099785695159790208746408713n,
                y: 836833761966832912041838670997809720956480125184019613046137179671364868342n
            },{
                x: 20167138407551983923267771085482039619356235346342340974084725181307126963014n,
                y: 15230474893905439933619732875191238757491584282365622315592449625581397304136n
            }]

export const VERIFYING_KEY_DATA = {
 alpha:{
                x: 455312488004742048346346071066803391339020316928385259020411430615437646071n,
                y: 4636982407054982036754271678492572307476851266062418430329034355064689094221n
            },
 beta:{
                x: {
                    x: 1070312587069106852789199311355149354683155482264305784448970574016135347666n,
                    y: 13282053880166930688310014987866973196139429538295222186265226178236371357740n
                }, 
                y: {
                    x: 5488701878043596761064152145560858371379623836480960385630232957790107809886n,
                    y: 2410702051166297685553489127927772319968573038544072199098208003258478709642n
                }
            },
 gamma: {
                x: {
                    x: 11931793079029378834012091825345264988936961266595794558821276919784995057387n,
                    y: 21368956716557744321648180589097110645920641245002256839181508480214839017465n
                }, 
                y: {
                    x: 13205993354477518803659055586811687527695145819108973062555369441900423628253n,
                    y: 10237753844960898468686264601636137172092102681351602443564242170412695405375n
                }
            },
 delta: {
                x: {
                    x: 6218357900123971917556502842615228843991230858609186248808616124353342730688n,
                    y: 20757431319761606559265799246724402637421714336675810329436053657683637589013n
                }, 
                y: {
                    x: 12301295560519324311052735315748438743489904113567040464817938798901651556324n,
                    y: 12179600214584788747257357176850822595703128702204738180676434406345439926353n
                }
            },
 gammaAbc: gammaAbc
 }

export type VerifyingKey = {
    millerb1a1: FQ12 // Precalculated miller(alpha, beta)
    gamma: G2Point
    delta: G2Point
    gammaAbc: FixedArray<G1Point, 5> // Size of array should be N + 1
}

export type Proof = {
    a: G1Point
    b: G2Point
    c: G1Point
}

export class G16BN256 extends SmartContractLib {
    
    @prop()
    static readonly N: bigint = 4n // Number of public inputs.

    @method()
    static verify(
        vk: VerifyingKey,
        inputs: FixedArray<bigint, 4>,
        proof: Proof,
    ): boolean {
        let vk_x = vk.gammaAbc[0]
        for (let i = 0; i < G16BN256.N; i++) {
            const p = BN256.mulG1Point(vk.gammaAbc[i + 1], inputs[i])
            vk_x = BN256.addG1Points(vk_x, p)
        }

        const a0: G1Point = {
            x: proof.a.x,
            y: -proof.a.y,
        }
        return BN256Pairing.pairCheckP4Precalc(
            a0,
            proof.b,
            vk.millerb1a1,
            vk_x,
            vk.gamma,
            proof.c,
            vk.delta
        )
    }
}

export class Verifier extends SmartContract {
    
    @prop()
    vk: VerifyingKey

    constructor(vk: VerifyingKey) {
        super(...arguments)
        this.vk = vk
    }
    
    @method()
    public verifyProof(
        inputs: FixedArray<bigint, 4>,
        proof: Proof,
    ) {
        assert(G16BN256.verify(this.vk, inputs, proof))
    }
}
