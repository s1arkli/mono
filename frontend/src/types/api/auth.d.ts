/** 注册接口请求参数，对应后端 RegisterReq。 */
export interface RegisterReq {
    account: string;
    password: string;
}

/** 登录接口请求参数，对应后端 LoginReq。 */
export interface LoginReq {
    account: string;
    password: string;
}


/** userinfo（用户信息）结构，对应 gateway LoginResp 中的用户字段。 */
export interface UserInfo {
    uid: number;
    avatar: string;
    nickname: string;
    isAdmin: boolean;
}

/** 登录接口响应结构，对应 gateway/service/auth/dto.go 中的 LoginResp。 */
export interface LoginResp extends  UserInfo {
}

/** 刷新接口响应结构，对应 gateway/service/auth/auth.go 返回的 accessToken 字符串。 */
export type RefreshResp = string
