# Battleship

# Setup

Install **sCrypt Compiler**:


Your can install **sCrypt Compiler** by installing [sCrypt IDE](https://marketplace.visualstudio.com/items?itemName=bsv-scrypt.sCrypt).

Or just install the compiler binary :

```
npm install
npx scryptlib download
```


Install the ZoKrates CLI:

```
curl -Ls https://scrypt.io/scripts/setup-zokrates.sh | sh
```

Or install the Circom CLI:

```
curl -Ls https://scrypt.io/scripts/setup-circom.sh | sh
```


Setup and check the zkSNARK verifier:

```
npm run setup
```

Test the zkSNARK verifier:

```
node verifier.js
```

# Start

```
npm start
```

## Credits
- diemkay's [battleship fontend](https://github.com/diemkay/battleship)
- Made with [Create React App](https://github.com/facebook/create-react-app).
- Sounds from [Leshy Online Sound Generator](https://www.leshylabs.com/apps/sfMaker/) and [FreeSound.org](https://freesound.org/), specifically [LittleRobotSoundFactory](people/LittleRobotSoundFactory/sounds/270468/).
