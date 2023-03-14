
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { WelcomeScreen } from './WelcomeScreen';
import { Game } from './Game/Game';
import { Header } from './Header';
import { Footer } from './Footer';
import reportWebVitals from './reportWebVitals';

import './css/style.css';
import { Network, SensiletWallet, web3} from './web3';
import { initPlayer } from './storage';
import { SensiletSigner, WhatsonchainProvider, bsv } from 'scrypt-ts';

export const App = () => {
  const [appState, setAppState] = useState('welcome'); // play or welcome
  const [desc, setDesc] = useState(null); // play or welcome
  const [signer, setSigner] = useState(null); 

  const startPlay = async () => {
    
    const provider = new WhatsonchainProvider(bsv.Networks.testnet);  // TODO: Maybe change to gorillapool because if big scripts
    const signer = new SensiletSigner(provider);
    
    await signer.getConnectedTarget() as any;

    setAppState('play');
    setSigner(signer)

    //const wallet =  new SensiletWallet();
    //web3.setWallet(wallet);
    //const isConnected = await web3.wallet.isConnected();

    //if(isConnected) {
    //  const n = await wallet.getNetwork();

    //  if(n === Network.Mainnet) {

    //    alert("your sensilet wallet's network is mainnet, switch to testnet before playing.");
    //    return;
    //  }

    //  web3.setWallet(new SensiletWallet(n));

    //  setAppState('play');
    //} else {

    //  try {
    //    const res = await web3.wallet.requestAccount("battleship", []);
    //    if (res) {
    //      setAppState('play');
    //    }
    //  } catch (error) {
    //    console.error("requestAccount error", error);
    //  }

    //}
  };

  // Renders either Welcome Screen or Game
  return (
    <React.Fragment>
      <Header />
      {appState === 'play' ? <Game desc={desc} signer={signer}/> : <WelcomeScreen startPlay={startPlay} desc={desc} setDesc={setDesc} />}
      <Footer />
    </React.Fragment>
  );
};


initPlayer()

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();