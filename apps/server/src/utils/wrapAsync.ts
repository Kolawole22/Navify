import { Request, Response, NextFunction, RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

// Define a more specific type for async handlers we want to wrap
type AsyncRequestHandler<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs
> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps an async request handler to catch errors and pass them to the Express error middleware.
 * Accepts generic types for params, response body, request body, and query.
 * @param fn The async request handler function.
 * @returns An Express RequestHandler.
 */
const wrapAsync = <
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs
>(
  fn: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => {
    // Make sure to catch any errors and pass them along to the error handler
    fn(req, res, next).catch(next);
  };
};

export default wrapAsync;
