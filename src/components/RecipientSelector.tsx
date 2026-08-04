'use client';

import { useEffect, useState } from 'react';

export interface Recipient {
  _id?: string;
  name: string;
  email: string;
  department?: string;
}

export default function RecipientSelector({
  selected,
  onChange,
}: {
  selected: Recipient[];
  onChange: (recipients: Recipient[]) => void;
}) {
  const [all, setAll] = useState<Recipient[]>([]);
  const [q, setQ] = useState('');
  const [importing, setImporting] = useState(false);

  const alwaysEmails = new Set(
    (process.env.NEXT_PUBLIC_MAIL_TO_ALWAYS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/recipients?q=${encodeURIComponent(q)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setAll((data.items || []).filter((r: Recipient) => !alwaysEmails.has(r.email.toLowerCase()))))
      .catch(() => {});
    return () => controller.abort();
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedEmails = new Set(selected.map((r) => r.email));

  function toggle(recipient: Recipient) {
    if (selectedEmails.has(recipient.email)) {
      onChange(selected.filter((r) => r.email !== recipient.email));
    } else {
      onChange([...selected, recipient]);
    }
  }

  function selectAll() {
    const merged = [...selected];
    for (const r of all) {
      if (!selectedEmails.has(r.email)) merged.push(r);
    }
    onChange(merged);
  }

  function clearAll() {
    onChange([]);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      const recipients = lines
        .map((line) => {
          const [name, email] = line.split(',').map((s) => s.trim());
          return name && email ? { name, email } : null;
        })
        .filter((r): r is Recipient => !!r);

      if (recipients.length === 0) {
        alert('No valid rows found. Expected CSV format: name,email');
        return;
      }

      const res = await fetch('/api/recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients }),
      });
      const data = await res.json();
      if (res.ok) {
        setQ((v) => v);
        alert(`Imported ${data.imported} of ${data.total} recipients.`);
      } else {
        alert(data.error || 'Import failed');
      }
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  return (
    <div className="border border-gray-200 rounded-md p-3">
      <div className="flex items-center gap-2 mb-2">
        <input
          placeholder="Search recipients…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={selectAll}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Clear
        </button>
        <label className="text-sm px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
          {importing ? 'Importing…' : 'Import CSV'}
          <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
        </label>
      </div>

      <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
        {all.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No recipients found.</p>
        ) : (
          all.map((r) => (
            <label
              key={r.email}
              className="flex items-center gap-2 py-1.5 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedEmails.has(r.email)}
                onChange={() => toggle(r)}
              />
              <span className="font-medium">{r.name}</span>
              <span className="text-gray-400">{r.email}</span>
            </label>
          ))
        )}
      </div>

      <p className="text-xs text-gray-500 mt-2">{selected.length} recipient(s) selected</p>
    </div>
  );
}
