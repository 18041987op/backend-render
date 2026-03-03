// backend/jobs/notificationScheduler.js
import cron from 'node-cron';
import Loan from '../models/Loan.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js'; // Necesario para notificar a admins

// --- Configuración ---
// CRON_SCHEDULE: expresión cron que controla con qué frecuencia se ejecutan las verificaciones.
//   Producción recomendada → '0 9 * * *'  (diariamente a las 9 AM)
//   Desarrollo / pruebas   → '*/10 * * * *' (cada 10 minutos)
// Define CRON_SCHEDULE y SCHEDULER_TIMEZONE en tu .env para sobrescribir los valores por defecto.
const DUE_SOON_HOURS_BEFORE       = 24; // Notificar 24 h antes del vencimiento
const ADMIN_ESCALATION_DAYS_OVERDUE = 2; // Escalar a admin si lleva 2+ días de retraso
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 9 * * *';
const SCHEDULER_TIMEZONE = process.env.SCHEDULER_TIMEZONE || 'America/Mexico_City';

// --- Main Scheduler Function ---
const checkLoanNotifications = async () => {
  const now = new Date();
  console.log(`[${now.toISOString()}] Running loan notification check...`);

  try {
    // 1. Find all active loans and populate necessary details
    const activeLoans = await Loan.find({ status: 'active' })
      .populate('technician', '_id name email')
      .populate('tool', '_id name');

    console.log(`[Scheduler] Found ${activeLoans.length} active loans to check.`);

    // Find all admin users ONCE to avoid multiple DB calls inside loop
    let adminUsers = [];
    try {
        adminUsers = await User.find({ role: 'admin', isActive: true }).select('_id'); // Get only IDs of active admins
        console.log(`[Scheduler] Found ${adminUsers.length} active admin user(s) for potential escalation notifications.`);
    } catch(adminErr) {
        console.error("[Scheduler] Error fetching admin users:", adminErr);
        // Continue without admin notifications if fetching fails
    }


    // Process each loan individually
    // We use a standard loop here for clarity, could use Promise.all for slight parallelization
    for (const loan of activeLoans) {
      // Skip if essential data is missing
      if (!loan.tool || !loan.technician) {
        console.warn(`[Scheduler] Skipping loan ${loan._id} due to missing populated tool or technician data.`);
        continue; // Go to the next loan
      }

      const technicianId = loan.technician._id;
      const toolName = loan.tool.name;
      const loanId = loan._id;
      const expectedReturnDate = loan.expectedReturn;

      // --- Check 1: Overdue Notification (for Technician) ---
      if (expectedReturnDate < now && !loan.overdueNotified) {
        console.log(`[Scheduler] OVERDUE: Loan ${loanId} for "${toolName}". Notifying technician ${technicianId}.`);
        const message = `ALERT: The tool "${toolName}" is overdue (was due on ${expectedReturnDate.toLocaleDateString()}). Please return it promptly.`;
        try {
          await Notification.create({
            recipient: technicianId, title: 'Loan Overdue', message: message, type: 'error', relatedTo: { model: 'Loan', id: loanId }
          });
          await Loan.findByIdAndUpdate(loanId, { overdueNotified: true });
          console.log(`[Scheduler] Overdue notification created and loan ${loanId} marked.`);
        } catch (err) {
          console.error(`[Scheduler] Failed processing overdue notification for loan ${loanId}:`, err);
        }
      }

      // --- Check 2: Due Soon Notification (for Technician) ---
      else if (expectedReturnDate > now && !loan.dueSoonNotified) { // Only check if not already overdue
        const dueSoonThreshold = new Date(now.getTime() + DUE_SOON_HOURS_BEFORE * 60 * 60 * 1000);
        if (expectedReturnDate < dueSoonThreshold) {
          console.log(`[Scheduler] DUE SOON: Loan ${loanId} for "${toolName}". Notifying technician ${technicianId}.`);
          const message = `REMINDER: The tool "${toolName}" is due on ${expectedReturnDate.toLocaleDateString()} at ${expectedReturnDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
          try {
            await Notification.create({
              recipient: technicianId, title: 'Loan Due Soon', message: message, type: 'info', relatedTo: { model: 'Loan', id: loanId }
            });
            await Loan.findByIdAndUpdate(loanId, { dueSoonNotified: true });
            console.log(`[Scheduler] Due soon notification created and loan ${loanId} marked.`);
          } catch (err) {
            console.error(`[Scheduler] Failed processing due soon notification for loan ${loanId}:`, err);
          }
        }
      }

      // --- Check 3: Overdue Escalation (for Admins) ---
      // This check is independent of the technician notification, but only runs if overdue
      if (expectedReturnDate < now && !loan.adminNotified) {
        const escalationThreshold = new Date(now.getTime() - ADMIN_ESCALATION_DAYS_OVERDUE * 24 * 60 * 60 * 1000);
        if (expectedReturnDate < escalationThreshold) {
          console.log(`[Scheduler] ESCALATION: Loan ${loanId} for "${toolName}" to tech ${loan.technician.name} is overdue by ${ADMIN_ESCALATION_DAYS_OVERDUE}+ days. Notifying admins.`);

          // Create notification promises for all admins
          const adminNotificationPromises = adminUsers.map(admin => {
            const message = `ESCALATION: Loan for "${toolName}" to technician "${loan.technician.name}" is overdue by ${ADMIN_ESCALATION_DAYS_OVERDUE}+ days (due ${expectedReturnDate.toLocaleDateString()}).`;
            return Notification.create({
              recipient: admin._id, title: 'Overdue Loan Escalation', message: message, type: 'warning', relatedTo: { model: 'Loan', id: loanId }
            }).catch(err => { // Catch errors per-admin notification
                 console.error(`[Scheduler] Failed creating escalation notification for admin ${admin._id} regarding loan ${loanId}:`, err);
             });
          });

          try {
              // Wait for all admin notifications for THIS loan to be processed
              await Promise.all(adminNotificationPromises);
              // Only mark the loan if notifications were attempted (even if some failed)
              await Loan.findByIdAndUpdate(loanId, { adminNotified: true });
              console.log(`[Scheduler] Admin escalation notifications sent/attempted and loan ${loanId} marked.`);
          } catch (err) {
              // This catch is mainly for the findByIdAndUpdate error
              console.error(`[Scheduler] Failed marking admin notified for loan ${loanId}:`, err);
          }
        }
      }
    } // End of loan loop

  } catch (error) {
    console.error('[Scheduler] Critical error during notification check run:', error);
  } finally {
      console.log(`[${new Date().toISOString()}] Notification check run finished.`);
  }
};

// --- Programar la tarea ---
if (cron.validate(CRON_SCHEDULE)) {
  console.log(`[Scheduler] Tarea programada → "${CRON_SCHEDULE}" (timezone: ${SCHEDULER_TIMEZONE})`);
  cron.schedule(CRON_SCHEDULE, checkLoanNotifications, {
    scheduled: true,
    timezone: SCHEDULER_TIMEZONE,
  });
} else {
  console.error(`[Scheduler] Error: expresión cron inválida "${CRON_SCHEDULE}". Tarea no programada.`);
}

// Export the main function if needed elsewhere (e.g., for manual trigger script)
export { checkLoanNotifications };