export class RetryableFetch {
  async fetch(_url: string) {
    console.log(_url);
    return 'data';
  }
}
