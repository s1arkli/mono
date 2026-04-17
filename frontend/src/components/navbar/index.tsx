import "./index.css";
import {Link} from "react-router-dom";
import postIcon from "../../assets/navbar/post-icon.svg";
import SearchBar from "./SearchBar";

export default function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar__left">
                <Link className="navbar__brand" to="/" aria-label="mono 首页">
                    <span className="navbar__brand-text">mono</span>
                </Link>

                <Link className="navbar__home-pill" to="/">
                    首页
                </Link>
            </div>

            <SearchBar/>

            <div className="navbar__right">
                <button className="navbar__post-button" type="button">
                    <img className="navbar__post-icon" src={postIcon} alt="" aria-hidden="true"/>
                    <span>发帖</span>
                </button>

                <Link to="/auth">
                    <button className="navbar__avatar-button" type="button" aria-label="用户头像">
                        <img
                            className="navbar__avatar-image"
                            src="/default-shark-avatar.svg"
                            alt="default avatar"
                        />
                    </button>
                </Link>

            </div>
        </nav>
    );
}
