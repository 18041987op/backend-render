import supabase, { shopId } from '../config/supabase.js';

// Get all tools (with filtering)
export const getTools = async (req, res) => {
  try {
    let query = supabase
      .from('tools')
      .select('*')
      .eq('shop_id', shopId);

    if (req.query.category) {
      query = query.eq('category', req.query.category);
    }

    if (req.query.status) {
      if (Array.isArray(req.query.status)) {
        query = query.in('status', req.query.status);
      } else {
        query = query.eq('status', req.query.status);
      }
    }

    const { data: tools, error } = await query.order('name');

    if (error) throw error;

    const mapped = tools.map(t => ({ ...t, _id: t.id }));
    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ success: false, message: 'Error fetching tools', error: error.message });
  }
};

// Get a specific tool by ID
export const getTool = async (req, res) => {
  try {
    const { data: tool, error } = await supabase
      .from('tools')
      .select('*')
      .eq('id', req.params.id)
      .eq('shop_id', shopId)
      .single();

    if (error || !tool) {
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    res.status(200).json({ success: true, data: { ...tool, _id: tool.id } });
  } catch (error) {
    console.error('Error fetching tool:', error);
    res.status(500).json({ success: false, message: 'Error fetching tool', error: error.message });
  }
};

// Create a new tool (admin only)
export const createTool = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { name, category, serialNumber, serial_number, location, description, cost, image, image_url, comments } = req.body;

    const { data: tool, error } = await supabase
      .from('tools')
      .insert({
        shop_id: shopId,
        name,
        category,
        serial_number: serial_number || serialNumber || null,
        location: location || 'Main Shop',
        description: description || '',
        status: 'available',
        cost: cost || 0,
        image_url: image_url || image || null,
        comments: comments || '',
        added_by: req.user.id,
      })
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: { ...tool, _id: tool.id } });
  } catch (error) {
    console.error('Error creating tool:', error);
    res.status(500).json({ success: false, message: 'Error creating tool', error: error.message });
  }
};

// Update a tool (admin only)
export const updateTool = async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('tools')
      .select('id')
      .eq('id', req.params.id)
      .eq('shop_id', shopId)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    const updates = { ...req.body };
    delete updates.status;
    delete updates._id;
    delete updates.id;
    delete updates.shop_id;

    // Handle frontend field name differences
    if (updates.serialNumber) {
      updates.serial_number = updates.serialNumber;
      delete updates.serialNumber;
    }
    if (updates.imageUrl || updates.image) {
      updates.image_url = updates.imageUrl || updates.image;
      delete updates.imageUrl;
      delete updates.image;
    }

    const { data: tool, error } = await supabase
      .from('tools')
      .update(updates)
      .eq('id', req.params.id)
      .eq('shop_id', shopId)
      .select('*')
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, data: { ...tool, _id: tool.id } });
  } catch (error) {
    console.error('Error updating tool:', error);
    res.status(500).json({ success: false, message: 'Error updating tool', error: error.message });
  }
};

// Delete a tool (admin only)
export const deleteTool = async (req, res) => {
  try {
    const { data: tool, error: fetchErr } = await supabase
      .from('tools')
      .select('id, status')
      .eq('id', req.params.id)
      .eq('shop_id', shopId)
      .single();

    if (fetchErr || !tool) {
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    if (tool.status === 'borrowed') {
      return res.status(400).json({ success: false, message: 'Cannot delete a tool that is currently on loan.' });
    }

    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', req.params.id)
      .eq('shop_id', shopId);

    if (error) throw error;

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting tool:', error);
    res.status(500).json({ success: false, message: 'Error deleting tool', error: error.message });
  }
};

// Update only the status of a tool (admin only)
export const updateToolStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'New status is required' });
    }

    const validStates = ['available', 'borrowed', 'maintenance', 'damaged'];
    if (!validStates.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStates.join(', ')}` });
    }

    const { data: tool, error: fetchErr } = await supabase
      .from('tools')
      .select('id, status')
      .eq('id', req.params.id)
      .eq('shop_id', shopId)
      .single();

    if (fetchErr || !tool) {
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    if (tool.status === 'borrowed' && status === 'available') {
      const { data: activeLoan } = await supabase
        .from('tool_loans')
        .select('id')
        .eq('tool_id', tool.id)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (activeLoan) {
        return res.status(400).json({ success: false, message: 'Cannot change status to available because the tool is currently on loan.' });
      }
    }

    const updates = { status };
    if (status === 'available' && (tool.status === 'maintenance' || tool.status === 'damaged')) {
      updates.last_maintenance = new Date().toISOString();
    }

    const { data: updated, error } = await supabase
      .from('tools')
      .update(updates)
      .eq('id', req.params.id)
      .eq('shop_id', shopId)
      .select('*')
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, data: { ...updated, _id: updated.id } });
  } catch (error) {
    console.error('Error updating tool status:', error);
    res.status(500).json({ success: false, message: 'Error updating tool status', error: error.message });
  }
};
