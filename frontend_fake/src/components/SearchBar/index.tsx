import { useState } from 'react';
import './index.css';

interface SearchBarProps {
    onSearch?: (keyword: string) => void;
}

export default function SearchBar(props: SearchBarProps) {
    const onSearch = props.onSearch;
    const [keyword, setKeyword] = useState('');

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            const trimmed = keyword.trim();
            if (trimmed !== '') {
                if (onSearch != null) {
                    onSearch(trimmed);
                }
            }
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setKeyword(e.target.value);
    }

    return (
        <input
            className="search"
            type="text"
            placeholder="搜索..."
            value={keyword}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
        />
    );
}