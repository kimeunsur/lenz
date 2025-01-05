import React, { useState, useEffect } from 'react';

const FollowingName = ({ userId }) => {
    const [name, setName] = useState('Loading...');

    useEffect(() => {
        const fetchName = async () => {
            try {
                const response = await fetch(`/user/${userId}/name`);
                if (response.ok) {
                    const data = await response.json();
                    setName(data.name || 'Unknown'); // 유저 이름 설정
                } else {
                    console.error('Failed to fetch name:', response.statusText);
                    setName('Error');
                }
            } catch (error) {
                console.error('Error fetching name:', error);
                setName('Error');
            }
        };

        fetchName();
    }, [userId]);

    return <span>{name}</span>;
};

export default FollowingName;