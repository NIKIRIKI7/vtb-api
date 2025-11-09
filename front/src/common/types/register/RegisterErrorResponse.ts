export type RegisterErrorResponse = {
  detail: Array<{
    type: string;
    loc: string[];
    msg: string;
    input?: any;
    ctx?: any;
  }> | string;
};
