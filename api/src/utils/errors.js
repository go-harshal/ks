class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

const notFound = (message = 'Not found') => new HttpError(404, 'NOT_FOUND', message);
const badRequest = (message = 'Bad request', fields) => new HttpError(400, 'BAD_REQUEST', message, fields);

module.exports = { HttpError, notFound, badRequest };
