/*import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate(); 
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleAddUser = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ User added successfully");
        setNewEmail("");
        setNewPassword("");
        setShowForm(false);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (err) {
      setMessage("❌ Server error");
    }
  };

  const handleSignOut = () => {
    // clear any admin session info if needed
    //localStorage.removeItem("adminSession");
    navigate("/"); // ✅ redirect back to login
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="mb-6">
        Logged in as <strong>{location.state?.email}</strong>
      </p>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg"
        >
          Add New User
        </button>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Add User</h2>
          <input
            type="email"
            placeholder="New user email"
            className="block w-full mb-3 p-2 border rounded-lg"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="New user password"
            className="block w-full mb-3 p-2 border rounded-lg"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            onClick={handleAddUser}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Save User
          </button>
        </div>
      )}

      {message && <p className="mt-4 text-gray-700">{message}</p>}

      {/* ✅ Sign Out Button }
      <button
        onClick={handleSignOut}
        className="mt-6 bg-red-500 text-white px-4 py-2 rounded-lg"
      >
        Sign Out
      </button>
    </div>
  );
}*/

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate(); 

  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleAddUser = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ User added successfully");
        setNewEmail("");
        setNewPassword("");
        setShowForm(false);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (err) {
      setMessage("❌ Server error");
    }
  };

  const handleSignOut = () => {
    navigate("/"); // ✅ redirect back to login
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("docId", "949772ac-b6d4-4898-acd3-a8f0735c8eca"); // unique ID
      formData.append("loaderName", "File Loader");
      formData.append("splitter", JSON.stringify({ config: { chunkSize: 1000 } }));
      formData.append("metadata", JSON.stringify({ uploadedBy: "admin", filename: file.name }));
      formData.append("replaceExisting", "true");
      formData.append("createNewDocStore", "false");

      const res = await fetch(
        "http://localhost:3000/api/v1/document-store/upsert/b76f5ac7-61a5-443f-8846-5fc4c0b555af",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer 6mDsefvylRvMA7DyUhMJmFETg1WQevBQPt4Pr4ceON8",
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (res.ok) {
        setUploadMessage(`✅ File "${file.name}" uploaded successfully`);
      } else {
        setUploadMessage(`❌ ${data.message || "Upload failed"}`);
      }
    } catch (err) {
      setUploadMessage("❌ Server error while uploading file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="mb-6">
        Logged in as <strong>{location.state?.email}</strong>
      </p>

      {/* ✅ Add User Section */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg"
        >
          Add New User
        </button>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Add User</h2>
          <input
            type="email"
            placeholder="New user email"
            className="block w-full mb-3 p-2 border rounded-lg"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="New user password"
            className="block w-full mb-3 p-2 border rounded-lg"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            onClick={handleAddUser}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Save User
          </button>
        </div>
      )}

      {message && <p className="mt-4 text-gray-700">{message}</p>}

      {/* ✅ File Upload Section */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Upload File to Flowise</h2>
        <input
          type="file"
          onChange={handleFileUpload}
          className="block w-full mb-3"
        />
        {uploading && <p className="text-blue-500">⏳ Uploading...</p>}
        {uploadMessage && <p className="mt-2">{uploadMessage}</p>}
      </div>

      {/* ✅ Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="mt-6 bg-red-500 text-white px-4 py-2 rounded-lg"
      >
        Sign Out
      </button>
    </div>
  );
}
