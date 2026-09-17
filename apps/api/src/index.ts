import { Appointment, Styler } from '@a10/shared';

export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    try {
      switch (url.pathname) {
        case '/api/appointments':
          return await handleAppointments(request, env);
        case '/api/stylers':
          return await handleStylers(request, env);
        case '/api/health':
          return new Response(JSON.stringify({ status: 'ok' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        default:
          return new Response(JSON.stringify({ error: 'Not Found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
      }
    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

async function handleAppointments(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    const appointments = await env.DB.prepare('SELECT * FROM appointments LIMIT 100').all();
    return new Response(JSON.stringify(appointments), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}

async function handleStylers(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    const stylers = await env.DB.prepare('SELECT * FROM stylers LIMIT 100').all();
    return new Response(JSON.stringify(stylers), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}
