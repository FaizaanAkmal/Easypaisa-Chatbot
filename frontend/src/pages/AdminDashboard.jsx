import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  UserPlus, 
  Upload, 
  LogOut, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle
} from "lucide-react";

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const user = location.state?.email || "guest";

  const setStatusMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const handleAddUser = async () => {
    if (!newEmail || !newPassword) {
      setStatusMessage("Please fill in all fields", "error");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatusMessage("User added successfully", "success");
        setNewEmail("");
        setNewPassword("");
        setShowForm(false);
      } else {
        setStatusMessage(data.message || "Failed to add user", "error");
      }
    } catch (err) {
      setStatusMessage("Server error - please try again", "error");
    }
  };

  const handleSignOut = () => {
    navigate("/");
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("docId", "9cb31707-3775-4836-881a-2fadf507bcdc");
      formData.append("loaderName", "File Loader");
      formData.append(
        "splitter",
        JSON.stringify({ config: { chunkSize: 1000 } })
      );
      formData.append(
        "metadata",
        JSON.stringify({ uploadedBy: user, filename: file.name })
      );
      formData.append("replaceExisting", "false");
      formData.append("createNewDocStore", "false");

      const res = await fetch(
        "http://localhost:3000/api/v1/document-store/upsert/cdbe2ea1-aaa0-4b75-8b1e-4a48fd97707a",
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
        setUploadMessage(`File "${file.name}" uploaded successfully`);
      } else {
        setUploadMessage(data.message || "Upload failed");
      }
    } catch (err) {
      setUploadMessage("Server error while uploading file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Logged in as {user}</p>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            messageType === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : messageType === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : messageType === 'error' ? (
              <XCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            {message}
          </div>
        )}

        {/* Main Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                  <p className="text-sm text-gray-600">Add new users to the system</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {!showForm ? (
                <div className="text-center py-4">
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <UserPlus className="w-5 h-5" />
                    Add New User
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleAddUser}
                      className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Save User
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setNewEmail("");
                        setNewPassword("");
                      }}
                      className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* File Upload Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">File Upload</h2>
                  <p className="text-sm text-gray-600">Upload files to Flowise</p>
                </div>
              </div>
            </div>

            <div className="p-6">
               <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <span className="text-gray-600">
                  Drop files here or{" "}
                  <span className="text-purple-600 font-medium hover:text-purple-700">
                    browse
                  </span>
                </span>
              </div>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

              {uploading && (
                <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-800">Uploading file...</span>
                </div>
              )}

              {uploadMessage && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                  uploadMessage.includes('successfully') 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}>
                  {uploadMessage.includes('successfully') ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  {uploadMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}