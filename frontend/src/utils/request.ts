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

function logRequest(method: string, url: string, reqParams?: unknown, response?: unknown) {
    console.log("┌─────────────────────────────────────────────────────────────────────────────────┐");
    console.log(`│ 🚀 HTTP API: ${method} ${url}`);
    console.log("│ 📋 请求参数:", reqParams ?? {});
    console.log("│ 📄 响应数据:", response ?? {});
    console.log("└─────────────────────────────────────────────────────────────────────────────────┘");
}


async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const method = options?.method ?? "GET";
    const reqParams = options?.body ? JSON.parse(String(options.body)) : undefined;

    //await 响应头
    const res = await fetch(BASE_URL + url, {
        credentials: 'include',
        ...options,
        headers: {
            "Content-Type": "application/json",
            // 需要鉴权就在这里统一带 token
            // "Authorization": `Bearer ${getToken()}`,
            ...options?.headers,
        },
    });

    if (!res.ok) {
        logRequest(method, url, reqParams, {status: res.status});
        throw new Error(`请求失败: ${res.status}`);
    }

    const json = await res.json() as apiResponse<T>;
    logRequest(method, url, reqParams, json);

    if (json.code != 200) {
        throw new BizError(json.code, json.msg);
    }

    return json.data;
}

export const http = {
    post: function <T>(url: string, data?: unknown): Promise<T> {
        return request<T>(url, {
            method: "POST",
            body: data !== undefined ? JSON.stringify(data) : undefined,
        });
    },
    delete: function <T>(url: string, data?: unknown): Promise<T> {
        return request<T>(url, {
            method: "DELETE",
            body: data !== undefined ? JSON.stringify(data) : undefined,
        });
    },
};