import { WorkerEnv } from './types';

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

      // Update appointment (move to different stylist/time)
      if (url.pathname.match(/^\/api\/appointments\/[^/]+$/) && request.method === "PUT") {
        const id = url.pathname.split('/').pop();
        const body = await request.json() as any;
        const { stylist_id, start_time } = body;

        if (!start_time) {
          return new Response(JSON.stringify({
            error: "Missing required field: start_time"
          }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        const updates = [];
        const bindings = [];
        updates.push("start_time = ?");
        bindings.push(start_time);

        if (stylist_id) {
          updates.push("stylist_id = ?");
          bindings.push(stylist_id);
        }

        bindings.push(id);

        const { success } = await db.prepare(
          `UPDATE appointments SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(...bindings).run() as any;

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            message: "Appointment updated"
          }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
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

      // ================= STYLISTS =================
      // Create stylist
      if (url.pathname === '/api/stylists' && request.method === 'POST') {
        const body = await request.json() as any;
        const { salon_id, name, email, phone, bio, avatar_url } = body;
        const id = `stylist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const { success } = await db.prepare(
          `INSERT INTO stylists (id, salon_id, name, email, phone, bio, avatar_url, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        ).bind(id, salon_id, name, email || null, phone || null, bio || null, avatar_url || null).run() as any;

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            id,
            message: 'Stylist created'
          }), {
            status: 201,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // Update stylist
      if (url.pathname.match(/^\/api\/stylists\/[^/]+$/) && request.method === 'PUT') {
        const id = url.pathname.split('/').pop();
        const body = await request.json() as any;
        const { name, email, phone, bio, avatar_url, is_active } = body;

        const updates = [];
        const bindings = [];
        if (name !== undefined) { updates.push('name = ?'); bindings.push(name); }
        if (email !== undefined) { updates.push('email = ?'); bindings.push(email); }
        if (phone !== undefined) { updates.push('phone = ?'); bindings.push(phone); }
        if (bio !== undefined) { updates.push('bio = ?'); bindings.push(bio); }
        if (avatar_url !== undefined) { updates.push('avatar_url = ?'); bindings.push(avatar_url); }
        if (is_active !== undefined) { updates.push('is_active = ?'); bindings.push(is_active ? 1 : 0); }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        bindings.push(id);

        const { success } = await db.prepare(
          `UPDATE stylists SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...bindings).run() as any;

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Stylist updated'
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // Delete stylist
      if (url.pathname.match(/^\/api\/stylists\/[^/]+$/) && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        const { success } = await db.prepare(
          'UPDATE stylists SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(id).run() as any;

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Stylist deleted'
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // ================= MENUS =================
      // Create menu
      if (url.pathname === '/api/menus' && request.method === 'POST') {
        const body = await request.json() as any;
        const { salon_id, name, duration_minutes, price, color_code, description } = body;
        const id = `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const { success } = await db.prepare(
          `INSERT INTO menus (id, salon_id, name, duration_minutes, price, color_code, description, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        ).bind(id, salon_id, name, duration_minutes, price, color_code || null, description || null).run() as any;

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            id,
            message: 'Menu created'
          }), {
            status: 201,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // Update menu
      if (url.pathname.match(/^\/api\/menus\/[^/]+$/) && request.method === 'PUT') {
        const id = url.pathname.split('/').pop();
        const body = await request.json() as any;
        const { name, duration_minutes, price, color_code, description, is_active, display_order } = body;

        const updates = [];
        const bindings = [];
        if (name !== undefined) { updates.push('name = ?'); bindings.push(name); }
        if (duration_minutes !== undefined) { updates.push('duration_minutes = ?'); bindings.push(duration_minutes); }
        if (price !== undefined) { updates.push('price = ?'); bindings.push(price); }
        if (color_code !== undefined) { updates.push('color_code = ?'); bindings.push(color_code); }
        if (description !== undefined) { updates.push('description = ?'); bindings.push(description); }
        if (is_active !== undefined) { updates.push('is_active = ?'); bindings.push(is_active ? 1 : 0); }
        if (display_order !== undefined) { updates.push('display_order = ?'); bindings.push(display_order); }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        bindings.push(id);

        const { success } = await db.prepare(
          `UPDATE menus SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...bindings).run() as any;

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Menu updated'
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // Delete menu
      if (url.pathname.match(/^\/api\/menus\/[^/]+$/) && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        const { success } = await db.prepare(
          'UPDATE menus SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(id).run() as any;

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Menu deleted'
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // ================= WORKING HOURS =================
      // Get working hours for a stylist
      if (url.pathname.match(/^\/api\/working-hours\/[^/]+$/) && request.method === 'GET') {
        const stylist_id = url.pathname.split('/').pop();
        const { results } = await db.prepare(
          'SELECT * FROM working_hours WHERE stylist_id = ? ORDER BY day_of_week'
        ).bind(stylist_id).all() as any;

        return new Response(JSON.stringify({
          results: results || [],
          success: true
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Create working hours
      if (url.pathname === '/api/working-hours' && request.method === 'POST') {
        const body = await request.json() as any;
        const { stylist_id, day_of_week, start_time, end_time } = body;
        const id = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const { success } = await db.prepare(
          `INSERT INTO working_hours (id, stylist_id, day_of_week, start_time, end_time, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        ).bind(id, stylist_id, day_of_week, start_time, end_time).run() as any;

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            id,
            message: 'Working hours created'
          }), {
            status: 201,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // Update working hours
      if (url.pathname.match(/^\/api\/working-hours\/[^/]+$/) && request.method === 'PUT') {
        const id = url.pathname.split('/').pop();
        const body = await request.json() as any;
        const { start_time, end_time, is_active } = body;

        const updates = [];
        const bindings = [];
        if (start_time !== undefined) { updates.push('start_time = ?'); bindings.push(start_time); }
        if (end_time !== undefined) { updates.push('end_time = ?'); bindings.push(end_time); }
        if (is_active !== undefined) { updates.push('is_active = ?'); bindings.push(is_active ? 1 : 0); }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        bindings.push(id);

        const { success } = await db.prepare(
          `UPDATE working_hours SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...bindings).run() as any;

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Working hours updated'
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // Delete working hours
      if (url.pathname.match(/^\/api\/working-hours\/[^/]+$/) && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        const { success } = await db.prepare(
          'DELETE FROM working_hours WHERE id = ?'
        ).bind(id).run() as any;

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Working hours deleted'
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // ================= OFF DAYS =================
      // Get off days for a stylist
      if (url.pathname.match(/^\/api\/off-days\/[^/]+$/) && request.method === 'GET') {
        const stylist_id = url.pathname.split('/').pop();
        const { results } = await db.prepare(
          'SELECT * FROM off_days WHERE stylist_id = ? ORDER BY date DESC'
        ).bind(stylist_id).all() as any;

        return new Response(JSON.stringify({
          results: results || [],
          success: true
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Create off day
      if (url.pathname === '/api/off-days' && request.method === 'POST') {
        const body = await request.json() as any;
        const { stylist_id, date, reason } = body;
        const id = `offd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const { success } = await db.prepare(
          `INSERT INTO off_days (id, stylist_id, date, reason, created_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
        ).bind(id, stylist_id, date, reason || null).run() as any;

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            id,
            message: 'Off day created'
          }), {
            status: 201,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // Delete off day
      if (url.pathname.match(/^\/api\/off-days\/[^/]+$/) && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        const { success } = await db.prepare(
          'DELETE FROM off_days WHERE id = ?'
        ).bind(id).run() as any;

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Off day deleted'
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // ================= SALON SETTINGS =================
      // Get salon settings
      if (url.pathname === '/api/salon/settings' && request.method === 'GET') {
        const { results } = await db.prepare(
          'SELECT * FROM salons LIMIT 1'
        ).all() as any;

        return new Response(JSON.stringify({
          result: results?.[0] || null,
          success: true
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Update salon settings
      if (url.pathname === '/api/salon/settings' && request.method === 'PUT') {
        const body = await request.json() as any;
        const { id, name, email, phone, address } = body;

        if (!id) {
          return new Response(JSON.stringify({
            error: 'Missing salon id'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const updates = [];
        const bindings = [];
        if (name !== undefined) { updates.push('name = ?'); bindings.push(name); }
        if (email !== undefined) { updates.push('email = ?'); bindings.push(email); }
        if (phone !== undefined) { updates.push('phone = ?'); bindings.push(phone); }
        if (address !== undefined) { updates.push('address = ?'); bindings.push(address); }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        bindings.push(id);

        const { success } = await db.prepare(
          `UPDATE salons SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...bindings).run() as any;

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Salon settings updated'
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }


      // ================= MENU SETS =================
      // Get all menu sets
      if (url.pathname === '/api/menu-sets' && request.method === 'GET') {
        const salonId = new URL(request.url).searchParams.get('salon_id') || 'salon_001';
        const { results } = await db.prepare(
          'SELECT * FROM menu_sets WHERE salon_id = ? AND is_active = 1 ORDER BY display_order'
        ).bind(salonId).all() as any;

        return new Response(JSON.stringify({
          results: results || [],
          success: true,
          count: results?.length || 0
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Create menu set
      if (url.pathname === '/api/menu-sets' && request.method === 'POST') {
        const body = await request.json() as any;
        const { salon_id, name, total_price, total_duration_minutes, color_code, description, menu_ids } = body;

        if (!name || !total_price || total_duration_minutes === undefined) {
          return new Response(JSON.stringify({
            error: 'Missing required fields: name, total_price, total_duration_minutes'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const id = `menu_set_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const { success } = await db.prepare(
          `INSERT INTO menu_sets (id, salon_id, name, total_price, total_duration_minutes, color_code, description, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        ).bind(id, salon_id, name, total_price, total_duration_minutes, color_code || '#ff6b9d', description || '').run() as any;

        if (!success) throw new Error('Failed to create menu set');

        if (menu_ids && Array.isArray(menu_ids)) {
          for (let i = 0; i < menu_ids.length; i++) {
            const item_id = `menu_set_item_${Date.now()}_${i}`;
            await db.prepare(
              `INSERT INTO menu_set_items (id, menu_set_id, menu_id, display_order, created_at)
               VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
            ).bind(item_id, id, menu_ids[i], i).run();
          }
        }

        return new Response(JSON.stringify({
          success: true,
          id,
          message: 'Menu set created'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Update menu set
      if (url.pathname.match(/^\/api\/menu-sets\/[^/]+$/) && request.method === 'PUT') {
        const id = url.pathname.split('/').pop();
        const body = await request.json() as any;
        const { name, total_price, total_duration_minutes, color_code, description, menu_ids } = body;

        const updates = [];
        const bindings = [];
        if (name !== undefined) { updates.push('name = ?'); bindings.push(name); }
        if (total_price !== undefined) { updates.push('total_price = ?'); bindings.push(total_price); }
        if (total_duration_minutes !== undefined) { updates.push('total_duration_minutes = ?'); bindings.push(total_duration_minutes); }
        if (color_code !== undefined) { updates.push('color_code = ?'); bindings.push(color_code); }
        if (description !== undefined) { updates.push('description = ?'); bindings.push(description); }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        bindings.push(id);

        const { success } = await db.prepare(
          `UPDATE menu_sets SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...bindings).run() as any;

        if (success && menu_ids && Array.isArray(menu_ids)) {
          await db.prepare('DELETE FROM menu_set_items WHERE menu_set_id = ?').bind(id).run();
          for (let i = 0; i < menu_ids.length; i++) {
            const item_id = `menu_set_item_${Date.now()}_${i}`;
            await db.prepare(
              `INSERT INTO menu_set_items (id, menu_set_id, menu_id, display_order, created_at)
               VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
            ).bind(item_id, id, menu_ids[i], i).run();
          }
        }

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Menu set updated'
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // Delete menu set
      if (url.pathname.match(/^\/api\/menu-sets\/[^/]+$/) && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();

        const { success } = await db.prepare(
          'UPDATE menu_sets SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(id).run() as any;

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Menu set deleted'
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // ================= PRIVATE TIME =================
      // Get private time blocks
      if (url.pathname === '/api/private-time' && request.method === 'GET') {
        const stylistId = new URL(request.url).searchParams.get('stylist_id');

        let query = 'SELECT * FROM private_time WHERE is_active = 1';
        let params: any[] = [];

        if (stylistId) {
          query += ' AND stylist_id = ?';
          params.push(stylistId);
        }

        query += ' ORDER BY start_time';

        const { results } = await db.prepare(query).bind(...params).all() as any;

        return new Response(JSON.stringify({
          results: results || [],
          success: true,
          count: results?.length || 0
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Create private time block
      if (url.pathname === '/api/private-time' && request.method === 'POST') {
        const body = await request.json() as any;
        const { stylist_id, start_time, end_time, reason } = body;

        if (!stylist_id || !start_time || !end_time) {
          return new Response(JSON.stringify({
            error: 'Missing required fields: stylist_id, start_time, end_time'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const id = `private_time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const { success } = await db.prepare(
          `INSERT INTO private_time (id, stylist_id, start_time, end_time, reason, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        ).bind(id, stylist_id, start_time, end_time, reason || '').run() as any;

        if (!success) throw new Error('Failed to create private time block');

        return new Response(JSON.stringify({
          success: true,
          id,
          message: 'Private time block created'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Update private time block
      if (url.pathname.match(/^\/api\/private-time\/[^/]+$/) && request.method === 'PUT') {
        const id = url.pathname.split('/').pop();
        const body = await request.json() as any;
        const { start_time, end_time, reason } = body;

        const updates = [];
        const bindings = [];
        if (start_time !== undefined) { updates.push('start_time = ?'); bindings.push(start_time); }
        if (end_time !== undefined) { updates.push('end_time = ?'); bindings.push(end_time); }
        if (reason !== undefined) { updates.push('reason = ?'); bindings.push(reason); }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        bindings.push(id);

        const { success } = await db.prepare(
          `UPDATE private_time SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...bindings).run() as any;

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Private time block updated'
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // Delete private time block
      if (url.pathname.match(/^\/api\/private-time\/[^/]+$/) && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();

        const { success } = await db.prepare(
          'UPDATE private_time SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(id).run() as any;

        if (success) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Private time block deleted'
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
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
