import crypto from 'crypto';

export async function handleLineWebhook(request: Request, env: any, db: any) {
  const channelSecret = env.LINE_CHANNEL_SECRET || '';
  const channelAccessToken = env.LINE_CHANNEL_ACCESS_TOKEN || '';

  // LINE signature verification
  const signature = request.headers.get('X-Line-Signature') || '';
  const body = await request.text();

  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(body)
    .digest('base64');

  if (signature !== hash) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const events = JSON.parse(body).events || [];

  for (const event of events) {
    const lineUserId = event.source?.userId;
    const replyToken = event.replyToken;

    // Handle follow event
    if (event.type === 'follow') {
      await sendLineMessage(lineUserId, replyToken, channelAccessToken, {
        type: 'text',
        text: 'A10サロンへようこそ！予約や施術内容など、お気軽にお問い合わせください。'
      });
      
      // Create or update line_users entry
      await db.prepare(
        `INSERT INTO line_users (id, line_user_id, created_at, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT(line_user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`
      ).bind(`line_${lineUserId}`, lineUserId).run();
    }

    // Handle message event
    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text;

      if (text === '予約' || text === 'reservation') {
        // Start booking flow - show menu selection
        const { results: menus } = await db.prepare(
          'SELECT * FROM menus WHERE is_active = 1 ORDER BY display_order'
        ).all() as any;

        const buttons = menus?.map((menu: any) => ({
          type: 'button',
          style: 'link',
          height: 'sm',
          action: {
            type: 'postback',
            label: `${menu.name} ¥${menu.price}`,
            data: `action=select_menu&menu_id=${menu.id}&menu_name=${menu.name}`
          }
        })) || [];

        await sendLineMessage(lineUserId, replyToken, channelAccessToken, {
          type: 'template',
          altText: 'メニューを選択してください',
          template: {
            type: 'buttons',
            text: 'ご希望のメニューを選択してください',
            actions: buttons.slice(0, 4) // LINE limit: 4 buttons max
          }
        });

        // Reset booking session
        await db.prepare(
          `DELETE FROM booking_sessions WHERE line_user_id = ?`
        ).bind(lineUserId).run();
      } else {
        // Echo message for other texts
        await sendLineMessage(lineUserId, replyToken, channelAccessToken, {
          type: 'text',
          text: `ご返信ありがとうございます。\n\n「予約」とメッセージしていただければ、予約フローをお始めできます。`
        });
      }
    }

    // Handle postback event (button clicks)
    if (event.type === 'postback') {
      const data = new URLSearchParams(event.postback.data);
      const action = data.get('action');

      if (action === 'select_menu') {
        const menuId = data.get('menu_id');
        const menuName = data.get('menu_name');

        // Save booking session
        await db.prepare(
          `INSERT OR REPLACE INTO booking_sessions 
           (id, line_user_id, step, menu_id, menu_name, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        ).bind(
          `session_${lineUserId}`,
          lineUserId,
          'menu_selected',
          menuId,
          menuName
        ).run();

        // Show stylist selection
        const { results: stylists } = await db.prepare(
          'SELECT * FROM stylists WHERE is_active = 1 ORDER BY name'
        ).all() as any;

        const buttons = [
          {
            type: 'button',
            style: 'link',
            height: 'sm',
            action: {
              type: 'postback',
              label: '指名なし',
              data: `action=select_stylist&stylist_id=free&stylist_name=フリー`
            }
          },
          ...(stylists?.map((stylist: any) => ({
            type: 'button',
            style: 'link',
            height: 'sm',
            action: {
              type: 'postback',
              label: stylist.name,
              data: `action=select_stylist&stylist_id=${stylist.id}&stylist_name=${stylist.name}`
            }
          })) || [])
        ];

        await sendLineMessage(lineUserId, replyToken, channelAccessToken, {
          type: 'template',
          altText: 'スタイリストを選択してください',
          template: {
            type: 'buttons',
            text: 'ご指名するスタイリストを選択してください',
            actions: buttons.slice(0, 4)
          }
        });
      }

      if (action === 'select_stylist') {
        const stylistId = data.get('stylist_id');
        const stylistName = data.get('stylist_name');

        // Update booking session
        await db.prepare(
          `UPDATE booking_sessions SET step = ?, stylist_id = ?, stylist_name = ?, updated_at = CURRENT_TIMESTAMP
           WHERE line_user_id = ?`
        ).bind('stylist_selected', stylistId === 'free' ? null : stylistId, stylistName, lineUserId).run();

        await sendLineMessage(lineUserId, replyToken, channelAccessToken, {
          type: 'text',
          text: '予約日時を入力してください（例：2026-09-20 14:00）'
        });
      }

      if (action === 'confirm_booking') {
        // Get booking session
        const { results } = await db.prepare(
          `SELECT * FROM booking_sessions WHERE line_user_id = ?`
        ).bind(lineUserId).all() as any;

        const session = results?.[0];

        if (session) {
          // Create appointment in database
          const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Get or create customer
          const customerId = `cust_${lineUserId}`;
          await db.prepare(
            `INSERT OR IGNORE INTO customers (id, salon_id, name, phone, created_at, updated_at)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
          ).bind(customerId, 'salon_1', 'LINE Customer', lineUserId).run();

          // Create appointment
          await db.prepare(
            `INSERT INTO appointments (id, salon_id, stylist_id, customer_id, menu_id, start_time, end_time, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
          ).bind(
            appointmentId,
            'salon_1',
            session.stylist_id || 'free',
            customerId,
            session.menu_id,
            session.datetime,
            new Date(new Date(session.datetime).getTime() + 60 * 60000).toISOString(),
            'confirmed'
          ).run();

          // Clear booking session
          await db.prepare(
            `DELETE FROM booking_sessions WHERE line_user_id = ?`
          ).bind(lineUserId).run();

          await sendLineMessage(lineUserId, replyToken, channelAccessToken, {
            type: 'text',
            text: `予約が確定しました！\n\nメニュー: ${session.menu_name}\nスタイリスト: ${session.stylist_name}\n日時: ${session.datetime}\n\nご利用ありがとうございます。`
          });
        }
      }
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function sendLineMessage(userId: string, replyToken: string, channelAccessToken: string, message: any) {
  try {
    await fetch('https://api.line.biz/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify({
        replyToken,
        messages: [message]
      })
    });
  } catch (error) {
    console.error('Failed to send LINE message:', error);
  }
}
