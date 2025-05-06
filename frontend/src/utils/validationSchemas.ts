import * as Yup from "yup";

export const itemValidationSchema = Yup.object().shape({
  description: Yup.string()
    .min(3, "Mínimo 3 caracteres")
    .max(100, "Máximo 100 caracteres")
    .required("Descrição é obrigatória"),
  type: Yup.string().required("Tipo é obrigatório"),
  // ... outros campos
});

export const userValidationSchema = Yup.object().shape({
  name: Yup.string().required("Nome é obrigatório"),
  email: Yup.string().email("Email inválido").required("Email é obrigatório"),
  // ... outros campos
});
