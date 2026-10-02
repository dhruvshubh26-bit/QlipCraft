# QlipCraft

## Qoneqt x CTRL FREAK Challenge

QlipCraft is a community-aware short-video studio built for the Qoneqt Global Feed. A creator enters a topic, selects one of 22 Qoneqt communities, and receives a vertical 9:16 video with a generated script, narration, local visual clips, caption, hashtags, and hooks.

The application can be used from the command line or through the FastAPI web studio. Community-specific clips are preferred from `clips/{community}/`; the asset manager falls back to the flat `clips/` directory when needed.

## Tech Stack

- Python 3.11
- FastAPI and Uvicorn
- Jinja2 templates and static HTML/CSS/JavaScript
- Groq API with `openai/gpt-oss-120b`
- Edge TTS with `en-US-AriaNeural`
- FFmpeg and FFprobe for 9:16 video composition
- Local MP4, MOV, and MKV clip library

## Project Structure

```text
QlipCraft/
├── main.py                  # Command-line generation pipeline
├── web.py                   # FastAPI application and web pipeline
├── requirements.txt         # Pinned Python dependencies
├── Dockerfile               # Production container
├── Procfile                 # Render web process
├── .env.example             # Environment variable template
├── modules/
│   ├── brain.py             # Groq script generation and communities
│   ├── audio.py             # Edge TTS narration
│   ├── asset_manager.py     # Community clip selection and fallback
│   └── composer.py          # FFmpeg video and audio composition
├── templates/
│   ├── base.html
│   └── index.html
├── static/
│   ├── style.css
│   └── app.js
├── clips/                   # Local source clips, organized by community
├── assets/
│   ├── audio_clips/
│   ├── final/
│   └── temp/
└── web_output/              # Generated web videos
```

## Setup

### 1. Install Python and FFmpeg

Install Python 3.11 or newer.

On Windows, install FFmpeg and verify it is available on PATH:

```powershell
ffmpeg -version
ffprobe -version
```

On Ubuntu or Debian:

```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

### 2. Create a virtual environment

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS or Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Configure Groq

Copy `.env.example` to `.env` and add a real Groq API key. Create a key at:

https://console.groq.com/keys

```env
GROQ_API_KEY=gsk_your_key_here
```

### 5. Add source clips

Add vertical `.mp4`, `.mov`, or `.mkv` files to a community folder, for example:

```text
clips/Technology/technology_clip.mp4
clips/Gaming/gaming_clip.mp4
```

If a community folder is empty, QlipCraft uses compatible files directly inside `clips/`.

## Run the CLI

From the project root:

```bash
python main.py
```

The CLI asks for a topic and community, then writes the final video to `assets/final/final_video.mp4`.

## Run the Web Studio

```bash
uvicorn web:app --reload --host 127.0.0.1 --port 8000
```

Open:

http://127.0.0.1:8000

Health check:

http://127.0.0.1:8000/health

## Deploy on Render

### Docker deployment

1. Push this repository to GitHub.
2. Create a new Render Web Service from the repository.
3. Choose Docker as the runtime.
4. Add the environment variable `GROQ_API_KEY` in Render's Environment settings.
5. Deploy. Render provides the `PORT` variable consumed by the Dockerfile.

### Native Python deployment

Use these Render settings:

- **Runtime:** Python
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn web:app --host 0.0.0.0 --port $PORT`
- **Environment variable:** `GROQ_API_KEY`

FFmpeg must also be available in the deployment environment. The included Dockerfile is the recommended Render configuration because it installs FFmpeg during the image build.

## Supported Qoneqt Communities

QlipCraft supports these 22 communities:

1. Jobs
2. Internship
3. Gaming
4. Event
5. Education
6. Technology
7. Sports
8. Entertainment
9. Blockchain
10. Company
11. News
12. General
13. Art
14. Personalities
15. Food & Cooking
16. Health & Fitness
17. Business & Finance
18. Travel & Lifestyle
19. Fashion & Photography
20. Motivation & Wellness
21. Learning & Growth
22. Quotes & Nature

## Team

**Team Cadillac**

- Dhruv Sukhadiya
- Manan Rami
- Jash Patel
- Priyansh Patel

Gandhinagar University

## Credits

- Pexels and Mixkit for visual-content inspiration and source media
- Groq for fast structured script generation
- Edge TTS for narration synthesis
- FFmpeg for video processing and final audio/video composition

