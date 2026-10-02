# QlipCraft

QlipCraft is a small Qoneqt-focused Python MVP that turns a topic into a short vertical video. It uses Groq for the script, edge-tts for narration, a local MP4 from `clips/` for visuals, and FFmpeg for the final 9:16 render.

## Setup

1. Install Python 3.10+ and FFmpeg. On Windows, verify FFmpeg with `ffmpeg -version`.
2. Install Python dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` and set `GROQ_API_KEY`.
4. Put one or more vertical `.mp4`, `.mov`, or `.mkv` videos in `clips/`. Community folders such as `clips/Gaming/` are preferred, with `clips/` as the fallback.

The project does not use Pexels, Pixabay, avatar footage, or Bark audio.

## Run

```powershell
python main.py
```

To run the website:

```powershell
uvicorn web:app --reload --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000 in your browser. Check http://127.0.0.1:8000/health for a basic health response.

Enter a topic and choose `Food`, `Tech`, or `News`. The generated files are saved here:

- Voiceover: `assets/audio_clips/voice.mp3`
- Final video: `assets/final/final_video.mp4`

## Pipeline

1. Groq returns `hook1`, `hook2`, narration lines, a caption, and hashtags as JSON.
2. edge-tts turns the narration lines into one MP3.
3. A random local video is selected from `clips/`.
4. FFmpeg loops and crops the video to 1080x1920, combines it with the voiceover, and writes an H.264/AAC MP4 compatible with Windows playback.
