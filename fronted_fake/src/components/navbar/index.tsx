import "./index.css"

export default function Navbar() {
    return (
        <nav className="navbar">
            <div className="left">
                {/*<img src="/logo.png" alt="logo" />*/}
                <div className="logo-text">mono</div>
                <ul className="nav-list">
                    <li><a href="/home">首页</a></li>
                    <li><a href="/about">关于</a></li>
                </ul>
            </div>

            <div className="middle">
                <input className="search" type="text" placeholder="搜索..." />
            </div>
            <div className="right">
                <button className="login-button">登录</button>
            </div>
        </nav>
    )
}
