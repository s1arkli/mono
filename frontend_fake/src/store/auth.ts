import {create} from 'zustand'
import type {TokenStore, UserInfoStore} from '../types/storage/auth'
import type {LoginResp, UserInfo} from "../types/api/auth";

export const useTokenStore = create<TokenStore>()(
    (set) => ({

        accessToken: null,

        setAccessToken: (accessToken) =>
            set(() => ({
                accessToken: accessToken,
            })),

        clearToken: () => set({accessToken: null}),
    })
)

export const useUserInfoStore = create<UserInfoStore>()(
    (set) => ({

        userInfoState: null,

        setLoginUserInfo: (data: LoginResp) =>
            set(() => ({
                userInfoState: {
                    uid: data.uid,
                    avatar: data.avatar,
                    nickname: data.nickname,
                    isAdmin: data.isAdmin,
                },
            })),

        updateUserInfo: (profile: Partial<UserInfo>) => set((state) => ({
            userInfoState: state.userInfoState
                ? {...state.userInfoState, ...profile}
                : null,
        })),

        clearUserInfo: () => set(() => ({
            userInfoState: null
        })),
    })
)