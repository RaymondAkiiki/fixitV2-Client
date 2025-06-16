import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPaperPlane, FaArrowLeft } from 'react-icons/fa';

// Service and Context Imports
import { useAuth } from '../../context/AuthContext.jsx';
import { createRequest } from '../../services/requestService.js';
import { getMyProfile } from '../../services/userService.js';

// Component Imports
import { Loader2 } from 'lucide-react';

// --- AddRequestPage Component ---
const AddRequestPage = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'plumbing',
        priority: 'medium',
        propertyId: '',
        unitId: '',
    });
    const [mediaFiles, setMediaFiles] = useState([]);
    const [tenancies, setTenancies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTenancies = async () => {
            if (!user) return;
            try {
                const profile = await getMyProfile();
                // Assumes profile.associations.tenancies is the structure from your backend
                const userTenancies = profile.associations?.tenancies || [];
                setTenancies(userTenancies);
                if (userTenancies.length > 0) {
                    // Pre-select the first available tenancy
                    setFormData(prev => ({
                        ...prev,
                        propertyId: userTenancies[0].property._id,
                        unitId: userTenancies[0].unit._id
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch user tenancies:", err);
                setError("Could not load your property information. Please go back and try again.");
            }
        };
        fetchTenancies();
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleTenancyChange = (e) => {
        const selectedTenancy = tenancies.find(t => t.unit._id === e.target.value);
        if (selectedTenancy) {
            setFormData(prev => ({
                ...prev,
                propertyId: selectedTenancy.property._id,
                unitId: selectedTenancy.unit._id,
            }));
        }
    };

    const handleFileChange = (e) => {
        setMediaFiles([...e.target.files]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.propertyId || !formData.unitId) {
            setError("You must select a property and unit.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await createRequest(formData, mediaFiles);
            alert("Request submitted successfully!"); // Replace with a better notification
            navigate('/tenant/requests');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit request.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-full">
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Submit a New Request</h1>
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black">
                    <FaArrowLeft />
                    Back to Requests
                </button>
            </header>
            
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>}

                {/* Notice if user is not associated with any property/unit */}
                {tenancies.length === 0 && (
                  <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-4">
                    <strong>Notice:</strong> You are not currently associated with any property or unit.
                    <br />
                    Please contact your property manager or landlord to be linked to your residence before submitting a request.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {tenancies.length > 1 && (
                        <div>
                            <label htmlFor="unitId" className="block text-sm font-medium text-gray-700 mb-1">Select your Unit</label>
                            <select id="unitId" name="unitId" value={formData.unitId} onChange={handleTenancyChange} className="w-full p-2 border border-gray-300 rounded-md">
                                {tenancies.map(t => (
                                    <option key={t.unit._id} value={t.unit._id}>
                                        {t.unit.unitName} at {t.property.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Request Title</label>
                        <input type="text" name="title" id="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., Leaking kitchen sink" required className="w-full p-2 border border-gray-300 rounded-md"/>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
                        <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} rows="4" placeholder="Please provide as much detail as possible..." required className="w-full p-2 border border-gray-300 rounded-md"></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select name="category" id="category" value={formData.category} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md">
                                <option value="plumbing">Plumbing</option>
                                <option value="electrical">Electrical</option>
                                <option value="hvac">HVAC (Heating & Cooling)</option>
                                <option value="appliance">Appliance</option>
                                <option value="general">General/Other</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select name="priority" id="priority" value={formData.priority} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="mediaFiles" className="block text-sm font-medium text-gray-700 mb-1">Upload Photos/Videos (Optional)</label>
                        <input type="file" name="mediaFiles" id="mediaFiles" onChange={handleFileChange} multiple className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"/>
                    </div>
                    
                    <div className="pt-4 border-t">
                        <button
                          type="submit"
                          disabled={loading || tenancies.length === 0}
                          className="w-full flex items-center justify-center gap-3 bg-[#219377] text-white font-semibold py-3 px-4 rounded-lg shadow-sm hover:bg-emerald-700 transition disabled:bg-gray-400"
                        >
                          {loading ? <Loader2 className="animate-spin" /> : <FaPaperPlane />}
                          {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddRequestPage;