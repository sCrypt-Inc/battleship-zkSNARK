
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { WelcomeScreen } from './WelcomeScreen';
import { Game } from './Game/Game';
import { Header } from './Header';
import { Footer } from './Footer';
import reportWebVitals from './reportWebVitals';

import './css/style.css';
import { SensiletSigner, WhatsonchainProvider, bsv } from 'scrypt-ts';

export const App = () => {
  const [appState, setAppState] = useState('welcome'); // play or welcome
  const [artifact, setArtifact] = useState(null); // play or welcome
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    const script = document.createElement('script');

    script.src = "/zk/snarkjs.min.js";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    }
  }, []);

  const startPlay = async () => {

    const provider = new WhatsonchainProvider(bsv.Networks.testnet);  // TODO: Maybe change to gorillapool because if big scripts
    const signer = new SensiletSigner(provider);

    await signer.getConnectedTarget() as any;

    setAppState('play');
    setSigner(signer)
  };

  // Renders either Welcome Screen or Game
  return (
    <React.Fragment>
      <Header />
      {appState === 'play' ? <Game artifact={artifact} signer={signer} /> : <WelcomeScreen startPlay={startPlay} artifact={artifact} setArtifact={setArtifact} />}
      <Footer />
    </React.Fragment>
  );
};

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