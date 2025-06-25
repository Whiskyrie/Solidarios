// src/common/validators/photo-url.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsPhotoUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPhotoUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (!value) return true; // Permite valores vazios se opcional

          // Se for um array, valida cada item
          if (Array.isArray(value)) {
            return value.every((url) => isValidPhotoUrl(url));
          }

          // Se for uma string única
          return isValidPhotoUrl(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} deve conter URLs válidas ou paths locais de imagem`;
        },
      },
    });
  };
}

function isValidPhotoUrl(url: string): boolean {
  if (typeof url !== 'string') {
    return false;
  }

  // Aceita URLs HTTP/HTTPS válidas
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return true;
    }
  } catch {
    // Não é uma URL válida, continua para verificar outros formatos
  }

  // Aceita paths locais do dispositivo móvel
  if (
    url.startsWith('file://') ||
    url.startsWith('/') ||
    url.startsWith('content://') ||
    url.startsWith('assets-library://') ||
    url.startsWith('ph://')
  ) {
    return true;
  }

  // Aceita URIs do expo/react-native
  if (url.includes('ExperienceData') || url.includes('ImagePicker')) {
    return true;
  }

  return false;
}
