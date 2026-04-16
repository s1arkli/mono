import {http} from "../utils/request.ts";
import type {LoginReq, RegisterReq} from "../types/api/auth";

export const authApi = {
    refresh()  {
        return http.post("account/refresh");
    },
    login(data:LoginReq){
        return http.post("account/login",data);
    },
    register(data:RegisterReq){
        return http.post("account/register",data);
    },
};

