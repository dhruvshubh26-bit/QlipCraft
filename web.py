import inspect  # noqa: I001
import re
import uuid

from pathlib import Path
from subprocess import SubprocessError

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from modules.audio import AudioEngine
from modules.asset_manager import AssetManager
from modules.brain import COMMUNITY_PROFILES, ContentBrain
from modules.composer import Composer

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "web_output"
OUTPUT_DIR.mkdir(exist_ok=True)

app = FastAPI(title="QlipCraft")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

RECENT = []

DEFAULT_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>'
ICONS = {name: DEFAULT_ICON for name in COMMUNITY_PROFILES}
MODEL_NAME = re.search(
    r'model="([^"]+)"', inspect.getsource(ContentBrain.generate_script)
).group(1)
VOICE_NAME = AudioEngine().voice

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "communities": COMMUNITY_PROFILES,
            "recent": RECENT,
            "icons": ICONS,
            "model_name": MODEL_NAME,
            "voice_name": VOICE_NAME,
        },
    )


@app.post("/generate")
async def generate(
    topic: str = Form(...),
    community: str = Form(...),
    duration: int = Form(30),
):
    try:
        brain = ContentBrain()
        content = brain.generate_script(topic, community, duration)
        scenes = content.get("script", [])
        full_text = " ".join(s.get("narration", "") for s in scenes if isinstance(s, dict))

        audio = AudioEngine()
        audio_path = await audio.generate(full_text)

        assets = AssetManager()
        clips = assets.get_clips(scenes, num_scenes=len(scenes), community=community)

        job_id = uuid.uuid4().hex[:8]
        output_path = OUTPUT_DIR / f"{job_id}.mp4"
        Composer().compose(clips, audio_path, str(output_path))

        RECENT.insert(
            0,
            {
                "id": job_id,
                "topic": topic,
                "community": community,
                "caption": content.get("caption", ""),
                "hashtags": content.get("hashtags", ""),
            },
        )
        del RECENT[20:]

        return JSONResponse({
            "id": job_id,
            "hook1": content.get("hook1", ""),
            "hook2": content.get("hook2", ""),
            "caption": content.get("caption", ""),
            "hashtags": content.get("hashtags", ""),
        })
    except (OSError, RuntimeError, SubprocessError, TypeError, ValueError) as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


@app.get("/health")
def health():
    return {"ok": True}


@app.delete("/videos/{video_id}")
def delete_video(video_id: str):
    if not re.fullmatch(r"[0-9a-fA-F]{8}", video_id):
        return JSONResponse({"error": "Invalid video id."}, status_code=400)

    item = next((entry for entry in RECENT if entry["id"] == video_id), None)
    if item is None:
        return JSONResponse({"error": "Video not found."}, status_code=404)

    try:
        (OUTPUT_DIR / f"{video_id}.mp4").unlink(missing_ok=True)
        RECENT.remove(item)
        return {"ok": True, "id": video_id}
    except OSError as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)