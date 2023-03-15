import React from 'react';
import { ReplicaBox } from './ReplicaBox';

export function PlayerFleet(props: any) {
  let availableShips = props.availableShips
  let selectShip = props.selectShip
  let currentlyPlacing = props.currentlyPlacing
  let startTurn = props.startTurn
  let startAgain = props.startAgain

  let shipsLeft = availableShips.map((ship: { name: any; }) => ship.name);

  // For every ship still available, return a Replica Box with the ship's name and as many squares as its length
  let shipReplicaBoxes = shipsLeft.map((shipName: React.Key | null | undefined) => (
    <ReplicaBox
      selectShip={selectShip}
      key={shipName}
      isCurrentlyPlacing={currentlyPlacing && currentlyPlacing.name === shipName}
      shipName={shipName}
      availableShips={availableShips}
    />
  ));

  let fleet = (
    <div id="replica-fleet">
      {shipReplicaBoxes}
      <p className="player-tip">Right click to rotate before you position.</p>
      <p className="restart" onClick={startAgain}>
        Restart
      </p>
    </div>
  );

  let playButton = (
    <div id="play-ready">
      <p className="player-tip">Ships are in formation.</p>
      <button id="play-button" onClick={startTurn}>
        Start game
      </button>
    </div>
  );

  return (
    <div id="available-ships">
      <div className="tip-box-title"> Your Ships</div>
      {availableShips.length > 0 ? fleet : playButton}
    </div>
  );
};
