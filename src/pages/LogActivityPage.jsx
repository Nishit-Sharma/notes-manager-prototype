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

  useEffect(() => {
    if (activityId) {
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
          }
        } catch (err) {
          console.error("Error fetching activity: ", err);
          setError('Failed to load activity data. Please try again.');
        }
        setIsLoading(false);
      };
      fetchActivity();
    } else {
      setExistingActivityData(null);
      setIsLoading(false);
      setError('');
    }
  }, [activityId, navigate]);

  const handleSave = () => {
    navigate('/activities'); 
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (activityId && isLoading) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <LogActivityForm 
        existingActivity={existingActivityData} 
        onSave={handleSave} 
        onCancel={handleCancel} 
      />
    </div>
  );
};

export default LogActivityPage; 