"""Re-encode the supplied GIF for the web; source stays outside public/."""
from hashlib import sha256
import json
from pathlib import Path
import re
import subprocess
from tempfile import TemporaryDirectory

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/source/initiald.gif"
MEDIA = ROOT / "public/media"
MEDIA.mkdir(parents=True, exist_ok=True)

with TemporaryDirectory(prefix="jdm-media-") as temporary:
    temporary = Path(temporary)
    video = temporary / "initiald.mp4"
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-ignore_loop", "1", "-i", str(SOURCE), "-an",
        "-c:v", "libx264", "-preset", "slow", "-crf", "21",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(video),
    ], check=True)
    with Image.open(SOURCE) as image:
        frames = image.n_frames
        duration = 0
        for index in range(frames):
            image.seek(index)
            duration += image.info.get("duration", 0)
        last = temporary / "last.webp"
        image.convert("RGB").save(last, lossless=True)
        image.seek(0)
        first = temporary / "first.webp"
        image.convert("RGB").save(first, quality=88, method=6)

    files = {}
    for key, file in [("video", video), ("first", first), ("last", last)]:
        prefix = "initiald" if key == "video" else "initiald-" + key
        name = prefix + "-" + sha256(file.read_bytes()).hexdigest()[:12] + file.suffix
        (MEDIA / name).write_bytes(file.read_bytes())
        files[key] = name
    lines = ["const base = import.meta.env.BASE_URL;", "", "export const HERO_MEDIA = {"]
    lines.extend("  " + key + ": base + " + json.dumps("media/" + name) + "," for key, name in files.items())
    lines.append("};")
    (ROOT / "src/heroMedia.js").write_text("\n".join(lines) + "\n")
    index = ROOT / "index.html"
    html = index.read_text()
    for key in ["first", "last"]:
        html = re.sub(r"\./media/initiald-" + key + r"-[a-f0-9]+\.webp", "./media/" + files[key], html)
    index.write_text(html)
    metadata = {
        "original_gif_bytes": SOURCE.stat().st_size,
        "video_bytes": video.stat().st_size,
        "frames": frames,
        "duration_seconds": duration / 1000,
        "encoding": "H.264, CRF 21, yuv420p, MP4 faststart; audio omitted",
        "files": files,
    }
    (ROOT / "docs/media-optimization.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(f"{metadata['original_gif_bytes']} bytes GIF -> {metadata['video_bytes']} bytes MP4")
    print(f"{frames} frames, {duration / 1000:.2f}s; source GIF is excluded from the public build.")
