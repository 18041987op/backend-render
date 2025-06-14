// backend/seedTools.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/database.js'; // Reuse your connection
import Tool from './models/Tool.js'; // Import the model

dotenv.config(); // Load environment variables

// --- Function to map Excel categories to system categories ---
const mapCategory = (excelCategory) => {
  const categoryMap = {
    'Diagnostics': 'diagnostico',
    'Engine & Transmission': 'motor_transmision',
    'Hand Tools': 'manuales',
    'hand Tools': 'manuales', // Handle case inconsistency
    'Suspension, Steering & Brakes': 'suspension_frenos',
    'Air Conditioning (A/C)': 'aire_acondicionado',
    'Fluid Handling': 'manejo_fluidos',
    'Electrical Tools': 'electricas_neumaticas',
    'Pneumatic Tools': 'electricas_neumaticas',
    'Tires & Wheels': 'neumaticos_ruedas',
    'Other / Miscellaneous': 'otros'
  };
  
  return categoryMap[excelCategory] || 'otros';
};

// --- Function to generate unique serial number ---
const generateSerialNumber = (partNumber, index) => {
  if (partNumber) {
    return `${partNumber}-${String(index).padStart(3, '0')}`;
  }
  return `TOOL-${String(index).padStart(4, '0')}`;
};

// --- Function to generate location based on category ---
const generateLocation = (category) => {
  const locationMap = {
    'diagnostico': ['Gabinete A1', 'Gabinete A2', 'Banco Diagnóstico'],
    'motor_transmision': ['Gabinete C1', 'Zona Motor', 'Banco Motor'],
    'manuales': ['Carro Taller 1', 'Carro Taller 2', 'Banco 1', 'Banco 2'],
    'suspension_frenos': ['Zona Suspensión', 'Gabinete B2', 'Zona Frenos'],
    'aire_acondicionado': ['Carro A/C', 'Zona A/C'],
    'manejo_fluidos': ['Zona Fluidos', 'Carro Taller 1'],
    'electricas_neumaticas': ['Zona Neumática', 'Zona Eléctrica', 'Zona Carga'],
    'neumaticos_ruedas': ['Zona Neumáticos', 'Área Ruedas'],
    'medicion': ['Banco 1', 'Gabinete A2'],
    'elevacion_soporte': ['Bahía 1', 'Bahía 2'],
    'otros': ['Almacén General', 'Zona Misceláneos']
  };
  
  const locations = locationMap[category] || locationMap['otros'];
  return locations[Math.floor(Math.random() * locations.length)];
};

// --- Complete list of Tools from Excel with all fields ---
const toolsDataFromExcel = [
  {
    name: 'Light Truck Diesel Compression Test Kit',
    category: 'Diagnostics',
    partNumber: 'GSI2025',
    description: 'Light Truck Diesel Compression Test Kit',
    estimatedCost: 209.95,
    purchaseDate: new Date('2019-10-23'),
    image: 'Light Truck Diesel Compression Test Kit',
    comments: null
  },
  {
    name: 'Valve Spring Compressor',
    category: 'Engine & Transmission',
    partNumber: 'SLC91400B',
    description: 'Valve Spring Compressor',
    estimatedCost: 179.95,
    purchaseDate: new Date('2019-09-28'),
    image: 'Valve Spring Compressor',
    comments: null
  },
  {
    name: 'Tap and Die Set',
    category: 'Hand Tools',
    partNumber: '40L824',
    description: '116 Pieces, #4-40 Min. Tap Thread Size, 1/2"-13/1/2"-20 Max. Tap Thread Size',
    estimatedCost: 707.75,
    purchaseDate: null,
    image: 'IRWIN Tap and Die Set',
    comments: null
  },
  {
    name: 'Camshaft & Crankshaft Tool Kit',
    category: 'Engine & Transmission',
    partNumber: 'PBT70960',
    description: 'Camshaft & Crankshaft Seal Tool Kit ',
    estimatedCost: 134.53,
    purchaseDate: new Date('2019-10-23'),
    image: 'Camshaft & Crankshaft Seal Tool Kit',
    comments: null
  },
  {
    name: 'Fuel Injection Master Kit ',
    category: 'Diagnostics',
    partNumber: 'GSI4325',
    description: 'Fuel Injection Master Kit ',
    estimatedCost: 569.95,
    purchaseDate: null,
    image: 'Fuel Injection Master Kit ',
    comments: null
  },
  {
    name: 'Bearing Race & Seal Set ',
    category: 'Hand Tools',
    partNumber: '45FF27',
    description: 'Bearing Race & Seal Set ',
    estimatedCost: 55,
    purchaseDate: null,
    image: 'Bearing Race & Seal Set ',
    comments: null
  },
  {
    name: 'Strut Spring Compressor Set',
    category: 'Suspension, Steering & Brakes',
    partNumber: '776-8016',
    description: 'MacPherson Strut Spring Compressor Set',
    estimatedCost: 35,
    purchaseDate: null,
    image: 'MacPherson Strut Spring Compressor Set',
    comments: null
  },
  {
    name: 'Puller/Bearing Separator Set',
    category: 'Hand Tools',
    partNumber: 'HRC4517',
    description: 'Puller/Bearing Separator Set',
    estimatedCost: 179.95,
    purchaseDate: new Date('2016-08-05'),
    image: 'Puller/Bearing Separator Set',
    comments: null
  },
  {
    name: 'Vacuum Pump - Automotive Test Kit',
    category: 'Diagnostics',
    partNumber: 'YA4000B',
    description: 'Use to test any part of any system that requires proper sealing or vacuum to operate. Also use to transfer fluids and bleed brakes.',
    estimatedCost: 190,
    purchaseDate: null,
    image: 'Vacuum Pump - Automotive Test Kit',
    comments: null
  },
  {
    name: 'Deluxe Orifice Tube Service Kit',
    category: 'Air Conditioning (A/C)',
    partNumber: '92311',
    description: 'Mastercool Deluxe Orifice Tube Service Kit',
    estimatedCost: 45.1,
    purchaseDate: null,
    image: 'Mastercool Deluxe Orifice Tube Service Kit',
    comments: null
  },
  {
    name: 'Blind Hole Bearing Puller Set ',
    category: 'Hand Tools',
    partNumber: 'OW4581',
    description: 'OTC Blind Hole Bearing Puller Sets 4581',
    estimatedCost: 199.95,
    purchaseDate: new Date('2018-02-16'),
    image: 'Blind Hole Bearing Puller Set ',
    comments: null
  },
  {
    name: 'Refrigerant Leak Detector ',
    category: 'Air Conditioning (A/C)',
    partNumber: 'MCL55900',
    description: 'Intella Sense, Refrigerant Leak Detector ',
    estimatedCost: 379.95,
    purchaseDate: null,
    image: 'Intella Sense, Refrigerant Leak Detector ',
    comments: null
  },
  {
    name: 'Timing Tool Set for Mini Cooper',
    category: 'Engine & Transmission',
    partNumber: 'ABN 3846',
    description: 'Engine Timing Tool Set for Mini Cooper N12, N14 - BMW, Citroen, Peugeot',
    estimatedCost: 21.99,
    purchaseDate: new Date('2019-04-18'),
    image: 'Timing Tool Set for Mini Cooper',
    comments: null
  },
  {
    name: 'Camshaft Timing Kit for Ford - 4.6L & 5.4L',
    category: 'Engine & Transmission',
    partNumber: '6498',
    description: 'OTC (6498) 4-Valve Camshaft Timing Kit for Ford - 4.6L & 5.4L',
    estimatedCost: 180.99,
    purchaseDate: null,
    image: 'OTC (6498) 4-Valve Camshaft Timing Kit for Ford - 4.6L & 5.4L',
    comments: null
  },
  {
    name: 'EGT Sensor Socket Set ',
    category: 'Hand Tools',
    partNumber: 'SLC15300',
    description: 'Cornwell EGT Sensor Socket Set ',
    estimatedCost: 235.7,
    purchaseDate: null,
    image: 'EGT Sensor Socket Set',
    comments: null
  },
  {
    name: 'Camshaft Timing Tool Kit for Ford - 4.0L',
    category: 'Engine & Transmission',
    partNumber: '6488',
    description: 'Camshaft Timing Tool Kit for Ford - 4.0L',
    estimatedCost: 276.99,
    purchaseDate: new Date('2019-06-20'),
    image: 'OTC 6488 Camshaft Timing Tool Kit for Ford - 4.0L',
    comments: null
  },
  {
    name: 'Pully Puller Installer Kit',
    category: 'Hand Tools',
    partNumber: '7768013',
    description: 'Evercraft Pully Puller Installer Kit',
    estimatedCost: 49.99,
    purchaseDate: null,
    image: 'Evercraft Pully Puller Installer Kit',
    comments: null
  },
  {
    name: 'Harmonic Damper Pulley Puller',
    category: 'Hand Tools',
    partNumber: 'HDP6490',
    description: 'Removes 3- and 6-spoke harmonic damper pulleys found on many Chrysler and GM engines',
    estimatedCost: 320,
    purchaseDate: null,
    image: 'Harmonic Damper Pulley Puller',
    comments: null
  },
  {
    name: 'Ratcheting Wrench Serpentine Belt Tool and Socket Set',
    category: 'Hand Tools',
    partNumber: '3680D',
    description: 'Gear Wrench Ratcheting Wrench Serpentine Belt Tool and Socket Set',
    estimatedCost: 70,
    purchaseDate: null,
    image: 'Gear Wrench Ratcheting Wrench Serpentine Belt Tool and Socket Set',
    comments: null
  },
  {
    name: 'Pneumatic Fan Clutch Wrench Set ',
    category: 'Hand Tools',
    partNumber: 'LS43300',
    description: 'Pneumatic Fan Clutch Wrench Set ',
    estimatedCost: 74.99,
    purchaseDate: null,
    image: 'Pneumatic Fan Clutch Wrench Set ',
    comments: null
  },
  {
    name: 'Vacuum Assist Coolant Refiller',
    category: 'Fluid Handling',
    partNumber: 'MSM-300CRA',
    description: 'Vacuum Assist Coolant Refiller',
    estimatedCost: 249.95,
    purchaseDate: null,
    image: 'Vacuum Assist Cooling System Refiller ',
    comments: null
  },
  {
    name: 'Transmission and Oil Pressure Tester',
    category: 'Diagnostics',
    partNumber: 'GSI3150',
    description: 'Transmission and Oil Pressure Tester',
    estimatedCost: 169.95,
    purchaseDate: null,
    image: 'Transmission and Oil Pressure Tester',
    comments: null
  },
  {
    name: 'Master Plus Disconnet Set ',
    category: 'Hand Tools',
    partNumber: '39850',
    description: 'Includes fuel line quick connect and spring lock couplings, air conditioning line couplings, and transmission oil cooler connectors',
    estimatedCost: 180,
    purchaseDate: null,
    image: 'Master Plus Disconnet Set ',
    comments: null
  },
  {
    name: 'Snap Ring Pliers, 8 Piece',
    category: 'Hand Tools',
    partNumber: 'PSR-8',
    description: 'Snap Ring Pliers, 8 Piece',
    estimatedCost: 75,
    purchaseDate: null,
    image: 'Snap Ring Pliers, 8 Piece',
    comments: null
  },
  {
    name: '3/8" Drive Flex Head Digital Torque Wrench',
    category: 'Hand Tools',
    partNumber: 'CTG3000ANG',
    description: 'Cornwell 3/8" Drive Flex Head Digital Torque Wrench Snap Latch Case',
    estimatedCost: 399.95,
    purchaseDate: null,
    image: 'Cornwell 3/8" Drive Flex Head Digital Torque Wrench Snap Latch Case',
    comments: null
  },
  {
    name: 'Fuel Injector Seal Tool Set for BMW ',
    category: 'Hand Tools',
    partNumber: 'BMW9054',
    description: 'Includes Test Lead Kit for easily and securely connecting Relay Test Jumpers to a multimeter',
    estimatedCost: 160,
    purchaseDate: null,
    image: 'Injection Seal Tool set ( BMW9054)',
    comments: null
  },
  {
    name: 'Master Relay Test Jump Set',
    category: 'Diagnostics',
    partNumber: '69300',
    description: 'Master Relay Test Jump Set',
    estimatedCost: 166.79,
    purchaseDate: new Date('2020-10-10'),
    image: 'Master Relay Test Jump Set',
    comments: null
  },
  {
    name: 'Battery Tester with Printer',
    category: 'Diagnostics',
    partNumber: 'BT2000',
    description: 'DHC Battery Tester with Printer',
    estimatedCost: 600,
    purchaseDate: null,
    image: 'DHC Battery Tester with Printer',
    comments: null
  },
  {
    name: 'In-Line Spark Checker Kit for Recessed Plug',
    category: 'Diagnostics',
    partNumber: '23970',
    description: 'In-Line Spark Checker Kit for Recessed Plug',
    estimatedCost: 25,
    purchaseDate: null,
    image: 'In-Line Spark Checker Kit for Recessed Plug',
    comments: null
  },
  {
    name: 'Separator Set - 5 Piece',
    category: 'Hand Tools',
    partNumber: '6299',
    description: 'Includes OTC numbers 6531 6532 6533 6534 and 6535 pickle forks',
    estimatedCost: 90,
    purchaseDate: null,
    image: 'Separator Set - 5 Piece',
    comments: null
  },
  {
    name: 'Crankshaft Seal Removal Kit for BMW',
    category: 'Hand Tools',
    partNumber: '7643',
    description: 'BMW Crankshaft Front & Rear Seal Removal & Installer Kit',
    estimatedCost: 200,
    purchaseDate: null,
    image: 'BMW Crankshaft Seal Removal Kit',
    comments: null
  },
  {
    name: 'Battery & Electrical System Analyzer',
    category: 'Diagnostics',
    partNumber: 'BT608',
    description: 'Battery & Electrical System Analyzer',
    estimatedCost: 500,
    purchaseDate: null,
    image: 'Touchscreen Battery & Electrical System Analyzer',
    comments: null
  },
  {
    name: '23-Piece Complete Auto Cooling System Tester',
    category: 'Diagnostics',
    partNumber: 'JFF1700',
    description: 'Proto 23-Piece Complete Auto Cooling System Tester',
    estimatedCost: 350,
    purchaseDate: null,
    image: 'Proto 23-Piece Complete Auto Cooling System Tester',
    comments: null
  },
  {
    name: 'Saw Rotary Tool ',
    category: 'Electrical Tools',
    partNumber: '80134',
    description: 'Great Neck Saw Rotary Tool ',
    estimatedCost: 35,
    purchaseDate: null,
    image: 'Great Neck Saw Rotary Tool ',
    comments: null
  },
  {
    name: 'Cordless Grease Gun',
    category: 'Suspension, Steering & Brakes',
    partNumber: 'CGG8850',
    description: 'Snap-On Cordless Grease Gun',
    estimatedCost: 250,
    purchaseDate: null,
    image: 'Snap-On Cordless Grease Gun',
    comments: null
  },
  {
    name: 'Super Duty Air Hammer Set ',
    category: 'Pneumatic Tools',
    partNumber: 'CAT3250AJMV',
    description: 'Cornwell Super Duty Air Hammer Set ',
    estimatedCost: 300,
    purchaseDate: null,
    image: 'Cornwell Super Duty Air Hammer Set ',
    comments: null
  },
  {
    name: '8 Piece Brake Tool Set',
    category: 'Suspension, Steering & Brakes',
    partNumber: 'CTG8BTS',
    description: 'Cornwell 8 Piece Brake Tool Set',
    estimatedCost: 104.95,
    purchaseDate: null,
    image: 'Cornwell 8 Piece Brake Tool Set',
    comments: null
  },
  {
    name: 'MaxiTPMS Relearn Tool TS508',
    category: 'Tires & Wheels',
    partNumber: 'TS508',
    description: 'Autel MaxiTPMS Relearn Tool',
    estimatedCost: 350,
    purchaseDate: null,
    image: 'Pre tire pressure monitoring system ',
    comments: null
  },
  {
    name: 'Mini-Ductor Venom Portable Induction Heater',
    category: 'Electrical Tools',
    partNumber: 'MDV-777',
    description: 'Mini-Ductor Venom Portable Induction Heater With Coil Twist Lock',
    estimatedCost: 550,
    purchaseDate: null,
    image: 'Mini-Ductor Venom Portable Induction Heater',
    comments: null
  },
  {
    name: 'Gear Driven Pneumatic Air Saw',
    category: 'Pneumatic Tools',
    partNumber: 'MT2219',
    description: 'Matco Tools Gear Driven Pneumatic Air Saw',
    estimatedCost: 200,
    purchaseDate: null,
    image: 'Matco Tools Gear Driven Pneumatic Air Saw',
    comments: null
  },
  {
    name: 'MaxiTPMS Relearn Tool TS401',
    category: 'Tires & Wheels',
    partNumber: 'TS401',
    description: 'Autel MaxiTPMS Relearn Tool',
    estimatedCost: 200,
    purchaseDate: null,
    image: 'Autel MaxiTPMS Relearn Tool TS401',
    comments: null
  },
  {
    name: 'Camshaft Timing Tool for Porsche',
    category: 'Engine & Transmission',
    partNumber: 'JTC 4240',
    description: 'Camshaft Timing Tool For Porsche',
    estimatedCost: 400,
    purchaseDate: null,
    image: 'Camshaft Timing Tool For Porsche',
    comments: null
  },
  {
    name: 'Automotive Compression Test Set ',
    category: 'Diagnostics',
    partNumber: 'EEPV500',
    description: 'Automotive Compression Test Set ',
    estimatedCost: 346,
    purchaseDate: null,
    image: 'Automotive Compression Test Set ',
    comments: null
  },
  {
    name: '8 PC Triple Square Drive Set ',
    category: 'Hand Tools',
    partNumber: 'XZN100',
    description: 'VIM 8 PC Triple Square Drive Set ',
    estimatedCost: 50,
    purchaseDate: null,
    image: 'VIM 8 PC Triple Square Drive Set ',
    comments: null
  },
  {
    name: 'Engine Camshaft Timing Locking Tool Kit',
    category: 'Engine & Transmission',
    partNumber: 'T40070',
    description: 'Camshaft Belt Locking Alignment Tools Set, Compatible with VW Audi',
    estimatedCost: 139.99,
    purchaseDate: null,
    image: 'ZAWAYINE Engine Camshaft Timing Locking Tool Kit',
    comments: null
  },
  {
    name: '22 Piece 3/8" Drive Ribe Power Bit Socket Set',
    category: 'Hand Tools',
    partNumber: 'CBSR222S',
    description: '22 Piece 3/8" Drive Ribe Power Bit Socket Set',
    estimatedCost: 134.95,
    purchaseDate: null,
    image: '22 Piece 3/8" Drive Ribe Power Bit Socket Set',
    comments: null
  },
  {
    name: 'Cordless Mini Torch and Soldering Iron Set',
    category: 'Electrical Tools',
    partNumber: 'ST100',
    description: 'Bernzomatic Cordless Mini Torch and Soldering Iron Set',
    estimatedCost: 35,
    purchaseDate: null,
    image: 'Bernzomatic Cordless Mini Torch and Soldering Iron Set',
    comments: null
  },
  {
    name: '8 pc Power Steering Puller Set',
    category: 'Hand Tools',
    partNumber: 'CJ3PSB',
    description: 'Snap-on 8 pc Power Steering Puller Set',
    estimatedCost: 360,
    purchaseDate: null,
    image: 'Snap-on 8 pc Power Steering Puller Set',
    comments: null
  },
  {
    name: 'Front End Service Set, 5-Piece',
    category: 'Suspension, Steering & Brakes',
    partNumber: 'W89303 ',
    description: 'For removal of most types of pitman arms, tie rods and ball joints found on automotive and light truck applications',
    estimatedCost: 100.98,
    purchaseDate: null,
    image: 'Front End Service Set, 5-Piece',
    comments: null
  },
  {
    name: '3/8 in Torque Wrench',
    category: 'Hand Tools',
    partNumber: 'J6018AB',
    description: '3/8 in Torque Wrench',
    estimatedCost: 700,
    purchaseDate: null,
    image: '3/8 in Torque Wrench',
    comments: null
  },
  {
    name: 'MDX-600 Battery and Electrical System Analyzer',
    category: 'Diagnostics',
    partNumber: 'MDX-600',
    description: 'MDX-600 Battery and Electrical System Analyzer',
    estimatedCost: 500,
    purchaseDate: null,
    image: 'MDX-600 Battery and Electrical System Analyzer',
    comments: null
  },
  {
    name: 'Camshaft Timing Chain Tool Kit for VW / Audi',
    category: 'Diagnostics',
    partNumber: 'T40133 ',
    description: 'Camshaft Timing Chain Tool Kit for VW / Audi',
    estimatedCost: 70,
    purchaseDate: null,
    image: 'Camshaft Timing Chain Tool Kit for VW / Audi',
    comments: null
  },
  {
    name: 'Camshaft Crankshaft Alignment Timing Locking Tool',
    category: 'Engine & Transmission',
    partNumber: '221006-1',
    description: 'Compatible with VOLVO Models 850 960 S40 S70 and S90 Heavy Duty Steel Construction-13 Pieces',
    estimatedCost: 50,
    purchaseDate: null,
    image: 'MOSTPLUS Camshaft Crankshaft Alignment Timing Locking Tool',
    comments: null
  },
  {
    name: 'MDX-224P Battery and Electrical System Analyzer',
    category: 'Diagnostics',
    partNumber: 'MDX-224P',
    description: 'MDX-224P Battery and Electrical System Analyzer',
    estimatedCost: 600,
    purchaseDate: null,
    image: 'MDX-224P Battery and Electrical System Analyzer',
    comments: null
  },
  {
    name: 'Master Inner Tie Rod Tool Set',
    category: 'Suspension, Steering & Brakes',
    partNumber: 'LS46800',
    description: 'Lisle Master Inner Tie Rod Tool Set',
    estimatedCost: 109.95,
    purchaseDate: null,
    image: 'Lisle Master Inner Tie Rod Tool Set',
    comments: null
  },
  {
    name: 'Master Wheel Hub & Bearing Remover & Installer Kit',
    category: 'Suspension, Steering & Brakes',
    partNumber: '27213',
    description: 'Back & Front Wheel Bearing Removal Tool',
    estimatedCost: 299.8,
    purchaseDate: new Date('2021-06-07'),
    image: 'OEMTOOLS 27213 Master Wheel Hub & Bearing Remover & Installer Kit',
    comments: null
  },
  {
    name: 'Cylinder Leakage Tester Kit',
    category: 'Diagnostics',
    partNumber: 'OTC 5609',
    description: 'OTC 5609 Cylinder Leakage Tester Kit',
    estimatedCost: 98.49,
    purchaseDate: new Date('2024-04-18'),
    image: 'OTC 5609 Cylinder Leakage Tester Kit',
    comments: null
  },
  {
    name: 'Infrared Thermometer with Target Laser',
    category: 'Diagnostics',
    partNumber: 'MCL52224 ',
    description: 'Infrared Thermometer with Target Laser',
    estimatedCost: 129.95,
    purchaseDate: null,
    image: 'Infrared Thermometer with Target Laser',
    comments: null
  },
  {
    name: '1/2" Drive Digital Torque Adapter',
    category: 'Electrical Tools',
    partNumber: '68283',
    description: 'Pittsburgh 1/2" Drive Digital Torque Adapter',
    estimatedCost: 67.57,
    purchaseDate: null,
    image: 'Pittsburgh 1/2" Drive Digital Torque Adapter',
    comments: null
  },
  {
    name: 'Infrared Thermometer with Laser Pointer',
    category: 'Diagnostics',
    partNumber: 'CP7876 ',
    description: 'Actron Infrared Thermometer with Laser Pointer',
    estimatedCost: 77.89,
    purchaseDate: null,
    image: 'Infrared Thermometer with Laser Pointer',
    comments: null
  },
  {
    name: 'Timing Tool Kit For BMW ',
    category: 'Engine & Transmission',
    partNumber: 'DPL',
    description: 'Compatible for BMW N51, N52, N53, N54, and N55 6-cylinder engines for precise timing adjustments',
    estimatedCost: 478.98,
    purchaseDate: null,
    image: 'Engine Timing Tool Kit For BMW ',
    comments: null
  },
  {
    name: 'Hydraulic Brake and Clutch Pressure Bleeding System',
    category: 'Fluid Handling',
    partNumber: 'MV6840 ',
    description: 'Mityvac MV6840 Hydraulic Brake and Clutch Pressure Bleeding System',
    estimatedCost: 390.99,
    purchaseDate: null,
    image: 'Mityvac MV6840 Professional Hydraulic Brake & Clutch Pressure Bleeding Syst',
    comments: null
  },
  {
    name: 'Genius 12V/24V 26 Amp Pro-Series Battery Charger',
    category: 'Diagnostics',
    partNumber: 'G26000 ',
    description: 'NOCO Genius G26000 12V/24V 26 Amp Pro-Series Battery Charger',
    estimatedCost: 385,
    purchaseDate: null,
    image: 'NOCO Genius 12V/24V 26 Amp Pro-Series Battery Charger',
    comments: null
  },
  {
    name: 'ATF Sealed Transmission Fluid Extractor and Refill Kit',
    category: 'Fluid Handling',
    partNumber: 'MV7412 ',
    description: 'Mityvac MV7412 ATF Sealed Transmission Fluid Extractor and Refill Kit',
    estimatedCost: 340.95,
    purchaseDate: null,
    image: 'Mityvac MV7412 ATF Sealed Transmission Fluid Extractor and Refill Kit',
    comments: null
  },
  {
    name: 'Engine Alignment Locking Timing Tool for BMW',
    category: 'Engine & Transmission',
    partNumber: 'CT0537',
    description: 'Engine Alignment Locking Timing Tool Compatible for BMW',
    estimatedCost: 59,
    purchaseDate: null,
    image: 'Engine Alignment Locking Timing Tool Compatible for BMW',
    comments: null
  },
  {
    name: 'Timing Chain Camshaft Locking Tool for BMW',
    category: 'Engine & Transmission',
    partNumber: 'VSE6111',
    description: 'Timing Chain Camshaft Locking Tool for BMW',
    estimatedCost: 500,
    purchaseDate: null,
    image: 'Timing Chain Camshaft Locking Tool for BMW',
    comments: null
  },
  {
    name: 'Timing Tool Camshaft Alignment for Jaguar / Land Rover',
    category: 'Engine & Transmission',
    partNumber: '5824091415',
    description: 'Petrol Timing Tools (V8) 5.0L Timing Tool Camshaft Alignment for Jaguar Land Rover',
    estimatedCost: 90,
    purchaseDate: null,
    image: 'Timing Tool Camshaft Alignment for Jaguar Land Rover',
    comments: null
  },
  {
    name: 'Noid Light/Iac Test Set 11Pc',
    category: 'Diagnostics',
    partNumber: 'VS2131',
    description: 'Noid Light/Iac Test Set 11Pc',
    estimatedCost: 104.99,
    purchaseDate: null,
    image: 'Noid Light/Iac Test Set 11Pc',
    comments: null
  },
  {
    name: 'Tube Flaring Kit',
    category: 'Other / Miscellaneous',
    partNumber: '5969',
    description: 'CENTRAL FORGE Tube Flaring Kit, 7 Piece',
    estimatedCost: 17.99,
    purchaseDate: null,
    image: 'Tube Flaring Kit',
    comments: null
  },
  {
    name: '3/8" Bolt Extractor Set',
    category: 'Hand Tools',
    partNumber: '394001',
    description: 'IRWIN Bolt Extractor Set, 5-Piece',
    estimatedCost: 25.95,
    purchaseDate: null,
    image: 'IRWIN Bolt Extractor Set, 5-Piece',
    comments: null
  },
  {
    name: 'Timing Chain Tool Kit for Mercedes',
    category: 'Engine & Transmission',
    partNumber: 'ABN-2450',
    description: 'Timing Chain Tool Kit For Mercedes',
    estimatedCost: 59.9,
    purchaseDate: null,
    image: 'Timing Chain Riveting Tools Set For Mercedes Benz ',
    comments: null
  },
  {
    name: 'Timing Chain Tool Kit for VW / Audi',
    category: 'Engine & Transmission',
    partNumber: 'RLT40271KIT ',
    description: 'Timing Chain Tool Kit for VW / Audi',
    estimatedCost: 49.99,
    purchaseDate: null,
    image: 'Timing Chain Tool Kit for VW / Audi',
    comments: null
  },
  {
    name: 'Camshaft Alignment Timing Tool Kit for BMW / Mini ',
    category: 'Engine & Transmission',
    partNumber: 'B09L4694R5',
    description: 'Camshaft Alignment Timing Tool Kit for BMW / Mini ',
    estimatedCost: 47,
    purchaseDate: new Date('2022-07-12'),
    image: 'Camshaft Alignment Timing Tool Kit for BMW / Mini ',
    comments: null
  },
  {
    name: 'Timing Alignment Locking Tool Kit for BMW',
    category: 'Engine & Transmission',
    partNumber: '119460',
    description: 'Timing Alignment Locking Tool Kit for BMW',
    estimatedCost: 63.99,
    purchaseDate: null,
    image: 'Timing Alignment Locking Tool Kit for BMW',
    comments: null
  },
  {
    name: 'Timing Tool Kit for Ford / Mazda',
    category: 'Engine & Transmission',
    partNumber: 'HTF1010C',
    description: 'Timing Tool Kit for Ford / Mazda (Camshaft Flywheel Locking)',
    estimatedCost: 37.59,
    purchaseDate: new Date('2021-09-10'),
    image: 'Timing Tool Kit for Ford / Mazda',
    comments: null
  },
  {
    name: 'Wheel Lock Removal Socket Set',
    category: 'Hand Tools',
    partNumber: 'LSR1000A',
    description: 'Snap-on Wheel Lock Removal Socket Set',
    estimatedCost: 415,
    purchaseDate: null,
    image: 'Snap-on Wheel Lock Removal Socket Set',
    comments: null
  },
  {
    name: 'Compression Tester',
    category: 'Diagnostics',
    partNumber: '7768080',
    description: 'Compression Tester',
    estimatedCost: 41.49,
    purchaseDate: null,
    image: 'Compression Tester',
    comments: null
  },
  {
    name: '3 Pc. Ratcheting Flex Head Flare Nut Metric Wrench Set',
    category: 'Hand Tools',
    partNumber: 'TP89099',
    description: '3 Pc. Ratcheting Flex Head Flare Nut Metric Wrench Set',
    estimatedCost: 38,
    purchaseDate: null,
    image: '3 Pc. Ratcheting Flex Head Flare Nut Metric Wrench Set',
    comments: null
  },
  {
    name: '3 Pc. Ratcheting Flex Head Flare Nut Metric Wrench Set',
    category: 'Hand Tools',
    partNumber: 'TP89098',
    description: '3 Pc. Ratcheting Flex Head Flare Nut Metric Wrench Set',
    estimatedCost: 38,
    purchaseDate: null,
    image: '3 Pc. Ratcheting Flex Head Flare Nut Metric Wrench Set',
    comments: null
  },
  {
    name: 'Timing Tool Kit for BMW (N63)',
    category: 'Engine & Transmission',
    partNumber: 'CTA 2893 ',
    description: 'Timing Tool Kit for BMW (N63)',
    estimatedCost: 249.82,
    purchaseDate: null,
    image: 'Timing Tool Kit for BMW (N63)',
    comments: null
  },
  {
    name: 'A/C Oil Injector Kit ',
    category: 'Air Conditioning (A/C)',
    partNumber: '06S32MD41TAOB',
    description: 'A/C Oil Injector Kit for Compressor Filling Tube for Leak Monitoring',
    estimatedCost: 43.65,
    purchaseDate: null,
    image: 'A/C Oil Injector Kit ',
    comments: null
  },
  {
    name: 'Specialty Switch Socket Set, 7-Piece',
    category: 'Hand Tools',
    partNumber: 'W89333',
    description: 'Specialty Switch Socket Set, 7-Piece',
    estimatedCost: 61.66,
    purchaseDate: null,
    image: 'Specialty Switch Socket Set, 7-Piece',
    comments: null
  },
  {
    name: '5 Point Security Bit Socket Set',
    category: 'Hand Tools',
    partNumber: 'VMV5PSD',
    description: 'VIM Tools 5 Point Security Bit Socket Set',
    estimatedCost: 70.45,
    purchaseDate: null,
    image: 'VIM Tools 5 Point Security Bit Socket Set',
    comments: null
  },
  {
    name: 'Universal Air Conditioner to 1046C A/C Repair Tool',
    category: 'Air Conditioning (A/C)',
    partNumber: '1046C',
    description: 'Universal Air Conditioner to 1046C A/C Repair Tool',
    estimatedCost: 69.29,
    purchaseDate: null,
    image: 'UAC Universal Air Conditioner to 1046C A/C Repair Tool',
    comments: null
  },
  {
    name: 'Camshaft Tensioning Alignment Locking Tool Kit for Chevrolet ',
    category: 'Engine & Transmission',
    partNumber: '27170',
    description: 'Camshaft Tensioning Alignment Locking Tool Kit for Chevrolet ',
    estimatedCost: 100,
    purchaseDate: null,
    image: 'Camshaft Tensioning Alignment Locking Tool Kit for Chevrolet ',
    comments: null
  },
  {
    name: 'Inductive Timing Light',
    category: 'Engine & Transmission',
    partNumber: 'CP7527',
    description: 'Actron CP7527 Inductive Timing Light 10.30 x 12.80 x 12.50 inches',
    estimatedCost: 55.99,
    purchaseDate: null,
    image: 'Actron CP7527 Inductive Timing Light 10.30 x 12.80 x 12.50 inches',
    comments: null
  },
  {
    name: 'Camshaft Alignment Timing Locking Tool Set for BMW ',
    category: 'Engine & Transmission',
    partNumber: 'CT3773',
    description: 'Camshaft Alignment Timing Locking Tool Set for BMW ',
    estimatedCost: 50,
    purchaseDate: null,
    image: 'Camshaft Alignment Timing Locking Tool Set for BMW ',
    comments: null
  },
  {
    name: 'Turbo Camshaft Engine Timing Locking Tool Kit for Chevrolet ',
    category: 'Engine & Transmission',
    partNumber: 'BT594260',
    description: 'Turbo Camshaft Engine Timing Locking Tool Kit for Chevrolet ',
    estimatedCost: 44.09,
    purchaseDate: null,
    image: 'Turbo Camshaft Engine Timing Locking Tool Kit for Chevrolet ',
    comments: null
  },
  {
    name: 'Crankshaft Damper Holding Tool for Honda / Acura ',
    category: 'Engine & Transmission',
    partNumber: '776-8031 ',
    description: 'EverCraft Crankshaft Damper Holding Tool for Honda / Acura ',
    estimatedCost: 25,
    purchaseDate: null,
    image: 'Crankshaft Damper Holding Tool for Honda / Acura ',
    comments: null
  },
  {
    name: 'Timing Chain Remove Tool Kit for BMW',
    category: 'Engine & Transmission',
    partNumber: 'WT04A2194',
    description: 'Timing Chain Remove Tool Kit for BMW',
    estimatedCost: 27.56,
    purchaseDate: null,
    image: 'Timing Chain Remove Tool Kit for BMW',
    comments: null
  },
  {
    name: '7 Piece 3/8" & 1/2" Drive SAE Hex Bit Socket Set',
    category: 'Hand Tools',
    partNumber: 'CBS-M723S',
    description: '7 Piece 3/8" & 1/2" Drive SAE Hex Bit Socket Set',
    estimatedCost: 79.95,
    purchaseDate: null,
    image: '7 Piece 3/8" & 1/2" Drive SAE Hex Bit Socket Set',
    comments: null
  },
  {
    name: 'Heavy Duty Pistol Grip Grease',
    category: 'Hand Tools',
    partNumber: 'CTGPGGG ',
    description: 'Cornwell Heavy Duty Pistol Grip Grease',
    estimatedCost: 58.95,
    purchaseDate: null,
    image: 'Cornwell Heavy Duty Pistol Grip Grease',
    comments: null
  },
  {
    name: 'Oil Suction Gun',
    category: 'Fluid Handling',
    partNumber: 'AGS7759',
    description: 'Oil Suction Gun',
    estimatedCost: 55.95,
    purchaseDate: null,
    image: 'Oil Suction Gun',
    comments: null
  },
  {
    name: 'Holding Wrench for Crankshaft Belt Pulley for VW',
    category: 'Hand Tools',
    partNumber: 'BGS 66701',
    description: 'Holding Wrench for Crankshaft Belt Pulley for VW',
    estimatedCost: 100,
    purchaseDate: null,
    image: 'Holding Wrench for Crankshaft Belt Pulley for VW',
    comments: null
  },
  {
    name: '8 pc 3/8" Drive Impact Driver Set',
    category: 'Hand Tools',
    partNumber: '208EPIT',
    description: '8 pc 3/8" Drive Impact Driver Set',
    estimatedCost: 403,
    purchaseDate: null,
    image: '8 pc 3/8" Drive Impact Driver Set',
    comments: null
  },
  {
    name: 'Intake/Exhaust Cam Sprocket Tool Wrench Holder Tool Kit for Subaru',
    category: 'Hand Tools',
    partNumber: '499977500',
    description: 'Intake/Exhaust Cam Sprocket Tool Wrench Holder Tool Kit for Subaru',
    estimatedCost: 50,
    purchaseDate: null,
    image: 'Intake/Exhaust Cam Sprocket Tool Wrench Holder Tool Kit for Subaru',
    comments: null
  },
  {
    name: 'Three Way Exhaust Back Pressure Kit',
    category: 'Diagnostics',
    partNumber: 'STATU24APB',
    description: 'Three Way Exhaust Back Pressure Kit',
    estimatedCost: 109.9,
    purchaseDate: null,
    image: 'Three Way Exhaust Back Pressure Kit',
    comments: null
  },
  {
    name: 'A/C Orifice Tube Service Kit',
    category: 'Air Conditioning (A/C)',
    partNumber: 'ACT2105',
    description: 'A/C Orifice Tube Service Kit',
    estimatedCost: 83.25,
    purchaseDate: null,
    image: 'A/C Orifice Tube Service Kit',
    comments: null
  },
  {
    name: '12 Piece 1/4", 3/8" & 1/2" Drive Impact Inverted Star Plus Bit Socket Set',
    category: 'Hand Tools',
    partNumber: 'CBSTXIP12023S ',
    description: '12 Piece 1/4", 3/8" & 1/2" Drive Impact Inverted Star Plus Bit Socket Set',
    estimatedCost: 112.95,
    purchaseDate: null,
    image: '12 Piece 1/4", 3/8" & 1/2" Drive Impact Inverted Star Plus Bit Socket Set',
    comments: null
  },
  {
    name: 'Back Pressure Tester',
    category: 'Diagnostics',
    partNumber: 'MDBPT1',
    description: 'Matco Back Pressure Tester',
    estimatedCost: 50,
    purchaseDate: null,
    image: 'Matco Back Pressure Tester',
    comments: null
  },
  {
    name: 'Hole Dozer Bi-Metal Hole Saw Set',
    category: 'Hand Tools',
    partNumber: '49-22-4009 ',
    description: 'Milwaukee 49-22-4009 Hole Dozer Bi-Metal Hole Saw Set (9-Piece)',
    estimatedCost: 69,
    purchaseDate: null,
    image: 'Milwaukee 49-22-4009 Hole Dozer Bi-Metal Hole Saw Set (9-Piece)',
    comments: null
  },
  {
    name: 'Pneumatic Fan Clutch Wrench Set ',
    category: 'Hand Tools',
    partNumber: '43300',
    description: 'Pneumatic Fan Clutch Wrench Set ',
    estimatedCost: 127.57,
    purchaseDate: null,
    image: 'Pneumatic Fan Clutch Wrench Set ',
    comments: null
  },
  {
    name: '8 Piece Front Wheel Drive Axle Nut Socket Set',
    category: 'Hand Tools',
    partNumber: 'HRC4547B ',
    description: '8 Piece Front Wheel Drive Axle Nut Socket Set',
    estimatedCost: 167.95,
    purchaseDate: null,
    image: '8 Piece Front Wheel Drive Axle Nut Socket Set',
    comments: null
  },
  {
    name: 'Differential Side Bearing Puller Set',
    category: 'Hand Tools',
    partNumber: '4520',
    description: 'Differential Side Bearing Puller Set',
    estimatedCost: 134.99,
    purchaseDate: null,
    image: 'OTC Differential Side Bearing Puller Set',
    comments: null
  },
  {
    name: 'Camshaft Alignment Timing Tool for Mercedes',
    category: 'Engine & Transmission',
    partNumber: 'CP101513',
    description: 'Camshaft Alignment Timing Tool for Mercedes',
    estimatedCost: 65.99,
    purchaseDate: null,
    image: 'Camshaft Alignment Timing Tool for Mercedes',
    comments: null
  },
  {
    name: 'Drive Pear-End Quick-Release Ratchet',
    category: 'Hand Tools',
    partNumber: 'PAR-12RHT-15',
    description: 'Drive Pear-End Quick-Release Ratchet',
    estimatedCost: 25,
    purchaseDate: null,
    image: 'Drive Pear-End Quick-Release Ratchet',
    comments: null
  },
  {
    name: 'Chain Wrench',
    category: 'Hand Tools',
    partNumber: 'HRC60 ',
    description: 'Chain Wrench',
    estimatedCost: 176.38,
    purchaseDate: null,
    image: 'Chain Wrench',
    comments: null
  },
  {
    name: 'Fuel Level Sensor Lock Ring Tool for BMW',
    category: 'Hand Tools',
    partNumber: 'BMW4622',
    description: 'Fuel Level Sensor Lock Ring Tool for BMW',
    estimatedCost: 89.89,
    purchaseDate: null,
    image: 'Fuel Level Sensor Lock Ring Tool for BMW',
    comments: null
  },
  {
    name: 'Drive Socket Set ',
    category: 'Hand Tools',
    partNumber: 'AISTS10P',
    description: 'Drive Socket Set ',
    estimatedCost: 17.99,
    purchaseDate: null,
    image: 'Drive Socket Set ',
    comments: null
  },
  {
    name: 'Radio Removal Tool Kit',
    category: 'Other / Miscellaneous',
    partNumber: '4715',
    description: 'Radio Removal Tool Kit',
    estimatedCost: 58.99,
    purchaseDate: null,
    image: 'Radio Removal Tool Kit',
    comments: null
  },
  {
    name: '5 Piece Metric Double Box Universal Spline Reversible Ratcheting Wrench Set',
    category: 'hand Tools',
    partNumber: 'PI1362704',
    description: '5 Piece Metric Double Box Universal Spline Reversible Ratcheting Wrench Set',
    estimatedCost: 200.35,
    purchaseDate: null,
    image: '5 Piece Metric Double Box Universal Spline Reversible Ratcheting Wrench Set',
    comments: null
  }
];

// Map Excel data to MongoDB format
const toolsData = toolsDataFromExcel.map((tool, index) => {
  const mappedCategory = mapCategory(tool.category);
  const serialNumber = generateSerialNumber(tool.partNumber, index + 1);
  const location = generateLocation(mappedCategory);
  
  return {
    name: tool.name,
    category: mappedCategory,
    serialNumber: serialNumber,
    location: location,
    description: tool.description,
    cost: tool.estimatedCost, // Maps to your existing 'cost' field
    partNumber: tool.partNumber, // New field added to model
    purchaseDate: tool.purchaseDate, // New field added to model
    image: tool.image, // Include image reference
    comments: tool.comments // Include comments (null if don't exist)
  };
});

console.log(`Processing ${toolsData.length} tools from Excel...`);

// --- Function to insert data ---
const seedDB = async () => {
  try {
    await connectDB(); // Connect to DB
    console.log('Connected to MongoDB for seeding...');

    // DELETE existing tools before inserting
    console.log('Deleting existing tools...');
    const deleteResult = await Tool.deleteMany({});
    console.log(`${deleteResult.deletedCount} tools deleted.`);

    console.log(`Inserting ${toolsData.length} tools from inventory...`);
    const insertResult = await Tool.insertMany(toolsData);
    console.log(`${insertResult.length} tools inserted successfully!`);

    // Show summary by categories
    const categoryCount = {};
    toolsData.forEach(tool => {
      categoryCount[tool.category] = (categoryCount[tool.category] || 0) + 1;
    });

    console.log('\n--- Summary by Categories ---');
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`${category}: ${count} tools`);
    });

    console.log('\n--- Data Statistics ---');
    const toolsWithDate = toolsData.filter(tool => tool.purchaseDate).length;
    const toolsWithImages = toolsData.filter(tool => tool.image).length;
    const toolsWithComments = toolsData.filter(tool => tool.comments).length;
    
    console.log(`Tools with purchase date: ${toolsWithDate}`);
    console.log(`Tools with image: ${toolsWithImages}`);
    console.log(`Tools with comments: ${toolsWithComments}`);

  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    console.log('Closing MongoDB connection...');
    await mongoose.connection.close();
    process.exit(); // Exit script
  }
};

// --- Execute function ---
seedDB();