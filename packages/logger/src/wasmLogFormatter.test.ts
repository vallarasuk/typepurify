import { describe, it, expect } from 'vitest';
import { WasmLogFormatter } from './wasmLogFormatter';

describe('WasmLogFormatter', () => {
  it('should format logs correctly', () => {
    const formatter = new WasmLogFormatter({ disableWasm: true });
    const log = formatter.format('info', 'Hello', { user: 1 });
    expect(log).toContain('[INFO]: Hello {"user":1}');
  });
});
