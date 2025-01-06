from gensim.models import Doc2Vec
from gensim.models.doc2vec import TaggedDocument

import gensim.downloader as api
"""
model = api.load("doc2vec-google-news-300")  # 예시: Google News Doc2Vec
pretrained_model_path = 'path/to/pretrained/doc2vec/model'
model = Doc2Vec.load(pretrained_model_path)
new_document = "This is a sample Instagram post."
vector = model.infer_vector(new_document.split())
print(vector)  # 벡터 값 출력
similar_docs = model.dv.most_similar([vector], topn=5)  # 가장 유사한 5개 문서 찾기
print(similar_docs)
"""

# 1. 게시글 데이터 준비
posts = [
    "I love hiking and outdoor adventures.",
    "Exploring new restaurants is my passion.",
    "Photography and nature walks are amazing.",
    "Trying new cuisines is always exciting.",
    "I enjoy reading science fiction books."
]

# 2. 게시글에 태그 추가
tagged_posts = [TaggedDocument(words=post.split(), tags=[str(i)]) for i, post in enumerate(posts)]

# 3. Doc2Vec 모델 학습
model = Doc2Vec(vector_size=50, min_count=1, epochs=20)
model.build_vocab(tagged_posts)
model.train(tagged_posts, total_examples=model.corpus_count, epochs=model.epochs)

# 4. 유사 게시글 찾기
post_index = 0  # 첫 번째 게시글 기준
similar_posts = model.dv.most_similar(str(post_index), topn=3)
print(f"Post {post_index} is similar to: {similar_posts}")