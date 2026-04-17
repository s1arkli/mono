import {http} from "../utils/request.ts";
import type {LoginReq, LoginResp, RegisterReq} from "../types/api/auth";

export const authApi = {
    refresh() {
        return http.post<string>("account/refresh");
    },
    login(data: LoginReq) {
        return http.post<LoginResp>("account/login", data);
    },
    register(data: RegisterReq) {
        return http.post<string>("account/register", data);
    },
};

