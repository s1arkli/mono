import {useState} from "react";
import searchIcon from "../../../assets/navbar/search-icon.svg";
import "./index.css";

export default function SearchBar() {
    const [keyword, setKeyword] = useState("");

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        //去除空格
        const trimmed = keyword.trim();
        if (trimmed) {
            //输入了值并且按下了enter，后续调用接口获取返回值
            console.log("搜索:", trimmed);
        }
    }

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        //拿到input内的值
        setKeyword(event.target.value);
    }

    return (
        <form className="searchbar" onSubmit={handleSubmit} role="search">
            <label className="searchbar__field">
                <img
                    className="searchbar__icon"
                    src={searchIcon}
                    alt=""
                    aria-hidden="true"
                />
                <input
                    className="searchbar__input"
                    type="search"
                    placeholder="搜索帖子"
                    aria-label="搜索帖子"
                    value={keyword}
                    onChange={handleChange}
                />
            </label>

            <button className="searchbar__action" type="submit" aria-label="执行搜索">
                <span className="searchbar__arrow" aria-hidden="true"/>
            </button>
        </form>
    );
}
