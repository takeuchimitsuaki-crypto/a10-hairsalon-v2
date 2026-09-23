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

      // Get availability for all stylists on a specific date
      if (url.pathname === '/api/availability' && request.method === 'GET') {
        const date = url.searchParams.get('date');
        const menuId = url.searchParams.get('menu_id');

        if (!date || !menuId) {
          return new Response(JSON.stringify({
            error: 'Missing required parameters: date, menu_id'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        try {
          const dateObj = new Date(date);
          const dayOfWeek = dateObj.getDay();
          const dateStr = dateObj.toISOString().split('T')[0];

          // Get menu duration
          const menuRes = await db.prepare(
            'SELECT duration_minutes FROM menus WHERE id = ?'
          ).bind(menuId).first() as any;

          if (!menuRes) {
            return new Response(JSON.stringify({ error: 'Menu not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          const durationMinutes = menuRes.duration_minutes;

          // Get all stylists
          const stylistsRes = await db.prepare(`
            SELECT s.id, s.name
            FROM stylists s
            WHERE s.is_active = 1
            ORDER BY s.name
          `).all() as any;

          const stylists = stylistsRes.results || [];
          const available = [];
          const unavailable = [];

          for (const stylist of stylists) {
            // Check if stylist is off this date
            const offDay = await db.prepare(
              'SELECT id FROM off_days WHERE stylist_id = ? AND date = ?'
            ).bind(stylist.id, dateStr).first() as any;

            if (offDay) {
              unavailable.push({
                stylist_id: stylist.id,
                name: stylist.name,
                reason: 'Off day'
              });
              continue;
            }

            // Get working hours for this day
            const workingHours = await db.prepare(
              'SELECT start_time, end_time FROM working_hours WHERE stylist_id = ? AND day_of_week = ? AND is_active = 1'
            ).bind(stylist.id, dayOfWeek).first() as any;

            if (!workingHours) {
              unavailable.push({
                stylist_id: stylist.id,
                name: stylist.name,
                reason: 'No working hours'
              });
              continue;
            }

            // Get appointments for this stylist on this date
            const appointments = await db.prepare(`
              SELECT start_time, end_time
              FROM appointments
              WHERE stylist_id = ? AND DATE(start_time) = ? AND status = 'confirmed'
              ORDER BY start_time
            `).bind(stylist.id, dateStr).all() as any;

            const appointmentList = (appointments.results || []) as any[];
            const slots = generateAvailableSlots(
              workingHours.start_time,
              workingHours.end_time,
              durationMinutes,
              appointmentList,
              dateStr
            );

            if (slots.length > 0) {
              available.push({
                stylist_id: stylist.id,
                name: stylist.name,
                available_count: slots.length,
                slots
              });
            } else {
              unavailable.push({
                stylist_id: stylist.id,
                name: stylist.name,
                reason: 'No available slots'
              });
            }
          }

          return new Response(JSON.stringify({
            date,
            available,
            unavailable,
            success: true
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (error: any) {
          return new Response(JSON.stringify({
            error: 'Failed to calculate availability',
            message: error.message
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
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
      
      // LINE Webhook
      if (url.pathname === '/api/line/webhook' && request.method === 'POST') {
        const jsonHeaders = { 'Content-Type': 'application/json' };
        const channelSecret = env.LINE_CHANNEL_SECRET;
        if (!channelSecret) {
          console.error('LINE Webhook Error: LINE_CHANNEL_SECRET is not configured');
          return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500, headers: jsonHeaders });
        }

        // 署名検証は必ず生のリクエストボディに対して行う（JSON.parse 後の再シリアライズは不可）
        const rawBody = await request.text();
        const signature = request.headers.get('x-line-signature');
        if (!signature || !(await verifyLineSignature(rawBody, signature, channelSecret))) {
          console.warn('LINE Webhook: invalid signature');
          return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: jsonHeaders });
        }

        let events: any[] = [];
        try {
          events = JSON.parse(rawBody).events || [];
        } catch {
          return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: jsonHeaders });
        }

        const channelAccessToken = env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!channelAccessToken && events.length > 0) {
          console.error('LINE Webhook Error: LINE_CHANNEL_ACCESS_TOKEN is not configured');
        }

        // Webhook検証（events が空）を含め、署名が正しいリクエストには常に 200 を返す。
        // 個々のイベント処理の失敗で 500 を返すと LINE 側で再送・エラー扱いになるため、ログのみ残す。
        for (const event of events) {
          try {
              const lineUserId = event.source?.userId;
              const replyToken = event.replyToken;

              if (!lineUserId || !replyToken || !channelAccessToken) continue;

              if (event.type === 'follow') {
                await sendLineReply(replyToken, channelAccessToken, {
                  type: 'text',
                  text: 'A10サロンへようこそ！「予約」とメッセージしていただければ、予約をお始めできます。'
                });
                const lineUsersId = `line_${lineUserId}`;
                await db.prepare(
                  `INSERT INTO line_users (id, line_user_id, created_at, updated_at)
                   VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                   ON CONFLICT(line_user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`
                ).bind(lineUsersId, lineUserId).run() as any;
              }

              if (event.type === 'message' && event.message?.type === 'text') {
                const text = event.message.text;

                if (text === '予約' || text === 'reservation') {
                  const { results: menus } = await db.prepare(
                    'SELECT * FROM menus WHERE is_active = 1 ORDER BY display_order LIMIT 4'
                  ).all() as any;

                  const actions = menus?.map((m: any) => ({
                    type: 'postback',
                    label: `${m.name} ¥${Math.floor(m.price)}`,
                    data: `action=select_menu&menu_id=${m.id}&menu_name=${encodeURIComponent(m.name)}`
                  })) || [];

                  await sendLineReply(replyToken, channelAccessToken, {
                    type: 'template',
                    altText: 'メニューを選択',
                    template: { type: 'buttons', text: 'ご希望のメニューを選択してください', actions: actions.slice(0, 4) }
                  });
                } else {
                  await sendLineReply(replyToken, channelAccessToken, {
                    type: 'text',
                    text: 'ご返信ありがとうございます。「予約」とメッセージしていただければ、予約フローをお始めできます。'
                  });
                }
              }

              if (event.type === 'postback') {
                const data = new URLSearchParams(event.postback.data);
                const action = data.get('action');

                if (action === 'select_menu') {
                  const menuId = data.get('menu_id');
                  const menuName = decodeURIComponent(data.get('menu_name') || '');
                  const sessionId = `session_${lineUserId}`;
                  await db.prepare(`INSERT OR REPLACE INTO booking_sessions (id, line_user_id, step, menu_id, menu_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(sessionId, lineUserId, 'menu_selected', menuId, menuName).run() as any;

                  const { results: stylists } = await db.prepare('SELECT * FROM stylists WHERE is_active = 1 ORDER BY name LIMIT 3').all() as any;

                  const stylistActions = [
                    { type: 'postback', label: '指名なし', data: 'action=select_stylist&stylist_id=free&stylist_name=フリー' },
                    ...(stylists?.map((s: any) => ({ type: 'postback', label: s.name, data: `action=select_stylist&stylist_id=${s.id}&stylist_name=${encodeURIComponent(s.name)}` })) || [])
                  ];

                  await sendLineReply(replyToken, channelAccessToken, { type: 'template', altText: 'スタイリストを選択', template: { type: 'buttons', text: 'ご指名するスタイリストを選択してください', actions: stylistActions.slice(0, 4) } });
                }

                if (action === 'select_stylist') {
                  const stylistId = data.get('stylist_id');
                  const stylistName = decodeURIComponent(data.get('stylist_name') || '');
                  await db.prepare(`UPDATE booking_sessions SET step = ?, stylist_id = ?, stylist_name = ?, updated_at = CURRENT_TIMESTAMP WHERE line_user_id = ?`).bind('stylist_selected', stylistId === 'free' ? null : stylistId, stylistName, lineUserId).run() as any;

                  await sendLineReply(replyToken, channelAccessToken, { type: 'text', text: '予約日時を入力してください（例：2026-09-20 14:00）' });
                }
              }
          } catch (error: any) {
            console.error('LINE Webhook event error:', event?.type, error?.message);
          }
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
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

// Generate available time slots
function generateAvailableSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  appointments: any[],
  dateStr: string
): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const slotStart = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    const slotEnd = new Date(dateStr);
    slotEnd.setHours(currentHour, currentMin + durationMinutes);
    const slotEndTime = `${String(slotEnd.getHours()).padStart(2, '0')}:${String(slotEnd.getMinutes()).padStart(2, '0')}`;

    // Check if slot overlaps with any appointment
    const isBooked = appointments.some((apt: any) => {
      const aptStart = new Date(apt.start_time);
      const aptEnd = new Date(apt.end_time);
      const currentDateTime = new Date(`${dateStr}T${slotStart}`);
      const currentEndTime = new Date(`${dateStr}T${slotEndTime}`);

      return currentDateTime < aptEnd && currentEndTime > aptStart;
    });

    if (!isBooked) {
      slots.push(slotStart);
    }

    currentMin += 30; // 30-minute intervals
    if (currentMin >= 60) {
      currentMin -= 60;
      currentHour += 1;
    }
  }

  return slots;
}

// LINE Webhook 署名検証: base64(HMAC-SHA256(channelSecret, rawBody)) === x-line-signature
// crypto.subtle.verify で比較するため定数時間比較になる
async function verifyLineSignature(rawBody: string, signature: string, channelSecret: string): Promise<boolean> {
  let signatureBytes: Uint8Array<ArrayBuffer>;
  try {
    signatureBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
  } catch {
    return false;
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(channelSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  return crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(rawBody));
}

// LINE Reply Helper
async function sendLineReply(replyToken: string, channelAccessToken: string, message: any) {
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${channelAccessToken}` },
      body: JSON.stringify({ replyToken, messages: [message] })
    });
    if (!res.ok) {
      console.error('LINE reply API error:', res.status, await res.text());
    }
  } catch (error) {
    console.error('Failed to send LINE message:', error);
  }
}

