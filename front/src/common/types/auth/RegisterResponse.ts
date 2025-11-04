export type RegisterResponse = {
  user: {
    id: number;
    email: string;
    phone: string;
    first_name: string;
    type_account: string;
    company_name?: string;
    inn?: string;
    kpp?: string;
  };
  token: string;
};
