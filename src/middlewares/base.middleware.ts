class Middleware {
  handleRequest(req: Request, resp: Response, next: NextFunction) {
    // # extract ussd params from request body/parameters/json/form-data
    // # extract session from redis
    next();
  }

  handleResponse(req: Request, resp: Response, next: NextFunction) {
    // # pick data from session, eg. req.session
    // # AND
    // # return response based on the expected format of the ussd gateway
  }
}
