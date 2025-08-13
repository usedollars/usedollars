import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

export function validationMiddleware(type: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const dtoObj = plainToClass(type, req.body);
    validate(dtoObj).then(errors => {
      if (errors.length > 0) {
        const messages = errors
          .map(err => Object.values(err.constraints || {}))
          .flat();
        return res.status(400).json({ errors: messages });
      } else {
        next();
      }
    });
  };
}

