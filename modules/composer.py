import os
import subprocess


def _duration(path):
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                path,
            ],
            capture_output=True,
            text=True,
            check=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return 0.0

    try:
        return float(result.stdout.strip())
    except ValueError:
        return 0.0


def _compose_video(video_paths, audio_path, output_path="assets/final/final_video.mp4"):
    if not video_paths:
        raise ValueError("At least one video clip is required.")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    os.makedirs("assets/temp", exist_ok=True)

    # Verify audio
    audio_dur = _duration(audio_path)
    print(f"🔊 Voiceover: {audio_dur:.2f}s  ({audio_path})")
    if audio_dur < 0.5:
        raise RuntimeError("Voiceover file is empty. Check audio.py.")

    num = len(video_paths)
    per_clip = audio_dur / num
    print(f"🎞️ {num} scenes × {per_clip:.2f}s")

    # Normalize each clip with different offset so repeats look different
    norm_files = []
    for i, vp in enumerate(video_paths):
        nf = f"assets/temp/n{i}.mp4"
        offset = (i * 1.7) % 5
        subprocess.run([
            "ffmpeg", "-y",
            "-ss", f"{offset:.2f}",
            "-i", vp,
            "-t", f"{per_clip:.2f}",
            "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30",
            "-an",
            "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
            nf
        ], check=True)
        norm_files.append(nf)

    # Concat list
    lst = "assets/temp/list.txt"
    with open(lst, "w", encoding="utf-8") as f:
        for nf in norm_files:
            f.write(f"file '{os.path.abspath(nf).replace(chr(92), '/')}'\n")

    # Combine silent video
    silent = "assets/temp/silent.mp4"
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", lst, "-c", "copy", silent
    ], check=True)

    # Add audio (the important part)
    subprocess.run([
        "ffmpeg", "-y",
        "-i", silent,
        "-i", audio_path,
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        "-map", "0:v:0", "-map", "1:a:0",
        "-shortest",
        output_path
    ], check=True)

    # Verify output has audio
    check = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "a",
            "-show_entries",
            "stream=codec_type",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            output_path,
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    if "audio" not in check.stdout:
        raise RuntimeError("Final video has NO audio track. FFmpeg is dropping it.")

    print("✅ Audio track confirmed in final video.")
    return output_path


class Composer:
    def compose(self, video_paths, audio_path, output_path="assets/final/final_video.mp4"):
        return _compose_video(video_paths, audio_path, output_path)