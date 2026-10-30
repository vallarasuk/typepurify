export type RequestInterceptor = (
  url: string,
  init?: RequestInit,
) => Promise<{ url: string; init?: RequestInit }> | { url: string; init?: RequestInit };

export type ResponseInterceptor = (response: Response, url: string) => Promise<Response> | Response;

/**
 * Pipeline to register, order, and execute request and response interceptors.
 */
export class RequestInterceptorChain {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  useRequest(interceptor: RequestInterceptor): this {
    this.requestInterceptors.push(interceptor);
    return this;
  }

  useResponse(interceptor: ResponseInterceptor): this {
    this.responseInterceptors.push(interceptor);
    return this;
  }

  async applyRequest(
    url: string,
    init?: RequestInit,
  ): Promise<{ url: string; init?: RequestInit }> {
    let currentUrl = url;
    let currentInit = init;

    for (const interceptor of this.requestInterceptors) {
      const result = await interceptor(currentUrl, currentInit);
      currentUrl = result.url;
      currentInit = result.init;
    }

    return { url: currentUrl, init: currentInit };
  }

  async applyResponse(response: Response, url: string): Promise<Response> {
    let currentResponse = response;

    for (const interceptor of this.responseInterceptors) {
      currentResponse = await interceptor(currentResponse, url);
    }

    return currentResponse;
  }

  clear(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }
}
