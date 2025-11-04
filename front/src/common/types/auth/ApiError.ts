import type {RegisterErrorResponse} from "@/common/types/auth/RegisterErrorResponse.ts";

export interface ApiError {
  response?: {
    data?: RegisterErrorResponse;
  };
}
