import {
  ExceptionFilter,
  Catch,
  HttpException,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const req = ctx.getRequest();
    const res = ctx.getResponse();

    const status = exception.getStatus();

    let message = exception.message;

    if (exception instanceof BadRequestException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response['message']) {
        message = response['message'];
      }
    }

    res.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}
