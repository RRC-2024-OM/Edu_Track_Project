import { Request, Response, NextFunction } from 'express';

export class ErrorMiddleware {
  static handle(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ): Response {
    console.error(`[ERROR] ${err.name || 'UnknownError'}: ${err.message}`);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    return res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
  }
}
