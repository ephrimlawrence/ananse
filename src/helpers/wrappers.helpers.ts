import { Request } from "@src/types/request";

export const getSessionId = (request: Request): string => {
  // TODO: check provider and get session id
  return request.query?.sessionid!;
};
