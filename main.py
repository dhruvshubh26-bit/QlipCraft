import asyncio
from subprocess import SubprocessError

from modules.asset_manager import AssetManager
from modules.audio import AudioEngine
from modules.brain import COMMUNITY_PROFILES, ContentBrain
from modules.composer import Composer


async def main():
    print("🎬 QlipCraft - Qoneqt Short Generator")
    topic = input("Enter a topic: ").strip()
    print("Available communities:", ", ".join(COMMUNITY_PROFILES.keys()))
    community = input("Community: ").strip()
    show_captions = input("Add captions to the video? [Y/n]: ").strip().lower() not in {
        "n",
        "no",
    }

    if not topic:
        print("❌ Topic cannot be empty.")
        return

    try:
        brain = ContentBrain()
        content = brain.generate_script(topic, community)
        print("📝 Script generated.")

        # Build full narration text from the scene dicts
        script_scenes = content.get("script", [])
        full_text = " ".join(
            s.get("narration", "") for s in script_scenes if isinstance(s, dict)
        ).strip()

        if not full_text:
            raise RuntimeError("No narration text generated.")

        # Voiceover
        audio = AudioEngine()
        audio_path = await audio.generate(full_text)
        if not audio_path:
            raise RuntimeError("Voiceover generation failed.")
        print(f"🎙️ Voiceover saved: {audio_path}")

        # Local clips (one per scene)
        assets = AssetManager()
        video_paths = assets.get_clips(
            script_scenes,
            num_scenes=len(script_scenes),
            community=community,
        )
        if not video_paths:
            raise RuntimeError("No video clips found.")

        # Compose final video
        composer = Composer()
        final_path = composer.compose(
            video_paths,
            audio_path,
            caption_scenes=script_scenes if show_captions else None,
        )

        print(f"\n✅ Final video saved: {final_path}")
        print("\n✅ QlipCraft finished successfully.")
        print(f"Video: {final_path}")
        print(f"Hook 1: {content.get('hook1', '')}")
        print(f"Hook 2: {content.get('hook2', '')}")
        print(f"Caption: {content.get('caption', '')}")
        print(f"Hashtags: {content.get('hashtags', '')}")

    except (OSError, RuntimeError, SubprocessError, TypeError, ValueError) as e:
        print(f"❌ Generation failed: {e}")


if __name__ == "__main__":
    asyncio.run(main())