export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

export class HttpException extends Error {
  public status: HttpStatus;
  public message: string;
  public errors?: any; // Campo opcional para errores de validación detallados

  constructor(message: string, status: HttpStatus, errors?: any) {
    super(message);
    this.message = message;
    this.status = status;
    this.errors = errors;
    // Esto es necesario para que 'instanceof HttpException' funcione correctamente
    Object.setPrototypeOf(this, HttpException.prototype);
  }
} 