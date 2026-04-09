import { Route, Routes } from "react-router-dom"
import Layout from "../components/layout"
import Post from "../pages/post"
import Auth from "../pages/auth"

export default function AppRouter() {
    return (
        <Routes>
            {/* 
              Routes（路由集合）可以理解成“URL（浏览器地址）和页面组件的映射表”。
              浏览器访问不同路径时，React Router（React 路由库）会从这里匹配应该显示哪个页面。
            */}

            {/*
              这是根路由 path="/"，也就是网站首页这一层。

              element={<Layout />} 的意思是：
              不管你访问的是 "/" 还是 "/auth"，都会先渲染 Layout（整体页面骨架）。

              Layout 一般放公共内容，比如：
              1. 顶部导航栏
              2. 侧边栏
              3. 页脚
              4. 页面公共容器

              你可以把它理解成 Go（Go 语言）项目里的“统一页面模板”。
            */}
            <Route path="/" element={<Layout />}>
                {/*
                  index 路由表示“默认子页面”。

                  当访问 "/" 时：
                  先匹配到外层 Layout，
                  然后在 Layout 里面的 <Outlet /> 位置渲染 <Post />。

                  所以最终效果可以理解成：
                  页面框架（Layout） + 帖子页（Post）
                */}
                <Route index element={<Post />} />

                {/*
                  当访问 "/auth" 时：
                  还是先渲染外层 Layout，
                  再把 <Auth /> 渲染到 Layout 里的 <Outlet /> 位置。

                  所以最终效果可以理解成：
                  页面框架（Layout） + 登录页（Auth）

                  这里写成 path="auth" 而不是 "/auth"，
                  是因为它是根路由 "/" 的子路由。
                  React Router 会自动把它拼成完整路径 "/auth"。
                */}
                <Route path="auth" element={<Auth />} />
            </Route>
        </Routes>
    )
}
