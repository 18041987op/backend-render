import Tool from '../models/Tool.js';
import Loan from '../models/Loan.js';

export const resetDatabase = async (req, res) => {
  try {
    // Resetear herramientas a "available"
    await Tool.updateMany({}, { status: 'available' });

    // Resetear préstamos a "returned"
    await Loan.updateMany({}, { status: 'returned', actualReturn: Date.now() });

    res.status(200).json({ success: true, message: 'Base de datos reseteada correctamente.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al resetear la base de datos.', error: error.message });
  }
};

// Obtener todas las herramientas
export const getTools = async (req, res) => {
  try {
    let query = Tool.find();

    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    const tools = await query;
    res.status(200).json({ success: true, count: tools.length, data: tools });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener herramientas', error: error.message });
  }
};

// Obtener una herramienta específica
export const getTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({ success: false, message: 'Herramienta no encontrada' });
    }
    res.status(200).json({ success: true, data: tool });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener la herramienta', error: error.message });
  }
};

// Crear una nueva herramienta (solo admin)
export const createTool = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    req.body.addedBy = req.user._id;
    const tool = await Tool.create(req.body);
    res.status(201).json({ success: true, data: tool });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear herramienta', error: error.message });
  }
};

// Actualizar una herramienta
export const updateTool = async (req, res) => {
  try {
    let tool = await Tool.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({ success: false, message: 'Herramienta no encontrada' });
    }

    tool = await Tool.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: tool });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar herramienta', error: error.message });
  }
};

// **Eliminar una herramienta**
export const deleteTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({ success: false, message: 'Herramienta no encontrada' });
    }

    await tool.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar herramienta', error: error.message });
  }
};

// Actualizar solo el estado de una herramienta
export const updateToolStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Se requiere especificar el nuevo estado' });
    }

    const validStates = ['available', 'borrowed', 'maintenance', 'damaged'];
    if (!validStates.includes(status)) {
      return res.status(400).json({ success: false, message: `Estado no válido. Debe ser uno de: ${validStates.join(', ')}` });
    }

    let tool = await Tool.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({ success: false, message: 'Herramienta no encontrada' });
    }

    if (tool.status === 'borrowed' && status === 'available') {
      const activeLoan = await Loan.findOne({ tool: tool._id, status: 'active' });
      if (activeLoan) {
        return res.status(400).json({ success: false, message: 'No se puede cambiar a disponible porque está prestada' });
      }
    }

    tool.status = status;
    if (status === 'available' && (tool.status === 'maintenance' || tool.status === 'damaged')) {
      tool.lastMaintenance = Date.now();
    }
    await tool.save();

    res.status(200).json({ success: true, data: tool });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar el estado', error: error.message });
  }
};
