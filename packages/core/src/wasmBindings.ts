export interface WasmModuleOptions {
  fallbackMode?: boolean;
}

export class WasmModule {
  private isLoaded: boolean = false;
  private instance: WebAssembly.Instance | null = null;
  private fallbackMode: boolean;

  constructor(options: WasmModuleOptions = {}) {
    this.fallbackMode = options.fallbackMode ?? false;
  }

  /**
   * Loads and instantiates the WASM module from a buffer.
   */
  async load(wasmBuffer: BufferSource): Promise<void> {
    if (this.fallbackMode) {
      console.warn('[WasmModule] Running in fallback mode. WASM loading skipped.');
      return;
    }

    try {
      const { instance } = await WebAssembly.instantiate(wasmBuffer);
      this.instance = instance;
      this.isLoaded = true;
    } catch (error) {
      console.error('[WasmModule] Failed to instantiate WASM module.', error);
      this.fallbackMode = true; // Gracefully fallback
    }
  }

  /**
   * Invokes a specific function exported by the WASM module.
   */
  invoke<T = any>(functionName: string, ...args: any[]): T {
    if (this.fallbackMode || !this.isLoaded || !this.instance) {
      throw new Error(`[WasmModule] Cannot invoke '${functionName}': module not loaded or running in fallback mode.`);
    }

    const func = this.instance.exports[functionName];
    if (typeof func !== 'function') {
      throw new Error(`[WasmModule] Export '${functionName}' is not a function.`);
    }

    return func(...args) as T;
  }

  /**
   * Returns whether the WASM module is successfully loaded.
   */
  get ready(): boolean {
    return this.isLoaded;
  }
}
