'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WelcomeCardPreview from './WelcomeCardPreview';
import RecipientSelector, { Recipient } from './RecipientSelector';

export interface AnnouncementFormData {
  employeeName: string;
  designation: string;
  department: string;
  reportingManager: string;
  officeLocation: string;
  qualification: string;
  university: string;
  bio: string;
  birthday: string;
  officialEmail: string;
  gender: 'male' | 'female';
  imageUrl: string;
}

const EMPTY: AnnouncementFormData = {
  employeeName: '',
  designation: '',
  department: '',
  reportingManager: '',
  officeLocation: '',
  qualification: '',
  university: '',
  bio: '',
  birthday: '',
  officialEmail: '',
  gender: 'male',
  imageUrl: '',
};

const FIELDS: { name: keyof AnnouncementFormData; label: string; required?: boolean }[] = [
  { name: 'employeeName', label: 'Employee Name', required: true },
  { name: 'designation', label: 'Designation', required: true },
  { name: 'department', label: 'Department', required: true },
  { name: 'reportingManager', label: 'Reporting Manager', required: true },
  { name: 'officeLocation', label: 'Office Location', required: true },
  { name: 'qualification', label: 'Highest Qualification', required: true },
  { name: 'university', label: 'Field of Study', required: true },
  { name: 'officialEmail', label: 'Official Email', required: true },
];

export default function AnnouncementForm({
  announcementId,
  initial,
  readOnly = false,
}: {
  announcementId?: string;
  initial?: Partial<AnnouncementFormData>;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<AnnouncementFormData>({ ...EMPTY, ...initial });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(initial?.imageUrl || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [imageError, setImageError] = useState('');

  function update<K extends keyof AnnouncementFormData>(key: K, value: AnnouncementFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setImageError('');
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setImageError('Only JPEG, PNG and WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be 5MB or smaller.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadImageIfNeeded() {
    if (!imageFile) return form.imageUrl;
    const fd = new FormData();
    fd.append('image', imageFile);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Image upload failed');
    return data.imageUrl as string;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const imageUrl = await uploadImageIfNeeded();
      const payload = { ...form, imageUrl };

      const res = await fetch(
        announcementId ? `/api/announcements/${announcementId}` : '/api/announcements',
        {
          method: announcementId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save');
        return;
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleSend() {
    setError('');
    setSending(true);
    try {
      let id = announcementId;
      if (!id) {
        const imageUrl = await uploadImageIfNeeded();
        const res = await fetch('/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, imageUrl }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save draft');
        id = data.item._id;
      } else {
        const imageUrl = await uploadImageIfNeeded();
        const res = await fetch(`/api/announcements/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, imageUrl }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to update');
      }

      const sendRes = await fetch(`/api/announcements/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients }),
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData.error || 'Failed to send email');

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((field) => (
            <div key={field.name} className={field.name === 'employeeName' ? 'col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </label>
              <input
                type={field.name === 'officialEmail' ? 'email' : 'text'}
                required={field.required}
                disabled={readOnly}
                value={form[field.name] as string}
                onChange={(e) => update(field.name, e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birthday <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              disabled={readOnly}
              value={form.birthday}
              onChange={(e) => update('birthday', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              disabled={readOnly}
              value={form.gender}
              onChange={(e) => update('gender', e.target.value as 'male' | 'female')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Short Introduction / Bio
          </label>
          <textarea
            disabled={readOnly}
            value={form.bio}
            onChange={(e) => update('bio', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
          {!readOnly && (
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} />
          )}
          {imageError && <p className="text-xs text-red-600 mt-1">{imageError}</p>}
        </div>

        {!readOnly && (
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-100 text-gray-800 text-sm font-medium px-4 py-2 rounded-md border border-gray-300 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={() => setShowRecipients((v) => !v)}
              className="bg-mitra-blue text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-60"
            >
              Select Recipients &amp; Send
            </button>
          </div>
        )}

        {showRecipients && !readOnly && (
          <div className="space-y-3 pt-2">
            <RecipientSelector selected={recipients} onChange={setRecipients} />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="bg-mitra-green bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-60"
            >
              {sending ? 'Sending…' : recipients.length > 0 ? `Send to ${recipients.length} recipient(s)` : 'Send'}
            </button>
          </div>
        )}
      </form>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Live Preview</h2>
        <WelcomeCardPreview
          data={{
            employeeName: form.employeeName || 'Employee Name',
            designation: form.designation || 'Designation',
            department: form.department || 'Department',
            reportingManager: form.reportingManager || 'Reporting Manager',
            officeLocation: form.officeLocation || 'Office Location',
            qualification: form.qualification || 'Qualification',
            university: form.university || 'Field of Study',
            bio: form.bio,
            birthday: form.birthday,
            officialEmail: form.officialEmail || 'employee@mitraindustries.com',
            gender: form.gender,
          }}
          imageSrc={imagePreview}
        />
      </div>
    </div>
  );
}
