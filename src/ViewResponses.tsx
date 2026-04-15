import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc, orderBy, limit, startAfter } from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { FormSchema } from './store';
import { Loader2, LogOut, X } from 'lucide-react';

export default function ViewResponses() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Добавили стейт для открытия модалки конкретной заявки
  const [selectedResponse, setSelectedResponse] = useState<any>(null);

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

      const schemaRef = doc(db, 'formSchemas', formId);
      const schemaSnap = await getDoc(schemaRef);
      
      if (!schemaSnap.exists()) {
        throw new Error("Form not found");
      }
      
      setFormSchema({ id: schemaSnap.id, ...schemaSnap.data() } as FormSchema);

      const q = query(
        collection(db, 'volunteerApplications'),
        where('eventId', '==', formId),
        orderBy('timestamp', 'desc'),
        limit(30)
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedResponses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setResponses(fetchedResponses);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 30);
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

  const loadMore = async () => {
    if (!hasMore || loadingMore || !lastDoc || !formId) return;
    
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'volunteerApplications'),
        where('eventId', '==', formId),
        orderBy('timestamp', 'desc'),
        startAfter(lastDoc),
        limit(30)
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedResponses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setResponses(prev => [...prev, ...fetchedResponses]);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 30);
    } catch (err) {
      console.error("Error loading more responses:", err);
    } finally {
      setLoadingMore(false);
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

  // Обновленная логика сортировки как в админке
  const getOrderedFormData = (app: any) => {
    if (!app || !app.formData) return [];
    
    const orderedEntries: [string, any][] = [];
    const processedKeys = new Set<string>();

    if (formSchema && formSchema.fields) {
      formSchema.fields.forEach((field: any) => {
        const questionText = field.label || field.question; 
        if (app.formData[questionText] !== undefined) {
          orderedEntries.push([questionText, app.formData[questionText]]);
          processedKeys.add(questionText);
        }
      });
    }

    Object.entries(app.formData).forEach(([key, value]) => {
      if (!processedKeys.has(key)) {
        orderedEntries.push([key, value]);
      }
    });

    return orderedEntries;
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 md:p-8 font-mono">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold font-head uppercase">{formSchema?.name || 'Form Responses'}</h1>
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
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold uppercase">Responses ({responses.length})</h2>
            </div>
            
            {responses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No responses found for this form yet.
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase">
                        <th className="p-4 font-semibold">Date</th>
                        <th className="p-4 font-semibold">Submitter</th>
                        <th className="p-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {responses.map((response) => {
                        const orderedData = getOrderedFormData(response);
                        const firstVal = orderedData.length > 0 ? orderedData[0][1] : null;
                        const submitter = firstVal 
                          ? (Array.isArray(firstVal) ? firstVal.join(', ') : String(firstVal))
                          : (response.name || response.email || 'Unknown');
                        const date = response.timestamp?.toDate 
                          ? response.timestamp.toDate().toLocaleString() 
                          : response.submittedAt?.seconds 
                            ? new Date(response.submittedAt.seconds * 1000).toLocaleString() 
                            : 'Unknown';

                        return (
                          <tr key={response.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 text-gray-800 whitespace-nowrap">{date}</td>
                            <td className="p-4 text-gray-800">{submitter}</td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setSelectedResponse(response)}
                                className="text-xs bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800 transition-colors mr-2 uppercase tracking-wider"
                              >
                                View Details
                              </button>
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
                                className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded hover:bg-red-200 transition-colors uppercase tracking-wider"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                  {responses.map((response) => {
                    const orderedData = getOrderedFormData(response);
                    const firstVal = orderedData.length > 0 ? orderedData[0][1] : null;
                    const submitter = firstVal 
                      ? (Array.isArray(firstVal) ? firstVal.join(', ') : String(firstVal))
                      : (response.name || response.email || 'Unknown');
                    const date = response.timestamp?.toDate 
                      ? response.timestamp.toDate().toLocaleString() 
                      : response.submittedAt?.seconds 
                        ? new Date(response.submittedAt.seconds * 1000).toLocaleString() 
                        : 'Unknown';

                    return (
                      <div key={response.id} className="p-4 space-y-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div className="text-sm font-semibold text-gray-800 break-words">{submitter}</div>
                          <div className="text-xs text-gray-500 whitespace-nowrap shrink-0">{date}</div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setSelectedResponse(response)}
                            className="flex-1 text-xs bg-black text-white px-3 py-2 rounded hover:bg-gray-800 transition-colors uppercase tracking-wider text-center"
                          >
                            View Details
                          </button>
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
                            className="text-xs bg-red-100 text-red-600 px-3 py-2 rounded hover:bg-red-200 transition-colors uppercase tracking-wider"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            
            {hasMore && responses.length > 0 && (
              <div className="p-4 border-t border-gray-200 flex justify-center bg-white">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="text-sm font-mono text-gray-500 hover:text-black disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модальное окно для просмотра деталей заявки (как в админке) */}
      {selectedResponse && (
        <div 
          className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedResponse(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-center shrink-0 bg-white">
              <h3 className="text-xl font-bold font-head uppercase text-gray-900">Application Details</h3>
              <button 
                onClick={() => setSelectedResponse(null)} 
                className="text-[#6b7280] hover:text-[#fe0000] transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 font-mono text-sm text-gray-900 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 bg-[#f9fafb] p-4 rounded-lg border border-[#e5e7eb]">
                <div>
                  <span className="text-[#6b7280] text-xs uppercase block mb-1">Date</span>
                  {selectedResponse.timestamp?.toDate 
                    ? selectedResponse.timestamp.toDate().toLocaleString() 
                    : selectedResponse.submittedAt?.seconds 
                      ? new Date(selectedResponse.submittedAt.seconds * 1000).toLocaleString() 
                      : 'Unknown'}
                </div>
                <div>
                  <span className="text-[#6b7280] text-xs uppercase block mb-1">Type / Form</span>
                  <span className="capitalize">{formSchema?.name || selectedResponse.type || 'volunteer'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold border-b border-[#e5e7eb] pb-2 text-gray-900 uppercase">Submitted Data</h4>
                {selectedResponse.formData ? (
                  getOrderedFormData(selectedResponse).map(([key, value]) => (
                    <div key={key} className="break-words">
                      <span className="text-[#6b7280] text-xs uppercase block mb-1">{key}</span>
                      {typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')) ? (
                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-[#fe0000] hover:underline break-all">
                          {value}
                        </a>
                      ) : (
                        <div className="whitespace-pre-wrap bg-[#f9fafb] p-3 rounded border border-[#e5e7eb] text-gray-900">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-[#6b7280] italic">No dynamic form data found.</div>
                )}

                {/* Фолбэк если данные лежат в старом формате */}
                {!selectedResponse.formData && (
                  <>
                    {selectedResponse.name && (
                      <div>
                        <span className="text-[#6b7280] text-xs uppercase block mb-1">Name</span>
                        <div className="bg-[#f9fafb] p-3 rounded border border-[#e5e7eb]">{selectedResponse.name}</div>
                      </div>
                    )}
                    {selectedResponse.email && (
                      <div>
                        <span className="text-[#6b7280] text-xs uppercase block mb-1">Email</span>
                        <div className="bg-[#f9fafb] p-3 rounded border border-[#e5e7eb]">{selectedResponse.email}</div>
                      </div>
                    )}
                    {selectedResponse.phone && (
                      <div>
                        <span className="text-[#6b7280] text-xs uppercase block mb-1">Phone</span>
                        <div className="bg-[#f9fafb] p-3 rounded border border-[#e5e7eb]">{selectedResponse.phone}</div>
                      </div>
                    )}
                    {selectedResponse.motivation && (
                      <div>
                        <span className="text-[#6b7280] text-xs uppercase block mb-1">Motivation</span>
                        <div className="whitespace-pre-wrap bg-[#f9fafb] p-3 rounded border border-[#e5e7eb]">{selectedResponse.motivation}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}