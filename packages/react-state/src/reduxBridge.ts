// @typepurify/react-state - Redux Devtools Bridge
export function mutateReduxDevtoolsBridge(storeName: string) {
  let devtools: any = null;

  if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
    devtools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({ name: storeName });
    devtools.init({});
  }

  return {
    dispatch: (action: string, state: any) => {
      if (devtools) {
        devtools.send(action, state);
      }
    },
  };
}
