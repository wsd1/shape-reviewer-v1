import {
  useEffect,
  useMemo,
  useRef,
  //useState,
} from 'react';

//let initStateWorker = {};
export default function useShapeWorker(createWorker, stateHandles) {
  //const [stateWorker, setStateWorker] = //(initStateWorker);

  const worker = useMemo(createWorker, [createWorker]);
  const lastWorker = useRef(null);
  useEffect(() => {
    lastWorker.current = worker;
    //let setStateWorkerSafe = (nextState) => setStateWorker(nextState);

    worker.onmessage = (e) => {
      let msg = e.data; //{ progress, graphs } 
      //console.log(`MEMOVEME: worker!!${msg}`);
      for(let handleName in stateHandles)
        stateHandles[handleName].process(stateHandles[handleName], msg)
    };

    //worker.onerror = () => setStateWorkerSafe({ error: 'error' });
    //worker.onmessageerror = () => setStateWorkerSafe({ error: 'messageerror' });

    //if (initCmd) worker.postMessage(initCmd);

    const cleanup = () => {
      //setStateWorkerSafe = () => null; // we should not setState after cleanup.
      worker.terminate();
      //setStateWorker(initStateWorker);
    };
    return cleanup;
  }, [worker, stateHandles]);




  return { 
    //stateProgress, 
    //stateGraphs,
    command: (input) => {
      lastWorker.current.postMessage(input);
    }};
};



