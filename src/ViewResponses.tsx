import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { FormSchema } from './store';
import { Loader2, LogOut } from 'lucide-react';

export default function ViewResponses() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchData();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [formId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!formId) throw new Error("Form ID is missing");

      // Fetch form schema
      const schemaRef = doc(db, 'formSchemas', formId);
      const schemaSnap = await getDoc(schemaRef);
      
      if (!schemaSnap.exists()) {
        throw new Error("Form not found");
      }
      
      setFormSchema({ id: schemaSnap.id, ...schemaSnap.data() } as FormSchema);

      // Fetch responses
      const q = query(
        collection(db, 'volunteerApplications'),
        where('eventId', '==', formId)
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedResponses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setResponses(fetchedResponses);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      if (err.message.includes('Missing or insufficient permissions')) {
        setError("You do not have permission to view these responses. Please ensure your email is authorized.");
      } else {
        setError(err.message || "Failed to load responses");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#fe0000]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">View Responses</h1>
          <p className="text-gray-600 mb-8">Please sign in with your Google account to view the responses for this form.</p>
          <button
            onClick={handleLogin}
            className="w-full bg-[#fe0000] text-white py-3 rounded-md hover:bg-red-700 transition-colors font-medium"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-bold">{formSchema?.name || 'Form Responses'}</h1>
            <p className="text-gray-500 text-sm">Logged in as {user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Responses ({responses.length})</h2>
            </div>
            
            {responses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No responses found for this form yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-3 text-sm font-medium text-gray-600">Date</th>
                      <th className="p-3 text-sm font-medium text-gray-600">Submitter</th>
                      <th className="p-3 text-sm font-medium text-gray-600">Details</th>
                      <th className="p-3 text-sm font-medium text-gray-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((response) => (
                      <tr key={response.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 text-sm text-gray-800">
                          {new Date(response.submittedAt?.seconds * 1000).toLocaleString()}
                        </td>
                        <td className="p-3 text-sm text-gray-800">
                          {response.formData?.['Email'] || response.formData?.['Email Address'] || response.email || 'Unknown'}
                        </td>
                        <td className="p-3 text-sm text-gray-800">
                          <div className="space-y-1">
                            {Object.entries(response.formData || {}).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="font-semibold text-gray-600">{key}:</span>{' '}
                                {typeof value === 'string' && value.startsWith('http') ? (
                                  <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                    View Link
                                  </a>
                                ) : (
                                  <span className="text-gray-800">{String(value)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-right">
                          <button
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this response?')) {
                                try {
                                  await deleteDoc(doc(db, 'volunteerApplications', response.id));
                                  setResponses(prev => prev.filter(r => r.id !== response.id));
                                } catch (err) {
                                  console.error('Error deleting response:', err);
                                  alert('Failed to delete response. You may not have permission.');
                                }
                              }
                            }}
                            className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
