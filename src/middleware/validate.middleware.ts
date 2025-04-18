import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const validate = (schema: Joi.ObjectSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const validationErrors = error.details.map((detail) => detail.message);
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
      return; 
    }

    next(); 
  };
};

export default validate;
