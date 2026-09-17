import { Router, IRequest } from 'itty-router';
import { WorkerEnv } from './types';

interface AppRequest extends IRequest {
  params: Record<string, string>;
}

const router = Router<AppRequest & { Bindings: WorkerEnv }>();

// Health check endpoint
router.get('/api/health', () => ({
  status: 'ok',
  timestamp: new Date().toISOString()
}));

// ============================================
// APPOINTMENTS ENDPOINTS
// ============================================

// GET /api/appointments - List all appointments
router.get('/api/appointments', async (request, env) => {
  const { searchParams } = new URL(request.url);
  const stylistId = searchParams.get('stylist_id');
  const date = searchParams.get('date');

  try {
    let query = 'SELECT * FROM appointments WHERE 1=1';
    const params: any[] = [];

    if (stylistId) {
      query += ' AND stylist_id = ?';
      params.push(stylistId);
    }

    if (date) {
      query += ' AND DATE(start_time) = ?';
      params.push(date);
    }

    query += ' ORDER BY start_time ASC';

    const result = await env.DB.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// POST /api/appointments - Create new appointment
router.post('/api/appointments', async (request, env) => {
  try {
    const data = await (request as any).json();
    const id = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO appointments (
        id, salon_id, stylist_id, customer_id, menu_id,
        start_time, end_time, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.salon_id,
      data.stylist_id,
      data.customer_id,
      data.menu_id,
      data.start_time,
      data.end_time,
      data.status || 'confirmed',
      data.notes || null
    ).run();

    return new Response(JSON.stringify({ id, ...data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// PUT /api/appointments/:id - Update appointment
router.put('/api/appointments/:id', async (request, env) => {
  try {
    const { id } = (request as any).params;
    const data = await (request as any).json();

    await env.DB.prepare(`
      UPDATE appointments
      SET start_time = ?, end_time = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      data.start_time,
      data.end_time,
      data.status,
      data.notes,
      id
    ).run();

    return new Response(JSON.stringify({ id, ...data }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// DELETE /api/appointments/:id - Delete appointment
router.delete('/api/appointments/:id', async (request, env) => {
  try {
    const { id } = (request as any).params;

    await env.DB.prepare('DELETE FROM appointments WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// ============================================
// STYLISTS ENDPOINTS
// ============================================

// GET /api/stylists - List all stylists
router.get('/api/stylists', async (request, env) => {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get('salon_id');

  try {
    let query = 'SELECT * FROM stylists WHERE 1=1';
    const params: any[] = [];

    if (salonId) {
      query += ' AND salon_id = ?';
      params.push(salonId);
    }

    const result = await env.DB.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// POST /api/stylists - Create new stylist
router.post('/api/stylists', async (request, env) => {
  try {
    const data = await (request as any).json();
    const id = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO stylists (id, salon_id, name, email, phone, bio, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.salon_id,
      data.name,
      data.email || null,
      data.phone || null,
      data.bio || null,
      data.avatar_url || null
    ).run();

    return new Response(JSON.stringify({ id, ...data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// ============================================
// MENUS ENDPOINTS
// ============================================

// GET /api/menus - List all menus
router.get('/api/menus', async (request, env) => {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get('salon_id');

  try {
    let query = 'SELECT * FROM menus WHERE is_active = 1';
    const params: any[] = [];

    if (salonId) {
      query += ' AND salon_id = ?';
      params.push(salonId);
    }

    query += ' ORDER BY display_order ASC';

    const result = await env.DB.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// ============================================
// MESSAGES ENDPOINTS
// ============================================

// GET /api/messages - List messages
router.get('/api/messages', async (request, env) => {
  const { searchParams } = new URL(request.url);
  const recipientId = searchParams.get('recipient_id');
  const appointmentId = searchParams.get('appointment_id');

  try {
    let query = 'SELECT * FROM messages WHERE 1=1';
    const params: any[] = [];

    if (recipientId) {
      query += ' AND recipient_id = ?';
      params.push(recipientId);
    }

    if (appointmentId) {
      query += ' AND appointment_id = ?';
      params.push(appointmentId);
    }

    query += ' ORDER BY created_at DESC';

    const result = await env.DB.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// POST /api/messages - Send message
router.post('/api/messages', async (request, env) => {
  try {
    const data = await (request as any).json();
    const id = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO messages (
        id, salon_id, sender_id, recipient_id, appointment_id, content
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.salon_id,
      data.sender_id,
      data.recipient_id,
      data.appointment_id || null,
      data.content
    ).run();

    return new Response(JSON.stringify({ id, ...data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// ============================================
// CHARTS/KARTES ENDPOINTS
// ============================================

// GET /api/charts/:customerId - Get customer charts
router.get('/api/charts/:customerId', async (request, env) => {
  try {
    const { customerId } = (request as any).params;

    const result = await env.DB.prepare(`
      SELECT c.*, cp.id as photo_id, cp.photo_url, cp.caption, cp.display_order
      FROM charts c
      LEFT JOIN chart_photos cp ON c.id = cp.chart_id
      WHERE c.customer_id = ?
      ORDER BY c.created_at DESC, cp.display_order ASC
    `).bind(customerId).all();

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// POST /api/charts - Create new chart
router.post('/api/charts', async (request, env) => {
  try {
    const data = await (request as any).json();
    const id = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO charts (
        id, salon_id, customer_id, stylist_id, appointment_id, shared_notes, private_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.salon_id,
      data.customer_id,
      data.stylist_id,
      data.appointment_id || null,
      data.shared_notes || null,
      data.private_notes || null
    ).run();

    return new Response(JSON.stringify({ id, ...data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// 404 handler
router.all('*', () => {
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
});

export default {
  fetch: (request: Request, env: WorkerEnv) => router.handle(request, env)
} as ExportedHandler<WorkerEnv>;
