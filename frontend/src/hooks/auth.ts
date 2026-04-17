import {useEffect} from "react";
import {authApi} from "../api/auth.ts";
import {useTokenStore} from "../store/auth.ts";

export const useTokenInit = () => {
    const setToken = useTokenStore((s) => s.setAccessToken)

    useEffect(() => {
        const init = async () => {
            try {
                const token = await authApi.refresh()
                setToken(token)
                console.log("登录成功！")
            } catch (err) {
                // 刷新失败视为未登录
                console.log("用户未登录")
                return
            }
        };
        init()
    }, [setToken])
}