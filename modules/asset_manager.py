from pathlib import Path  # noqa: I001


VIDEO_EXTENSIONS = (".mp4", ".mov", ".mkv")


def _list_clips(clips_dir):
    clips_path = Path(clips_dir)
    if not clips_path.is_dir():
        return []

    return sorted(
        str(path)
        for path in clips_path.iterdir()
        if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS
    )


class AssetManager:
    def __init__(self, clips_dir="clips"):
        self.clips_dir = clips_dir

    def get_clips(self, scenes, num_scenes=None, community=None):
        """Return one cycling local clip per scene, preferring a community folder."""
        if isinstance(scenes, dict):
            scene_list = scenes.get("script", []) or scenes.get("scenes", [])
        elif isinstance(scenes, list):
            scene_list = scenes
        else:
            scene_list = []

        if num_scenes is None:
            num_scenes = len(scene_list)

        if num_scenes <= 0:
            raise ValueError("num_scenes must be greater than zero.")

        community_name = Path((community or "").strip()).name
        community_dir = Path(self.clips_dir) / community_name
        clips = _list_clips(community_dir) if community_name else []

        if clips:
            source_dir = community_dir
        else:
            clips = _list_clips(self.clips_dir)
            source_dir = Path(self.clips_dir)

        if not clips:
            raise RuntimeError(
                "No video clips found in the community or flat 'clips/' folder."
            )

        if community_name and source_dir == Path(self.clips_dir):
            print(
                f"⚠️ No clips found in '{community_dir}'. "
                "Falling back to the flat 'clips/' folder."
            )

        selected_clips = []
        for index in range(num_scenes):
            clip_path = clips[index % len(clips)]
            selected_clips.append(clip_path)

            scene = scene_list[index] if index < len(scene_list) else {}
            visual_query = (
                scene.get("visual_query", "")
                if isinstance(scene, dict)
                else ""
            )
            print(
                f"🎥 Scene {index + 1}: {visual_query} -> {clip_path}"
            )

        return selected_clips

    def fetch(self, scenes, num_scenes=None, community=None):
        return self.get_clips(scenes, num_scenes, community)

    def get_videos(self, scenes, num_scenes=None, community=None):
        return self.get_clips(scenes, num_scenes, community)

    def download_assets(self, scenes, num_scenes=None, community=None):
        return self.get_clips(scenes, num_scenes, community)
