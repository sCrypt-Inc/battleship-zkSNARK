import { useState, useEffect } from "react";

export function Balance(props: any) {
  const [_balance, setBalance] = useState(props.balance || 0);
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("");
  useEffect(() => {
    if (props.signer) {
      props.signer.getBalance().then((balance) => {
        const total = balance.confirmed + balance.unconfirmed
        setBalance(total)
      })
      props.signer.getNetwork().then((network) => {
        setNetwork(network.name)
      })
      props.signer.getDefaultAddress().then((address) => {
        setAddress(address.toString())
      })
    }
  }, []);

  return (
    <div className="wallet">
      <div className="walletInfo">
        <div className="balance">
          <label>Balance: {_balance} <span> (satoshis)</span></label>
          <br></br>
          <label>Network: {network} </label>
          <br></br>
          <label>Address: {address} </label>
        </div>
      </div>
    </div>
  );
};
