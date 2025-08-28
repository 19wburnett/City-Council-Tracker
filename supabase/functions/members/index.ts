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

    switch (method) {
      case 'GET':
        // Get all members or specific member by ID
        const url = new URL(req.url)
        const id = url.searchParams.get('id')
        
        if (id) {
          const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) throw error
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } else {
          const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('seat')
          
          if (error) throw error
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        break

      case 'POST':
        // Create new member
        const body = await req.json()
        const { data, error } = await supabase
          .from('members')
          .insert(body)
          .select()
          .single()
        
        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        })

      case 'PUT':
        // Update member
        const updateBody = await req.json()
        const { id: updateId, ...updateData } = updateBody
        
        if (!updateId) {
          return new Response(JSON.stringify({ error: 'Member ID is required' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }

        const { data: updatedData, error: updateError } = await supabase
          .from('members')
          .update(updateData)
          .eq('id', updateId)
          .select()
          .single()
        
        if (updateError) throw updateError
        return new Response(JSON.stringify(updatedData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'DELETE':
        // Delete member
        const deleteUrl = new URL(req.url)
        const deleteId = deleteUrl.searchParams.get('id')
        
        if (!deleteId) {
          return new Response(JSON.stringify({ error: 'Member ID is required' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }

        const { error: deleteError } = await supabase
          .from('members')
          .delete()
          .eq('id', deleteId)
        
        if (deleteError) throw deleteError
        return new Response(JSON.stringify({ message: 'Member deleted successfully' }), {
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
