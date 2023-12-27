import { useEffect, useState } from 'react';
import artifact from '../artifacts/zkBattleship.json'


export function WelcomeScreen(props: any) {

  const [loading, setLoading] = useState(true); // play or welcome
  // Similar to componentDidMount and componentDidUpdate:
  useEffect(() => {

    if (!props.desc) {
      // TODO: Shouldn't be needed with future versions of scrypt-ts
      if (!artifact.hasOwnProperty('transformer')) {
        const transformer = {
          "success": true,
          "errors": [],
          "scryptfile": "",
          "sourceMapFile": "",
          "ctxMethods": [
            "move"
          ]
        }
        artifact['transformer'] = transformer
      }

      props.setArtifact(artifact)
      setLoading(false)
    }

  });
  return (
    <main>
      <h2 className="tip-box-title">Rules</h2>
      <p className="player-tip">
        You and your opponent are competing navy commanders. Your fleets are positioned at
        secret coordinates, and you take turns firing torpedoes at each other. The first
        to sink the other person’s whole fleet wins!
      </p>
      <button onClick={props.startPlay}>{loading ? "loading..." : "Play"}</button>
    </main>
  );
};
