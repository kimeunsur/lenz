const { express, jwt, User, authMiddleware } = require('../modules/common');
const router = express.Router();

router.get('/search',authMiddleware, async (req, res) => {
  try {

    // 검색어 & 페이지 파라미터
    const { keyword = '', page = 1 } = req.query; 
    const limit = 30; 
    const skip = (page - 1) * limit; 

    // 정규식 (대소문자 구분X, name 또는 email에서 keyword 매칭)
    const regex = new RegExp(keyword, 'i'); 
    const query = { $or: [{ name: regex }, { email: regex }] };

    // 전체 개수도 구해 페이지네이션 참고(선택) ???
    const totalCount = await User.countDocuments(query);

    // 데이터 찾기 (패스워드 같은 민감 정보 제외) ???
    const users = await User.find(query, 'profileImage email name')
      .skip(skip)
      .limit(limit);

    // 클라이언트로 응답
    return res.status(200).json({
      users,
      currentPage: Number(page),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;