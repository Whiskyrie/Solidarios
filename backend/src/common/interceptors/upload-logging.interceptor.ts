// src/common/interceptors/upload-logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class UploadLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(UploadLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const files = request.files;
    const itemId = request.params.id;
    const userId = request.user?.id;

    if (files && files.length > 0) {
      this.logger.log(
        `Upload iniciado - Usuário: ${userId}, Item: ${itemId}, Arquivos: ${files.length}`,
      );

      files.forEach((file: Express.Multer.File, index: number) => {
        this.logger.debug(
          `Arquivo ${index + 1}: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        );
      });
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(
          `Upload concluído - Usuário: ${userId}, Item: ${itemId}, Duração: ${duration}ms`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.error(
          `Upload falhou - Usuário: ${userId}, Item: ${itemId}, Duração: ${duration}ms, Erro: ${error.message}`,
        );
        return throwError(() => error);
      }),
    );
  }
}
