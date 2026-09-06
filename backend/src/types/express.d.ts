import { IUser } from "../models/User";

// Augment Express's Request type so `req.user` is available and typed
// after the auth middleware runs, instead of using `any` everywhere.
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};
