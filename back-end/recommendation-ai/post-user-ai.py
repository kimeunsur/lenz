import sys
import json
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer, util
import os
from dotenv import load_dotenv
import random

# 1. .env 파일 로드
load_dotenv()
model = SentenceTransformer('all-MiniLM-L6-v2')

# 2. MongoDB 연결
db_uri = os.getenv('CONNECT_DB')  # .env에서 DB URI 가져오기
database_name = "testDatabase"    # 사용할 데이터베이스 이름

client = MongoClient(db_uri)
db = client[database_name]
posts_collection = db['posts']

# 3. 데이터 가져오기 (content와 _id만 가져옴)
all_posts = list(posts_collection.find({}, {'_id': 1, 'content': 1}))

# 특정 게시글 선택 (예: 첫 번째 게시글)
input_post_ids = sys.argv[1:]  # Js에서 전달된 postIds

# 기준이 될 게시글 (postIds로 필터링)
target_posts = [post for post in all_posts if str(post['_id']) in input_post_ids]

if not target_posts:
    # 기준 게시글이 없으면 랜덤 50개 반환
    random.shuffle(all_posts)
    print(json.dumps({'postIds': [str(post['_id']) for post in all_posts[:50]]}, indent=4))
    sys.exit(0)

# 기준 게시글들의 content 벡터화 및 평균 계산
target_vectors = model.encode([post['content'] for post in target_posts], convert_to_tensor=True)
average_target_vector = target_vectors.mean(dim=0)  # 평균 벡터 계산

# 모든 게시글의 content 벡터화
contents = [post['content'] for post in all_posts]
content_vectors = model.encode(contents, convert_to_tensor=True)

# 모든 게시글과 기준 평균 벡터 간의 유사도 계산
similarities = util.pytorch_cos_sim(average_target_vector, content_vectors).squeeze(0)

# 유사도 상위 50개 추출
top_50_indices = similarities.argsort(descending=True)[:50]

# 결과 반환
print(json.dumps({'postIds': [str(all_posts[idx.item()]['_id']) for idx in top_50_indices]}, indent=4))