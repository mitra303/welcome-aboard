'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Announcement {
  _id: string;
  employeeName: string;
  designation: string;
  department: string;
  status: 'draft' | 'sent';
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, status, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/announcements?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [q, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this draft announcement?')) return;
    const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
    if (res.ok) load();
    else alert((await res.json()).error || 'Failed to delete');
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Welcome Aboard Announcements</h1>
        <Link
          href="/dashboard/new"
          className="bg-mitra-blue text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + New Announcement
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search by name, designation, department…"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 w-12">#</th>
              <th className="px-4 py-2">Employee</th>
              <th className="px-4 py-2">Designation</th>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  No announcements found.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item._id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-500">{(page - 1) * limit + index + 1}</td>
                  <td className="px-4 py-2 font-medium">{item.employeeName}</td>
                  <td className="px-4 py-2">{item.designation}</td>
                  <td className="px-4 py-2">{item.department}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        item.status === 'sent'
                          ? 'inline-block px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700'
                          : 'inline-block px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700'
                      }
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-right space-x-3">
                    <button
                      onClick={() => router.push(`/dashboard/${item._id}`)}
                      className="text-mitra-blue hover:underline"
                    >
                      {item.status === 'draft' ? 'Edit' : 'View'}
                    </button>
                    {item.status === 'draft' && (
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
        <span>
          Page {page} of {totalPages} ({total} total)
        </span>
        <div className="space-x-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
