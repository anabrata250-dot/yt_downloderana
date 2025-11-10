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

    let currentVideoData = null;

    function formatDuration(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    async function analyzeVideo(url) {
        try {
            const response = await fetch('/.netlify/functions/get-video-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) throw new Error('Failed to analyze video');
            
            const data = await response.json();
            currentVideoData = data;

            // Update UI with video information
            thumbnail.src = data.thumbnail;
            videoTitle.textContent = data.title;
            videoDuration.textContent = formatDuration(data.duration);

            // Create quality options
            qualityOptions.innerHTML = data.formats
                .map((format, index) => `
                    <label class="quality-option">
                        <input type="radio" name="quality" value="${format.itag}" ${index === 0 ? 'checked' : ''}>
                        <span>${format.quality}</span>
                    </label>
                `).join('');

            videoInfo.classList.remove('hidden');
        } catch (error) {
            alert('Error analyzing video: ' + error.message);
        }
    }

    async function startDownload() {
        try {
            const selectedQuality = document.querySelector('input[name="quality"]:checked').value;
            const response = await fetch('/.netlify/functions/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: videoUrl.value,
                    quality: selectedQuality
                })
            });

            if (!response.ok) throw new Error('Failed to start download');
            
            const data = await response.json();
            
            // Create a hidden download link and click it
            const a = document.createElement('a');
            a.href = data.downloadUrl;
            a.download = currentVideoData.title + '.mp4';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            alert('Error starting download: ' + error.message);
        }
    }

    analyzeBtn.addEventListener('click', () => {
        if (videoUrl.value) {
            analyzeVideo(videoUrl.value);
        } else {
            alert('Please enter a video URL');
        }
    });

    downloadBtn.addEventListener('click', startDownload);
});