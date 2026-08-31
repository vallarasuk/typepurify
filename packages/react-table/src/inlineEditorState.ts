import { useState, useCallback } from 'react';

export interface InlineEditorConfig<T> {
  initialData: T;
  onSave?: (data: T) => Promise<void> | void;
  validate?: (data: T) => boolean;
}

/**
 * Hook to manage inline editing state for table rows in @typepurify/react-table.
 * Supports dirty states, validation, and async saving.
 */
export function useInlineEditor<T>(config: InlineEditorConfig<T>) {
  const [data, setData] = useState<T>(config.initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = useCallback(() => setIsEditing(true), []);

  const cancelEdit = useCallback(() => {
    setData(config.initialData);
    setIsEditing(false);
    setError(null);
  }, [config.initialData]);

  const saveEdit = useCallback(async () => {
    if (config.validate && !config.validate(data)) {
      setError('Validation failed');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (config.onSave) {
        await config.onSave(data);
      }
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [data, config]);

  return {
    data,
    setData,
    isEditing,
    isSaving,
    error,
    startEdit,
    cancelEdit,
    saveEdit,
  };
}
