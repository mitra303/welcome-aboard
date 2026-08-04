import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import Announcement, { IAnnouncement } from '@/models/Announcement';
import AnnouncementForm from '@/components/AnnouncementForm';

export default async function AnnouncementDetailPage({ params }: { params: { id: string } }) {
  await connectDB();
  const item = await Announcement.findById(params.id).lean<IAnnouncement>();
  if (!item) notFound();

  const isReadOnly = item.status === 'sent';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">
          {isReadOnly ? 'Announcement' : 'Edit Draft'} — {item.employeeName}
        </h1>
        {isReadOnly && (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
            sent {item.sentAt ? new Date(item.sentAt).toLocaleString() : ''}
          </span>
        )}
      </div>
      <AnnouncementForm
        announcementId={item._id.toString()}
        readOnly={isReadOnly}
        initial={{
          employeeName: item.employeeName,
          designation: item.designation,
          department: item.department,
          reportingManager: item.reportingManager,
          officeLocation: item.officeLocation,
          qualification: item.qualification,
          university: item.university,
          bio: item.bio || '',
          birthday: item.birthday,
          officialEmail: item.officialEmail,
          gender: item.gender,
          imageUrl: item.imageUrl || '',
        }}
      />
    </div>
  );
}
