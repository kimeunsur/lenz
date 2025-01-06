from gensim.models import Doc2Vec
from gensim.models.doc2vec import TaggedDocument
import numpy as np

# 1. 게시글 데이터
posts = [
    "I love hiking and outdoor adventures.",
    "Exploring new restaurants is my passion.",
    "Photography and nature walks are amazing.",
    "Trying new cuisines is always exciting.",
    "I enjoy reading science fiction books."
]

# 유저가 좋아요 누른 게시글 정보
user_likes = [0, 2, 4]  # 유저가 좋아요 누른 게시글 인덱스

# 2. 게시글에 태그 추가
tagged_posts = [TaggedDocument(words=post.split(), tags=[str(i)]) for i, post in enumerate(posts)]

# 3. Doc2Vec 모델 학습
model = Doc2Vec(vector_size=50, min_count=1, epochs=20)
model.build_vocab(tagged_posts)
model.train(tagged_posts, total_examples=model.corpus_count, epochs=model.epochs)

# 4. 유저 성향 벡터화 (좋아요 게시글의 벡터 평균)
user_vector = np.mean([model.dv[str(idx)] for idx in user_likes], axis=0)

# 5. 유사 게시글 찾기 (유저 성향과 유사한 게시글)
similar_posts = model.dv.most_similar([user_vector], topn=3)
print(f"User might like: {similar_posts}")