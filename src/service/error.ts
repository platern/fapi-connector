import {getReasonPhrase, StatusCodes} from "http-status-codes";

export class HttpException extends Error {
  status: number;
  message: string;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.message = message;
  }

  response = () => new ErrorResponse(this.status, this.message);
}

export class ConfigException extends Error {
  message: string;

  constructor(message: string) {
    super(message);
    this.message = message;
  }
}

export class ErrorResponse {
  error: string;
  message: string;

  constructor(status: number, message: string) {
    this.error = getReasonPhrase(status);
    this.message = message;
  }

}

export const opError = (code: number, message: string): HttpException => {
  return new HttpException(code, message);
}

export const badRequestError = (message: string): HttpException => {
  return new HttpException(StatusCodes.BAD_REQUEST, message);
};

export const configError = (message: string): HttpException => {
  return new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, message);
};

export const dataError = (message: string): HttpException => {
  return new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, message);
};

export const externalCallError = (message: string): HttpException => {
  return new HttpException(StatusCodes.FAILED_DEPENDENCY, message);
};

export const notFoundError = (message: string): HttpException => {
  return new HttpException(StatusCodes.NOT_FOUND, message);
};

export const openIDProviderError = (message: string): HttpException => {
  return new HttpException(StatusCodes.FAILED_DEPENDENCY, message);
};

export const unknownError = (message: string): HttpException => {
  return new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, message);
};
