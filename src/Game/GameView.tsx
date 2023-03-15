import React from 'react';

import { PlayerFleet } from './PlayerFleet';
import { PlayerBoard } from './PlayerBoard';
import { ComputerBoard } from './ComputerBoard';
import { PlayerTips } from './PlayerTips';

export function GameView(props: any) {
  return (
    <section id="game-screen">
      {props.gameState !== 'placement' ? (
        <PlayerTips
          gameState={props.gameState}
          hitsbyPlayer={props.hitsByPlayer}
          hitsByComputer={props.hitsByComputer}
          winner={props.winner}
          deployTxid={props.deployTxid}
          startAgain={props.startAgain}
        />
      ) : (
        <PlayerFleet
          availableShips={props.availableShips}
          selectShip={props.selectShip}
          currentlyPlacing={props.currentlyPlacing}
          startTurn={props.startTurn}
          startAgain={props.startAgain}
        />
      )}

      <PlayerBoard
        currentlyPlacing={props.currentlyPlacing}
        setCurrentlyPlacing={props.setCurrentlyPlacing}
        rotateShip={props.rotateShip}
        placeShip={props.placeShip}
        placedShips={props.placedShips}
        hitsByComputer={props.hitsByComputer}
        hitsProofToComputer={props.hitsProofToComputer}
        playSound={props.playSound}
      />
      <ComputerBoard
        computerShips={props.computerShips}
        changeTurn={props.changeTurn}
        gameState={props.gameState}
        hitComputer={props.hitComputer}
        hitsByPlayer={props.hitsByPlayer}
        hitsByComputer={props.hitsByComputer}
        setHitsByPlayer={props.setHitsByPlayer}
        handleComputerTurn={props.handleComputerTurn}
        checkIfGameOver={props.checkIfGameOver}
        setComputerShips={props.setComputerShips}
        hitsProofToPlayer={props.hitsProofToPlayer}
        playSound={props.playSound}
        handleFire={props.handleFire}
      />
    </section>
  );
};
