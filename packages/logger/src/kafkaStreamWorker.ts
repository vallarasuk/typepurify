// @typepurify/logger - Kafka Stream Worker (Zero Dependency Simulation)
export class KafkaStreamWorker {
  private logBuffer: string[] = [];

  constructor(
    private maxBuffer: number = 100,
    private topic: string = 'app-logs',
  ) {}

  public streamLog(message: string): void {
    const formatted = JSON.stringify({
      topic: this.topic,
      timestamp: new Date().toISOString(),
      message,
    });

    this.logBuffer.push(formatted);
    if (this.logBuffer.length >= this.maxBuffer) {
      this.flush();
    }
  }

  public flush(): void {
    // In a real environment, we'd use native HTTP requests to a Kafka REST proxy here
    if (this.logBuffer.length > 0) {
      // simulated flush
      this.logBuffer = [];
    }
  }
}
