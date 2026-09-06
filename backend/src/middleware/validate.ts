import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

/**
 * Runs after express-validator chains; short-circuits with a 400 and a
 * field-level error list if any validation rule failed.
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  next();
};
