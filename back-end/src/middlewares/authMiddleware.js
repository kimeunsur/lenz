const jwt = require('jsonwebtoken'); 

const authMiddleware = (req, res, next) => {
  //const token = req.header('Authorization')?.replace('Bearer ', ''); // 'Bearer ' 제거
  const token = req.header('Authorization')?.split(' ')[1]; // 'Bearer ' 제거
  
  if (!token) {
    return res.status(401).json({ message: '토큰이 없습니다. 접근이 거부됩니다.' });
  }

  try {
    const decoded = jwt.verify(token, 'secretKey');
    req.user = decoded;
    //console.log('디코딩된 사용자 ID:', req.user.id);
    next();
  } catch (error) {
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

module.exports = authMiddleware;