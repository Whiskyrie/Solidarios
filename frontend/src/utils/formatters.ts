/**
 * Funções utilitárias para formatação de dados
 */

/**
 * Formata uma data para exibição no formato brasileiro (DD/MM/YYYY)
 * @param dateString String de data ou objeto Date
 * @returns Data formatada
 */
export const formatDate = (dateString: string | Date): string => {
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "Data inválida";
  }
};

/**
 * Formata uma data e hora para exibição (DD/MM/YYYY HH:MM)
 * @param dateString String de data ou objeto Date
 * @returns Data e hora formatadas
 */
export const formatDateTime = (dateString: string | Date): string => {
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    return `${date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })} ${date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch (error) {
    console.error("Erro ao formatar data e hora:", error);
    return "Data/hora inválida";
  }
};

/**
 * Formata um valor numérico para exibição como moeda (R$)
 * @param value Valor numérico
 * @returns Valor formatado como moeda
 */
export const formatCurrency = (value: number): string => {
  try {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  } catch (error) {
    console.error("Erro ao formatar moeda:", error);
    return "Valor inválido";
  }
};

/**
 * Formata um número com casas decimais e separadores
 * @param value Valor numérico
 * @param decimals Número de casas decimais
 * @returns Número formatado
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  try {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch (error) {
    console.error("Erro ao formatar número:", error);
    return "Número inválido";
  }
};

/**
 * Formata um percentual
 * @param value Valor decimal (ex: 0.25 para 25%)
 * @param decimals Número de casas decimais
 * @returns Percentual formatado
 */
export const formatPercent = (value: number, decimals: number = 2): string => {
  try {
    return value.toLocaleString("pt-BR", {
      style: "percent",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch (error) {
    console.error("Erro ao formatar percentual:", error);
    return "Valor inválido";
  }
};

/**
 * Formata um valor de tamanho (KB, MB, GB)
 * @param bytes Número de bytes
 * @returns Tamanho formatado
 */
export const formatFileSize = (bytes: number): string => {
  try {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  } catch (error) {
    console.error("Erro ao formatar tamanho do arquivo:", error);
    return "Tamanho inválido";
  }
};

/**
 * Formata um nome para exibição (primeira letra maiúscula de cada palavra)
 * @param name Nome para formatar
 * @returns Nome formatado
 */
export const formatName = (name: string): string => {
  try {
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  } catch (error) {
    console.error("Erro ao formatar nome:", error);
    return name;
  }
};

/**
 * Trunca um texto longo adicionando reticências
 * @param text Texto para truncar
 * @param maxLength Comprimento máximo
 * @returns Texto truncado
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

/**
 * Converte um enum para um array de opções (para uso em selects)
 * @param enumObject Objeto enum
 * @returns Array de opções {value, label}
 */
export const enumToOptions = (enumObject: Record<string, any>) => {
  return Object.entries(enumObject)
    .filter(([key]) => isNaN(Number(key))) // Filtrar apenas chaves string
    .map(([_, value]) => ({
      value,
      label: formatEnumLabel(value),
    }));
};

/**
 * Formata um valor de enum para exibição
 * @param value Valor do enum
 * @returns Label formatado
 */
export const formatEnumLabel = (value: string): string => {
  if (!value) return "";

  // Substitui underscores por espaços e formata cada palavra
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Formata um CPF/CNPJ
 * @param value Número do documento
 * @returns Documento formatado
 */
export const formatDocument = (value: string): string => {
  // Remove caracteres não numéricos
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11) {
    // CPF: 000.000.000-00
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } else if (digits.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }

  return value;
};

/**
 * Formata um telefone
 * @param value Número do telefone
 * @returns Telefone formatado
 */
export const formatPhone = (value: string): string => {
  // Remove caracteres não numéricos
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11) {
    // Celular: (00) 00000-0000
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (digits.length === 10) {
    // Fixo: (00) 0000-0000
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return value;
};

/**
 * Formata um CEP
 * @param value Número do CEP
 * @returns CEP formatado
 */
export const formatZipCode = (value: string): string => {
  // Remove caracteres não numéricos
  const digits = value.replace(/\D/g, "");

  if (digits.length === 8) {
    // CEP: 00000-000
    return digits.replace(/(\d{5})(\d{3})/, "$1-$2");
  }

  return value;
};
