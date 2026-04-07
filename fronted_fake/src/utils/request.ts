const BASE_URL = "/api/v1";

async function request<T>(url: string,options?:RequestInit): Promise<T> {
    const res = await fetch(BASE_URL + url,{
        ...options,
        headers:{
            "Content-Type":"application/json",
            // 需要鉴权就在这里统一带 token
            // "Authorization": `Bearer ${getToken()}`,
            ...options?.headers,
        },
    });

    if (!res.ok) {
        throw new Error(`请求失败: ${res.status}`);
    }

    return res.json() as Promise<T>;
}

export const http = {
    get<T>(url: string) {
        return request<T>(url);
    },
    post<T>(url: string, data: unknown) {
        return request<T>(url, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    put<T>(url: string, data: unknown) {
        return request<T>(url, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },
    delete<T>(url: string) {
        return request<T>(url, { method: "DELETE" });
    },
};