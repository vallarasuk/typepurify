export interface Request {
  headers: Record<string, string | string[] | undefined>;
  body?: any;
}
export interface Response {
  status(code: number): this;
  json(body: any): this;
}
export type NextFunction = (err?: any) => void;

export interface RaspConfig {
  blockSqlInjection?: boolean;
  blockXss?: boolean;
  maxPayloadSize?: number;
}

/**
 * Runtime Application Self-Protection (RASP) middleware for @typepurify/security.
 * Intercepts incoming Express/Connect requests to detect malicious payloads before they hit the application layer.
 */
export function createRaspMiddleware(config: RaspConfig = {}) {
  const sqlRegex = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR 1=1)\b)/i;
  const xssRegex = /(<script.*?>.*?<\/script>)/i;
  const maxSize = config.maxPayloadSize ?? 1024 * 1024; // 1MB

  return function raspMiddleware(req: Request, res: Response, next: NextFunction) {
    // Check Payload Size
    const contentLength = parseInt(String(req.headers['content-length'] || '0'), 10);
    if (contentLength > maxSize) {
      return res.status(413).json({ error: 'RASP: Payload Too Large' });
    }

    // Deep inspect body for threats
    if (req.body && typeof req.body === 'object') {
      const payloadStr = JSON.stringify(req.body);

      if (config.blockSqlInjection && sqlRegex.test(payloadStr)) {
        return res.status(403).json({ error: 'RASP: SQL Injection detected' });
      }

      if (config.blockXss && xssRegex.test(payloadStr)) {
        return res.status(403).json({ error: 'RASP: XSS detected' });
      }
    }

    next();
  };
}
