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

    const { tool, purpose } = req.body;
    const newLoan = await Loan.create({
      tool,
      technician: req.user._id,
      purpose
    });

    await Tool.findByIdAndUpdate(tool, { status: 'borrowed' });

    res.status(201).json({ success: true, data: newLoan });
  } catch (error) {
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

    if (loan.status !== 'active') {
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
