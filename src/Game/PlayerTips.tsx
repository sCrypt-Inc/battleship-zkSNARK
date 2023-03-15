import { Whatsonchain } from '../web3';

export function PlayerTips(props: any) {

  let gameState = props.gameState
  let hitsByPlayer = props.hitsbyPlayer
  let hitsByComputer = props.hitsByComputer
  let startAgain = props.startAgain
  let winner = props.winner
  let deployTxid = props.deployTxid

  let numberOfHits = hitsByPlayer.length;
  let numberOfSuccessfulHits = hitsByPlayer.filter((hit: any) => hit.type === 'hit').length;
  let accuracyScore = Math.round(100 * (numberOfSuccessfulHits / numberOfHits));
  let succesfulComputerHits = hitsByComputer.filter((hit: any) => hit.type === 'hit').length;

  let gameOverPanel = (
    <div>
      <div className="tip-box-title">Game Over!</div>
      <p className="player-tip">
        {winner === 'player' ? 'You win! 🎉' : 'You lose 😭. Better luck next time! '}
      </p>
      <p className="restart" onClick={startAgain}>
        Play again?
      </p>
    </div>
  );

  let tipsPanel = (
    <div>
      <div className="tip-box-title">Stats</div>
      <div id="firing-info">
        <ul>
          <li>deploy txid: <a href={Whatsonchain.getTxUri(deployTxid)} target="_blank" rel="noopener noreferrer">{deployTxid.substr(0, 6)}</a></li>
          <li>{numberOfSuccessfulHits} successful hits</li>
          <li>{accuracyScore > 0 ? `${accuracyScore}%` : `0%`} accuracy </li>
        </ul>
        <p className="player-tip">The first to sink all 5 opponent ships wins.</p>
        <p className="restart" onClick={startAgain}>
          Restart
        </p>
      </div>
    </div>
  );

  return (
    <div id="player-tips">
      {numberOfSuccessfulHits === 17 || succesfulComputerHits === 17
        ? gameOverPanel
        : tipsPanel}
    </div>
  );
};
