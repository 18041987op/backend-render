// backend/jobs/notificationScheduler.js
import cron from 'node-cron';
import Loan from '../models/Loan.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js'; // Needed later for admin notifications

// --- Configuration (Consider moving to environment variables later) ---
const DUE_SOON_HOURS_BEFORE = 24; // Notify 24 hours before (Will use later)
const ADMIN_ESCALATION_DAYS_OVERDUE = 2; // Notify admins if overdue by 2 days (Will use later)
// const CRON_SCHEDULE = '0 * * * *'; // Run at the start of every hour
const CRON_SCHEDULE = '*/5 * * * *'; // Run every 5 minutes (FOR TESTING - CHANGE LATER!)

// --- Main Scheduler Function ---
const checkLoanNotifications = async () => {
  const now = new Date();
  console.log(`[${now.toISOString()}] Running loan notification check...`);

  try {
    // 1. Find active loans that might need notifications
    // Populate related data needed for checks and messages
    const activeLoans = await Loan.find({ status: 'active' })
      .populate('technician', '_id name email') // Ensure _id is populated for recipient
      .populate('tool', '_id name'); // Ensure _id and name are populated

    console.log(`[Scheduler] Found ${activeLoans.length} active loans to check.`);

    // --- Check for OVERDUE loans (for Technician) ---
    const overdueCheckPromises = activeLoans.map(async (loan) => {
      // Skip if essential data is missing (e.g., tool was deleted)
      if (!loan.tool || !loan.technician) {
         console.warn(`[Scheduler] Skipping loan ${loan._id} due to missing populated tool or technician data.`);
         return;
      }

      // Condition: Loan is overdue and technician hasn't been notified yet
      if (loan.expectedReturn < now && !loan.overdueNotified) {
        console.log(`[Scheduler] Loan for tool "${loan.tool.name}" (ID: ${loan._id}) is overdue. Notifying technician ${loan.technician._id}.`);

        const notificationData = {
          recipient: loan.technician._id,
          // Using title for potential frontend use
          title: 'Loan Overdue',
          message: `The tool "${loan.tool.name}" (Loan ID: ${loan._id}) is overdue. It was due on ${loan.expectedReturn.toLocaleDateString()}. Please return it promptly.`,
          type: 'error', // Or 'warning'
          relatedTo: {
             model: 'Loan',
             id: loan._id
           }
        };

        try {
          // Create notification and update loan atomically (or as close as possible)
          await Notification.create(notificationData);
          await Loan.findByIdAndUpdate(loan._id, { overdueNotified: true });
          console.log(`[Scheduler] Overdue notification created and loan ${loan._id} marked.`);

        } catch (notificationError) {
          console.error(`[Scheduler] Failed to process overdue notification for loan ${loan._id}:`, notificationError);
        }
      }
    });

    // Wait for all overdue checks to finish before proceeding
    await Promise.all(overdueCheckPromises);
    console.log('[Scheduler] Overdue checks completed.');

    // --- Check for DUE SOON loans (for Technician) ---
    // TODO: Implement Logic Here
    console.log('[Scheduler] Skipping due soon checks (TODO).');


    // --- Check for OVERDUE ESCALATION (for Admin) ---
    // TODO: Implement Logic Here
    console.log('[Scheduler] Skipping admin escalation checks (TODO).');


  } catch (error) {
    console.error('[Scheduler] Critical error during notification check run:', error);
  } finally {
      console.log(`[${new Date().toISOString()}] Notification check run finished.`);
  }
};

// --- Schedule the Task ---
if (cron.validate(CRON_SCHEDULE)) {
  console.log(`[Scheduler] Scheduling notification check with schedule: ${CRON_SCHEDULE}`);
  cron.schedule(CRON_SCHEDULE, checkLoanNotifications, {
     scheduled: true,
     timezone: "America/New_York" // IMPORTANT: Set to your server's or target timezone
  });

  // Optional: Run once immediately on startup for testing/verification
  // console.log('[Scheduler] Running initial check on startup...');
  // checkLoanNotifications().catch(err => console.error("Initial check failed:", err));

} else {
  console.error(`[Scheduler] Error: Invalid CRON schedule expression "${CRON_SCHEDULE}". Task not scheduled.`);
}

// Export the main function if you want to trigger it manually elsewhere
export { checkLoanNotifications };