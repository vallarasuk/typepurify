import { describe, it, expect } from 'vitest';
import { useInlineEditor } from './inlineEditorState';
// Basic structure test to ensure module parses
describe('inlineEditorState', () => {
  it('should export useInlineEditor', () => {
    expect(useInlineEditor).toBeDefined();
  });
});
