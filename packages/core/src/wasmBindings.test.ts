import { describe, it, expect } from 'vitest';
import { WasmModule } from './wasmBindings';

describe('WasmModule', () => {
  it('should enable fallback mode when requested', () => {
    const wasm = new WasmModule({ fallbackMode: true });
    expect(() => wasm.invoke('test')).toThrow('module not loaded or running in fallback mode');
  });
  
  it('should handle load failure and fallback', async () => {
    const wasm = new WasmModule();
    const mockBuffer = new ArrayBuffer(8);
    // Invalid wasm buffer will fail
    await wasm.load(mockBuffer);
    expect(wasm.ready).toBe(false);
    expect(() => wasm.invoke('test')).toThrow('module not loaded or running in fallback mode');
  });
});
