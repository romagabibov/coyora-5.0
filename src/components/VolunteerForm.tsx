import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Toast } from './Toast';
import { FormField } from '../store';

interface VolunteerFormProps {
  eventId: string;
  eventName: string;
  type: string;
  fields?: FormField[];
  onSuccess: () => void;
  lang: string;
  translate: (key: string | undefined) => string;
}

const uploadPhotoToDrive = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      
      try {
        const scriptUrl = "https://script.google.com/macros/s/AKfycbwvYrYkuPDu4oIUCQQJAoy_xfs4WjlG7C06ZcYtdgf0hkrif91qEWGgmmlWpjmQSWqp/exec"; 
        
        const response = await fetch(scriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            base64: base64Data
          })
        });
        
        const result = await response.json();
        
        if (result.status === "success") {
          resolve(result.url);
        } else {
          reject(result.message);
        }
      } catch (error) {
        reject("Ошибка при отправке файла: " + error);
      }
    };
    reader.onerror = error => reject("Ошибка при чтении файла: " + error);
  });
};

export function VolunteerForm({ eventId, eventName, type, fields, onSuccess, lang, translate }: VolunteerFormProps) {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const [toastIsError, setToastIsError] = useState(false);

  const showToast = (msg: string, isError: boolean = false) => {
    setToastMessage(msg);
    setToastIsError(isError);
    setIsToastVisible(true);
  };

  const defaultSteps = [
    {
      id: 'name',
      question: translate('What is your full name?'),
      type: 'text',
      required: true,
      placeholder: 'John Doe',
      allowedFileTypes: undefined,
      options: undefined
    },
    {
      id: 'email',
      question: translate('What is your email address?'),
      type: 'email',
      required: true,
      placeholder: 'john@example.com',
      allowedFileTypes: undefined,
      options: undefined
    },
    {
      id: 'phone',
      question: translate('What is your phone number?'),
      type: 'tel',
      required: true,
      placeholder: '+1 234 567 8900',
      allowedFileTypes: undefined,
      options: undefined
    },
    {
      id: 'motivation',
      question: translate('Why do you want to volunteer with us?'),
      type: 'textarea',
      required: true,
      placeholder: translate('Tell us about your motivation...'),
      allowedFileTypes: undefined,
      options: undefined
    },
    {
      id: 'photo',
      question: translate('Please upload a photo of yourself'),
      type: 'file',
      required: true,
      placeholder: '',
      allowedFileTypes: undefined,
      options: undefined
    }
  ];

  const formSteps = fields && fields.length > 0 
    ? fields.map(f => ({
        id: f.id,
        question: f.label,
        type: f.type,
        required: f.required,
        allowedFileTypes: f.allowedFileTypes,
        options: f.options,
        placeholder: ''
      }))
    : defaultSteps;

  const handleNext = () => {
    const currentStepData = formSteps[step];
    const value = formData[currentStepData.id];

    if (currentStepData.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      showToast(translate('This field is required.'), true);
      return;
    }

    if (currentStepData.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        showToast(translate('Please enter a valid email address.'), true);
        return;
      }
    }

    if (currentStepData.type === 'tel' && value) {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(value)) {
        showToast(translate('Please enter a valid phone number.'), true);
        return;
      }
    }

    if (step < formSteps.length - 1) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Honeypot check for spam bots
    if (honeypot) {
      console.warn("Spam detected");
      return;
    }

    // Rate limiting check (max 3 per hour)
    const now = Date.now();
    const submissions = JSON.parse(localStorage.getItem('form_submissions') || '[]');
    const recentSubmissions = submissions.filter((time: number) => now - time < 3600000);
    if (recentSubmissions.length >= 3) {
      showToast(translate("You have submitted too many applications. Please try again later."), true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for duplicate email if email field exists
      const emailFieldId = formSteps.find(s => s.type === 'email')?.id;
      if (emailFieldId && formData[emailFieldId]) {
        const q = query(
          collection(db, 'volunteerApplications'),
          where(`formData.${emailFieldId}`, '==', formData[emailFieldId]),
          where('eventId', '==', eventId)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          showToast(translate("An application with this email already exists for this event."), true);
          setIsSubmitting(false);
          return;
        }
      }

      // Upload files and map to labels
      const finalData: Record<string, any> = {};
      for (const s of formSteps) {
        let value = formData[s.id];
        if (s.type === 'file' && value instanceof File) {
          value = await uploadPhotoToDrive(value);
        }
        if (value !== undefined) {
          // Truncate strings to prevent massive payload attacks
          if (typeof value === 'string' && value.length > 5000) {
            value = value.substring(0, 5000);
          }
          finalData[s.question] = value;
        }
      }

      const candidateData = {
        eventId: eventId.substring(0, 100),
        eventName: eventName.substring(0, 100),
        type,
        formData: finalData,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'volunteerApplications'), candidateData);
      
      // Update rate limiting
      recentSubmissions.push(now);
      localStorage.setItem('form_submissions', JSON.stringify(recentSubmissions));

      showToast(translate("Application submitted successfully!"));
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error("Error submitting application:", error);
      showToast(translate("Failed to submit application. Please try again."), true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStep = formSteps[step];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[var(--color-bg)]">
      <Toast message={toastMessage} isVisible={isToastVisible} onClose={() => setIsToastVisible(false)} isError={toastIsError} />
      <div className="w-full max-w-xl">
        <div className="mb-8 flex justify-between items-center">
          <span className="text-xs font-mono text-[var(--color-muted)]">
            {translate('Step')} {step + 1} {translate('of')} {formSteps.length}
          </span>
          <div className="flex gap-1">
            {formSteps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 w-8 rounded-full ${i <= step ? 'bg-[#fe0000]' : 'bg-[var(--color-border)]'}`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-[200px]"
          >
            <h3 className="text-2xl font-head mb-6">{currentStep.question}</h3>
            
            {currentStep.type === 'textarea' ? (
              <textarea
                value={formData[currentStep.id] || ''}
                onChange={(e) => setFormData({ ...formData, [currentStep.id]: e.target.value })}
                placeholder={currentStep.placeholder}
                className="w-full p-4 bg-transparent border border-[var(--color-border)] rounded-lg focus:border-[#fe0000] outline-none transition-colors min-h-[150px] resize-none"
                autoFocus
              />
            ) : currentStep.type === 'dropdown' ? (
              <select
                value={formData[currentStep.id] || ''}
                onChange={(e) => setFormData({ ...formData, [currentStep.id]: e.target.value })}
                className="w-full p-4 bg-transparent border border-[var(--color-border)] rounded-lg focus:border-[#fe0000] outline-none transition-colors text-lg appearance-none"
                autoFocus
              >
                <option value="" disabled>Select an option</option>
                {(currentStep.options || []).map((opt: string, idx: number) => (
                  <option key={idx} value={opt}>{opt}</option>
                ))}
              </select>
            ) : currentStep.type === 'file' ? (
              <div className="w-full p-8 border-2 border-dashed border-[var(--color-border)] rounded-lg flex flex-col items-center justify-center text-center hover:border-[#fe0000] transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept={currentStep.allowedFileTypes ? currentStep.allowedFileTypes.map(t => `.${t}`).join(',') : '*/*'}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) { // 5MB limit
                        showToast(translate('File size must be less than 5MB.'), true);
                        e.target.value = '';
                        return;
                      }
                      setFormData({ ...formData, [currentStep.id]: file });
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {formData[currentStep.id] ? (
                  <div className="text-[#fe0000] font-mono text-sm">
                    {formData[currentStep.id].name}
                  </div>
                ) : (
                  <div className="text-[var(--color-muted)] font-mono text-sm flex flex-col items-center gap-2">
                    <span>{translate('Click or drag file to upload')}</span>
                    <span className="text-[10px] opacity-50">{translate('Max file size: 5MB')}</span>
                  </div>
                )}
              </div>
            ) : (
              <input
                type={currentStep.type}
                value={formData[currentStep.id] || ''}
                onChange={(e) => setFormData({ ...formData, [currentStep.id]: e.target.value })}
                placeholder={currentStep.placeholder}
                className="w-full p-4 bg-transparent border border-[var(--color-border)] rounded-lg focus:border-[#fe0000] outline-none transition-colors text-lg"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (!currentStep.required || formData[currentStep.id])) {
                    if (step < formSteps.length - 1) handleNext();
                    else handleSubmit(e);
                  }
                }}
              />
            )}
            
            {/* Honeypot field - hidden from real users */}
            <input 
              type="text" 
              name="_honey" 
              value={honeypot} 
              onChange={(e) => setHoneypot(e.target.value)} 
              style={{ display: 'none' }} 
              tabIndex={-1} 
              autoComplete="off" 
            />
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 0 || isSubmitting}
            className={`px-6 py-3 font-mono text-sm uppercase tracking-wider border border-[var(--color-border)] rounded-full transition-colors ${step === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#fe0000] hover:text-[#fe0000]'}`}
          >
            {translate('Back')}
          </button>

          {step < formSteps.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={currentStep.required && !formData[currentStep.id]}
              className={`px-6 py-3 font-mono text-sm uppercase tracking-wider bg-[#fe0000] text-white rounded-full transition-colors ${currentStep.required && !formData[currentStep.id] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
            >
              {translate('Next')}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={(currentStep.required && !formData[currentStep.id]) || isSubmitting}
              className={`px-6 py-3 font-mono text-sm uppercase tracking-wider bg-[#fe0000] text-white rounded-full transition-colors flex items-center gap-2 ${((currentStep.required && !formData[currentStep.id]) || isSubmitting) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
            >
              {isSubmitting ? translate('Submitting...') : translate('Submit Application')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
