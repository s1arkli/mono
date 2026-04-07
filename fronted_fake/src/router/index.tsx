import { createBrowserRouter } from "react-router-dom"
import Layout from "../components/layout"
import Post from "../pages/post";
import Auth from "../pages/auth";

const router = createBrowserRouter([
    {
        path:"/",
        element: <Layout />,
        children:[
            {
                index:true,
                element: <Post />,
            },
            {
                path:"auth",
                element: <Auth />,
            }
        ]
    },
])

export default router