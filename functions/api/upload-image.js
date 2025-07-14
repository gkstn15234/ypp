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

        // Get the uploaded file from the request
        const formData = await request.formData();
        const file = formData.get('file');
        
        if (!file) {
            return new Response(JSON.stringify({ error: 'No file provided' }), { 
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return new Response(JSON.stringify({ error: 'Invalid file type' }), { 
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            return new Response(JSON.stringify({ error: 'File too large' }), { 
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

        // Upload to Cloudflare Images
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const cloudflareResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`
            },
            body: uploadFormData
        });

        const result = await cloudflareResponse.json();

        if (!result.success) {
            return new Response(JSON.stringify({ 
                error: 'Upload failed', 
                details: result.errors?.[0]?.message || 'Unknown error' 
            }), { 
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Return the image URL
        const imageUrl = result.result.variants?.[0] || result.result.url;
        
        return new Response(JSON.stringify({ 
            success: true, 
            url: imageUrl,
            id: result.result.id 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Upload error:', error);
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