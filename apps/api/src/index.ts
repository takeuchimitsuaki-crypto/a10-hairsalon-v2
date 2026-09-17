import { WorkerEnv, Stylist, Menu, Appointment, Chart, Message } from './types';

export default {
  async fetch(request: Request, env: WorkerEnv) {
    const url = new URL(request.url);
    const db = env.DB;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (url.pathname === '/api/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          database: 'connected'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Get all stylists
      if (url.pathname === '/api/stylists' && request.method === 'GET') {
        const { results } = await db.prepare(
          'SELECT * FROM stylists ORDER BY created_at DESC'
        ).all() as any;
        
        return new Response(JSON.stringify({
          results: results || [],
          success: true,
          count: results?.length || 0
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Get all appointments
      if (url.pathname === '/api/appointments' && request.method === 'GET') {
        const { results } = await db.prepare(
          'SELECT * FROM appointments ORDER BY start_time DESC'
        ).all() as any;
        
        return new Response(JSON.stringify({
          results: results || [],
          success: true,
          count: results?.length || 0
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Get all menus
      if (url.pathname === '/api/menus' && request.method === 'GET') {
        const { results } = await db.prepare(
          'SELECT * FROM menus WHERE is_active = 1 ORDER BY display_order'
        ).all() as any;
        
        return new Response(JSON.stringify({
          results: results || [],
          success: true,
          count: results?.length || 0
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Get all messages
      if (url.pathname === '/api/messages' && request.method === 'GET') {
        const { results } = await db.prepare(
          'SELECT * FROM messages ORDER BY created_at DESC'
        ).all() as any;
        
        return new Response(JSON.stringify({
          results: results || [],
          success: true,
          count: results?.length || 0
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Get all charts
      if (url.pathname === '/api/charts' && request.method === 'GET') {
        const { results } = await db.prepare(
          'SELECT * FROM charts ORDER BY created_at DESC'
        ).all() as any;
        
        return new Response(JSON.stringify({
          results: results || [],
          success: true,
          count: results?.length || 0
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Not found
      return new Response(JSON.stringify({ 
        error: 'Not Found',
        path: url.pathname 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error: any) {
      console.error('API Error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
} as ExportedHandler<WorkerEnv>;
