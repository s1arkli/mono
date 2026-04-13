import "./index.css"
import {Link} from 'react-router-dom'
import SearchBar from '../SearchBar';

export default function Navbar() {
    //处理搜索的回调函数
    function handleSearch(kw: string) {
        console.log('搜索:', kw);
    }

    return (
        <nav className="navbar">
            <div className="left">
                {/*<img src="/logo.png" alt="logo" />*/}
                <div className="logo-text">mono</div>
                <ul className="nav-list">
                    <li><Link to="/home">首页</Link></li>
                    <li><Link to="/about">关于</Link></li>
                </ul>
            </div>

            <div className="middle">
                <SearchBar onSearch={handleSearch} />
            </div>
            <div className="right">
                <button className="avatar-button" type="button" aria-label="用户头像">
                    <img
                        className="avatar-image"
                        src="/default-shark-avatar.svg"
                        alt="default avatar"
                    />
                </button>
            </div>
        </nav>
    )
}
