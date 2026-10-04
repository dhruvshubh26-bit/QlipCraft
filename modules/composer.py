import os
import subprocess
import textwrap


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


def _srt_timestamp(seconds):
    milliseconds = max(0, round(seconds * 1000))
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    seconds, milliseconds = divmod(remainder, 1_000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"


def _write_captions(caption_scenes, scene_duration, path):
    cues = []
    for index, scene in enumerate(caption_scenes):
        if not isinstance(scene, dict):
            continue
        text = " ".join(str(scene.get("narration", "")).split())
        if not text:
            continue

        start = index * scene_duration
        end = (index + 1) * scene_duration
        wrapped = "\n".join(textwrap.wrap(text, width=42, break_long_words=False))
        cues.append(
            f"{len(cues) + 1}\n"
            f"{_srt_timestamp(start)} --> {_srt_timestamp(end)}\n"
            f"{wrapped}\n"
        )

    if not cues:
        raise ValueError("Caption scenes do not contain narration text.")

    with open(path, "w", encoding="utf-8-sig") as captions_file:
        captions_file.write("\n".join(cues))


def _subtitle_filter_path(path):
    return os.path.relpath(path).replace("\\", "/")


def _compose_video(
    video_paths,
    audio_path,
    output_path="assets/final/final_video.mp4",
    caption_scenes=None,
):
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
    audio_video = output_path
    if caption_scenes:
        audio_video = "assets/temp/with_audio.mp4"
    subprocess.run([
        "ffmpeg", "-y",
        "-i", silent,
        "-i", audio_path,
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        "-map", "0:v:0", "-map", "1:a:0",
        "-shortest",
        audio_video
    ], check=True)

    if caption_scenes:
        captions_path = "assets/temp/captions.srt"
        _write_captions(caption_scenes, per_clip, captions_path)
        subprocess.run([
            "ffmpeg", "-y",
            "-i", audio_video,
            "-vf",
            (
                f"subtitles={_subtitle_filter_path(captions_path)}:"
                "force_style='FontName=Arial,FontSize=28,Bold=1,"
                "PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,"
                "BorderStyle=1,Outline=3,Shadow=0,Alignment=2,MarginV=360'"
            ),
            "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
            "-c:a", "copy",
            output_path,
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
    def compose(
        self,
        video_paths,
        audio_path,
        output_path="assets/final/final_video.mp4",
        caption_scenes=None,
    ):
        return _compose_video(video_paths, audio_path, output_path, caption_scenes)