import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar'; // 기존 Sidebar 사용
import './deco/Search.css';

function SearchUser() {
  const [keyword, setKeyword] = useState('');
  const [userList, setUserList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (keyword.trim() !== '') {
      handleSearch();
    }
  }, [page]);

  const handleSearch = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/search?keyword=${keyword}&page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('검색 실패');
      const data = await response.json();
      setUserList(data.users);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error(error);
      alert('검색 중 오류가 발생했습니다.');
    }
  };

  const handleFollow = async (followingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/follow/${followingId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('팔로우 실패');
      alert('팔로우 성공!');
    } catch (error) {
      console.error(error);
      alert('팔로우 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="container">
      <Sidebar /> {/* Sidebar 유지 */}

      <div className="content">
        <div className="search-bar">
          <input
            type="text"
            placeholder="검색어 입력 (이름/이메일)"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
          />
          <button onClick={handleSearch}>검색</button>
        </div>

        <div className="user-list">
          {userList.map((user) => (
            <div className="user-item" key={user._id}>
              <img src={user.profileImage || '/default.jpg'} alt={user.name} className="profile-img" />
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
              <button
                className="follow-button"
                onClick={() => handleFollow(user._id)}
              >
                팔로우
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pagination">
        <button
          className="pagination-button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1}
        >
          이전
        </button>
        <span className="pagination-info">{page} / {totalPages}</span>
        <button
          className="pagination-button"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page === totalPages}
        >
          다음
        </button>
      </div>
    </div>
  );
}

export default SearchUser;