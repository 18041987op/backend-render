import cron from 'node-cron';
import supabase, { shopId } from '../config/supabase.js';

const DUE_SOON_HOURS_BEFORE = 24;
const ADMIN_ESCALATION_DAYS_OVERDUE = 2;
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 9 * * *';
const SCHEDULER_TIMEZONE = process.env.SCHEDULER_TIMEZONE || 'America/Mexico_City';

const checkLoanNotifications = async () => {
  const now = new Date();
  console.log(`[${now.toISOString()}] Running loan notification check...`);

  try {
    // Get all active loans with tool and technician info
    const { data: activeLoans, error: loansErr } = await supabase
      .from('tool_loans')
      .select('id, tool_id, technician_id, expected_return, due_soon_notified, overdue_notified, admin_notified')
      .eq('shop_id', shopId)
      .eq('status', 'active');

    if (loansErr) throw loansErr;

    console.log(`[Scheduler] Found ${activeLoans.length} active loans to check.`);

    // Get admin user IDs
    const { data: admins } = await supabase
      .from('tools_users')
      .select('id')
      .eq('shop_id', shopId)
      .eq('role', 'admin')
      .eq('is_active', true);

    const adminIds = (admins || []).map(a => a.id);

    // Pre-fetch tool and technician names
    const toolIds = [...new Set(activeLoans.map(l => l.tool_id))];
    const techIds = [...new Set(activeLoans.map(l => l.technician_id))];

    const { data: tools } = await supabase.from('tools').select('id, name').in('id', toolIds);
    const { data: techs } = await supabase.from('tools_users').select('id, name').in('id', techIds);

    const toolMap = Object.fromEntries((tools || []).map(t => [t.id, t.name]));
    const techMap = Object.fromEntries((techs || []).map(t => [t.id, t.name]));

    for (const loan of activeLoans) {
      const toolName = toolMap[loan.tool_id] || 'Unknown Tool';
      const techName = techMap[loan.technician_id] || 'Unknown';
      const expectedReturn = new Date(loan.expected_return);

      // Check 1: Overdue notification (for technician)
      if (expectedReturn < now && !loan.overdue_notified) {
        const message = `ALERTA: La herramienta "${toolName}" está vencida (debía devolverse el ${expectedReturn.toLocaleDateString()}). Por favor devuélvala.`;
        await supabase.from('tool_notifications').insert({
          shop_id: shopId,
          recipient_id: loan.technician_id,
          message,
          type: 'error',
          related_model: 'Loan',
          related_id: loan.id,
        });
        await supabase.from('tool_loans').update({ overdue_notified: true }).eq('id', loan.id);
        console.log(`[Scheduler] OVERDUE: Loan ${loan.id} for "${toolName}"`);
      }

      // Check 2: Due soon notification (for technician)
      else if (expectedReturn > now && !loan.due_soon_notified) {
        const threshold = new Date(now.getTime() + DUE_SOON_HOURS_BEFORE * 60 * 60 * 1000);
        if (expectedReturn < threshold) {
          const message = `RECORDATORIO: La herramienta "${toolName}" debe devolverse el ${expectedReturn.toLocaleDateString()} a las ${expectedReturn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
          await supabase.from('tool_notifications').insert({
            shop_id: shopId,
            recipient_id: loan.technician_id,
            message,
            type: 'info',
            related_model: 'Loan',
            related_id: loan.id,
          });
          await supabase.from('tool_loans').update({ due_soon_notified: true }).eq('id', loan.id);
          console.log(`[Scheduler] DUE SOON: Loan ${loan.id} for "${toolName}"`);
        }
      }

      // Check 3: Admin escalation
      if (expectedReturn < now && !loan.admin_notified) {
        const escalationThreshold = new Date(now.getTime() - ADMIN_ESCALATION_DAYS_OVERDUE * 24 * 60 * 60 * 1000);
        if (expectedReturn < escalationThreshold) {
          for (const adminId of adminIds) {
            const message = `ESCALACIÓN: Préstamo de "${toolName}" al técnico "${techName}" lleva ${ADMIN_ESCALATION_DAYS_OVERDUE}+ días vencido (vencía ${expectedReturn.toLocaleDateString()}).`;
            await supabase.from('tool_notifications').insert({
              shop_id: shopId,
              recipient_id: adminId,
              message,
              type: 'warning',
              related_model: 'Loan',
              related_id: loan.id,
            });
          }
          await supabase.from('tool_loans').update({ admin_notified: true }).eq('id', loan.id);
          console.log(`[Scheduler] ESCALATION: Loan ${loan.id} for "${toolName}" to ${techName}`);
        }
      }
    }
  } catch (error) {
    console.error('[Scheduler] Critical error:', error);
  } finally {
    console.log(`[${new Date().toISOString()}] Notification check finished.`);
  }
};

// Schedule the task
if (cron.validate(CRON_SCHEDULE)) {
  console.log(`[Scheduler] Tarea programada: "${CRON_SCHEDULE}" (timezone: ${SCHEDULER_TIMEZONE})`);
  cron.schedule(CRON_SCHEDULE, checkLoanNotifications, {
    scheduled: true,
    timezone: SCHEDULER_TIMEZONE,
  });
} else {
  console.error(`[Scheduler] Error: expresión cron inválida "${CRON_SCHEDULE}".`);
}

export { checkLoanNotifications };
