export type RegisterPayload = {
  email: string;
  phone: string;
  password: string;
  first_name: string;
  type_account: string;
  company_name?: string;
  inn?: string;
  kpp?: string;
};
