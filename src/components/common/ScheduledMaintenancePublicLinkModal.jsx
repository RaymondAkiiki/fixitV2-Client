import React, { useState, useEffect } from "react";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import {
  enableScheduledMaintenancePublicLink,
  disableScheduledMaintenancePublicLink,
} from "../../services/scheduledMaintenanceService";

function ScheduledMaintenancePublicLinkModal({ isOpen, onClose, task, onLinkChanged }) {
  const [loading, setLoading] = useState(false);
  const [publicLink, setPublicLink] = useState(task?.publicLink || null);
  const [expiresInDays, setExpiresInDays] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setPublicLink(task?.publicLink || null);
    setError("");
    setSuccess("");
    setExpiresInDays("");
  }, [task, isOpen]);

  const handleEnable = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await enableScheduledMaintenancePublicLink(task._id, expiresInDays ? Number(expiresInDays) : undefined);
      setPublicLink(res.publicLink);
      setSuccess("Public link enabled!");
      if (onLinkChanged) onLinkChanged(res.publicLink);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to enable public link.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await disableScheduledMaintenancePublicLink(task._id);
      setPublicLink(null);
      setSuccess("Public link revoked.");
      if (onLinkChanged) onLinkChanged(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to disable public link.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (publicLink) {
      navigator.clipboard.writeText(publicLink);
      setSuccess("Link copied to clipboard!");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Public Link">
      <div className="space-y-4 p-2">
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        {publicLink ? (
          <div>
            <div className="mb-2">
              <span className="font-semibold">Public Link:</span>
              <input
                type="text"
                value={publicLink}
                readOnly
                className="w-full border px-2 py-1 mt-1"
                onClick={handleCopy}
              />
              <Button onClick={handleCopy} className="mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded">Copy Link</Button>
            </div>
            <Button onClick={handleDisable} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded" disabled={loading}>
              Revoke Public Link
            </Button>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expire After (Days, optional)
            </label>
            <input
              type="number"
              min="1"
              value={expiresInDays}
              onChange={e => setExpiresInDays(e.target.value)}
              className="w-full border px-2 py-1 mb-3"
              placeholder="Leave blank for no expiry"
            />
            <Button onClick={handleEnable} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded" disabled={loading}>
              Enable Public Link
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ScheduledMaintenancePublicLinkModal;