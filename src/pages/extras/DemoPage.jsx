import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const DemoPage = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function fetchLogs() {
      try {
        // You need to implement this endpoint in your backend or replace with actual service
        const res = await api.get("/admin/audit-log");
        setLogs(res.data || []);
      } catch (err) {
        // handle error
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>
      <table className="w-full">
        <thead>
          <tr>
            <th>Date</th>
            <th>User</th>
            <th>Action</th>
            <th>Target</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log._id}>
              <td>{log.createdAt?.slice(0, 19).replace("T", " ")}</td>
              <td>{log.user?.name || log.user}</td>
              <td>{log.action}</td>
              <td>{log.targetModel} / {log.targetId}</td>
              <td>{JSON.stringify(log.detail)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DemoPage;