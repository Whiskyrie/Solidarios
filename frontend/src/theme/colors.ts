/**
 * Definição das cores para o tema da aplicação Solidários
 * Baseado no guia de estilo visual fornecido
 */

export const colors = {
  // Cores Primárias
  primary: {
    main: "#173F5F", // Azul Marinho - cor principal
    secondary: "#006E58", // Verde Turquesa - cor secundária
    accent: "#B89700", // Amarelo - cor de destaque
  },

  // Cores Neutras
  neutral: {
    white: "#FFFFFF", // Fundo principal
    lightGray: "#F6F6F6", // Fundo secundário
    mediumGray: "#E2E8F0", // Bordas, linhas divisórias
    darkGray: "#64748B", // Textos secundários
    black: "#1E293B", // Textos principais
  },

  // Cores de Status
  status: {
    success: "#10B981", // Verde Sucesso
    error: "#EF4444", // Vermelho Alerta
    warning: "#F59E0B", // Amarelo Aviso
    info: "#3B82F6", // Azul Informação
  },

  // Badges de Status (para itens)
  badges: {
    available: {
      background: "#DCFCE7",
      text: "#166534",
    },
    reserved: {
      background: "#FEF9C3",
      text: "#854D0E",
    },
    distributed: {
      background: "#FEE2E2",
      text: "#991B1B",
    },
    lowStock: {
      background: "#FEF3C7",
      text: "#92400E",
    },
  },

  // Notificações
  notifications: {
    success: {
      background: "#DCFCE7",
      icon: "#16A34A",
      text: "#166534",
    },
    error: {
      background: "#FEE2E2",
      icon: "#DC2626",
      text: "#991B1B",
    },
    warning: {
      background: "#FEF3C7",
      icon: "#F59E0B",
      text: "#92400E",
    },
    info: {
      background: "#DBEAFE",
      icon: "#3B82F6",
      text: "#1E40AF",
    },
  },
};

export default colors;
