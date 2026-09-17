export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/api/stylists') {
      return new Response(JSON.stringify({
        results: [],
        success: true,
        message: 'Stylists endpoint working - DB initialization needed'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/api/appointments') {
      return new Response(JSON.stringify({
        results: [],
        success: true,
        message: 'Appointments endpoint working'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/api/menus') {
      return new Response(JSON.stringify({
        results: [],
        success: true,
        message: 'Menus endpoint working'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/api/messages') {
      return new Response(JSON.stringify({
        results: [],
        success: true,
        message: 'Messages endpoint working'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/api/charts') {
      return new Response(JSON.stringify({
        results: [],
        success: true,
        message: 'Charts endpoint working'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} as ExportedHandler;
