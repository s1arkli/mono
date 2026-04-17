import {http} from "../utils/request.ts";
import type {ListReq,ListResp} from "../types/api/post";

export const postApi = {
    List(data:ListReq) {
    return http.post<ListResp>("/post/list", data);
    },
}