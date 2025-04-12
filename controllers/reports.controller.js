// backend/controllers/reports.controller.js
import Loan from '../models/Loan.js';
import mongoose from 'mongoose';

// --- Report: Late Returns by Technician ---
export const getLateReturnsByTechnician = async (req, res) => {
  console.log("[Reports] Request received for Late Returns by Technician");
  try {
    const lateReturnsReport = await Loan.aggregate([
      // 1. Filter for loans that were actually returned and were late
      {
        $match: {
          status: 'returned', // Only consider returned loans
          actualReturn: { $ne: null }, // Ensure there is an actual return date
          expectedReturn: { $ne: null }, // Ensure there is an expected return date
          $expr: { $gt: ["$actualReturn", "$expectedReturn"] } // Filter where actual > expected
        }
      },
      // 2. Group by technician and count the late returns
      {
        $group: {
          _id: "$technician", // Group by the technician's ObjectId
          lateCount: { $sum: 1 } // Count how many late loans per technician
        }
      },
      // 3. Sort by the count of late returns, descending
      {
        $sort: {
          lateCount: -1
        }
      },
      // 4. (Optional but recommended) Lookup technician details
      {
        $lookup: {
          from: 'users', // The name of the users collection
          localField: '_id', // The field from the $group stage (technician ID)
          foreignField: '_id', // The field in the users collection
          as: 'technicianInfo' // The name of the new array field to add
        }
      },
      // 5. Deconstruct the technicianInfo array and handle cases where user might not be found
      {
        $unwind: {
           path: "$technicianInfo",
           preserveNullAndEmptyArrays: true // Keep results even if technician was deleted
        }
      },
      // 6. Project the final desired fields
      {
        $project: {
          _id: 0, // Exclude the default _id from the group stage
          technicianId: "$_id",
          technicianName: { $ifNull: ["$technicianInfo.name", "Usuario Desconocido"] }, // Use name or fallback
          lateCount: 1 // Include the count
        }
      }
    ]);

    console.log(`[Reports] Generated Late Returns Report with ${lateReturnsReport.length} entries.`);
    res.status(200).json({ success: true, data: lateReturnsReport });

  } catch (error) {
    console.error('[Reports] Error generating late returns report:', error);
    res.status(500).json({ success: false, message: 'Error generating report', error: error.message });
  }
};

// --- Report: Damaged Returns by Technician ---
export const getDamagedReturnsByTechnician = async (req, res) => {
  console.log("[Reports] Request received for Damaged Returns by Technician");
  try {
    // **IMPORTANT**: This assumes damage is tracked in 'returnCondition.hasDamage'
    // Adjust the $match stage if your field is named differently!
    const damagedReturnsReport = await Loan.aggregate([
      // 1. Filter for loans returned with damage reported
      {
        $match: {
          status: 'returned',
          'returnCondition.hasDamage': true // Match based on the damage flag
          // You might also want to add: 'returnCondition': { $ne: null } if the field might not exist
        }
      },
      // 2. Group by technician and count damaged returns
      {
        $group: {
          _id: "$technician",
          damagedCount: { $sum: 1 }
        }
      },
      // 3. Sort by count descending
      {
        $sort: {
          damagedCount: -1
        }
      },
      // 4. Lookup technician details
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'technicianInfo'
        }
      },
      // 5. Deconstruct the array and handle missing technicians
      {
        $unwind: {
           path: "$technicianInfo",
           preserveNullAndEmptyArrays: true
        }
      },
      // 6. Project final fields
      {
        $project: {
          _id: 0,
          technicianId: "$_id",
          technicianName: { $ifNull: ["$technicianInfo.name", "Usuario Desconocido"] },
          damagedCount: 1
        }
      }
    ]);

    console.log(`[Reports] Generated Damaged Returns Report with ${damagedReturnsReport.length} entries.`);
    res.status(200).json({ success: true, data: damagedReturnsReport });

  } catch (error) {
    console.error('[Reports] Error generating damaged returns report:', error);
    res.status(500).json({ success: false, message: 'Error generating report', error: error.message });
  }
};