import { ContractUtxos } from '../storage';
import { Whatsonchain } from '../web3';
import {
  stateToClass,
  generateEmptyLayout,
  putEntityInLayout,
  SQUARE_STATE,
  indexToCoords,
  updateSunkShips,
  coordsToIndex,
} from './layoutHelpers';

export function ComputerBoard(props: any) {
  let computerShips = props.computerShips
  let gameState = props.gameState
  let hitsByPlayer = props.hitsByPlayer
  let hitsByComputer = props.hitsByComputer
  let setHitsByPlayer = props.setHitsByPlayer
  let handleComputerTurn = props.handleComputerTurn
  let checkIfGameOver = props.checkIfGameOver
  let setComputerShips = props.setComputerShips
  let playSound = props.playSound
  let handleFire = props.handleFire
  let hitsProofToPlayer = props.hitsProofToPlayer

  // Ships on an empty layout
  let compLayout = computerShips.reduce(
    (prevLayout: any, currentShip: any) =>
      putEntityInLayout(prevLayout, currentShip, SQUARE_STATE.ship),
    generateEmptyLayout()
  );

  //  Add hits dealt by player
  compLayout = hitsByPlayer.reduce(
    (prevLayout: any, currentHit: { type: string; }) =>
      putEntityInLayout(prevLayout, currentHit, currentHit.type),
    compLayout
  );

  compLayout = computerShips.reduce(
    (prevLayout: any, currentShip: { sunk: any; }) =>
      currentShip.sunk
        ? putEntityInLayout(prevLayout, currentShip, SQUARE_STATE.ship_sunk)
        : prevLayout,
    compLayout
  );

  // Check what's at the square and decide what next
  const fireTorpedo = (index: string | number) => {
    if (compLayout[index] === 'ship') {
      const newHits = [
        ...hitsByPlayer,
        {
          position: indexToCoords(index),
          type: SQUARE_STATE.hit,
        },
      ];
      setHitsByPlayer(newHits);

      let successfulPlayerHits = newHits.filter((hit) => hit.type === 'hit').length;
      let successfulComputerHits = hitsByComputer.filter((hit: { type: string; }) => hit.type === 'hit')
        .length;

      const playerHits_ = new Array(100).fill(false);
      const computerHits_ = new Array(100).fill(false);

      newHits.map((hit) => coordsToIndex(hit.position)).forEach(v => {
        playerHits_[v] = true
      })

      hitsByComputer.map((hit: { position: any; }) => coordsToIndex(hit.position)).forEach((v: any) => {
        computerHits_[v] = true
      })

      handleFire('player', index, {
        successfulPlayerHits: successfulPlayerHits,
        successfulComputerHits: successfulComputerHits,
        playerTurn: false,
        playerHits: playerHits_,
        computerHits: computerHits_
      });

      return newHits;
    }
    if (compLayout[index] === 'empty') {
      const newHits = [
        ...hitsByPlayer,
        {
          position: indexToCoords(index),
          type: SQUARE_STATE.miss,
        },
      ];
      setHitsByPlayer(newHits);

      let successfulPlayerHits = newHits.filter((hit) => hit.type === 'hit').length;
      let successfulComputerHits = hitsByComputer.filter((hit: { type: string; }) => hit.type === 'hit')
        .length;

      const playerHits_ = new Array(100).fill(false);
      const computerHits_ = new Array(100).fill(false);

      newHits.map((hit) => coordsToIndex(hit.position)).forEach(v => {
        playerHits_[v] = true
      })

      hitsByComputer.map((hit: { position: any; }) => coordsToIndex(hit.position)).forEach((v: any) => {
        computerHits_[v] = true
      })

      handleFire('player', index, {
        successfulPlayerHits: successfulPlayerHits,
        successfulComputerHits: successfulComputerHits,
        playerTurn: false,
        playerHits: playerHits_,
        computerHits: computerHits_
      });
      return newHits;
    }
    return []
  };

  const playerTurn = gameState === 'player-turn';
  const playerCanFire = playerTurn && !checkIfGameOver();

  let alreadyHit = (index: string | number) =>
    compLayout[index] === 'hit' ||
    compLayout[index] === 'miss' ||
    compLayout[index] === 'ship-sunk';

  let compSquares = compLayout.map((square: string | number, index: any) => {
    const hitProofStatus = hitsProofToPlayer.get(index);
    return (
      <div
        // Only display square if it's a hit, miss, or sunk ship
        className={
          stateToClass[square] === 'hit' ||
            stateToClass[square] === 'miss' ||
            stateToClass[square] === 'ship-sunk'
            ? `square ${stateToClass[square]} ${hitProofStatus ? hitProofStatus.status : ''}`
            : `square`
        }
        key={`comp-square-${index}`}
        id={`comp-square-${index}`}
        onClick={async () => {
          if (playerCanFire && !alreadyHit(index)) {

            const newHits = fireTorpedo(index);

            const shipsWithSunkFlag = updateSunkShips(newHits, computerShips);
            const sunkShipsAfter = shipsWithSunkFlag.filter((ship) => ship.sunk).length;
            const sunkShipsBefore = computerShips.filter((ship: { sunk: any; }) => ship.sunk).length;
            if (sunkShipsAfter > sunkShipsBefore) {
              playSound('sunk');
            }

            setComputerShips(shipsWithSunkFlag);

            handleComputerTurn();

          } else if (hitProofStatus && hitProofStatus.status === 'verified') { // TODO: use somthing like `hitsTxStatus` to replace `hitProofStatus`

            const utxo = ContractUtxos.getPlayerUtxoByIndex(index);

            if (utxo) {
              if (utxo.utxo) {
                let win = window.open(Whatsonchain.getTxUri(utxo.utxo.txId), '_blank')
                if (win) { win.focus() };
              }
            } else {
              console.error('utxo not found for index: ', index)
            }
          }
        }}
      />
    );
  });

  return (
    <div>
      <h2 className="player-title">Computer</h2>
      <div className="board">{compSquares}</div>
    </div>
  );
};