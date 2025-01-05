import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Add() {
  const [previewImage, setPreviewImage] = useState('');
  const [file, setFile] = useState(null);
  const [content, setContent] = useState('');
  const navigate = useNavigate();

  // Base64 이미지 변환
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // 사진 선택 시 미리보기
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);

      // 미리보기 (Base64)
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // 사진 업로드 후 처리
  const handleUpload = async () => {
    if (!file || !content) {
      alert('사진과 글 내용을 입력하세요.');
      return;
    }

    try {
      const base64Image = await convertToBase64(file);
      const token = localStorage.getItem('token');

      const requestData = {
        content,
        image: base64Image,
      };

      const response = await fetch('/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '업로드 실패');
      }

      const data = await response.json();
      alert('글이 성공적으로 작성되었습니다!');
      navigate('/profile');
    } catch (error) {
      console.error('업로드 실패:', error.message);
      alert('업로드 중 문제가 발생했습니다: ' + error.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>글 쓰기</h2>

      {/* 글 내용 입력 */}
      <textarea
        placeholder="글 내용을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: '100%',
          height: '100px',
          marginBottom: '10px',
          padding: '10px',
        }}
      />

      {/* 파일 선택 */}
      <input type="file" accept="image/*" onChange={handleFileChange} />

      {/* 미리보기 */}
      {previewImage && (
        <div style={{ margin: '10px 0' }}>
          <img
            src={previewImage}
            alt="미리보기"
            style={{ width: '200px', border: '1px solid #ccc' }}
          />
        </div>
      )}

      {/* 업로드 버튼 */}
      <button onClick={handleUpload}>게시하기</button>
    </div>
  );
}

export default Add;
