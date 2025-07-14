export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        // CORS headers for the response
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle preflight OPTIONS request
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Get the image URL from the request
        const { imageUrl, filename } = await request.json();
        
        if (!imageUrl) {
            return new Response(JSON.stringify({ error: 'No image URL provided' }), { 
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Validate URL format
        let url;
        try {
            url = new URL(imageUrl);
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Invalid URL format' }), { 
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Download the image from the external URL
        const downloadResponse = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            // Add timeout
            signal: AbortSignal.timeout(30000) // 30 seconds timeout
        });

        if (!downloadResponse.ok) {
            return new Response(JSON.stringify({ 
                error: `Failed to download image: ${downloadResponse.status} ${downloadResponse.statusText}` 
            }), { 
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get the image data
        const imageData = await downloadResponse.arrayBuffer();
        const contentType = downloadResponse.headers.get('content-type');
        
        // Validate content type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
            return new Response(JSON.stringify({ error: 'Invalid image type' }), { 
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Check file size (5MB limit)
        if (imageData.byteLength > 5 * 1024 * 1024) {
            return new Response(JSON.stringify({ error: 'Image too large (max 5MB)' }), { 
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get Cloudflare credentials from environment variables
        const accountId = env.CLOUDFLARE_ACCOUNT_ID;
        const apiToken = env.CLOUDFLARE_API_TOKEN;
        
        if (!accountId || !apiToken) {
            return new Response(JSON.stringify({ error: 'Missing Cloudflare credentials' }), { 
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Generate filename if not provided
        const finalFilename = filename || url.pathname.split('/').pop() || `image-${Date.now()}.jpg`;
        
        // Create a File object from the downloaded data
        const file = new File([imageData], finalFilename, { type: contentType });

        // Upload to Cloudflare Images
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const uploadResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                },
                body: uploadFormData
            }
        );

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadResult.success) {
            console.error('Cloudflare upload error:', uploadResult);
            return new Response(JSON.stringify({ 
                error: 'Failed to upload to Cloudflare Images',
                details: uploadResult.errors || uploadResult.messages
            }), { 
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Return the optimized image URL
        const imageId = uploadResult.result.id;
        const optimizedUrl = `https://imagedelivery.net/${env.CLOUDFLARE_HASH}/${imageId}/public`;

        return new Response(JSON.stringify({
            success: true,
            url: optimizedUrl,
            originalUrl: imageUrl,
            filename: finalFilename,
            size: imageData.byteLength,
            contentType: contentType,
            cloudflareId: imageId
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Download image error:', error);
        
        // Handle timeout errors
        if (error.name === 'AbortError') {
            return new Response(JSON.stringify({ error: 'Image download timeout' }), { 
                status: 408,
                headers: { 
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json' 
                }
            });
        }
        
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            details: error.message
        }), { 
            status: 500,
            headers: { 
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json' 
            }
        });
    }
} 