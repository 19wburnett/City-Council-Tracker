import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { method } = req
    const url = new URL(req.url)

    switch (method) {
      case 'GET':
        // Get votes with various filters
        const itemId = url.searchParams.get('item_id')
        const memberId = url.searchParams.get('member_id')
        const meetingId = url.searchParams.get('meeting_id')
        
        let query = supabase
          .from('votes')
          .select(`
            *,
            agenda_items (
              id,
              title,
              description,
              issue_tags,
              meetings (
                id,
                date
              )
            ),
            members (
              id,
              name,
              seat
            )
          `)
        
        if (itemId) {
          query = query.eq('item_id', itemId)
        }
        if (memberId) {
          query = query.eq('member_id', memberId)
        }
        if (meetingId) {
          query = query.eq('agenda_items.meeting_id', meetingId)
        }
        
        const { data, error } = await query.order('created_at', { ascending: false })
        
        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'POST':
        // Create new vote
        const body = await req.json()
        const { data: newVote, error: insertError } = await supabase
          .from('votes')
          .insert(body)
          .select(`
            *,
            agenda_items (
              id,
              title,
              description,
              issue_tags,
              meetings (
                id,
                date
              )
            ),
            members (
              id,
              name,
              seat
            )
          `)
          .single()
        
        if (insertError) throw insertError
        return new Response(JSON.stringify(newVote), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        })

      case 'PUT':
        // Update vote
        const updateBody = await req.json()
        const { id: updateId, ...updateData } = updateBody
        
        if (!updateId) {
          return new Response(JSON.stringify({ error: 'Vote ID is required' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }

        const { data: updatedVote, error: updateError } = await supabase
          .from('votes')
          .update(updateData)
          .eq('id', updateId)
          .select(`
            *,
            agenda_items (
              id,
              title,
              description,
              issue_tags,
              meetings (
                id,
                date
              )
            ),
            members (
              id,
              name,
              seat
            )
          `)
          .single()
        
        if (updateError) throw updateError
        return new Response(JSON.stringify(updatedVote), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'DELETE':
        // Delete vote
        const deleteId = url.searchParams.get('id')
        
        if (!deleteId) {
          return new Response(JSON.stringify({ error: 'Vote ID is required' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }

        const { error: deleteError } = await supabase
          .from('votes')
          .delete()
          .eq('id', deleteId)
        
        if (deleteError) throw deleteError
        return new Response(JSON.stringify({ message: 'Vote deleted successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405,
        })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
