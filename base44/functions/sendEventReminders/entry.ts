import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const timestamp = new Date().toISOString();
    const today = timestamp.split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const allEvents = await base44.asServiceRole.entities.PersonalEvent.filter({});
    const results = [];
    let totalProcessed = 0;
    let successCount = 0;
    let failureCount = 0;

    for (const ev of allEvents) {
      let countedAsProcessed = false;
      console.log(`Processing event ${ev.id}: ${ev.title || 'Untitled event'}`);

      try {
        const notifications = [];
        const title = escapeHtml(ev.title);
        const description = escapeHtml(ev.description);
        const eventDate = escapeHtml(ev.event_date);

        if (ev.notify_day_before && !ev.notified_day_before && ev.event_date === tomorrow) {
          notifications.push({
            type: 'day_before',
            subject: `⏰ Reminder: "${ev.title}" is TOMORROW!`,
            body: `<h2>📅 Event Reminder</h2><p>Hi! Just a friendly reminder that <strong>${title}</strong> is <strong>tomorrow</strong> (${eventDate}).</p>${ev.description ? `<p><strong>Details:</strong> ${description}</p>` : ''}<p>Don't forget to prepare! 😊</p>`,
          });
        }

        if (ev.notify_day_of && !ev.notified_day_of && ev.event_date === today) {
          notifications.push({
            type: 'day_of',
            subject: `🎉 Today: "${ev.title}" is happening!`,
            body: `<h2>📅 Event Today!</h2><p>Hi! <strong>${title}</strong> is <strong>today</strong>!</p>${ev.description ? `<p><strong>Details:</strong> ${description}</p>` : ''}<p>Have a wonderful time! 🎉</p>`,
          });
        }

        if (notifications.length === 0) {
          results.push({ eventId: ev.id, status: 'skipped', reason: 'No reminder due' });
          continue;
        }

        totalProcessed += 1;
        countedAsProcessed = true;
        const sentTypes = [];

        for (const notification of notifications) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: ev.user_email,
            subject: notification.subject,
            body: notification.body,
          });

          const update = notification.type === 'day_before'
            ? { notified_day_before: true }
            : { notified_day_of: true };
          await base44.asServiceRole.entities.PersonalEvent.update(ev.id, update);
          sentTypes.push(notification.type);
        }

        successCount += 1;
        results.push({ eventId: ev.id, status: 'success', notificationTypes: sentTypes });
        console.log(`Completed event ${ev.id}: ${sentTypes.join(', ')}`);
      } catch (error) {
        if (!countedAsProcessed) totalProcessed += 1;
        failureCount += 1;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Failed event ${ev.id}: ${message}`);
        results.push({ eventId: ev.id, status: 'failed', error: message });
      }
    }

    return Response.json({
      timestamp,
      totalScanned: allEvents.length,
      totalProcessed,
      successCount,
      failureCount,
      results,
    }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`sendEventReminders batch failure: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}