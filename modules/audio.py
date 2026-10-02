import os

import edge_tts


class AudioEngine:
    def __init__(self, voice="en-US-AriaNeural"):
        self.voice = voice
        self.output_dir = "assets/audio_clips"

    async def generate(self, text):
        os.makedirs(self.output_dir, exist_ok=True)
        out_path = os.path.join(self.output_dir, "voice.mp3")

        # Make sure we only pass a string here
        if not isinstance(text, str):
            raise TypeError(f"AudioEngine.generate expected str, got {type(text).__name__}")

        communicate = edge_tts.Communicate(text, self.voice)
        await communicate.save(out_path)
        return out_path

    # alias in case main.py calls it differently
    async def generate_voice(self, text):
        return await self.generate(text)

    async def run(self, text):
        return await self.generate(text)