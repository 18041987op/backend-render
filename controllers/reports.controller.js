// backend/controllers/reports.controller.js
import Loan from '../models/Loan.js';
import mongoose from 'mongoose';

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

// --- Report: Damaged Returns by Technician (Placeholder) ---
// export const getDamagedReturnsByTechnician = async (req, res) => {
//   // TODO: Implement aggregation logic similar to above,
//   // but matching on returnCondition.hasDamage = true (or similar field)
//   res.status(501).json({ success: false, message: 'Report not yet implemented' });
// };