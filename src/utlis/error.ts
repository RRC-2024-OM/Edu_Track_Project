import { Response } from 'express';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const handleError = (error: unknown, res: Response): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
  } else if (error instanceof Error) {
    console.error(error.stack);
    res.status(500).json({ error: error.message });
  } else {
    console.error('Unknown error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};