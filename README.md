This project downloads YouTube videos.

Updated behavior:
- The downloader will try to use `yt-dlp` first (more robust).
- If `yt-dlp` is not available, it will fall back to `pytube`.

Run:

```powershell
python -u "c:\Users\123\Desktop\New folder\main.py"
```

If you prefer to force `yt-dlp` usage, install it with:

```powershell
python -m pip install --upgrade yt-dlp
```
