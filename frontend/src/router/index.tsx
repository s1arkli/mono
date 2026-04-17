import {Route, Routes} from "react-router-dom"
import Layout from "../components/layout"
import Post from "../pages/post"
import Auth from "../pages/auth"

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<Layout/>}>
                <Route index element={<Post/>}/>
                <Route path="auth" element={<Auth/>}/>
            </Route>
        </Routes>
    )
}
