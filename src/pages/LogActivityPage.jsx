import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import LogActivityForm from '../components/LogActivityForm';

const LogActivityPage = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  
  const [existingActivityData, setExistingActivityData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageTitle, setPageTitle] = useState('Log New Office Activity');

  useEffect(() => {
    if (activityId) {
      setPageTitle('Edit Office Activity');
      setIsLoading(true);
      setError('');
      const fetchActivity = async () => {
        try {
          const activityRef = doc(db, 'activityLogs', activityId);
          const activitySnap = await getDoc(activityRef);
          if (activitySnap.exists()) {
            setExistingActivityData({ id: activitySnap.id, ...activitySnap.data() });
          } else {
            console.error("No such activity found!");
            setError('Activity not found. It may have been deleted.');
            // navigate('/activities', { replace: true }); // REMOVED COMMENTED OUT CODE
          }
        } catch (err) {
          console.error("Error fetching activity: ", err);
          setError('Failed to load activity data. Please try again.');
        }
        setIsLoading(false);
      };
      fetchActivity();
    } else {
      setPageTitle('Log New Office Activity');
      setExistingActivityData(null); // Clear any previous edit data when creating new
    }
  }, [activityId, navigate]);

  const handleSave = () => {
    // After successful save, navigate away. 
    // If it was an edit, navigate to activities list, if new, maybe to activities or dashboard.
    // For simplicity, always go to activity list for now.
    navigate('/activities'); 
  };

  const handleCancel = () => {
    navigate(-1); // Go back to the previous page
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading activity details...</div>;
  }

  if (error) {
    return (
        <div className="p-6 text-center bg-red-100 text-red-700 rounded-md">
            <p>{error}</p>
            <button onClick={() => navigate('/activities')} className="mt-4 btn-secondary">
                Go to Activities List
            </button>
        </div>
    );
  }

  // If activityId is present but existingActivityData is not yet loaded (and not loading, and no error),
  // it means we are in edit mode but data is not found (already handled by error state ideally)
  // or we are switching from edit to new, this ensures form gets null.
  if (activityId && !existingActivityData && !isLoading && !error) {
    // This case should ideally be covered by the error state if doc doesn't exist
    // If we land here, it means fetch completed, no doc, but error wasn't set or loading didn't stop it.
    // This can happen briefly if navigate happens before state update or due to timing.
    // Returning null or a specific message can prevent rendering form with stale/no data in edit mode.
    return <div className="p-6 text-center">Verifying activity data...</div>; 
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* <h1 className="text-2xl font-semibold mb-6">{pageTitle}</h1> */} {/* REMOVED COMMENTED OUT CODE */}
      <LogActivityForm 
        existingActivity={existingActivityData} 
        onSave={handleSave} 
        onCancel={handleCancel} 
      />
    </div>
  );
};

export default LogActivityPage; 