import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    // Get all events
    const allEvents = await base44.asServiceRole.entities.PersonalEvent.filter({});
    let sent = 0;

    for (const ev of allEvents) {
      const notifications = [];

      // Day-before reminder
      if (ev.notify_day_before && !ev.notified_day_before && ev.event_date === tomorrow) {
        notifications.push({
          type: "day_before",
          subject: `⏰ Reminder: "${ev.title}" is TOMORROW!`,
          body: `<h2>📅 Event Reminder</h2>
            <p>Hi! Just a friendly reminder that <strong>${ev.title}</strong> is <strong>tomorrow</strong> (${ev.event_date}).</p>
            ${ev.description ? `<p><strong>Details:</strong> ${ev.description}</p>` : ""}
            <p>Don't forget to prepare! 😊</p>`,
        });
      }

      // Day-of reminder
      if (ev.notify_day_of && !ev.notified_day_of && ev.event_date === today) {
        notifications.push({
          type: "day_of",
          subject: `🎉 Today: "${ev.title}" is happening!`,
          body: `<h2>📅 Event Today!</h2>
            <p>Hi! <strong>${ev.title}</strong> is <strong>today</strong>!</p>
            ${ev.description ? `<p><strong>Details:</strong> ${ev.description}</p>` : ""}
            <p>Have a wonderful time! 🎉</p>`,
        });
      }

      for (const notif of notifications) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: ev.user_email,
          subject: notif.subject,
          body: notif.body,
        });

        const update = {};
        if (notif.type === "day_before") update.notified_day_before = true;
        if (notif.type === "day_of") update.notified_day_of = true;
        await base44.asServiceRole.entities.PersonalEvent.update(ev.id, update);
        sent++;
      }
    }

    return Response.json({ success: true, notifications_sent: sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});