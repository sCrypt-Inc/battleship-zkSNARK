/* global BigInt */
import React, { useEffect, useRef, useState } from 'react';
import { bsv, BuildMethodCallTxOptions, BuildMethodCallTxResult, findSig, FixedArray, MethodCallOptions, PubKey, Sig, SignatureResponse } from 'scrypt-ts'
import { ContractUtxos } from '../storage';
import { web3 } from '../web3';
import { Balance } from './Balance';
import { GameView } from './GameView';
import { buildMimc7 } from 'circomlibjs';
import {
  coordsToIndex, generateEmptyLayout,
  generateRandomIndex,
  getNeighbors, indexToCoords, placeAllComputerShips, putEntityInLayout, SQUARE_STATE, updateSunkShips
} from './layoutHelpers';

import { BattleShip } from '../contracts/zkBattleship';
import { VERIFYING_KEY_DATA, BN256, BN256Pairing, VerifyingKey } from '../contracts/verifier';
import { runZKP } from '../zkProvider';
import Queue from "queue-promise";

const AVAILABLE_SHIPS = [
  {
    name: 'carrier',
    length: 5,
    placed: null,
  },
  {
    name: 'battleship',
    length: 4,
    placed: null,
  },
  {
    name: 'cruiser',
    length: 3,
    placed: null,
  },
  {
    name: 'submarine',
    length: 3,
    placed: null,
  },
  {
    name: 'destroyer',
    length: 2,
    placed: null,
  },
];

export const Game = ({ artifact, signer }) => {
  const [gameState, setGameState] = useState('placement');
  const [winner, setWinner] = useState(null);

  const [currentlyPlacing, setCurrentlyPlacing] = useState(null);
  const [placedShips, setPlacedShips] = useState([]);
  const [placedShipsHash, setPlacedShipsHash] = useState([]);
  const [availableShips, setAvailableShips] = useState(AVAILABLE_SHIPS);
  const [computerShips, setComputerShips] = useState([]);
  const [computerShipsHash, setComputerShipsHash] = useState([]);
  const [hitsByPlayer, setHitsByPlayer] = useState([]);
  const [hitsByComputer, setHitsByComputer] = useState([]);
  const [hitsProofToComputer, setHitsProofToComputer] = useState(new Map()); // index: number => {status: 'pending'/'verified', proof?: object}
  const [hitsProofToPlayer, setHitsProofToPlayer] = useState(new Map()); // structure same as above
  const [battleShipContract, setBattleShipContract] = useState(null); // contract
  const [deployTxid, setDeployTxid] = useState('');
  const [balance, setBalance] = useState(-1);
  const [queue, setQueue] = useState(null);

  const hp2CRef = useRef(hitsProofToComputer);
  useEffect(() => {
    hp2CRef.current = hitsProofToComputer
  }, [hitsProofToComputer]);

  const hp2PRef = useRef(hitsProofToPlayer);
  useEffect(() => {
    hp2PRef.current = hitsProofToPlayer
  }, [hitsProofToPlayer]);

  const hbpRef = useRef(hitsByPlayer);
  useEffect(() => {
    hbpRef.current = hitsByPlayer
  }, [hitsByPlayer]);

  const hbcRef = useRef(hitsByComputer);
  useEffect(() => {
    hbcRef.current = hitsByComputer
  }, [hitsByComputer]);

  useEffect(() => {
    const queue = new Queue({
      concurrent: 1,
      interval: 2000
    });

    setQueue(queue)

    return (() => {
      queue.stop();
    })
  }, []);


  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleShipContract]);


  // *** PLAYER ***
  const selectShip = (shipName) => {
    let shipIdx = availableShips.findIndex((ship) => ship.name === shipName);
    const shipToPlace = availableShips[shipIdx];

    setCurrentlyPlacing({
      ...shipToPlace,
      orientation: 'horizontal',
      position: null,
    });
  };

  const move = async (isPlayerFired, index, contractUtxo, hit, proof, newStates) => {

    console.log('call move ...', 'index=', index, 'hit=', hit, 'newStates=', newStates)

    const pubKeyPlayer = await signer.getDefaultPubKey()
    const pubKeyComputer = pubKeyPlayer

    const currentInstance = battleShipContract;
    const nextInstance = currentInstance.next()

    const initBalance = currentInstance.from?.tx.outputs[currentInstance.from?.outputIndex].satoshis as number;
    // Update contract state:
    Object.assign(nextInstance, newStates); // TODO (miha)

    BattleShip.bindTxBuilder('move', async (options: BuildMethodCallTxOptions<BattleShip>, sig: Sig) => {

      const unsignedTx: bsv.Transaction = new bsv.Transaction()
        .addInputFromPrevTx(currentInstance.from?.tx as bsv.Transaction, currentInstance.from?.outputIndex)
        .from(options.utxos);

      const changeAddress = await currentInstance.signer.getDefaultAddress();

      if (nextInstance.successfulPlayerHits == 17n) {

        unsignedTx.addOutput(new bsv.Transaction.Output({
          script: bsv.Script.buildPublicKeyHashOut(pubKeyPlayer),
          satoshis: initBalance
        }))
          .change(changeAddress)

        return Promise.resolve({
          unsignedTx,
          atInputIndex: 0,
          nexts: [

          ]
        }) as Promise<BuildMethodCallTxResult<BattleShip>>

      } else if (newStates.successfulComputerHits == 17n) {

        unsignedTx.addOutput(new bsv.Transaction.Output({
          script: bsv.Script.buildPublicKeyHashOut(pubKeyComputer),
          satoshis: initBalance
        }))
          .change(changeAddress)

        return Promise.resolve({
          unsignedTx,
          atInputIndex: 0,
          nexts: [

          ]
        }) as Promise<BuildMethodCallTxResult<BattleShip>>

      } else {
        unsignedTx.addOutput(new bsv.Transaction.Output({
          script: nextInstance.lockingScript,
          satoshis: initBalance,
        }))
          .change(changeAddress)

        return Promise.resolve({
          unsignedTx,
          atInputIndex: 0,
          nexts: [
            {
              instance: nextInstance,
              atOutputIndex: 0,
              balance: initBalance
            }
          ]
        }) as Promise<BuildMethodCallTxResult<BattleShip>>
      }
    })


    const currentTurn = !newStates.yourTurn;
    const pubKey = currentTurn ? pubKeyPlayer : pubKeyComputer
    const position = indexToCoords(index);

    const { tx: callTx } = await currentInstance.methods.move(
      (sigResponses: SignatureResponse[]) => {
        return findSig(sigResponses, pubKey)
      },
      position.x, position.y, hit, proof, initBalance,
      {
        pubKeyOrAddrToSign: pubKey,
      } as MethodCallOptions<BattleShip>
    )

    ContractUtxos.add(callTx, isPlayerFired, index);

    battleShipContract.successfulYourHits = newStates.successfulYourHits;
    battleShipContract.successfulComputerHits = newStates.successfulComputerHits;
    battleShipContract.yourTurn = newStates.yourTurn;
    battleShipContract.yourHits = newStates.yourHits;
    battleShipContract.computerHits = newStates.computerHits;

    setTimeout(async () => {
      web3.wallet.getbalance().then(balance => {
        console.log('update balance:', balance)
        setBalance(balance)
      })
    }, 5000);

  }

  const placeShip = (currentlyPlacing) => {
    setPlacedShips([
      ...placedShips,
      {
        ...currentlyPlacing,
        placed: true,
      },
    ]);

    setAvailableShips((previousShips) =>
      previousShips.filter((ship) => ship.name !== currentlyPlacing.name)
    );

    setCurrentlyPlacing(null);
  };

  const rotateShip = (event) => {
    if (currentlyPlacing != null && event.button === 2) {
      setCurrentlyPlacing({
        ...currentlyPlacing,
        orientation:
          currentlyPlacing.orientation === 'vertical' ? 'horizontal' : 'vertical',
      });
    }
  };

  const startTurn = async () => {
    BattleShip.loadArtifact(artifact)

    const computerShips_ = generateComputerShips();
    const playerHash = await shipHash(placedShips);
    const computerHash = await shipHash(computerShips_);

    // Construct VK
    let alpha = BN256.createCurvePoint(VERIFYING_KEY_DATA.alpha)
    let beta = BN256.createTwistPoint(VERIFYING_KEY_DATA.beta)
    let millerb1a1 = BN256Pairing.miller(beta, alpha)

    let vk: VerifyingKey = {
      millerb1a1: millerb1a1,
      gamma: VERIFYING_KEY_DATA.gamma,
      delta: VERIFYING_KEY_DATA.delta,
      gammaAbc: VERIFYING_KEY_DATA.gammaAbc
    }

    const falseArr: FixedArray<boolean, 100> = new Array(100).fill(false) as FixedArray<boolean, 100>

    // Because in this implementation we're playing against our local computer we just use the same
    // key (of our Sensilet wallet) for both players for the sake of simplicity.
    const pubKeyPlayer = await signer.getDefaultPubKey()
    const pubKeyComputer = pubKeyPlayer

    const instance = new BattleShip(
      PubKey(await pubKeyPlayer.toString()),
      PubKey(await pubKeyComputer.toString()),
      BigInt(playerHash),
      BigInt(computerHash),
      falseArr, falseArr,
      vk);

    instance.connect(signer)

    setBattleShipContract(instance);

    try {
      ContractUtxos.clear();
      const rawTx = await instance.deploy(10000);
      ContractUtxos.add(rawTx, 0, -1);

      const txid = ContractUtxos.getdeploy().utxo.txId

      setDeployTxid(txid)

      setTimeout(async () => {
        signer.getBalance().then(balance => {
          console.log('update balance:', balance.total)
          setBalance(balance.total)
        })
      }, 10000);
    } catch (error) {
      console.error("deploy contract fails", error);
      setBattleShipContract(null);
      alert("deploy contract error:" + error.message);
      return;
    }

    setGameState('player-turn');
    setPlacedShipsHash(playerHash);
    setComputerShipsHash(computerHash);
  };

  const changeTurn = () => {
    setGameState((oldGameState) =>
      oldGameState === 'player-turn' ? 'computer-turn' : 'player-turn'
    );
  };

  // *** COMPUTER ***
  const generateComputerShips = () => {
    let placedComputerShips = placeAllComputerShips(AVAILABLE_SHIPS.slice());

    setComputerShips(placedComputerShips);
    return placedComputerShips
  };

  const computerFire = (index, layout) => {
    let computerHits;
    let fireResult;
    if (layout[index] === 'ship') {
      fireResult = {
        position: indexToCoords(index),
        type: SQUARE_STATE.hit,
      };
      computerHits = [
        ...hitsByComputer,
        fireResult,
      ];
    }
    if (layout[index] === 'empty') {
      fireResult = {
        position: indexToCoords(index),
        type: SQUARE_STATE.miss,
      }
      computerHits = [
        ...hitsByComputer,
        fireResult,
      ];
    }
    const sunkShips = updateSunkShips(computerHits, placedShips);
    const sunkShipsAfter = sunkShips.filter((ship) => ship.sunk).length;
    const sunkShipsBefore = placedShips.filter((ship) => ship.sunk).length;
    if (sunkShipsAfter > sunkShipsBefore) {
      playSound('sunk');
    }
    setPlacedShips(sunkShips);
    setHitsByComputer(computerHits);

    if (fireResult) {

      let successfulYourHits = hbpRef.current.filter((hit) => hit.type === 'hit').length;
      let successfulComputerHits = computerHits.filter((hit) => hit.type === 'hit')
        .length;

      const yourHits_ = new Array(100).fill(false);
      const computerHits_ = new Array(100).fill(false);

      hbpRef.current.map((hit) => coordsToIndex(hit.position)).forEach(v => {
        yourHits_[v] = true
      })

      computerHits.map((hit) => coordsToIndex(hit.position)).forEach(v => {
        computerHits_[v] = true
      })


      handleFire('computer', index, {
        successfulYourHits: successfulYourHits,
        successfulComputerHits: successfulComputerHits,
        yourTurn: true,
        yourHits: yourHits_,
        computerHits: computerHits_
      });
    }
  };

  // Change to computer turn, check if game over and stop if yes; if not fire into an eligible square
  const handleComputerTurn = () => {
    changeTurn();

    if (checkIfGameOver()) {
      return;
    }

    // Recreate layout to get eligible squares
    let layout = placedShips.reduce(
      (prevLayout, currentShip) =>
        putEntityInLayout(prevLayout, currentShip, SQUARE_STATE.ship),
      generateEmptyLayout()
    );

    layout = hitsByComputer.reduce(
      (prevLayout, currentHit) =>
        putEntityInLayout(prevLayout, currentHit, currentHit.type),
      layout
    );

    layout = placedShips.reduce(
      (prevLayout, currentShip) =>
        currentShip.sunk
          ? putEntityInLayout(prevLayout, currentShip, SQUARE_STATE.ship_sunk)
          : prevLayout,
      layout
    );

    let successfulComputerHits = hitsByComputer.filter((hit) => hit.type === 'hit');

    let nonSunkComputerHits = successfulComputerHits.filter((hit) => {
      const hitIndex = coordsToIndex(hit.position);
      return layout[hitIndex] === 'hit';
    });

    let potentialTargets = nonSunkComputerHits
      .flatMap((hit) => getNeighbors(hit.position))
      .filter((idx) => layout[idx] === 'empty' || layout[idx] === 'ship');

    // Until there's a successful hit
    if (potentialTargets.length === 0) {
      let layoutIndices = layout.map((item, idx) => idx);
      potentialTargets = layoutIndices.filter(
        (index) => layout[index] === 'ship' || layout[index] === 'empty'
      );
    }

    let randomIndex = generateRandomIndex(potentialTargets.length);

    let target = potentialTargets[randomIndex];

    setTimeout(() => {
      computerFire(target, layout);
      changeTurn();
    }, 300);
  };

  // *** END GAME ***

  // Check if either player or computer ended the game
  const checkIfGameOver = () => {
    let successfulPlayerHits = hitsByPlayer.filter((hit) => hit.type === 'hit').length;
    let successfulComputerHits = hitsByComputer.filter((hit) => hit.type === 'hit')
      .length;

    if (successfulComputerHits === 17 || successfulPlayerHits === 17) {
      setGameState('game-over');

      if (successfulComputerHits === 17) {
        setWinner('computer');
        playSound('lose');
      }
      if (successfulPlayerHits === 17) {
        setWinner('player');
        playSound('win');
      }

      return true;
    }

    return false;
  };

  const startAgain = () => {
    setGameState('placement');
    setWinner(null);
    setCurrentlyPlacing(null);
    setPlacedShips([]);
    setAvailableShips(AVAILABLE_SHIPS);
    setComputerShips([]);
    setHitsByPlayer([]);
    setHitsByComputer([]);
    setHitsProofToComputer(new Map());
    setHitsProofToPlayer(new Map());
    ContractUtxos.clear();
  };

  const handleFire = (role, targetIdx, newStates) => {
    const isPlayerFired = role === 'player';
    const privateInputs = toPrivateInputs(isPlayerFired ? computerShips : placedShips);
    const position = indexToCoords(targetIdx);
    const publicInputs = [isPlayerFired ? computerShipsHash : placedShipsHash, position.x.toString(), position.y.toString()];

    if (isPlayerFired) {
      setHitsProofToPlayer(new Map(hitsProofToPlayer.set(targetIdx, { status: 'pending' })));
    } else {
      setHitsProofToComputer(new Map(hitsProofToComputer.set(targetIdx, { status: 'pending' })));
    }

    const ctx = {
      role,
      targetIdx,
      newStates
    }

    queue.enqueue(async () => {
      await runZKP(privateInputs, publicInputs).then(async ({ isVerified, proof, isHit }: any) => {
        console.log("isVerified", isVerified)
        console.log("isHit", isHit)
        console.log(proof)

        const isPlayerFired = ctx.role === 'player';

        const contractUtxo = ContractUtxos.getlast().utxo;

        contractUtxo.script = battleShipContract.lockingScript.toHex();

        await move(isPlayerFired, ctx.targetIdx, contractUtxo, isHit, {
          a: {
            x: BigInt(proof.pi_a[0]),
            y: BigInt(proof.pi_a[1]),
          },
          b: {
            x: {
              x: BigInt(proof.pi_b[0][0]),
              y: BigInt(proof.pi_b[0][1]),
            },
            y: {
              x: BigInt(proof.pi_b[1][0]),
              y: BigInt(proof.pi_b[1][1]),
            }
          },
          c: {
            x: BigInt(proof.pi_c[0]),
            y: BigInt(proof.pi_c[1]),
          },
        }, ctx.newStates)
          .then(() => {

            if (isPlayerFired) {
              setHitsProofToPlayer(new Map(hp2PRef.current.set(ctx.targetIdx, { status: isVerified ? 'verified' : 'failed', proof })))
            } else {
              setHitsProofToComputer(new Map(hp2CRef.current.set(ctx.targetIdx, { status: isVerified ? 'verified' : 'failed', proof })))
            }
          })
          .catch(e => {
            console.error("call contract error:", e);
            alert("call contract error:" + e.message);
          })
      })
    })
  }

  // *** Zero Knowledge Proof

  const sortShipsForZK = (ships) => {
    const SORTED_ZK_SHIP_NAMES = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];
    return ships.sort((a, b) => SORTED_ZK_SHIP_NAMES.indexOf(a) - SORTED_ZK_SHIP_NAMES.indexOf(b))
  }

  const shipHash = async (ships) => {
    let multiplier = 1n;
    const shipPreimage =
      sortShipsForZK(ships)
        .reduce(
          (res, ship) => {
            const val = ship.position.x + ship.position.y * 16 + (ship.orientation === "horizontal" ? 1 : 0) * 16 * 16
            const r = res + BigInt(val) * multiplier;
            multiplier *= BigInt(16 ** 3);
            return r;
          },
          BigInt(0)
        );

    const mimc7 = await buildMimc7();
    return mimc7.F.toString(mimc7.hash(shipPreimage, 0));
  }

  const toPrivateInputs = (ships) => {
    return ships.map(ship =>
      [
        ship.position.x,
        ship.position.y,
        ship.orientation === "horizontal" ? 1 : 0
      ]
    )
  }

  // *** End ZKP **

  const sunkSoundRef = useRef(null);
  const clickSoundRef = useRef(null);
  const lossSoundRef = useRef(null);
  const winSoundRef = useRef(null);

  const stopSound = (sound) => {
    sound.current.pause();
    sound.current.currentTime = 0;
  };
  const playSound = (sound) => {
    if (sound === 'sunk') {
      stopSound(sunkSoundRef);
      sunkSoundRef.current.play();
    }

    if (sound === 'click') {
      stopSound(clickSoundRef);
      clickSoundRef.current.play();
    }

    if (sound === 'lose') {
      stopSound(lossSoundRef);
      lossSoundRef.current.play();
    }

    if (sound === 'win') {
      stopSound(winSoundRef);
      winSoundRef.current.play();
    }
  };
  return (
    <React.Fragment>
      <audio
        ref={sunkSoundRef}
        src="/zk-battleship/sounds/ship_sunk.wav"
        className="clip"
        preload="auto"
      />
      <audio
        ref={clickSoundRef}
        src="/zk-battleship/sounds/click.wav"
        className="clip"
        preload="auto"
      />
      <audio ref={lossSoundRef} src="/zk-battleship/sounds/lose.wav" className="clip" preload="auto" />
      <audio ref={winSoundRef} src="/zk-battleship/sounds/win.wav" className="clip" preload="auto" />
      <GameView
        availableShips={availableShips}
        selectShip={selectShip}
        currentlyPlacing={currentlyPlacing}
        setCurrentlyPlacing={setCurrentlyPlacing}
        rotateShip={rotateShip}
        placeShip={placeShip}
        placedShips={placedShips}
        startTurn={startTurn}
        computerShips={computerShips}
        computerShipsHash={computerShipsHash}
        gameState={gameState}
        changeTurn={changeTurn}
        hitsByPlayer={hitsByPlayer}
        setHitsByPlayer={setHitsByPlayer}
        hitsByComputer={hitsByComputer}
        hitsProofToComputer={hitsProofToComputer}
        hitsProofToPlayer={hitsProofToPlayer}
        setHitsByComputer={setHitsByComputer}
        handleComputerTurn={handleComputerTurn}
        checkIfGameOver={checkIfGameOver}
        startAgain={startAgain}
        winner={winner}
        setComputerShips={setComputerShips}
        playSound={playSound}
        deployTxid={deployTxid}
        handleFire={handleFire}
      />
      <Balance balance={balance} signer={signer}></Balance>
    </React.Fragment>
  );
};
