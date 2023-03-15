import { ContractUtxos } from '../storage';
import { Whatsonchain } from '../web3';
import {
  SQUARE_STATE,
  stateToClass,
  generateEmptyLayout,
  putEntityInLayout,
  indexToCoords,
  calculateOverhang,
  canBePlaced,
} from './layoutHelpers';

export function PlayerBoard(props: any) {
  let currentlyPlacing = props.currentlyPlacing
  let setCurrentlyPlacing = props.setCurrentlyPlacing
  let rotateShip = props.rotateShip
  let placeShip = props.placeShip
  let placedShips = props.placedShips
  let hitsByComputer = props.hitsByComputer
  let hitsProofToComputer = props.hitsProofToComputer
  let playSound = props.playSound

  // Player ships on empty layout
  let layout = placedShips.reduce(
    (prevLayout: any, currentShip: any) =>
      putEntityInLayout(prevLayout, currentShip, SQUARE_STATE.ship),
    generateEmptyLayout()
  );

  // Hits by computer
  layout = hitsByComputer.reduce(
    (prevLayout: any, currentHit: any) =>
      putEntityInLayout(prevLayout, currentHit, currentHit.type),
    layout
  );

  layout = placedShips.reduce(
    (prevLayout: any, currentShip: any) =>
      currentShip.sunk
        ? putEntityInLayout(prevLayout, currentShip, SQUARE_STATE.ship_sunk)
        : prevLayout,
    layout
  );

  const isPlacingOverBoard = currentlyPlacing && currentlyPlacing.position != null;
  const canPlaceCurrentShip = isPlacingOverBoard && canBePlaced(currentlyPlacing, layout);

  if (isPlacingOverBoard) {
    if (canPlaceCurrentShip) {
      layout = putEntityInLayout(layout, currentlyPlacing, SQUARE_STATE.ship);
    } else {
      let forbiddenShip = {
        ...currentlyPlacing,
        length: currentlyPlacing.length - calculateOverhang(currentlyPlacing),
      };
      layout = putEntityInLayout(layout, forbiddenShip, SQUARE_STATE.forbidden);
    }
  }




  let squares = layout.map((square: any, index: any) => {
    const hitProofStatus = hitsProofToComputer.get(index);
    return (
      <div
        onMouseDown={rotateShip}
        onClick={() => {
          if (canPlaceCurrentShip) {
            playSound('click');
            placeShip(currentlyPlacing);
          } else if (hitProofStatus && hitProofStatus.status === 'verified') {
            const utxo = ContractUtxos.getComputerUtxoByIndex(index);
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
        className={`square ${stateToClass[square]} ${hitProofStatus ? hitProofStatus.status : ''}`}
        key={`square-${index}`}
        id={`square-${index}`}
        onMouseOver={() => {
          if (currentlyPlacing) {
            setCurrentlyPlacing({
              ...currentlyPlacing,
              position: indexToCoords(index),
            });
          }
        }}
      />
    );
  });

  return (
    <div>
      <h2 className="player-title">You</h2>
      <div className="board">{squares}</div>
    </div>
  );
};
