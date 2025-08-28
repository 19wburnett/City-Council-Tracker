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
        // Get meetings with optional filters
        const id = url.searchParams.get('id')
        const date = url.searchParams.get('date')
        const includeItems = url.searchParams.get('include_items') === 'true'
        
        if (id) {
          // Get specific meeting
          let query = supabase
            .from('meetings')
            .select('*')
            .eq('id', id)
            .single()
          
          if (includeItems) {
            query = supabase
              .from('meetings')
              .select(`
                *,
                agenda_items (
                  id,
                  title,
                  description,
                  issue_tags
                )
              `)
              .eq('id', id)
              .single()
          }
          
          const { data, error } = await query
          if (error) throw error
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } else {
          // Get all meetings
          let query = supabase
            .from('meetings')
            .select('*')
            .order('date', { ascending: false })
          
          if (date) {
            query = query.eq('date', date)
          }
          
          const { data, error } = await query
          if (error) throw error
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        break

      case 'POST':
        // Create new meeting
        const body = await req.json()
        const { data: newMeeting, error: insertError } = await supabase
          .from('meetings')
          .insert(body)
          .select()
          .single()
        
        if (insertError) throw insertError
        return new Response(JSON.stringify(newMeeting), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        })

      case 'PUT':
        // Update meeting
        const updateBody = await req.json()
        const { id: updateId, ...updateData } = updateBody
        
        if (!updateId) {
          return new Response(JSON.stringify({ error: 'Meeting ID is required' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }

        const { data: updatedMeeting, error: updateError } = await supabase
          .from('meetings')
          .update(updateData)
          .eq('id', updateId)
          .select()
          .single()
        
        if (updateError) throw updateError
        return new Response(JSON.stringify(updatedMeeting), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'DELETE':
        // Delete meeting
        const deleteId = url.searchParams.get('id')
        
        if (!deleteId) {
          return new Response(JSON.stringify({ error: 'Meeting ID is required' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }

        const { error: deleteError } = await supabase
          .from('meetings')
          .delete()
          .eq('id', deleteId)
        
        if (deleteError) throw deleteError
        return new Response(JSON.stringify({ message: 'Meeting deleted successfully' }), {
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
