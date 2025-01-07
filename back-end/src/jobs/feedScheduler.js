const schedule = require('node-schedule');
const Feed = require('../models/Feed'); // Feed 모델
const Follow = require('../models/Follow'); // Follow 모델
const Post = require('../models/Post'); // Post 모델
const { User } = require('../modules/common');
let job = null; // 스케줄러 작업 저장
const mongoose = require('mongoose'); // 추가

// 사용자별 피드 업데이트 함수
const updateUserFeed = async (userId) => {
    try {
        const user = await User.findById(userId).select('name');
        const username = user ? user.name : 'Unknown';
        
        const following = await Follow.find({ followerId: userId }).select('followingId');
        const followingIds = following.map(f => f.followingId);

        const posts = await Post.find({ userId: { $in: followingIds } })
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('userId', 'name');


            const feedData = posts.map(post => ({
                postId: post._id,
                content: post.content, // 게시물 내용 추가
                image: post.image,
                createdAt: post.createdAt,
                likes: post.likes,
                userId: post.userId,
            }));

        await Feed.updateOne(
            { userId },
            { posts: feedData, updatedAt: new Date() },
            { upsert: true } // 피드가 없으면 새로 생성
        );

        console.log(`사용자 ${username}의 피드가 업데이트되었습니다.`);
    } catch (err) {
        console.error(`사용자 ${userId}의 피드 업데이트 중 오류:`, err);
    }
};
// 1분마다 실행되는 피드 업데이트 작업 (기존)
const feedScheduler = () => {
    schedule.scheduleJob('*/5 * * * *', async () => {
        console.log('5분마다 피드 업데이트 시작');
        try {
            if (mongoose.connection.readyState !== 1) {
                throw new Error('MongoDB not connected');
            }

            const allUsers = await Feed.find({});
            for (const feed of allUsers) {
                await updateUserFeed(feed.userId); // 사용자별 피드 업데이트
            }
            console.log('1분마다 피드 업데이트 완료');
        } catch (err) {
            console.error('피드 업데이트 중 오류:', err);
        }
    });
};

feedScheduler.stop = () => {
    if (job) {
        job.cancel();
        console.log('피드 스케줄러가 정지되었습니다.');
    }
};

module.exports = {
    feedScheduler, updateUserFeed, 
};