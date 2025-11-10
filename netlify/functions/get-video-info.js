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

        // Get video info using ytdl-core
        const info = await ytdl.getInfo(url);
        
        // Format the video information
        const formats = info.formats
            .filter(format => format.hasVideo && format.hasAudio)
            .map(format => ({
                itag: format.itag,
                quality: format.qualityLabel,
                mimeType: format.mimeType,
                size: format.contentLength,
                url: format.url
            }));

        // Get video details
        const videoDetails = {
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
            duration: info.videoDetails.lengthSeconds,
            formats: formats.sort((a, b) => {
                const getQualityNumber = (quality) => parseInt(quality?.replace('p', '') || '0');
                return getQualityNumber(b.quality) - getQualityNumber(a.quality);
            })
        };

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(videoDetails)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

        # YoutubeDL options for format extraction
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'format': 'bestvideo[height<=4320][vcodec^=vp9.2|vcodec^=vp9|vcodec^=av1|vcodec^=h264]+bestaudio[acodec^=opus]/bestvideo[height<=4320]+bestaudio/best[height<=4320]',
            'format_sort': [
                'res:2160>1440>1080>720',
                'vcodec:vp9.2>vp9>av1>h264',
                'acodec:opus>aac',
                'size',
                'br'
            ]
        }

        # Extract video information
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            formats = {
                'title': info.get('title', 'Unknown Title'),
                'duration': info.get('duration', 0),
                'thumbnail': info.get('thumbnail', ''),
                'formats': []
            }
            
            # Process available formats
            seen_qualities = set()
            for f in info.get('formats', []):
                if f.get('vcodec') != 'none':
                    height = f.get('height', 0)
                    if height and height not in seen_qualities:
                        seen_qualities.add(height)
                        formats['formats'].append({
                            'format_id': f.get('format_id'),
                            'quality': f"{height}p",
                            'ext': f.get('ext', 'mp4'),
                            'filesize': f.get('filesize', 0),
                            'fps': f.get('fps', 0)
                        })

            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': json.dumps(formats)
            }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }