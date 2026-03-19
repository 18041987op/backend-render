import supabase, { shopId } from '../config/supabase.js';

// Helper: calculate expected return date from duration string or explicit date
function calculateExpectedReturn(expectedReturn, loanDuration) {
  if (expectedReturn) {
    const date = new Date(expectedReturn);
    if (!isNaN(date.getTime())) return date;
  }

  if (loanDuration && loanDuration !== 'custom') {
    const unit = loanDuration.slice(-1).toLowerCase();
    const value = parseInt(loanDuration.slice(0, -1));
    if (!isNaN(value) && value > 0) {
      const date = new Date();
      if (unit === 'h') date.setHours(date.getHours() + value);
      else if (unit === 'd') date.setDate(date.getDate() + value);
      else return null; // invalid unit
      return date;
    }
  }

  // Default: 3 days
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date;
}

// Helper: enrich loan with tool and technician data
async function enrichLoan(loan) {
  const [toolRes, techRes] = await Promise.all([
    supabase.from('tools').select('id, name, category, serial_number, location, status').eq('id', loan.tool_id).single(),
    supabase.from('tools_users').select('id, name, email').eq('id', loan.technician_id).single(),
  ]);

  return {
    ...loan,
    _id: loan.id,
    tool: toolRes.data ? { ...toolRes.data, _id: toolRes.data.id } : null,
    technician: techRes.data ? { ...techRes.data, _id: techRes.data.id } : null,
  };
}

// Get all loans
export const getLoans = async (req, res) => {
  try {
    let query = supabase
      .from('tool_loans')
      .select('*')
      .eq('shop_id', shopId);

    // Filter by technician if not admin
    if (req.user.role !== 'admin') {
      query = query.eq('technician_id', req.user.id);
    }

    // Severely overdue filter
    if (req.query.severelyOverdueDays && !isNaN(parseInt(req.query.severelyOverdueDays))) {
      const days = parseInt(req.query.severelyOverdueDays);
      if (days > 0) {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - days);
        threshold.setHours(0, 0, 0, 0);
        query = query.eq('status', 'active').lt('expected_return', threshold.toISOString());
      }
    } else if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    // Sort
    const sortBy = req.query.sortBy || 'created_at';
    const sortAsc = !sortBy.startsWith('-');
    const sortCol = sortBy.replace(/^-/, '');
    // Map MongoDB field names to Supabase column names
    const colMap = { createdAt: 'created_at', borrowedAt: 'borrowed_at', expectedReturn: 'expected_return' };
    query = query.order(colMap[sortCol] || sortCol, { ascending: sortAsc });

    // Limit
    if (req.query.limit && !isNaN(parseInt(req.query.limit))) {
      query = query.limit(parseInt(req.query.limit));
    }

    const { data: loans, error } = await query;
    if (error) throw error;

    // Enrich with tool/technician data
    const enriched = await Promise.all(loans.map(enrichLoan));

    res.status(200).json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    console.error('Error en getLoans:', error);
    res.status(500).json({ success: false, message: 'Error al obtener préstamos', error: error.message });
  }
};

// Get a specific loan
export const getLoan = async (req, res) => {
  try {
    const { data: loan, error } = await supabase
      .from('tool_loans')
      .select('*')
      .eq('id', req.params.id)
      .eq('shop_id', shopId)
      .single();

    if (error || !loan) {
      return res.status(404).json({ success: false, message: 'Préstamo no encontrado' });
    }

    const enriched = await enrichLoan(loan);
    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener el préstamo', error: error.message });
  }
};

// Create a loan
export const createLoan = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const { tool, purpose, expectedReturn, loanDuration, vehicle } = req.body;

    // Validate tool exists and is available
    const { data: toolData, error: toolErr } = await supabase
      .from('tools')
      .select('id, name, status')
      .eq('id', tool)
      .eq('shop_id', shopId)
      .single();

    if (toolErr || !toolData) {
      return res.status(404).json({ success: false, message: 'Herramienta no encontrada.' });
    }
    if (toolData.status !== 'available') {
      return res.status(400).json({ success: false, message: `La herramienta "${toolData.name}" no está disponible actualmente (estado: ${toolData.status}).` });
    }

    const calculatedReturn = calculateExpectedReturn(expectedReturn, loanDuration);

    const { data: loan, error } = await supabase
      .from('tool_loans')
      .insert({
        shop_id: shopId,
        tool_id: tool,
        technician_id: req.user.id,
        purpose,
        vehicle: vehicle || '',
        expected_return: calculatedReturn.toISOString(),
        status: 'active',
      })
      .select('*')
      .single();

    if (error) throw error;

    // Mark tool as borrowed
    await supabase
      .from('tools')
      .update({ status: 'borrowed' })
      .eq('id', tool);

    const enriched = await enrichLoan(loan);
    res.status(201).json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error al crear préstamo:', error);
    res.status(500).json({ success: false, message: 'Error al crear préstamo', error: error.message });
  }
};

// Return a tool
export const returnTool = async (req, res) => {
  try {
    const { data: loan, error: fetchErr } = await supabase
      .from('tool_loans')
      .select('*')
      .eq('id', req.params.id)
      .eq('shop_id', shopId)
      .single();

    if (fetchErr || !loan) {
      return res.status(404).json({ success: false, message: 'Préstamo no encontrado' });
    }

    if (loan.status !== 'active') {
      return res.status(200).json({ success: true, data: { ...loan, _id: loan.id }, message: `El préstamo ya estaba en estado: ${loan.status}` });
    }

    // Update loan to returned
    const updates = {
      status: 'returned',
      actual_return: new Date().toISOString(),
    };

    if (req.body.returnCondition) {
      updates.return_has_damage = req.body.returnCondition.hasDamage || false;
      updates.return_damage_description = req.body.returnCondition.description || null;
      updates.return_condition_status = req.body.returnCondition.hasDamage ? 'damaged' : 'good';
    }

    const { data: updatedLoan, error } = await supabase
      .from('tool_loans')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;

    // Update tool status
    const newToolStatus = req.body.returnCondition?.hasDamage ? 'damaged' : 'available';
    await supabase
      .from('tools')
      .update({ status: newToolStatus })
      .eq('id', loan.tool_id);

    const enriched = await enrichLoan(updatedLoan);
    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error al devolver herramienta:', error);
    res.status(500).json({ success: false, message: 'Error al devolver herramienta', error: error.message });
  }
};

// Get my active loans (technician)
export const getMyLoans = async (req, res) => {
  try {
    const { data: loans, error } = await supabase
      .from('tool_loans')
      .select('*')
      .eq('technician_id', req.user.id)
      .eq('status', 'active')
      .eq('shop_id', shopId)
      .order('borrowed_at', { ascending: false });

    if (error) throw error;

    const enriched = await Promise.all(loans.map(enrichLoan));
    res.status(200).json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    console.error('Error en getMyLoans:', error);
    res.status(500).json({ success: false, message: 'Error al obtener herramientas prestadas', error: error.message });
  }
};

// Transfer a loan to another technician
export const transferLoan = async (req, res) => {
  try {
    const loanId = req.params.id;
    const { targetTechnician, purpose, vehicle, notes, loanDuration, expectedReturn } = req.body;

    const { data: loan, error: fetchErr } = await supabase
      .from('tool_loans')
      .select('*')
      .eq('id', loanId)
      .eq('shop_id', shopId)
      .single();

    if (fetchErr || !loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }
    if (loan.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Loan is not active and cannot be transferred' });
    }

    // Validate target technician
    const { data: targetUser, error: userErr } = await supabase
      .from('tools_users')
      .select('id, name, is_active')
      .eq('id', targetTechnician)
      .eq('shop_id', shopId)
      .single();

    if (userErr || !targetUser || !targetUser.is_active) {
      return res.status(400).json({ success: false, message: 'Target technician not found or is inactive' });
    }
    if (targetUser.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot transfer a tool to yourself.' });
    }
    if (targetUser.id === loan.technician_id) {
      return res.status(400).json({ success: false, message: `Tool is already assigned to ${targetUser.name}.` });
    }

    const newExpectedReturn = calculateExpectedReturn(expectedReturn, loanDuration);

    // Record transfer in loan_transfers table
    await supabase
      .from('loan_transfers')
      .insert({
        loan_id: loanId,
        from_technician_id: loan.technician_id,
        to_technician_id: targetUser.id,
        initiated_by: req.user.id,
        notes: notes || null,
      });

    // Update the loan
    const { data: updatedLoan, error } = await supabase
      .from('tool_loans')
      .update({
        technician_id: targetUser.id,
        purpose,
        vehicle: vehicle || '',
        expected_return: newExpectedReturn.toISOString(),
        due_soon_notified: false,
        overdue_notified: false,
        admin_notified: false,
      })
      .eq('id', loanId)
      .select('*')
      .single();

    if (error) throw error;

    const enriched = await enrichLoan(updatedLoan);
    res.status(200).json({ success: true, message: 'Tool transferred successfully', data: enriched });
  } catch (error) {
    console.error(`Error transferring loan:`, error);
    res.status(500).json({ success: false, message: 'Error transferring tool', error: error.message });
  }
};
