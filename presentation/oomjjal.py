from moviepy.editor import VideoFileClip

import os
if not os.path.exists(output_folder):
    os.makedirs(output_folder)
    
def create_gifs(video_path, time_ranges, output_folder):
    for i, (start_time, end_time) in enumerate(time_ranges):
        # 동영상 클립 자르기
        clip = VideoFileClip(video_path).subclip(start_time, end_time)
        
        # 파일명에 번호 붙여 저장
        output_gif_path = f"{output_folder}/output_{i+1}.gif"
        clip.write_gif(output_gif_path, fps=10)
        print(f"움짤 저장 완료: {output_gif_path}")

# 사용 예시
video_path = "sample_video.mp4"  # 동영상 파일 경로
time_ranges = [(5, 10), (15, 20), (30, 35)]  # 각 구간 (시작, 종료) 리스트
output_folder = "gifs"  # 저장 폴더 경로

create_gifs(video_path, time_ranges, output_folder)