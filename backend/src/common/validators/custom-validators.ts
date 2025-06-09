// src/common/validators/custom-validators.ts
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { Injectable } from '@nestjs/common';

// Validador personalizado para senhas fortes
@ValidatorConstraint({ name: 'strongPassword', async: false })
@Injectable()
export class StrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string) {
    // Pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial
    // Mínimo de 8 caracteres
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  }

  defaultMessage() {
    return 'A senha deve ter pelo menos 8 caracteres e incluir letras maiúsculas, minúsculas, números e caracteres especiais';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: StrongPasswordConstraint,
    });
  };
}

// Validador para prevenir XSS em strings
@ValidatorConstraint({ name: 'noXss', async: false })
@Injectable()
export class NoXssConstraint implements ValidatorConstraintInterface {
  validate(text: string) {
    if (typeof text !== 'string') return true;

    // Procura por tags HTML ou scripts potencialmente maliciosos
    const xssPattern =
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|javascript:|on\w+\s*=|<\s*\/?\s*[a-z0-9]+(?:\s+[^>]*)?>/i;
    return !xssPattern.test(text);
  }

  defaultMessage() {
    return 'O texto contém código potencialmente malicioso';
  }
}

export function NoXss(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: NoXssConstraint,
    });
  };
}

// Validador para strings com apenas caracteres seguros
@ValidatorConstraint({ name: 'safeString', async: false })
@Injectable()
export class SafeStringConstraint implements ValidatorConstraintInterface {
  validate(text: string) {
    if (typeof text !== 'string') return true;

    // Padrão que permite apenas letras, números, espaços e alguns caracteres especiais comuns
    const safePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,\-_()[\]?!@:;'"]+$/;
    return safePattern.test(text);
  }

  defaultMessage() {
    return 'O texto contém caracteres não permitidos';
  }
}

export function IsSafeString(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: SafeStringConstraint,
    });
  };
}

// Validador para URLs com domínios seguros
@ValidatorConstraint({ name: 'safeUrl', async: false })
@Injectable()
export class SafeUrlConstraint implements ValidatorConstraintInterface {
  validate(url: string) {
    if (typeof url !== 'string') return true;

    try {
      const parsedUrl = new URL(url);
      // Lista de protocolos permitidos
      const allowedProtocols = ['http:', 'https:'];

      return allowedProtocols.includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  defaultMessage() {
    return 'URL inválida ou não segura';
  }
}

export function IsSafeUrl(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: SafeUrlConstraint,
    });
  };
}
