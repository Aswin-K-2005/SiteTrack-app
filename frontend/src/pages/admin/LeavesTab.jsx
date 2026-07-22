import { useEffect, useState, useCallback } from "react";
import client, { apiErrorMessage } from "../../api/client";

function dateLabel(str) {
  if (!str) return "";
  return new Date(str + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function LeavesTab() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get("/leaves/all");
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(id, newStatus) {
    setError(""); setSuccess("");
    setBusyId(id);
    try {
      // In FastAPI, new_status is expected as a query parameter based on our route setup
      await client.patch(`/leaves/${id}/status?new_status=${newStatus}`);
      setSuccess(`Leave request marked as ${newStatus.toUpperCase()}.`);
      await load(); // Refresh the list
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  if (loading && leaves.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-on-surface-variant font-headline-sm text-lg gap-3">
        <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary-container border-t-transparent"></span>
        FETCHING LEAVE REGISTRY...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-error-container/20 border-l-4 border-error p-4 text-sm text-error font-bold">{error}</div>}
      {success && <div className="bg-[#1a2e21] border-l-4 border-secondary p-4 text-sm text-[#4edea3] font-bold">{success}</div>}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline-sm text-xl text-on-surface uppercase tracking-wider">Leave Approvals</h2>
        <span className="bg-surface-container-highest px-2 py-0.5 rounded text-on-surface text-sm font-bold">
          {leaves.filter(l => l.status === 'pending').length} PENDING
        </span>
      </div>

      <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-highest border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">WORKER</th>
                <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">DATES</th>
                <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">REASON</th>
                <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider text-center">STATUS</th>
                <th className="px-4 py-3 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-on-surface-variant/50 text-sm">
                    No leave requests found in the system.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-4">
                      <p className="font-body-md font-bold text-on-surface text-sm">{l.user_name || "Unknown Worker"}</p>
                    </td>
                    <td className="px-4 py-4 font-body-md text-sm text-on-surface-variant whitespace-nowrap">
                      {dateLabel(l.start_date)} {l.start_date !== l.end_date ? `to ${dateLabel(l.end_date)}` : ''}
                    </td>
                    <td className="px-4 py-4 font-body-md text-sm text-on-surface-variant">
                      {l.reason || "—"}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {l.status === 'approved' && <span className="inline-flex items-center px-2 py-0.5 bg-[#1a2e21] text-[#4edea3] font-label-caps text-[10px] rounded border border-secondary/30">APPROVED</span>}
                      {l.status === 'rejected' && <span className="inline-flex items-center px-2 py-0.5 bg-error-container/20 text-error font-label-caps text-[10px] rounded border border-error/30">REJECTED</span>}
                      {l.status === 'pending' && <span className="inline-flex items-center px-2 py-0.5 bg-surface-container-highest text-on-surface-variant font-label-caps text-[10px] rounded border border-outline-variant animate-pulse">PENDING</span>}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {l.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleStatusChange(l.id, "approved")}
                            disabled={busyId === l.id}
                            className="px-3 py-1.5 text-xs font-label-caps bg-[#1a2e21] border border-secondary/30 text-[#4edea3] hover:brightness-110 transition-all rounded disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(l.id, "rejected")}
                            disabled={busyId === l.id}
                            className="px-3 py-1.5 text-xs font-label-caps border border-outline-variant text-on-surface-variant hover:text-error hover:border-error/50 transition-all rounded disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-label-caps text-on-surface-variant/50">LOCKED</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
