import { useState, useEffect } from "react";
import { Network, web3 } from "../web3";
export function Balance(props: any) {
  const [_balance, setBalance] = useState(0);
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("");
  useEffect(() => {
    if (web3.wallet) {
      web3.wallet.getbalance().then((balance) => {
        setBalance(balance);
      });

      web3.wallet.getRawChangeAddress().then((address) => {
        setAddress(address);
      });

      web3.wallet.getNetwork().then((network) => {
        if (network === Network.Testnet) {
          setNetwork('Testnet')
        } else {
          setNetwork('Mainnet')
        }
      });
    }
  }, []);

  return (
    <div className="wallet">
      <div className="walletInfo">
        <div className="balance">
          <label>Balance: {props.balance > 0 ? props.balance : _balance} <span> (satoshis)</span></label>
          <br></br>
          <label>Network: {network} </label>
          <br></br>
          <label>Address: {address} </label>
        </div>
      </div>
    </div>
  );
};
