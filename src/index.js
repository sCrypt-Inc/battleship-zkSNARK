import React, { useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import { WelcomeScreen } from './WelcomeScreen';
import { Game } from './Game/Game.js';
import { Header } from './Header';
import { Footer } from './Footer';

import './css/style.css';
import { Network, SensiletWallet, web3} from './web3';
import { initPlayer } from './storage';
import { bsv } from 'scryptlib/dist';

export const App = () => {
  const [appState, setAppState] = useState('welcome'); // play or welcome

  const [desc, setDesc] = useState(null); // play or welcome

  useEffect(() => {

    bsv.Transaction.FEE_PER_KB = 0.0001
    const script = document.createElement('script');
  
    script.src = "/zk-battleship/zk/snarkjs.min.js";
    script.async = true;
  
    document.body.appendChild(script);
  
    return () => {
      document.body.removeChild(script);
    }
  }, []);

  const startPlay = async () => {

    const wallet =  new SensiletWallet();
    web3.setWallet(wallet);
    const isConnected = await web3.wallet.isConnected();

    if(isConnected) {
      const n = await wallet.getNetwork();

      if(n === Network.Mainnet) {

        alert("your sensilet wallet's network is mainnet, switch to testnet before playing.");
        return;
      }

      web3.setWallet(new SensiletWallet(n));

      setAppState('play');
    } else {

      try {
        const res = await web3.wallet.requestAccount("battleship");
        if (res) {
          setAppState('play');
        }
      } catch (error) {
        console.error("requestAccount error", error);
      }

    }
  };

  // Renders either Welcome Screen or Game
  return (
    <React.Fragment>
      <Header />
      {appState === 'play' ? <Game desc={desc}/> : <WelcomeScreen startPlay={startPlay} desc={desc} setDesc={setDesc} />}
      <Footer />
    </React.Fragment>
  );
};

initPlayer();
ReactDOM.render(<App />, document.getElementById('root'));
