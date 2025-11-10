import os
from flask import jsonify
import threading
from functools import partial

class DownloadManager:
    def __init__(self):
        self.downloads = {}
        self.lock = threading.Lock()

    def add_download(self, download_id, url, save_path, quality):
        with self.lock:
            self.downloads[download_id] = {
                'url': url,
                'save_path': save_path,
                'quality': quality,
                'status': 'downloading',
                'progress': 0,
                'speed': 0,
                'eta': 0,
                'thread': None,
                'pause_event': threading.Event()
            }

    def pause_download(self, download_id):
        with self.lock:
            if download_id in self.downloads:
                self.downloads[download_id]['pause_event'].set()
                self.downloads[download_id]['status'] = 'paused'
                return True
        return False

    def resume_download(self, download_id):
        with self.lock:
            if download_id in self.downloads:
                self.downloads[download_id]['pause_event'].clear()
                self.downloads[download_id]['status'] = 'downloading'
                if not self.downloads[download_id]['thread'] or not self.downloads[download_id]['thread'].is_alive():
                    self._start_download(download_id)
                return True
        return False

    def cancel_download(self, download_id):
        with self.lock:
            if download_id in self.downloads:
                self.downloads[download_id]['status'] = 'cancelled'
                self.downloads[download_id]['pause_event'].set()
                return True
        return False

    def get_status(self, download_id):
        with self.lock:
            if download_id in self.downloads:
                download = self.downloads[download_id]
                return {
                    'status': download['status'],
                    'progress': download['progress'],
                    'speed': download['speed'],
                    'eta': download['eta']
                }
        return None

    def update_progress(self, download_id, progress, speed=None, eta=None):
        with self.lock:
            if download_id in self.downloads:
                self.downloads[download_id]['progress'] = progress
                if speed is not None:
                    self.downloads[download_id]['speed'] = speed
                if eta is not None:
                    self.downloads[download_id]['eta'] = eta

download_manager = DownloadManager()