
export function ReplicaBox(props: any) {
  let ship = props.availableShips.find((item: any) => item.name === props.shipName);
  let shipLength = new Array(ship.length).fill('ship');
  let allReplicaSquares = shipLength.map((item, index) => (
    <div className="small-square" key={index} />
  ));

  return (
    <div
      id={`${props.shipName}-replica`}
      onClick={() => props.selectShip(props.shipName)}
      key={`${props.shipName}`}
      className={props.isCurrentlyPlacing ? 'replica placing' : 'replica'}
    >
      <div className="replica-title">{props.shipName}</div>
      <div className="replica-squares">{allReplicaSquares}</div>
    </div>
  );
};
