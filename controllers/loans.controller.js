import Loan from '../models/Loan.js';
import Tool from '../models/Tool.js';

// Obtener todos los préstamos
export const getLoans = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.technician = req.user._id;
    }

    const loans = await Loan.find(query)
      .populate('tool', 'name category serialNumber')
      .populate('technician', 'name email')
      .sort('-borrowedAt');

    res.status(200).json({ success: true, count: loans.length, data: loans });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener préstamos', error: error.message });
  }
};

// **Obtener un préstamo específico**
export const getLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('tool', 'name category serialNumber')
      .populate('technician', 'name email');

    if (!loan) return res.status(404).json({ success: false, message: 'Préstamo no encontrado' });

    if (req.user.role !== 'admin' && loan.technician._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'No autorizado para ver este préstamo' });
    }

    res.status(200).json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener el préstamo', error: error.message });
  }
};

// Crear un préstamo
export const createLoan = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    // Extraer datos de la solicitud
    const { tool, purpose, expectedReturn, loanDuration } = req.body;
    
    // Calcular la fecha de devolución esperada
    let calculatedExpectedReturn;
    
    // Si se proporciona una fecha explícita, utilizarla
    if (expectedReturn) {
      calculatedExpectedReturn = new Date(expectedReturn);
    } 
    // Si se proporciona una duración (en formato "1h", "2d", etc.), calcular la fecha
    else if (loanDuration) {
      calculatedExpectedReturn = new Date();
      
      // Analizar la duración: formato esperado como "5h" (5 horas) o "3d" (3 días)
      const unit = loanDuration.slice(-1); // Obtener última letra (h o d)
      const value = parseInt(loanDuration.slice(0, -1)); // Obtener el número
      
      if (unit === 'h') {
        // Añadir horas
        calculatedExpectedReturn.setHours(calculatedExpectedReturn.getHours() + value);
      } else if (unit === 'd') {
        // Añadir días
        calculatedExpectedReturn.setDate(calculatedExpectedReturn.getDate() + value);
      }
    } 
    // Si no se proporciona nada, establecer por defecto 3 días
    else {
      calculatedExpectedReturn = new Date();
      calculatedExpectedReturn.setDate(calculatedExpectedReturn.getDate() + 3);
    }

    // Crear el nuevo préstamo con la fecha calculada
    const newLoan = await Loan.create({
      tool,
      technician: req.user._id,
      purpose,
      expectedReturn: calculatedExpectedReturn
    });

    // Actualizar el estado de la herramienta a "prestada"
    await Tool.findByIdAndUpdate(tool, { status: 'borrowed' });

    res.status(201).json({ success: true, data: newLoan });
  } catch (error) {
    console.error('Error al crear préstamo:', error);
    res.status(500).json({ success: false, message: 'Error al crear préstamo', error: error.message });
  }
};

// Devolver una herramienta
export const returnTool = async (req, res) => {
  try {
    let loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ success: false, message: 'Préstamo no encontrado' });

    if (req.user.role !== 'admin' && loan.technician.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'No autorizado para devolver esta herramienta' });
    }

    // Nueva validación para evitar devolver herramientas ya devueltas
    if (loan.status === 'returned') {
      return res.status(400).json({ success: false, message: 'Esta herramienta ya ha sido devuelta' });
    }

    loan.actualReturn = Date.now();
    loan.status = 'returned';
    await loan.save();

    await Tool.findByIdAndUpdate(loan.tool, { status: 'available' });

    res.status(200).json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al devolver herramienta', error: error.message });
  }
};

export const getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.find({
      technician: req.user._id,
      status: 'active' // Asegurar que solo se devuelvan préstamos activos
    }).populate({
      path: 'tool',
      select: 'name category serialNumber status'
    });

    res.status(200).json({ success: true, count: loans.length, data: loans });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener herramientas prestadas', error: error.message });
  }
};
