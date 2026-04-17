import type {LoginResp, UserInfo} from "../api/auth";

/** Token store（令牌仓库）对外暴露的完整结构。 */
export interface TokenStore {
    /** 当前 token 状态，为 null 表示未登录。 */
    accessToken: string | null;
    /** 仅更新 accessToken，常用于 refresh（刷新登录态）接口。 */
    setAccessToken: (accessToken: string) => void;
    /** 清空 token 状态。 */
    clearToken: () => void;
}

/** Userinfo store（用户信息仓库）对外暴露的完整结构。 */
export interface UserInfoStore {
    /** 当前用户信息状态，为 null 表示未登录。 */
    userInfoState: UserInfo | null;
    /** 使用登录接口返回结果建立用户信息状态。 */
    setLoginUserInfo: (data: LoginResp) => void;
    /** 局部更新用户信息。 */
    updateUserInfo: (profile: Partial<UserInfo>) => void;
    /** 清空用户信息状态。 */
    clearUserInfo: () => void;
}
