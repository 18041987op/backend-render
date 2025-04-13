// backend/controllers/tools.controller.js
import Tool from '../models/Tool.js';
import Loan from '../models/Loan.js'; // Loan model might be needed for status checks

// (Any potential commented-out resetDatabase function remains commented)
// export const resetDatabase = async (req, res) => { ... };

// Get all tools (with filtering)
export const getTools = async (req, res) => {
  try {
    console.log('Received query params:', req.query); // Log translated

    let query = {};

    // Process category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Process status filter
    if (req.query.status) {
      // Handle multiple status values (sent as array)
      if (Array.isArray(req.query.status)) {
        query.status = { $in: req.query.status };
      } else {
        query.status = req.query.status;
      }
    }

    console.log('Final query filter:', query); // Log translated

    const tools = await Tool.find(query);

    console.log(`Found ${tools.length} tools with applied filters`); // Log translated

    res.status(200).json({ success: true, count: tools.length, data: tools });
  } catch (error) {
    console.error('Error fetching tools:', error); // Standard error log
    res.status(500).json({ success: false, message: 'Error fetching tools', error: error.message }); // Message translated
  }
};

// Get a specific tool by ID
export const getTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({ success: false, message: 'Tool not found' }); // Message translated
    }
    res.status(200).json({ success: true, data: tool });
  } catch (error) {
    console.error('Error fetching tool:', error);
    res.status(500).json({ success: false, message: 'Error fetching tool', error: error.message }); // Message translated
  }
};

// Create a new tool (admin only)
export const createTool = async (req, res) => {
  try {
    // Authentication check is handled by middleware, but req.user is needed
    if (!req.user) {
       // This case might not be reachable if 'protect' middleware is effective
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Add the user who added the tool
    req.body.addedBy = req.user._id;
    // req.body should contain name, category, location, and optionally serialNumber, description, cost

    const tool = await Tool.create(req.body); // Assumes req.body has all necessary fields including the new 'cost'
    res.status(201).json({ success: true, data: tool });
  } catch (error) {
     console.error('Error creating tool:', error);
    // Handle potential validation errors from Mongoose
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Error creating tool', error: error.message }); // Message translated
  }
};

// Update a tool (admin only, usually via middleware)
export const updateTool = async (req, res) => {
  try {
    let tool = await Tool.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({ success: false, message: 'Tool not found' }); // Message translated
    }

    // Ensure status is not accidentally changed here if sent from frontend
    // It's better to handle status updates via updateToolStatus
    const updateData = { ...req.body };
    delete updateData.status; // Prevent accidental status changes via this route
    // We assume req.body contains the fields to update, including 'cost'

    tool = await Tool.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: tool });
  } catch (error) {
    console.error('Error updating tool:', error);
     // Handle potential validation errors from Mongoose
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Error updating tool', error: error.message }); // Message translated
  }
};

// Delete a tool (admin only, usually via middleware)
export const deleteTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({ success: false, message: 'Tool not found' }); // Message translated
    }

    // Consider adding a check here: can a tool be deleted if it's currently borrowed?
    if (tool.status === 'borrowed') {
        return res.status(400).json({ success: false, message: 'Cannot delete a tool that is currently on loan.' });
    }

    await tool.deleteOne(); // Use deleteOne() on the document
    res.status(200).json({ success: true, data: {} }); // Send back empty data on successful deletion
  } catch (error) {
     console.error('Error deleting tool:', error);
    res.status(500).json({ success: false, message: 'Error deleting tool', error: error.message }); // Message translated
  }
};

// Update only the status of a tool (admin only, usually via middleware)
export const updateToolStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'New status is required' }); // Message translated
    }

    // Use the enum values from your Tool model
    const validStates = Tool.schema.path('status').enumValues; // Get valid states from schema
    if (!validStates.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStates.join(', ')}` }); // Message translated
    }

    let tool = await Tool.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({ success: false, message: 'Tool not found' }); // Message translated
    }

    // Prevent changing status TO 'available' if it's currently 'borrowed' without returning the loan first
    // (This check might be better enforced during the loan return process)
    if (tool.status === 'borrowed' && status === 'available') {
      // Check if there's still an active loan associated with it
      const activeLoan = await Loan.findOne({ tool: tool._id, status: 'active' });
      if (activeLoan) {
        return res.status(400).json({ success: false, message: 'Cannot change status to available because the tool is currently on loan.' }); // Message translated
      }
    }

    // Update the status
    tool.status = status;
    // If status changes from maintenance/damaged back to available, update lastMaintenance date
    if (status === 'available' && (tool.status === 'maintenance' || tool.status === 'damaged')) {
      tool.lastMaintenance = Date.now(); // Record when it became available after repair/check
    }
    await tool.save();

    res.status(200).json({ success: true, data: tool });
  } catch (error) {
    console.error('Error updating tool status:', error);
    res.status(500).json({ success: false, message: 'Error updating tool status', error: error.message }); // Message translated
  }
};

// ************************************
//import Tool from '../models/Tool.js';
//import Loan from '../models/Loan.js';

// export const resetDatabase = async (req, res) => {
//   try {
//     // Resetear herramientas a "available"
//     await Tool.updateMany({}, { status: 'available' });

//     // Resetear préstamos a "returned"
//     await Loan.updateMany({}, { status: 'returned', actualReturn: Date.now() });

//     res.status(200).json({ success: true, message: 'Base de datos reseteada correctamente.' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error al resetear la base de datos.', error: error.message });
//   }
// };

// Obtener todas las herramientas
// export const getTools = async (req, res) => {
//   try {
//     console.log('Query params recibidos:', req.query);
    
//     let query = {};
    
//     // Procesar filtro de categoría
//     if (req.query.category) {
//       query.category = req.query.category;
//     }
    
//     // Procesar filtro de estado
//     if (req.query.status) {
//       // Si hay múltiples valores para status (viene como array)
//       if (Array.isArray(req.query.status)) {
//         query.status = { $in: req.query.status };
//       } else {
//         query.status = req.query.status;
//       }
//     }
    
//     console.log('Filtro final para la consulta:', query);
    
//     const tools = await Tool.find(query);
    
//     console.log(`Encontradas ${tools.length} herramientas con los filtros aplicados`);
    
//     res.status(200).json({ success: true, count: tools.length, data: tools });
//   } catch (error) {
//     console.error('Error al obtener herramientas:', error);
//     res.status(500).json({ success: false, message: 'Error al obtener herramientas', error: error.message });
//   }
// };

// Obtener una herramienta específica
// export const getTool = async (req, res) => {
//   try {
//     const tool = await Tool.findById(req.params.id);
//     if (!tool) {
//       return res.status(404).json({ success: false, message: 'Herramienta no encontrada' });
//     }
//     res.status(200).json({ success: true, data: tool });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error al obtener la herramienta', error: error.message });
//   }
// };

// Crear una nueva herramienta (solo admin)
// export const createTool = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(403).json({ success: false, message: 'No autorizado' });
//     }

//     req.body.addedBy = req.user._id;
//     const tool = await Tool.create(req.body);
//     res.status(201).json({ success: true, data: tool });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error al crear herramienta', error: error.message });
//   }
// };

// Actualizar una herramienta
// export const updateTool = async (req, res) => {
//   try {
//     let tool = await Tool.findById(req.params.id);
//     if (!tool) {
//       return res.status(404).json({ success: false, message: 'Herramienta no encontrada' });
//     }

//     tool = await Tool.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
//     res.status(200).json({ success: true, data: tool });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error al actualizar herramienta', error: error.message });
//   }
// };

// **Eliminar una herramienta**
// export const deleteTool = async (req, res) => {
//   try {
//     const tool = await Tool.findById(req.params.id);
//     if (!tool) {
//       return res.status(404).json({ success: false, message: 'Herramienta no encontrada' });
//     }

//     await tool.deleteOne();
//     res.status(200).json({ success: true, data: {} });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error al eliminar herramienta', error: error.message });
//   }
// };

// Actualizar solo el estado de una herramienta
// export const updateToolStatus = async (req, res) => {
//   try {
//     const { status } = req.body;
//     if (!status) {
//       return res.status(400).json({ success: false, message: 'Se requiere especificar el nuevo estado' });
//     }

//     const validStates = ['available', 'borrowed', 'maintenance', 'damaged'];
//     if (!validStates.includes(status)) {
//       return res.status(400).json({ success: false, message: `Estado no válido. Debe ser uno de: ${validStates.join(', ')}` });
//     }

//     let tool = await Tool.findById(req.params.id);
//     if (!tool) {
//       return res.status(404).json({ success: false, message: 'Herramienta no encontrada' });
//     }

//     if (tool.status === 'borrowed' && status === 'available') {
//       const activeLoan = await Loan.findOne({ tool: tool._id, status: 'active' });
//       if (activeLoan) {
//         return res.status(400).json({ success: false, message: 'No se puede cambiar a disponible porque está prestada' });
//       }
//     }

//     tool.status = status;
//     if (status === 'available' && (tool.status === 'maintenance' || tool.status === 'damaged')) {
//       tool.lastMaintenance = Date.now();
//     }
//     await tool.save();

//     res.status(200).json({ success: true, data: tool });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error al actualizar el estado', error: error.message });
//   }
// };
