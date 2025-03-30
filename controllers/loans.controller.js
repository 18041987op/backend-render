import Loan from '../models/Loan.js';
import Tool from '../models/Tool.js';

// Obtener todos los préstamos (Sin cambios)
export const getLoans = async (req, res) => {
  try {
    let query = {};

    // Filtrar por estado si se proporciona en la query
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filtrar por técnico si no es admin
    if (req.user.role !== 'admin') {
      query.technician = req.user._id;
    }

    // Ordenar si se proporciona sortBy
    let sortOption = '-createdAt'; // Default sort
    if (req.query.sortBy) {
        sortOption = req.query.sortBy;
    }

    // Limitar si se proporciona limit
    let limitOption = undefined;
    if (req.query.limit && !isNaN(parseInt(req.query.limit))) {
        limitOption = parseInt(req.query.limit);
    }

    console.log('DEBUG: [getLoans] Query:', query, 'Sort:', sortOption, 'Limit:', limitOption);

    const loans = await Loan.find(query)
      .populate('tool', 'name category serialNumber location status') // Añadido location y status
      .populate('technician', 'name email')
      .sort(sortOption)
      .limit(limitOption); // Aplicar límite

    res.status(200).json({ success: true, count: loans.length, data: loans });
  } catch (error) {
    console.error('Error en getLoans:', error);
    res.status(500).json({ success: false, message: 'Error al obtener préstamos', error: error.message });
  }
};

// Obtener un préstamo específico (Sin cambios)
export const getLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('tool', 'name category serialNumber')
      .populate('technician', 'name email');
    if (!loan) return res.status(404).json({ success: false, message: 'Préstamo no encontrado' });
    // ... (verificación de permisos sin cambios) ...
    res.status(200).json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener el préstamo', error: error.message });
  }
};

// --- Crear un préstamo (LÓGICA DE FECHA CORREGIDA) ---
export const createLoan = async (req, res) => {
  try {
    console.log('DEBUG: req.body recibido en createLoan:', req.body);
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const { tool, purpose, expectedReturn, loanDuration, vehicle } = req.body;

    let calculatedExpectedReturn;
    let usedDefault = false; // Bandera para saber si se usó el default

    if (expectedReturn) {
      // 1. Prioridad: Fecha explícita (asegurar que sea válida)
      const date = new Date(expectedReturn);
      if (!isNaN(date.getTime())) {
         calculatedExpectedReturn = date;
         console.log('DEBUG: Usando fecha explícita:', calculatedExpectedReturn);
      } else {
         console.warn('DEBUG: Fecha expectedReturn inválida recibida:', expectedReturn);
         // Considerar si lanzar un error o usar el default
      }
    }

    // 2. Si no se usó fecha explícita, intentar con loanDuration
    if (!calculatedExpectedReturn && loanDuration && loanDuration !== 'custom') {
      const unit = loanDuration.slice(-1).toLowerCase();
      const value = parseInt(loanDuration.slice(0, -1));

      if (!isNaN(value) && value > 0) { // Validar que value sea un número positivo
        calculatedExpectedReturn = new Date(); // Empezar desde ahora
        if (unit === 'h') {
          calculatedExpectedReturn.setHours(calculatedExpectedReturn.getHours() + value);
          console.log(`DEBUG: Calculado con ${value} hora(s):`, calculatedExpectedReturn);
        } else if (unit === 'd') {
          calculatedExpectedReturn.setDate(calculatedExpectedReturn.getDate() + value);
          console.log(`DEBUG: Calculado con ${value} día(s):`, calculatedExpectedReturn);
        } else {
          // Unidad inválida, marcaremos para usar el default
          console.log('DEBUG: loanDuration con unidad inválida:', loanDuration);
          calculatedExpectedReturn = null; // Forzar uso del default
        }
      } else {
        // Valor inválido, marcaremos para usar el default
        console.log('DEBUG: loanDuration con valor inválido:', loanDuration);
        calculatedExpectedReturn = null; // Forzar uso del default
      }
    }

    // 3. Default: Si después de las comprobaciones anteriores no tenemos fecha, usar 3 días
    if (!calculatedExpectedReturn) {
      usedDefault = true;
      calculatedExpectedReturn = new Date();
      calculatedExpectedReturn.setDate(calculatedExpectedReturn.getDate() + 3);
      console.log('DEBUG: Usando default 3 días:', calculatedExpectedReturn);
    }

     // Validar que la herramienta exista y esté disponible
    const toolToBorrow = await Tool.findById(tool);
    if (!toolToBorrow) {
       return res.status(404).json({ success: false, message: 'Herramienta no encontrada.' });
    }
    if (toolToBorrow.status !== 'available') {
        return res.status(400).json({ success: false, message: `La herramienta "${toolToBorrow.name}" no está disponible actualmente (estado: ${toolToBorrow.status}).` });
    }


    // Crear el préstamo
    const newLoan = await Loan.create({
      tool,
      technician: req.user._id,
      purpose,
      vehicle: vehicle || undefined,
      expectedReturn: calculatedExpectedReturn // Usar la fecha final calculada
    });

    // Actualizar estado de la herramienta (solo si el préstamo se creó)
    if(newLoan) {
       await Tool.findByIdAndUpdate(tool, { status: 'borrowed' });
       console.log(`DEBUG: Herramienta ${tool} marcada como 'borrowed'.`);
    } else {
       throw new Error("No se pudo crear el registro del préstamo.");
    }

    res.status(201).json({ success: true, data: newLoan });
  } catch (error) {
    console.error('Error al crear préstamo:', error);
    res.status(500).json({ success: false, message: 'Error al crear préstamo', error: error.message });
  }
};


// Devolver herramienta (Sin cambios respecto a la última versión que funcionaba)
export const returnTool = async (req, res) => {
   // ... (código de returnTool sin cambios) ...
  try {
    console.log('---------------------------------------------------');
    console.log('INICIO DEVOLUCIÓN DE HERRAMIENTA');
    console.log('ID del préstamo:', req.params.id);
    console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));

    let loan = await Loan.findById(req.params.id).populate('tool'); // Populate para verificar estado fácil
    if (!loan) {
      console.log('ERROR: Préstamo no encontrado');
      return res.status(404).json({ success: false, message: 'Préstamo no encontrado' });
    }
     if (loan.status !== 'active') {
        console.log(`INFO: El préstamo ${req.params.id} ya no está activo (estado: ${loan.status}). No se hace nada.`);
        // Considera devolver el préstamo actual por si la UI necesita actualizarse
        return res.status(200).json({ success: true, data: loan, message: `El préstamo ya estaba en estado: ${loan.status}` });
      }


    console.log('Préstamo encontrado:', JSON.stringify(loan, null, 2));

    // Verificar herramienta (si aún existe)
    const toolExists = loan.tool; // Ya populado
    if (!toolExists) {
      console.warn('ADVERTENCIA: La herramienta asociada a este préstamo ya no existe:', loan.tool?._id || 'ID Desconocido');
      // Decidir cómo proceder: ¿Aún marcar el préstamo como devuelto? Sí, probablemente.
    } else {
       console.log('Estado actual de la herramienta:', toolExists.status);
    }


    // Marcar préstamo como devuelto
    loan.actualReturn = new Date(); // Usar new Date()
    loan.status = 'returned';

    if (req.body.returnCondition) {
      console.log('Guardando condición de devolución:', req.body.returnCondition);
      // Asegúrate que el schema de Loan tenga un campo para esto si quieres guardarlo
      // loan.returnCondition = req.body.returnCondition; // Descomenta si tienes el campo en el schema
    }

    await loan.save();
    console.log('Préstamo actualizado a "returned" correctamente');

    // Actualizar estado de la herramienta SÓLO si la herramienta aún existe
    if (toolExists) {
        const newToolStatus = req.body.returnCondition?.hasDamage ? 'damaged' : 'available';
        console.log(`Intentando cambiar herramienta ${loan.tool._id} a estado: ${newToolStatus}`);
        try {
            const updatedTool = await Tool.findByIdAndUpdate(
                loan.tool._id,
                { status: newToolStatus },
                { new: true, runValidators: true }
            );
            if (updatedTool) {
                console.log('Estado final de la herramienta:', updatedTool.status);
            } else {
                 console.error(`ERROR: No se encontró la herramienta ${loan.tool._id} para actualizar su estado tras la devolución.`);
            }
        } catch(toolUpdateError) {
             console.error(`ERROR al actualizar estado de la herramienta ${loan.tool._id}:`, toolUpdateError);
             // Considera qué hacer aquí. El préstamo está devuelto, pero la herramienta no se actualizó.
        }
    }

    console.log('FIN DEVOLUCIÓN DE HERRAMIENTA');
    console.log('---------------------------------------------------');

    res.status(200).json({ success: true, data: loan });
  } catch (error) {
    console.error('ERROR GENERAL EN DEVOLUCIÓN:', error);
    res.status(500).json({ success: false, message: 'Error al devolver herramienta', error: error.message });
  }
};

// Obtener mis préstamos (Sin cambios)
export const getMyLoans = async (req, res) => {
  try {
    console.log(`[getMyLoans] Buscando préstamos activos para usuario: ${req.user._id}`);
    const loans = await Loan.find({ technician: req.user._id, status: 'active' })
      .populate({ path: 'tool', select: 'name category serialNumber location status' })
      .populate('technician', 'name email')
      .sort('-borrowedAt') // Ordenar por más reciente primero
      .lean();
    console.log(`[getMyLoans] Encontrados ${loans.length} préstamos activos`);
    res.status(200).json({ success: true, count: loans.length, data: loans });
  } catch (error) {
    console.error('Error en getMyLoans:', error);
    res.status(500).json({ success: false, message: 'Error al obtener herramientas prestadas', error: error.message });
  }
};

// import Loan from '../models/Loan.js';
// import Tool from '../models/Tool.js';

// // Obtener todos los préstamos
// export const getLoans = async (req, res) => {
//   try {
//     let query = {};
//     if (req.user.role !== 'admin') {
//       query.technician = req.user._id;
//     }

//     const loans = await Loan.find(query)
//       .populate('tool', 'name category serialNumber')
//       .populate('technician', 'name email')
//       .sort('-borrowedAt');

//     res.status(200).json({ success: true, count: loans.length, data: loans });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error al obtener préstamos', error: error.message });
//   }
// };

// // **Obtener un préstamo específico**
// export const getLoan = async (req, res) => {
//   try {
//     const loan = await Loan.findById(req.params.id)
//       .populate('tool', 'name category serialNumber')
//       .populate('technician', 'name email');

//     if (!loan) return res.status(404).json({ success: false, message: 'Préstamo no encontrado' });

//     if (req.user.role !== 'admin' && loan.technician._id.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ success: false, message: 'No autorizado para ver este préstamo' });
//     }

//     res.status(200).json({ success: true, data: loan });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error al obtener el préstamo', error: error.message });
//   }
// };

// // Crear un préstamo
// export const createLoan = async (req, res) => {
//   try {
//     console.log('DEBUG: req.body recibido en createLoan:', req.body); // <--- AÑADE ESTO
//     if (!req.user) {
//       return res.status(403).json({ success: false, message: 'No autorizado' });
//     }

//     // Extraer datos de la solicitud
//     const { tool, purpose, expectedReturn, loanDuration, vehicle } = req.body;
    
//     // Calcular la fecha de devolución esperada
//     let calculatedExpectedReturn;
    
//     // Si se proporciona una fecha explícita, utilizarla
//     if (expectedReturn) {
//       calculatedExpectedReturn = new Date(expectedReturn);
//     } 
//     // Si se proporciona una duración (en formato "1h", "2d", etc.), calcular la fecha
//     else if (loanDuration) {
//       calculatedExpectedReturn = new Date();
      
//       // Analizar la duración: formato esperado como "5h" (5 horas) o "3d" (3 días)
//       const unit = loanDuration.slice(-1); // Obtener última letra (h o d)
//       const value = parseInt(loanDuration.slice(0, -1)); // Obtener el número
      
//       if (unit === 'h') {
//         // Añadir horas
//         calculatedExpectedReturn.setHours(calculatedExpectedReturn.getHours() + value);
//       } else if (unit === 'd') {
//         // Añadir días
//         calculatedExpectedReturn.setDate(calculatedExpectedReturn.getDate() + value);
//       }
//     } 
//     // Si no se proporciona nada, establecer por defecto 3 días
//     else {
//       calculatedExpectedReturn = new Date();
//       calculatedExpectedReturn.setDate(calculatedExpectedReturn.getDate() + 3);
//     }

//     console.log('DEBUG: Fecha calculada para expectedReturn:', calculatedExpectedReturn); // <--- AÑADE ESTO

//     // Crear el nuevo préstamo con la fecha calculada
//     const newLoan = await Loan.create({
//       tool,
//       technician: req.user._id,
//       purpose,
//       vehicle, // Incluir el campo vehicle si existe en la solicitud
//       expectedReturn: calculatedExpectedReturn
//     });

//     // Actualizar el estado de la herramienta a "prestada"
//     await Tool.findByIdAndUpdate(tool, { status: 'borrowed' });

//     res.status(201).json({ success: true, data: newLoan });
//   } catch (error) {
//     console.error('Error al crear préstamo:', error);
//     res.status(500).json({ success: false, message: 'Error al crear préstamo', error: error.message });
//   }
// };

// // En controllers/loans.controller.js
// export const returnTool = async (req, res) => {
//   try {
//     console.log('---------------------------------------------------');
//     console.log('INICIO DEVOLUCIÓN DE HERRAMIENTA');
//     console.log('ID del préstamo:', req.params.id);
//     console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));
    
//     let loan = await Loan.findById(req.params.id);
//     if (!loan) {
//       console.log('ERROR: Préstamo no encontrado');
//       return res.status(404).json({ success: false, message: 'Préstamo no encontrado' });
//     }
    
//     console.log('Préstamo encontrado:', JSON.stringify(loan, null, 2));
//     console.log('ID de la herramienta:', loan.tool);

//     // Verificar si la herramienta existe
//     const toolBefore = await Tool.findById(loan.tool);
//     if (!toolBefore) {
//       console.log('ERROR: Herramienta no encontrada:', loan.tool);
//       return res.status(404).json({ success: false, message: 'Herramienta no encontrada' });
//     }
    
//     console.log('Estado actual de la herramienta:', toolBefore.status);

//     // Marcar préstamo como devuelto
//     loan.actualReturn = Date.now();
//     loan.status = 'returned';
    
//     if (req.body.returnCondition) {
//       console.log('Guardando condición de devolución:', req.body.returnCondition);
//       loan.returnCondition = req.body.returnCondition;
//     }
    
//     await loan.save();
//     console.log('Préstamo actualizado correctamente');

//     // Intentar diferentes métodos para actualizar la herramienta
//     let updateResult;
//     const newStatus = req.body.returnCondition && req.body.returnCondition.hasDamage ? 'damaged' : 'available';
    
//     console.log(`Intentando cambiar herramienta a estado: ${newStatus}`);
    
//     try {
//       // Método 1: findByIdAndUpdate
//       updateResult = await Tool.findByIdAndUpdate(
//         loan.tool,
//         { status: newStatus },
//         { new: true, runValidators: true }
//       );
//       console.log('Método 1 (findByIdAndUpdate) resultado:', updateResult ? 'Éxito' : 'Fallo');
//     } catch (updateError) {
//       console.error('Error en Método 1:', updateError.message);
      
//       // Método 2: buscar y luego actualizar
//       try {
//         const tool = await Tool.findById(loan.tool);
//         if (tool) {
//           tool.status = newStatus;
//           updateResult = await tool.save();
//           console.log('Método 2 (buscar y guardar) resultado:', updateResult ? 'Éxito' : 'Fallo');
//         } else {
//           console.log('Método 2: Herramienta no encontrada');
//         }
//       } catch (saveError) {
//         console.error('Error en Método 2:', saveError.message);
        
//         // Método 3: actualización directa
//         try {
//           updateResult = await Tool.updateOne(
//             { _id: loan.tool },
//             { $set: { status: newStatus } }
//           );
//           console.log('Método 3 (updateOne) resultado:', updateResult);
//         } catch (directError) {
//           console.error('Error en Método 3:', directError.message);
//         }
//       }
//     }
    
//     // Verificar estado final de la herramienta
//     const toolAfter = await Tool.findById(loan.tool);
//     console.log('Estado final de la herramienta:', toolAfter ? toolAfter.status : 'Herramienta no encontrada');
    
//     console.log('FIN DEVOLUCIÓN DE HERRAMIENTA');
//     console.log('---------------------------------------------------');

//     res.status(200).json({ success: true, data: loan });
//   } catch (error) {
//     console.error('ERROR GENERAL EN DEVOLUCIÓN:', error);
//     res.status(500).json({ success: false, message: 'Error al devolver herramienta', error: error.message });
//   }
// };

// // Devolver una herramienta
// // export const returnTool = async (req, res) => {
// //   try {
// //     console.log('---------------------------------------------------');
// //     console.log('INICIO DEVOLUCIÓN DE HERRAMIENTA');
// //     console.log('ID del préstamo:', req.params.id);
// //     console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));

// //     let loan = await Loan.findById(req.params.id);
// //     if (!loan) return res.status(404).json({ success: false, message: 'Préstamo no encontrado' });
// //     console.log('ERROR: Préstamo no encontrado');

// //     if (req.user.role !== 'admin' && loan.technician.toString() !== req.user._id.toString()) {
// //       return res.status(403).json({ success: false, message: 'No autorizado para devolver esta herramienta' });
// //     }

// //     console.log('Préstamo encontrado:', JSON.stringify(loan, null, 2));
// //     console.log('ID de la herramienta:', loan.tool);

// //     // Verificar estado actual de la herramienta
// //     const toolBefore = await Tool.findById(loan.tool);
// //     console.log('Estado actual de la herramienta:', toolBefore.status);

// //     // Nueva validación para evitar devolver herramientas ya devueltas
// //     if (loan.status === 'returned') {
// //       return res.status(400).json({ success: false, message: 'Esta herramienta ya ha sido devuelta' });
// //     }

// //     loan.actualReturn = Date.now();
// //     loan.status = 'returned';  // Esta línea es crucial
    
// //     // Si se incluyen datos sobre el estado de devolución, guardarlos
// //     if (req.body.returnCondition) {
// //       loan.returnCondition = req.body.returnCondition;
// //     }
    
// //     await loan.save();

// //     // Actualizar el estado de la herramienta a disponible
// //     // Si se reporta daño, marcar la herramienta como dañada
// //     if (req.body.returnCondition && req.body.returnCondition.hasDamage) {
// //       console.log(`Backend: MARCANDO HERRAMIENTA  ${loan.tool} COMO DAÑADA`);
// //       await Tool.findByIdAndUpdate(loan.tool, { status: 'damaged' });
// //     } else {
// //       console.log(`Backend: MARCANDO HERRAMIENTA  ${loan.tool} COMO DISPONIBLE`);
// //       await Tool.findByIdAndUpdate(loan.tool, { status: 'available' });
// //     }

// //   console.log('Resultado de la actualización:', JSON.stringify(updateResult, null, 2));

// //   // Verificar estado final de la herramienta
// //   const toolAfter = await Tool.findById(loan.tool);
// //   console.log('Estado final de la herramienta:', toolAfter.status);

// //   console.log('FIN DEVOLUCIÓN DE HERRAMIENTA');
// //   console.log('---------------------------------------------------');

// //   res.status(200).json({ success: true, data: loan });
// //   } catch (error) {
// //     console.error('ERROR EN DEVOLUCIÓN:', error);
// //     res.status(500).json({ success: false, message: 'Error al devolver herramienta', error: error.message });
// //   }

// // };

// export const getMyLoans = async (req, res) => {
//   try {
//     console.log(`[getMyLoans] Buscando préstamos activos para usuario: ${req.user._id}`);
    
//     const loans = await Loan.find({
//       technician: req.user._id,
//       status: 'active' // Asegurar que solo se devuelvan préstamos activos
//     })
//     .populate({
//       path: 'tool',
//       select: 'name category serialNumber status'
//     })
//     .populate('technician', 'name email')
//     .lean();  // Usar lean para mejorar rendimiento

//     console.log(`[getMyLoans] Encontrados ${loans.length} préstamos activos`);
    
//     res.status(200).json({ success: true, count: loans.length, data: loans });
//   } catch (error) {
//     console.error('Error en getMyLoans:', error);
//     res.status(500).json({ success: false, message: 'Error al obtener herramientas prestadas', error: error.message });
//   }
// };