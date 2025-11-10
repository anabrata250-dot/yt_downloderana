const ytdl = require('ytdl-core');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { url } = JSON.parse(event.body);
        
        if (!url) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'URL is required' })
            };
        }

        // Get video info
        const info = await ytdl.getInfo(url);
        
        // Format the video information
        const formats = info.formats
            .filter(format => format.hasVideo && format.hasAudio)
            .map(format => ({
                itag: format.itag,
                quality: format.qualityLabel,
                mimeType: format.mimeType,
                size: format.contentLength,
                fps: format.fps,
                container: format.container
            }));

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: info.videoDetails.title,
                thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
                duration: info.videoDetails.lengthSeconds,
                formats: formats.sort((a, b) => {
                    const getQualityNumber = (quality) => parseInt(quality?.replace('p', '') || '0');
                    return getQualityNumber(b.quality) - getQualityNumber(a.quality);
                })
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};