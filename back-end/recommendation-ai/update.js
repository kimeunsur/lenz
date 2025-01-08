const { MongoClient } = require('mongodb');

// MongoDB 연결 설정
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = "recommendation";
const collectionName = "weight_logs";

async function updateWeights(weights, postScores, activityCount, learningRate = 0.1) {
    // MongoDB 연결
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // 학습률 조정: 활동량(activityCount)이 많을수록 학습률 감소
    const adjustedLearningRate = learningRate / (1 + Math.log1p(activityCount));

    // 추천도 비율 계산
    const totalScore = postScores.reduce((sum, score) => sum + score, 0);
    const scoreRatios = postScores.map(score => score / totalScore);

    // 발언권 업데이트
    const updatedWeights = weights.map((weight, index) => {
        return weight + adjustedLearningRate * scoreRatios[index] * 100;
    });

    // 정규화
    const totalWeight = updatedWeights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = updatedWeights.map(w => (w / totalWeight) * 100);

    // 로그 저장
    const logEntry = {
        timestamp: new Date(),
        weightsBefore: weights,
        weightsAfter: normalizedWeights,
        postScores,
        activityCount,
        learningRate: adjustedLearningRate
    };
    await collection.insertOne(logEntry);

    // MongoDB 연결 종료
    await client.close();

    return normalizedWeights;
}

// 사용 예시
(async () => {
    let weights = [20, 20, 20, 20, 20]; // 초기 발언권
    const postScores = [1, 4, 2, 5, 14]; // 추천도
    const activityCount = 50; // 유저 활동량 (기준치)

    weights = await updateWeights(weights, postScores, activityCount);
    console.log(weights); // 업데이트된 발언권 출력
})();