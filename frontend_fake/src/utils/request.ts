const BASE_URL = "/api/v1";

interface apiResponse<T> {
    code: number;
    msg: string;
    data: T;
}

/*继承了父类Error的构造函数，然后被子类定义的构造函数覆盖，使用super复用父类的构造函数
* this指代当前实例
* */

class BizError extends Error {
    code: number;

    constructor(code: number, msg: string) {
        super(msg);
        this.code = code;
    }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
    //await 响应头
    const res = await fetch(BASE_URL + url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            // 需要鉴权就在这里统一带 token
            // "Authorization": `Bearer ${getToken()}`,
            ...options?.headers,
        },
    });

    if (!res.ok) {
        throw new Error(`请求失败: ${res.status}`);
    }

    const json = await res.json() as apiResponse<T>;

    if (json.code != 200) {
        throw new BizError(json.code, json.msg);
    }

    return json.data;
}

export const http = {
    post: function <T>(url: string, data?: unknown): Promise<T> {
        return request<T>(url, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    delete: function <T>(url: string, data?: unknown): Promise<T> {
        return request<T>(url, {
            method: "DELETE",
            body: JSON.stringify(data),
        });
    },
};