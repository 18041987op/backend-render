import supabase, { shopId } from '../config/supabase.js';

// Report: Late Returns by Technician (uses the Supabase view)
export const getLateReturnsByTechnician = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('late_returns_by_technician_view')
      .select('*')
      .eq('shop_id', shopId)
      .order('late_count', { ascending: false });

    if (error) throw error;

    // Map to match the original API response format
    const report = data.map(row => ({
      technicianId: row.technician_id,
      technicianName: row.technician_name,
      lateCount: row.late_count,
    }));

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error('[Reports] Error generating late returns report:', error);
    res.status(500).json({ success: false, message: 'Error generating report', error: error.message });
  }
};

// Report: Damaged Returns by Technician (uses the Supabase view)
export const getDamagedReturnsByTechnician = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('damaged_returns_by_technician_view')
      .select('*')
      .eq('shop_id', shopId)
      .order('damaged_count', { ascending: false });

    if (error) throw error;

    const report = data.map(row => ({
      technicianId: row.technician_id,
      technicianName: row.technician_name,
      damagedCount: row.damaged_count,
    }));

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error('[Reports] Error generating damaged returns report:', error);
    res.status(500).json({ success: false, message: 'Error generating report', error: error.message });
  }
};
