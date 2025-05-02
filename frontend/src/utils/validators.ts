/**
 * Funções utilitárias para validação de dados
 */

/**
 * Valida um endereço de e-mail
 * @param email E-mail para validar
 * @returns True se válido, false caso contrário
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida uma senha com requisitos mínimos
 * @param password Senha para validar
 * @returns Objeto com resultado da validação e mensagem
 */
export const validatePassword = (
  password: string
): { isValid: boolean; message: string } => {
  if (password.length < 6) {
    return {
      isValid: false,
      message: "A senha deve ter pelo menos 6 caracteres",
    };
  }

  // Opcionalmente, adicionar validações mais rígidas
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!(hasUpperCase && hasLowerCase && hasNumber)) {
    return {
      isValid: false,
      message:
        "A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número",
    };
  }

  return { isValid: true, message: "Senha válida" };
};

/**
 * Valida um CPF
 * @param cpf CPF para validar
 * @returns True se válido, false caso contrário
 */
export const isValidCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, "");

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    return false;
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCPF)) {
    return false;
  }

  // Algoritmo de validação do CPF
  let sum = 0;
  let remainder;

  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) {
    return false;
  }

  // Segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) {
    return false;
  }

  return true;
};

/**
 * Valida um CNPJ
 * @param cnpj CNPJ para validar
 * @returns True se válido, false caso contrário
 */
export const isValidCNPJ = (cnpj: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, "");

  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) {
    return false;
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCNPJ)) {
    return false;
  }

  // Algoritmo de validação do CNPJ
  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;

  // Primeiro dígito verificador
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) {
    return false;
  }

  // Segundo dígito verificador
  size += 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) {
    return false;
  }

  return true;
};

/**
 * Valida um CEP
 * @param cep CEP para validar
 * @returns True se válido, false caso contrário
 */
export const isValidZipCode = (cep: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCEP = cep.replace(/\D/g, "");

  // Verifica se tem 8 dígitos
  if (cleanCEP.length !== 8) {
    return false;
  }

  // Verifica se o formato é 00000-000
  const cepRegex = /^[0-9]{5}-?[0-9]{3}$/;
  return cepRegex.test(cep);
};

/**
 * Valida um número de telefone
 * @param phone Telefone para validar
 * @returns True se válido, false caso contrário
 */
export const isValidPhone = (phone: string): boolean => {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, "");

  // Verifica se tem 10 (fixo) ou 11 (celular) dígitos
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
    return false;
  }

  // Verifica se o formato é (00) 0000-0000 ou (00) 00000-0000
  const phoneRegex = /^\(?[1-9]{2}\)? ?(?:9[1-9]|[2-9])[0-9]{3}-?[0-9]{4}$/;
  return phoneRegex.test(phone);
};

/**
 * Valida uma data
 * @param date Data para validar (string ou objeto Date)
 * @returns True se válido, false caso contrário
 */
export const isValidDate = (date: string | Date): boolean => {
  try {
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    return !isNaN(parsedDate.getTime());
  } catch (error) {
    return false;
  }
};

/**
 * Verifica se uma URL é válida
 * @param url URL para validar
 * @returns True se válido, false caso contrário
 */
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Verifica se é uma URL de imagem válida
 * @param url URL para validar
 * @returns True se válido, false caso contrário
 */
export const isValidImageURL = (url: string): boolean => {
  if (!isValidURL(url)) {
    return false;
  }

  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".webp",
    ".svg",
  ];
  const urlLower = url.toLowerCase();
  return imageExtensions.some((ext) => urlLower.endsWith(ext));
};

/**
 * Valida o comprimento de um texto
 * @param text Texto para validar
 * @param min Comprimento mínimo
 * @param max Comprimento máximo
 * @returns True se válido, false caso contrário
 */
export const isValidLength = (
  text: string,
  min: number,
  max: number
): boolean => {
  return text.length >= min && text.length <= max;
};

/**
 * Verifica se um valor está dentro de um intervalo
 * @param value Valor para validar
 * @param min Valor mínimo
 * @param max Valor máximo
 * @returns True se válido, false caso contrário
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};
