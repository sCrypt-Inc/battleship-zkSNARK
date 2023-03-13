import { ZKProvider } from './zkProvider';

import Queue from "queue-promise";

const queue = new Queue({
  concurrent: 1,
  interval: 2000
});


onmessage = async function (event) {

  const { ctx, publicInputs, privateInputs } = event.data;
  // console.log('job received ', event.data)
  // setTimeout(() => self.postMessage({id, isVerified: true}), 5000) // mock
  console.log('onmessage', ctx)

  queue.enqueue(async () => {
    await runZKP(privateInputs, publicInputs)
    .then((res) => {
      const workerResult = event.data;
      workerResult.onmessage = true;
      postMessage({ ctx, ...res });
    });
  })

};


// run zero knowledge proof
function runZKP(privateInputs, publicInputs) {
  return ZKProvider
    .init()
    .then(() => {
      // computer witness for fire result
      return ZKProvider.computeWitness(privateInputs.concat(publicInputs))
    })
    .then(async ({ witness, output }) => {
      const proof = await ZKProvider.generateProof(witness);
      output = output === 'true' ? true : false;
      return {proof, output}
    })
    .then(async ({proof, output}) => {
      const isVerified = await ZKProvider.verify(proof);
      console.log('verify proof:', isVerified)
      return { isVerified, proof, output};
    })
    .catch(e => {
      console.error('zkp.worker error:', e)
      return {
        isVerified: false
      }
    })
}