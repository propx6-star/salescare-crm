import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Edge function to track IP and send alert email on new login
// Configured to be called via Supabase Webhook on auth.users sign in

serve(async (req) => {
  try {
    const { record, type } = await req.json()
    
    // Only track on LOGIN/SIGNUP
    if (type !== 'INSERT' && type !== 'UPDATE') {
      return new Response("Not a login event", { status: 200 })
    }

    const ipAddress = req.headers.get('x-forwarded-for') || 'Unknown IP'
    const userAgent = req.headers.get('user-agent') || 'Unknown Device'

    // 1. Log to database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabaseClient.from('login_logs').insert({
      user_id: record.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      location: 'IP Tracking Pending' // Integrate with an IP API here
    })

    // 2. Send Email Alert to Admin (Using Resend API as example)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'alert@salescare.com',
          to: 'admin@salescare.com',
          subject: `Cảnh báo đăng nhập mới từ IP: ${ipAddress}`,
          html: `<p>Có một lượt đăng nhập mới vào hệ thống.</p>
                 <ul>
                   <li><strong>User ID:</strong> ${record.id}</li>
                   <li><strong>Email:</strong> ${record.email}</li>
                   <li><strong>IP:</strong> ${ipAddress}</li>
                   <li><strong>Thiết bị:</strong> ${userAgent}</li>
                 </ul>`
        })
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
