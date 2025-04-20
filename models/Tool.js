// frontend/src/pages/EditTool.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getToolById, updateTool, deleteTool, updateToolStatus } from '../services/api'; // Added updateToolStatus

const EditTool = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [toolData, setToolData] = useState({
    name: '',
    category: '',
    serialNumber: '',
    location: '',
    description: '',
    cost: 0, // Initialize cost state
    status: '' // Also fetch current status
  });
  const [newStatus, setNewStatus] = useState(''); // Separate state for status change
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch tool data
  const fetchTool = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getToolById(id);
      if (response.success && response.data) {
        // Set all fetched data, including cost and status
        setToolData({
          name: response.data.name || '',
          category: response.data.category || '',
          serialNumber: response.data.serialNumber || '',
          location: response.data.location || '',
          description: response.data.description || '',
          cost: response.data.cost || 0, // Use fetched cost or default to 0
          status: response.data.status || '' // Store current status
        });
        setNewStatus(response.data.status || ''); // Initialize status dropdown
      } else {
         throw new Error(response.message || 'Tool not found');
      }
    } catch (err) {
      setError(err.message || 'Error loading tool details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTool();
  }, [fetchTool]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setToolData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleStatusChange = (e) => {
      setNewStatus(e.target.value);
  };

  // Handle general tool details update (excluding status)
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setError('');
    setSuccess('');
    try {
       // Prepare data, ensure cost is a number
       const dataToUpdate = {
           ...toolData,
           cost: toolData.cost ? parseFloat(toolData.cost) : 0
       };
       if (isNaN(dataToUpdate.cost)) {
          throw new Error('Invalid cost value.');
       }
       delete dataToUpdate.status; // Do not update status via this submit

      await updateTool(id, dataToUpdate); // Pass only relevant fields
      setSuccess('Tool details updated successfully!');
      // Optionally refetch data
      // fetchTool();
    } catch (err) {
      setError(err.message || 'Error updating tool details.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle status update separately
  const handleStatusUpdate = async () => {
      if (newStatus === toolData.status) {
          alert("Status is already set to this value.");
          return;
      }
      if (!newStatus) {
          alert("Please select a valid status.");
          return;
      }

      // Add confirmation for potentially impactful changes
      let proceed = true;
      if (newStatus === 'damaged' || newStatus === 'maintenance') {
          proceed = window.confirm(`Are you sure you want to mark this tool as '${newStatus}'?`);
      } else if (newStatus === 'available' && toolData.status === 'borrowed') {
          proceed = window.confirm(`Marking this tool as 'available' assumes any active loan has been resolved. Proceed?`);
      }

      if (!proceed) return;

      setStatusLoading(true);
      setError('');
      setSuccess('');
      try {
          await updateToolStatus(id, { status: newStatus });
          setSuccess(`Tool status updated to '${newStatus}' successfully!`);
          // Update local state to reflect change immediately
          setToolData(prev => ({...prev, status: newStatus}));
      } catch(err) {
          setError(err.message || 'Error updating status.');
          // Revert dropdown if update fails?
          setNewStatus(toolData.status);
      } finally {
          setStatusLoading(false);
      }
  };

  // Handle tool deletion
  const handleDelete = async () => {
    // English confirmation prompt
    if (window.confirm(`Are you sure you want to delete the tool "${toolData.name}"? This action cannot be undone.`)) {
      setDeleteLoading(true);
      setError('');
      setSuccess('');
      try {
        await deleteTool(id);
        alert('Tool deleted successfully.'); // English Alert
        navigate('/admin/tools'); // Redirect after successful deletion
      } catch (err) {
        setError(err.message || 'Error deleting tool.');
      } finally {
        setDeleteLoading(false);
      }
    }
  };


  // Loading and Error states
  if (loading) {
     return <Layout><div className="text-center py-10"><p className="text-gray-500">Loading tool data...</p></div></Layout>;
  }
  if (error && !updateLoading && !statusLoading && !deleteLoading) { // Show main error if no action is in progress
     return (
        <Layout>
            <div className="p-4 sm:p-6 md:p-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <p>{error}</p>
                </div>
                <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={() => navigate('/admin/tools')}>
                    Back to Tool Management
                </button>
            </div>
        </Layout>
     );
  }

  // Tool status options for the dropdown
  const statusOptions = ['available', 'maintenance', 'damaged'];
  // Only add 'borrowed' if it's the current status (shouldn't be manually set)
  if (toolData.status === 'borrowed') {
      statusOptions.push('borrowed');
  }

  return (
    <Layout>
       {/* Consistent padding */}
      <div className="p-4 sm:p-6 md:p-8">
         {/* Header with Back link */}
         <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Edit Tool: {toolData.name}</h1>
            <Link to="/admin/tools" className="text-sm text-blue-600 hover:text-blue-800">
                &larr; Back to Tool Management
            </Link>
         </div>

         {/* Success/Error Messages for Actions */}
         {success && <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">{success}</div>}
         {error && (updateLoading || statusLoading || deleteLoading) && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}


         {/* Edit Details Form - Consistent Styling */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
             <div className="md:col-span-2 bg-white p-6 rounded-xl shadow">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Tool Details</h2>
                <form onSubmit={handleDetailsSubmit} className="space-y-4">
                   {/* Name Input */}
                   <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                    Tool Name *
                    </label>
                    <input
                    type="text" id="name" name="name" value={toolData.name} onChange={handleChange} required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  {/* Category Select */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                    Category *
                    </label>
                    <select
                    id="category" name="category" value={toolData.category} onChange={handleChange} required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                        {/* Options remain the same */}
                        <option value="diagnostico">Diagnostics</option>
                        <option value="manuales">Hand Tools</option>
                        <option value="electricas">Power Tools (Electric)</option>
                        <option value="neumaticas">Power Tools (Pneumatic)</option>
                        <option value="medicion">Measuring Tools</option>
                        <option value="motor_transmision">Engine & Transmission</option>
                        <option value="suspension_frenos">Suspension, Steering & Brakes</option>
                        <option value="aire_acondicionado">Air Conditioning (A/C)</option>
                        <option value="neumaticos_ruedas">Tires & Wheels</option>
                        <option value="manejo_fluidos">Fluid Handling</option>
                        <option value="elevacion_soporte">Lifting & Support Equipment</option>
                        <option value="otros">Other / Miscellaneous</option>
                    </select>
                  </div>

                  {/* Serial Number Input */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="serialNumber">
                    Serial Number
                    </label>
                    <input
                    type="text" id="serialNumber" name="serialNumber" value={toolData.serialNumber || ''} onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  {/* Location Input */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                    Location *
                    </label>
                    <input
                    type="text" id="location" name="location" value={toolData.location} onChange={handleChange} required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  {/* Cost Input - NEW */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cost">
                        Cost / Replacement Value ($)
                    </label>
                    <input
                    type="number"
                    id="cost"
                    name="cost"
                    value={toolData.cost || ''} // Use controlled input
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g., 150.75"
                    step="0.01"
                    min="0"
                    />
                  </div>

                  {/* Description Textarea */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                    Description
                    </label>
                    <textarea
                    id="description" name="description" value={toolData.description || ''} onChange={handleChange} rows="3"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end pt-2">
                    <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                    disabled={updateLoading}
                    >
                    {updateLoading ? 'Saving...' : 'Save Changes'} {/* English Text */}
                    </button>
                  </div>
                </form>
             </div>

            {/* Status and Delete Section */}
            <div className="md:col-span-1 space-y-6">
                 {/* Update Status Card */}
                <div className="bg-white p-6 rounded-xl shadow">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Update Status</h2>
                     <p className="text-sm text-gray-600 mb-3">Current Status:
                        <strong className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            toolData.status === 'available' ? 'bg-green-100 text-green-800' :
                            toolData.status === 'borrowed' ? 'bg-yellow-100 text-yellow-800' :
                            toolData.status === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                            toolData.status === 'damaged' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                           {toolData.status ? toolData.status.charAt(0).toUpperCase() + toolData.status.slice(1) : 'Unknown'}
                        </strong>
                     </p>
                     {toolData.status === 'borrowed' ? (
                        <p className="text-xs text-gray-500 italic mb-4">Status cannot be changed while tool is on loan. Return the loan first.</p>
                     ) : (
                         <>
                            <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">
                                Set New Status:
                            </label>
                            <select
                                id="status" name="status"
                                value={newStatus} onChange={handleStatusChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
                            >
                                {statusOptions.map(option => (
                                    <option key={option} value={option} disabled={option === 'borrowed' && toolData.status !== 'borrowed'}>
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={handleStatusUpdate}
                                className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                                disabled={statusLoading || newStatus === toolData.status} // Disable if no change or loading
                            >
                                {statusLoading ? 'Updating...' : 'Update Status'}
                            </button>
                         </>
                     )}
                </div>

                 {/* Delete Tool Card */}
                 <div className="bg-white p-6 rounded-xl shadow border border-red-300">
                    <h2 className="text-xl font-semibold mb-4 text-red-700">Delete Tool</h2>
                    <p className="text-sm text-gray-600 mb-4">
                       Deleting a tool is permanent and cannot be undone. Ensure the tool is not currently on loan.
                    </p>
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                        disabled={deleteLoading || toolData.status === 'borrowed'} // Disable if borrowed or deleting
                    >
                        {deleteLoading ? 'Deleting...' : 'Delete This Tool'}
                    </button>
                     {toolData.status === 'borrowed' && (
                         <p className="text-xs text-red-600 mt-2">Cannot delete while on loan.</p>
                     )}
                </div>

            </div>
         </div>


      </div>
    </Layout>
  );
};

export default EditTool;

// // backend/models/Tool.js
// import mongoose from 'mongoose';

// const ToolSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'Tool name is required'] // English validation message
//   },
//   category: {
//     type: String,
//     required: [true, 'Category is required'] // English validation message
//   },
//   serialNumber: {
//     type: String,
//     unique: true, // Keep unique constraint
//     sparse: true // Allows multiple null/missing values without violating uniqueness
//   },
//   status: {
//     type: String,
//     enum: ['available', 'borrowed', 'maintenance', 'damaged'],
//     default: 'available'
//   },
//   location: {
//     type: String,
//     required: [true, 'Location is required'] // English validation message
//   },
//   description: {
//     type: String,
//     default: ''
//   },
//   // --- NEW COST FIELD ---
//   cost: {
//     type: Number,
//     required: false, // Make it optional for now
//     min: [0, 'Cost cannot be negative'], // English validation message
//     default: 0 // Default to 0 if not provided
//   },
//   // --- END NEW COST FIELD ---
//   lastMaintenance: {
//     type: Date
//   },
//   addedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User' // Reference to the User model
//   }
// }, { timestamps: true }); // timestamps adds createdAt and updatedAt

// const Tool = mongoose.model('Tool', ToolSchema);
// export default Tool;