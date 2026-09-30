"use client";

import AdminSystemPage from "../../../../components/AdminSystemPage";

function Bar({ label, value, max, color }) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="capitalize text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
      </div>
      <div className="h-2 rounded bg-gray-100">
        <div className={`h-2 rounded ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <AdminSystemPage title="Analytics" description="Live platform usage figures">
      {(status) => {
        const { users, usersByType, appointments, appointmentsByStatus } = status.totals;
        const userMax = Math.max(0, ...Object.values(usersByType));
        const apptMax = Math.max(0, ...Object.values(appointmentsByStatus));
        return (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Stat label="Total users" value={users} />
              <Stat label="Doctors" value={usersByType.doctor || 0} />
              <Stat label="Appointments" value={appointments} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-lg bg-white p-6 shadow" aria-label="Users by role">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Users by role</h2>
                <div className="space-y-4">
                  {Object.entries(usersByType).map(([type, count]) => (
                    <Bar key={type} label={type} value={count} max={userMax} color="bg-primary-600" />
                  ))}
                </div>
              </section>

              <section className="rounded-lg bg-white p-6 shadow" aria-label="Appointments by status">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Appointments by status</h2>
                {Object.keys(appointmentsByStatus).length === 0 ? (
                  <p className="text-sm text-gray-500">No appointments have been booked yet.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(appointmentsByStatus).map(([s, count]) => (
                      <Bar key={s} label={s} value={count} max={apptMax} color="bg-green-500" />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        );
      }}
    </AdminSystemPage>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
