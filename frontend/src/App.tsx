import {BrowserRouter} from "react-router-dom"
import AppRouter from "./router"
import {useTokenInit} from "./hooks/auth.ts";

export default function App() {
    useTokenInit()
    return (
        <BrowserRouter>
            <AppRouter/>
        </BrowserRouter>
    )
}
