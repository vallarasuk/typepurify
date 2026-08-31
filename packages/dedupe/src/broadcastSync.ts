// @typepurify/dedupe - BroadcastChannel Sync
export class BroadcastSync {
  private channel: BroadcastChannel | null = null;

  constructor(public channelName: string) {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(channelName);
    }
  }

  public subscribe(onMessage: (data: any) => void): () => void {
    if (!this.channel) return () => {};

    const handler = (event: MessageEvent) => onMessage(event.data);
    this.channel.addEventListener('message', handler);

    return () => this.channel?.removeEventListener('message', handler);
  }

  public broadcast(data: any): void {
    if (this.channel) {
      this.channel.postMessage(data);
    }
  }
}
