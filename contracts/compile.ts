import { writeFileSync } from 'fs'
import { compileContract } from 'scryptlib/dist'

(async () => {
    const res = compileContract('scrypts/src/contracts/battleship.scrypt', {
        artifact: true
    })
    const artifact = res.toArtifact()
    
    writeFileSync('scrypts/src/contracts/battleship.json', JSON.stringify(artifact))
})()
