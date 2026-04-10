import React from 'react';
import { Save, Trash2, Plus, X, Link as LinkIcon } from 'lucide-react';
import { FormSchema, FormField, FormFieldType } from '../store';

interface EventEditorProps {
  event: FormSchema;
  onUpdate: (id: string, field: string, value: any) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
}

const FILE_TYPES = ['jpeg', 'jpg', 'pdf', 'png', 'raw', 'cr2', 'mp4', 'mp3'];

export const EventEditor: React.FC<EventEditorProps> = ({ event, onUpdate, onSave, onDelete }) => {
  const handleAddField = () => {
    const newField: FormField = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'text',
      label: 'New Question',
      required: true,
    };
    onUpdate(event.id, 'fields', [...(event.fields || []), newField]);
  };

  const handleUpdateField = (fieldId: string, key: keyof FormField, value: any) => {
    const fields = event.fields || [];
    const updatedFields = fields.map(f => f.id === fieldId ? { ...f, [key]: value } : f);
    onUpdate(event.id, 'fields', updatedFields);
  };

  const handleRemoveField = (fieldId: string) => {
    const fields = event.fields || [];
    onUpdate(event.id, 'fields', fields.filter(f => f.id !== fieldId));
  };

  const handleToggleFileType = (fieldId: string, fileType: string) => {
    const fields = event.fields || [];
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    const currentTypes = field.allowedFileTypes || [];
    const newTypes = currentTypes.includes(fileType)
      ? currentTypes.filter(t => t !== fileType)
      : [...currentTypes, fileType];
    
    handleUpdateField(fieldId, 'allowedFileTypes', newTypes);
  };

  return (
    <div className="border border-[#e5e7eb] rounded-lg p-4 bg-[#f9fafb]">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 mr-4 space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-mono text-[#6b7280] block mb-1">Event Name</label>
            <button 
              onClick={() => {
                const url = `${window.location.origin}/apply/${event.category}/${event.id}`;
                navigator.clipboard.writeText(url);
                alert('Shareable link copied to clipboard!');
              }}
              className="flex items-center gap-1 text-xs text-[#fe0000] hover:underline"
            >
              <LinkIcon size={12} /> Copy Link
            </button>
          </div>
          <input 
            type="text"
            value={event.name}
            onChange={(e) => onUpdate(event.id, 'name', e.target.value)}
            className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => onSave(event.id)}
            className="text-green-500 hover:text-green-700 p-2"
            title="Save Event"
          >
            <Save size={18} />
          </button>
          <button 
            onClick={() => onDelete(event.id)}
            className="text-red-500 hover:text-red-700 p-2"
            title="Delete Event"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs font-mono text-[#6b7280] block mb-1">Date / Time</label>
          <input 
            type="text"
            value={event.date}
            onChange={(e) => onUpdate(event.id, 'date', e.target.value)}
            className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-[#6b7280] block mb-1">Allowed Emails (comma separated)</label>
          <input 
            type="text"
            value={(event.allowedEmails || []).join(', ')}
            onChange={(e) => onUpdate(event.id, 'allowedEmails', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="email1@example.com, email2@example.com"
            className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm"
          />
          <p className="text-[10px] text-[#6b7280] mt-1">These users will be able to view the responses for this form.</p>
        </div>
        <div>
          <label className="text-xs font-mono text-[#6b7280] block mb-1">Description</label>
          <textarea 
            value={event.description}
            onChange={(e) => onUpdate(event.id, 'description', e.target.value)}
            className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm min-h-[80px]"
          />
        </div>

        {/* Dynamic Fields Section */}
        <div className="pt-4 border-t border-[#e5e7eb]">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono text-[#6b7280] block">Form Questions</label>
              <button 
                onClick={handleAddField}
                className="flex items-center gap-1 text-xs bg-[#ffffff] border border-[#e5e7eb] px-2 py-1 rounded hover:bg-[#e5e7eb] transition-colors"
              >
                <Plus size={12} /> Add Question
              </button>
            </div>
            
            <div className="space-y-3">
              {(event.fields || []).map((field, index) => (
                <div key={field.id} className="p-3 border border-[#e5e7eb] rounded bg-[#ffffff]">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex-1 space-y-2">
                      <input 
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateField(field.id, 'label', e.target.value)}
                        placeholder="Question Label"
                        className="w-full bg-transparent border border-[#e5e7eb] rounded p-1.5 text-sm"
                      />
                      <div className="flex gap-2 items-center">
                        <select
                          value={field.type}
                          onChange={(e) => handleUpdateField(field.id, 'type', e.target.value as FormFieldType)}
                          className="bg-transparent border border-[#e5e7eb] rounded p-1.5 text-xs"
                        >
                          <option value="text">Text (Open Answer)</option>
                          <option value="textarea">Textarea (Long Answer)</option>
                          <option value="email">Email</option>
                          <option value="phone">Phone</option>
                          <option value="file">File Upload</option>
                          <option value="dropdown">Dropdown</option>
                        </select>
                        <label className="flex items-center gap-1 text-xs">
                          <input 
                            type="checkbox" 
                            checked={field.required}
                            onChange={(e) => handleUpdateField(field.id, 'required', e.target.checked)}
                          />
                          Required
                        </label>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveField(field.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  {field.type === 'dropdown' && (
                    <div className="mt-2 pt-2 border-t border-[#e5e7eb]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-[#6b7280] block">Dropdown Options:</span>
                        <button 
                          onClick={() => handleUpdateField(field.id, 'options', [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`])}
                          className="flex items-center gap-1 text-[10px] bg-[#f9fafb] border border-[#e5e7eb] px-2 py-1 rounded hover:bg-[#e5e7eb] transition-colors"
                        >
                          <Plus size={10} /> Add Option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(field.options || []).map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input 
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...(field.options || [])];
                                newOpts[optIndex] = e.target.value;
                                handleUpdateField(field.id, 'options', newOpts);
                              }}
                              placeholder={`Option ${optIndex + 1}`}
                              className="flex-1 bg-transparent border border-[#e5e7eb] rounded p-1.5 text-sm"
                            />
                            <button 
                              onClick={() => {
                                const newOpts = [...(field.options || [])];
                                newOpts.splice(optIndex, 1);
                                handleUpdateField(field.id, 'options', newOpts);
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {(!field.options || field.options.length === 0) && (
                          <p className="text-xs text-[#6b7280] italic">No options added yet.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {field.type === 'file' && (
                    <div className="mt-2 pt-2 border-t border-[#e5e7eb]">
                      <span className="text-xs text-[#6b7280] block mb-1">Allowed File Types:</span>
                      <div className="flex flex-wrap gap-2">
                        {FILE_TYPES.map(ft => (
                          <label key={ft} className="flex items-center gap-1 text-xs">
                            <input 
                              type="checkbox"
                              checked={(field.allowedFileTypes || []).includes(ft)}
                              onChange={() => handleToggleFileType(field.id, ft)}
                            />
                            .{ft}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {(!event.fields || event.fields.length === 0) && (
                <p className="text-xs text-[#6b7280] italic">No custom questions added. Default fields (Name, Email, Phone, Motivation, Photo) will be used.</p>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
