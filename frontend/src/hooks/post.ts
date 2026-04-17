import {postApi} from "../api/post.ts";
import type {ListReq, ListResp} from "../types/api/post";
import {useEffect, useState} from "react";

export const usePost = (data:ListReq) => {
    const [list, setList] = useState<ListResp>({ posts: [], total: 0 })

    useEffect(() => {

        const listPost = async () => {
            try {
                const res = await postApi.List(data)
                setList (res)
            }catch (err) {
                //请求失败
                console.log(err)
            }
        }
        listPost()
    },[data.page,data.pageSize,data.postType,data.sort])

    return list
}