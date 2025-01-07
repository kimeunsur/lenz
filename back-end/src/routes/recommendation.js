const {Post, Follow} = require('../modules/common');
const mongoose = require('mongoose');

async function getRecommendedPosts(userId) {
    const postByLikes = await getPostsSortedByLikes(userId);
    const postsByFollowers = await getPostsSortedByFollowers(userId);
    const postsByCoFollower = await getPostsSortedByCoFollower(userId);
    const postsByCoLiker = await getPostsSortedByCoLiker(userId);

    const postScores = {};
    // console.log('postByLikes:', postByLikes);
    // console.log('postsByFollowers:', postsByFollowers);
    // console.log('postsByCoFollower:', postsByCoFollower);
    // console.log('postsByCoLiker:', postsByCoLiker);
    const addScores = (posts, weight) => {
        posts.forEach(post => {
            const postId = post._id.toString();
            postScores[postId] = (postScores[postId] || 0) + post.recommendationScore * weight;
        });
    };
    
    // 가중치 부여
    addScores(postByLikes, 0.25);       // 좋아요 기반 추천: 20%
    addScores(postsByFollowers, 0.25); // 팔로워 기반 추천: 40%
    addScores(postsByCoFollower, 0.25); // 공통 팔로워 추천: 20%
    addScores(postsByCoLiker, 0.25);   // 공통 좋아요 추천: 20%

    // 점수 기준으로 정렬 후 상위 50개 추출
    const sortedPosts = Object.entries(postScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50)
    .map(([postId, recommendationScore]) => ({ postId, recommendationScore }));

    return sortedPosts;
}


async function getPostsSortedByLikes(userId) {
    // 1. 좋아요 기반 가중치 계산 및 정렬
    const posts = await Post.aggregate([
        {
            $addFields: {
                likeCount: { $size: "$likes" },
                weight: {
                    $add: [
                        { $size: "$likes" },
                        {
                            $divide: [
                                { $subtract: [new Date(), "$createdAt"] },
                                1000 * 60 * 60 * 24 // 하루 단위로 나눔
                            ]
                        }
                    ]
                }
            }
        },
        { $sort: { weight: -1, createdAt: -1 } }, // 가중치 -> 생성 시간 순으로 정렬
        { $limit: 100 }
    ]);

    // 2. 유저 팔로워 수 계산 및 추가 정렬
    const populatedPosts = await Promise.all(
        posts.map(async (post) => {
            const followerCount = await Follow.countDocuments({ followingId: post.userId });
            return { ...post, followerCount };
        })
    );

    if (populatedPosts.length === 0) {
        return [];
    }

    // 3. recommendationScore 계산
    const totalScore = 100;
    const topScore = 2 * totalScore / (1 + populatedPosts.length);
    const bottomScore = totalScore / (1 + populatedPosts.length);
    const scoreDiff = (topScore - bottomScore) / (populatedPosts.length - 1);

    populatedPosts.forEach((post, index) => {
        post.recommendationScore = topScore - scoreDiff * index;
    });

    // 4. 점수 합 조정 (총합 100 보장)
    const currentSum = populatedPosts.reduce((sum, post) => sum + post.recommendationScore, 0);
    const scaleFactor = totalScore / currentSum;

    populatedPosts.forEach((post) => {
        post.recommendationScore = Math.round(post.recommendationScore * scaleFactor);
    });

    return populatedPosts;
}

async function getPostsSortedByFollowers(userId) {
    // 1. 팔로워 수 기반 게시물 집계
    const posts = await Post.aggregate([
        {
            $lookup: {
                from: 'follows',
                localField: 'userId',
                foreignField: 'followingId',
                as: 'followerInfo'
            }
        },
        {
            $addFields: { 
                followerCount: { $size: "$followerInfo" },
                likeCount: { $size: "$likes" }
            }
        },
        {
            $project: {
                content: 1,
                image: 1,
                createdAt: 1,
                followerCount: 1,
                likeCount: 1
            }
        },
        { $sort: { followerCount: -1, createdAt: -1, likeCount: -1 } },
        { $limit: 100 }
    ]);

    if (posts.length === 0) {
        return [];
    }

    // 2. recommendationScore 계산
    const totalScore = 100;
    const topScore = 2 * totalScore / (1 + posts.length);
    const bottomScore = totalScore / (1 + posts.length);
    const scoreDiff = (topScore - bottomScore) / (posts.length - 1);

    posts.forEach((post, index) => {
        post.recommendationScore = topScore - scoreDiff * index;
    });

    // 3. 점수 합 조정 (총합 100 보장)
    const currentSum = posts.reduce((sum, post) => sum + post.recommendationScore, 0);
    const scaleFactor = totalScore / currentSum;

    posts.forEach((post) => {
        post.recommendationScore = Math.round(post.recommendationScore * scaleFactor);
    });

    return posts;
}

async function getPostsSortedByCoFollower(userId) {
    // 1. 내가 팔로우하는 유저 목록 가져오기
    const followingUsers = await Follow.find({ followerId: userId }).select('followingId');
    const followingIds = followingUsers.map(follow => follow.followingId);

    // 2. 내가 팔로우하지 않는 유저 중 겹치는 팔로워가 많은 유저 집계
    const popularUsers = await Follow.aggregate([
        { 
            $match: { 
                followerId: { $in: followingIds, $ne: userId },
                followingId: { $nin: followingIds, $ne: userId }
            } 
        },
        { $group: { _id: '$followingId', followerCount: { $sum: 1 } } },
        { $sort: { followerCount: -1 } },
        { $limit: 50 }
    ]);

    const popularUserIds = popularUsers
        .filter(user => user._id.toString() !== userId.toString())
        .map(user => user._id);

    // 3. 상위 유저와 하위 유저 분리
    const topUsers = popularUserIds.slice(0, 10);
    const lowerUsers = popularUserIds.slice(10);

    // 4. 유저별로 게시물 가져오기
    const topUserPosts = [];
    for (const userId of topUsers) {
        const posts = await Post.find({ userId })
            .sort({ createdAt: -1 })
            .limit(2);
        topUserPosts.push(...posts);
    }

    const lowerUserPosts = [];
    for (const userId of lowerUsers) {
        const posts = await Post.find({ userId })
            .sort({ createdAt: -1 })
            .limit(1);
        lowerUserPosts.push(...posts);
    }

    // 5. 게시물 병합
    const recommendedPosts = [...topUserPosts, ...lowerUserPosts].slice(0, 50);

    if (recommendedPosts.length === 0) {
        return [];
    }

    // 6. recommendationScore 추가
    const totalScore = 100;
    const topScore = 2 * totalScore / (1 + recommendedPosts.length);
    const bottomScore = totalScore / (1 + recommendedPosts.length);
    const scoreDiff = (topScore - bottomScore) / (recommendedPosts.length - 1);

    recommendedPosts.forEach((post, index) => {
        post.recommendationScore = topScore - scoreDiff * index;
    });

    // 7. 점수 합 조정 (총합 100 보장)
    const currentSum = recommendedPosts.reduce((sum, post) => sum + post.recommendationScore, 0);
    const scaleFactor = totalScore / currentSum;

    recommendedPosts.forEach((post) => {
        post.recommendationScore = Math.round(post.recommendationScore * scaleFactor);
    });

    return recommendedPosts;
}

async function getPostsSortedByCoLiker(userId) {
    // 1. 내가 좋아요 누른 최근 100개의 게시물 가져오기
    const recentLikedPosts = await Post.find({ likes: userId })
        .sort({ createdAt: -1 })
        .limit(100)
        .select('_id likes');

    // 2. 좋아요가 겹친 사용자 계산
    const userLikeCounts = {};
    recentLikedPosts.forEach(post => {
        post.likes.forEach(likedUserId => {
            if (likedUserId.toString() !== userId.toString()) { // 본인 제외
                userLikeCounts[likedUserId] = (userLikeCounts[likedUserId] || 0) + 1;
            }
        });
    });

    // 3. 좋아요 겹친 사용자 상위 30명 추출
    const topUsers = Object.entries(userLikeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 30)
        .map(([userId]) => new mongoose.Types.ObjectId(userId));

    // 4. 상위 유저들이 좋아요를 누른 게시물들 가져오기 및 likeCount 추가
    const postsWithLikeCount = await Post.aggregate([
        {
            $match: {
                likes: { $elemMatch: { $in: topUsers } },
                userId: { $ne: new mongoose.Types.ObjectId(userId) },
                _id: { $nin: recentLikedPosts.map(post => post._id) }
            }
        },
        {
            $addFields: {
                likeCount: {
                    $size: {
                        $setIntersection: ["$likes", topUsers]
                    }
                }
            }
        },
        { $sort: { likeCount: -1, createdAt: -1 } },
        { $limit: 50 }
    ]);

    if (postsWithLikeCount.length === 0) {
        return [];
    }

    // 5. recommendationScore 추가
    const totalScore = 100;
    const topScore = 2 * totalScore / (1 + postsWithLikeCount.length);
    const bottomScore = totalScore / (1 + postsWithLikeCount.length);
    const scoreDiff = postsWithLikeCount.length > 1
    ? (topScore - bottomScore) / (postsWithLikeCount.length - 1)
    : 0; // 하나뿐인 경우 점수 차이는 0

    postsWithLikeCount.forEach((post, index) => {
        post.recommendationScore = topScore - scoreDiff * index;
    });

    // 6. 점수 합 조정 (총합 100 보장)
    const currentSum = postsWithLikeCount.reduce((sum, post) => sum + post.recommendationScore, 0);
    const scaleFactor = totalScore / currentSum;

    postsWithLikeCount.forEach((post) => {
        post.recommendationScore = Math.round(post.recommendationScore * scaleFactor);
    });

    return postsWithLikeCount;
}

module.exports = {getRecommendedPosts, getPostsSortedByLikes, getPostsSortedByFollowers, getPostsSortedByCoFollower, getPostsSortedByCoLiker};