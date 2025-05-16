"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Wraps an async request handler to catch errors and pass them to the Express error middleware.
 * Accepts generic types for params, response body, request body, and query.
 * @param fn The async request handler function.
 * @returns An Express RequestHandler.
 */
const wrapAsync = (fn) => {
    return (req, res, next) => {
        // Make sure to catch any errors and pass them along to the error handler
        fn(req, res, next).catch(next);
    };
};
exports.default = wrapAsync;
//# sourceMappingURL=wrapAsync.js.map