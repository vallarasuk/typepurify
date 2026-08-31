// @typepurify/paginate - Optimistic UI Updater Invalidator
export class OptimisticUIUpdater<T> {
  private originalState: T[] = [];
  private currentState: T[] = [];

  constructor(initialState: T[]) {
    this.originalState = [...initialState];
    this.currentState = [...initialState];
  }

  public applyOptimistic(item: T): void {
    this.currentState.push(item);
  }

  public invalidateOptimistic(): void {
    // Revert to original
    this.currentState = [...this.originalState];
  }

  public commitOptimistic(): void {
    // Lock in the new state
    this.originalState = [...this.currentState];
  }

  public getState(): T[] {
    return this.currentState;
  }
}
