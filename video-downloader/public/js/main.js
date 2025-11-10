document.addEventListener('DOMContentLoaded', () => {
    const videoUrl = document.getElementById('videoUrl');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const videoInfo = document.getElementById('videoInfo');
    const downloadProgress = document.getElementById('downloadProgress');
    const thumbnail = document.getElementById('thumbnail');
    const videoTitle = document.getElementById('videoTitle');
    const videoDuration = document.getElementById('videoDuration');
    const qualityOptions = document.getElementById('qualityOptions');
    const downloadBtn = document.getElementById('downloadBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    let currentVideoData = null;

    function formatDuration(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function formatFileSize(bytes) {
        if (!bytes) return 'Unknown size';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }

    async function analyzeVideo(url) {
        try {
            videoInfo.classList.add('hidden');
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';

            const response = await fetch('/.netlify/functions/get-video-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                throw new Error('Failed to analyze video');
            }
            
            const data = await response.json();
            currentVideoData = data;

            // Update UI with video information
            thumbnail.src = data.thumbnail;
            videoTitle.textContent = data.title;
            videoDuration.textContent = formatDuration(data.duration);

            // Create quality options
            qualityOptions.innerHTML = data.formats
                .map((format, index) => `
                    <label class="quality-option glassmorphism">
                        <input type="radio" name="quality" value="${format.itag}" ${index === 0 ? 'checked' : ''}>
                        <div class="quality-info">
                            <span class="quality-label">${format.quality}</span>
                            <span class="quality-details">
                                ${format.fps}fps | ${formatFileSize(format.size)}
                            </span>
                        </div>
                    </label>
                `).join('');

            videoInfo.classList.remove('hidden');
        } catch (error) {
            showToast('Error analyzing video: ' + error.message, 'error');
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze';
        }
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }, 100);
    }

    async function startDownload() {
        try {
            const selectedQuality = document.querySelector('input[name="quality"]:checked').value;
            const selectedDevice = document.querySelector('.device-btn.active')?.dataset.device || 'pc';
            
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting...';

            const response = await fetch('/.netlify/functions/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: videoUrl.value,
                    quality: selectedQuality,
                    device: selectedDevice
                })
            });

            if (!response.ok) {
                throw new Error('Failed to start download');
            }
            
            const data = await response.json();
            
            // Create a hidden download link and click it
            const a = document.createElement('a');
            a.href = data.url;
            a.download = data.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            showToast('Download started successfully!', 'success');
        } catch (error) {
            showToast('Error starting download: ' + error.message, 'error');
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Now';
        }
    }

    // Event Listeners
    analyzeBtn.addEventListener('click', () => {
        if (videoUrl.value) {
            analyzeVideo(videoUrl.value);
        } else {
            showToast('Please enter a video URL', 'error');
        }
    });

    videoUrl.addEventListener('paste', (e) => {
        setTimeout(() => {
            if (videoUrl.value) {
                analyzeVideo(videoUrl.value);
            }
        }, 100);
    });

    downloadBtn.addEventListener('click', startDownload);

    cancelBtn.addEventListener('click', () => {
        videoInfo.classList.add('hidden');
        videoUrl.value = '';
        currentVideoData = null;
    });

    // Device button selection
    document.querySelectorAll('.device-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
});