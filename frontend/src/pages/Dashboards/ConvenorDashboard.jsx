import { useEffect, useState } from "react";
import axios from "../../api/axios";
import Navbar from "../../components/Navbar";


function ConvenorDashboard() {
  const [modules, setModules] = useState([]);
  const [moduleName, setModuleName] = useState("");
  const [moduleYear, setModuleYear] = useState("");
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [masterModules, setMasterModules] = useState([]);
  const [allModules, setAllModules] = useState([]);


  const [selectedModule, setSelectedModule] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [masterGroups, setMasterGroups] = useState([]);


  const [repoInputs, setRepoInputs] = useState({});
  const [groupRepositories, setGroupRepositories] = useState({});
  const [repoOverview, setRepoOverview] = useState({});

  const [repoContributors, setRepoContributors] = useState({});
  const [expandedContributor, setExpandedContributor] = useState({});
  const [repoCommits, setRepoCommits] = useState({});

  const [minExpectedCommits, setMinExpectedCommits] = useState("");
  const [inactivityDays, setInactivityDays] = useState("");
  const [smallCommitThreshold, setSmallCommitThreshold] = useState("");


  // ========================
  // FETCH MODULES
  // ========================
  const fetchModules = async () => {
    try {
      const res = await axios.get("/modules");
      setModules(res.data);
    } catch (err) {
      console.error("Failed to fetch modules:", err);
    }
  };

  const fetchAllModules = async () => {
    try {
      const res = await axios.get("/modules/all");
      setAllModules(res.data);
    } catch (err) {
      console.error("Failed to fetch all modules:", err);
    }
  };


  const fetchMasterModules = async () => {
    try {
      const res = await axios.get("/master/modules");
      setMasterModules(res.data);
    } catch (err) {
      console.error("Failed to fetch master modules:", err);
    }
  };


  useEffect(() => {
    fetchModules();
    fetchAllModules();
    fetchMasterModules();
  }, []);

  // ========================
  // MODULE CRUD
  // ========================
  const handleModuleSubmit = async (e) => {
    e.preventDefault();

    if (
      minExpectedCommits < 0 ||
      inactivityDays < 0 ||
      smallCommitThreshold < 0
    ) {
      alert("Values cannot be negative.");
      return;
    }

    if (editingModuleId) {
      await axios.put(`/modules/${editingModuleId}`, {
        name: moduleName,
        year: moduleYear,
        minExpectedCommits,
        inactivityDays,
        smallCommitThreshold,
      });
      setEditingModuleId(null);
    } else {
      await axios.post("/modules", {
        name: moduleName,
        year: moduleYear,
        minExpectedCommits,
        inactivityDays,
        smallCommitThreshold,
      });
    }

    setModuleName("");
    setModuleYear("");
    setMinExpectedCommits(3),
      setInactivityDays(7),
      setSmallCommitThreshold(5),
      fetchModules();
  };

  const handleEditModule = (module) => {
    setModuleName(module.name);
    setModuleYear(module.year);
    setEditingModuleId(module.id);
  };

  const handleDeleteModule = async (id) => {
    await axios.delete(`/modules/${id}`);
    if (selectedModule?.id === id) {
      setSelectedModule(null);
      setGroups([]);
    }
    fetchModules();
  };

  // ========================
  // GROUP CRUD
  // ========================
  const fetchGroups = async (moduleId) => {
    const res = await axios.get(`/groups/module/${moduleId}`);
    setGroups(res.data);

    res.data.forEach((group) => {
      fetchRepository(group.id);
    });
  };

  const handleSelectModule = (module) => {
    setSelectedModule(module);
    setSelectedModuleId(module.id);
    fetchGroups(module.id);
  };

  const handleGroupSubmit = async (e) => {

    if (!selectedModule) {
      // Create module first from static name
      const res = await axios.post("/modules", {
        name: selectedModuleId.replace("static-", ""),
        year: "2025"
      });

      setSelectedModule(res.data);
    }

    e.preventDefault();

    if (editingGroupId) {
      await axios.put(`/groups/${editingGroupId}`, {
        name: groupName,
      });
      setEditingGroupId(null);
    } else {
      await axios.post("/groups", {
        name: groupName,
        moduleId: selectedModule.id,
      });
    }

    setGroupName("");
    fetchGroups(selectedModule.id);
  };

  const handleEditGroup = (group) => {
    setGroupName(group.name);
    setEditingGroupId(group.id);
  };

  const handleDeleteGroup = async (id) => {
    await axios.delete(`/groups/${id}`);
    fetchGroups(selectedModule.id);
  };



  const fetchRepository = async (groupId) => {
    try {
      const res = await axios.get(`/repositories/${groupId}`);

      setGroupRepositories((prev) => ({
        ...prev,
        [groupId]: res.data,
      }));

      // Only fetch overview if repo exists
      if (res.data) {
        await fetchRepositoryOverview(groupId);
        await fetchContributors(groupId);
        await fetchConsolidatedCommits(groupId);
      }

    } catch (err) {
      if (err.response?.status === 404) {

        setGroupRepositories((prev) => ({
          ...prev,
          [groupId]: null,
        }));

        return; // DO NOT treat as error
      }

      console.error("Failed to fetch repository:", err);
    }
  };


  const handleRepoInputChange = (groupId, field, value) => {
    setRepoInputs((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [field]: value,
      },
    }));
  };

  const handleRepositorySubmit = async (groupId) => {
    const input = repoInputs[groupId];

    if (!input?.url) {
      alert("Please enter repository URL");
      return;
    }

    try {
      await axios.post("/repositories", {
        groupId,
        url: input.url,
        platform: input.platform || "GITHUB",
      });

      await fetchRepository(groupId);

      // Clear only that group’s input
      setRepoInputs((prev) => ({
        ...prev,
        [groupId]: { url: "", platform: "GITHUB" },
      }));

    } catch (err) {
      console.error(err);
      alert("Failed to link repository");
    }
  };

  const handleDeleteRepository = async (groupId) => {
    await axios.delete(`/repositories/${groupId}`);
    fetchRepository(groupId);
  };


  const fetchRepositoryOverview = async (groupId) => {
    try {
      const res = await axios.get(`/repositories/overview/${groupId}`);
      setRepoOverview((prev) => ({
        ...prev,
        [groupId]: res.data,
      }));
    } catch (err) {

      // If overview 404, ignore silently
      if (err.response?.status === 404) return;

      console.error("Failed to fetch overview:", err);
    }
  };


  const fetchContributors = async (groupId) => {
    try {
      const res = await axios.get(`/repositories/contributors/${groupId}`);

      setRepoContributors((prev) => ({
        ...prev,
        [groupId]: res.data,
      }));
    } catch (err) {
      console.error("Failed to fetch contributors:", err);
    }
  };

  const toggleContributor = (groupId, email) => {
    setExpandedContributor(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [email]: !prev[groupId]?.[email]
      }
    }));
  };

  const fetchConsolidatedCommits = async (groupId) => {
    try {
      const res = await axios.get(`/repositories/commits/${groupId}`);

      setRepoCommits((prev) => ({
        ...prev,
        [groupId]: res.data,
      }));

    } catch (err) {
      console.error("Failed to fetch consolidated commits:", err);
    }
  };


  const downloadPDF = async (groupId) => {
    try {
      const response = await axios.get(
        `/reports/group/${groupId}/pdf`,
        { responseType: "blob" }   // IMPORTANT
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `group-${groupId}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error("PDF download failed:", err);
    }
  };

  const downloadCSV = async (groupId) => {
    try {
      const response = await axios.get(
        `/reports/group/${groupId}/csv`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `group-${groupId}-report.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error("CSV download failed:", err);
    }
  };

  const viewSummary = async (groupId) => {
    const response = await axios.get(`/reports/group/${groupId}`);
    console.log(response.data);
    alert(JSON.stringify(response.data, null, 2));
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-white p-10">

        <h2 className="text-3xl font-bold mb-8">
          Convenor Dashboard 🎓
        </h2>

        {/* ================= MODULE SECTION ================= */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-10 shadow-xl">
          <h3 className="text-xl font-semibold mb-4">
            Select Module
          </h3>

          <select
            value={selectedModuleId}
            onChange={async (e) => {
              const moduleId = parseInt(e.target.value);
              const value = e.target.value;
              // STATIC MODULE
              if (value.startsWith("static-")) {
                const moduleName = value.replace("static-", "");

                // Check if already exists in DB
                const existing = allModules.find(m => m.name === moduleName);

                let moduleToUse = existing;

                // If not exists → create it automatically
                if (!existing) {
                  const res = await axios.post("/modules", {
                    name: moduleName,
                    year: "2025-26"
                  });

                  moduleToUse = res.data;
                  // Refresh modules
                  await fetchModules();
                  await fetchAllModules();
                }

                setSelectedModuleId(moduleToUse.id);
                setSelectedModule(moduleToUse);
                fetchGroups(moduleToUse.id);

              } else {
                // NORMAL DB MODULE
                const moduleId = parseInt(value);
                setSelectedModuleId(moduleId);
                setSelectedGroupId("");

                const module = allModules.find(m => m.id === moduleId);
                setSelectedModule(module);

                if (moduleId) fetchGroups(moduleId);
              }
            }}
            className="w-full px-4 py-2 rounded-lg bg-white/20 text-white"
          >
            <option value="">-- Select Module --</option>

            {allModules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.name} ({module.year})
              </option>
            ))}

            {/* Static Modules (only if not already in DB) */}
            {masterModules
              .filter(
                name => !allModules.some(m => m.name === name)
              )
              .map((name, index) => (
                <option key={`static-${index}`} value={`static-${name}`}>
                  {name}
                </option>
              ))}
          </select>





          <h3 className="text-xl font-semibold mt-6 mb-4">
            Select Group
          </h3>

          <select
            value={selectedGroupId}
            onChange={(e) => {
              const groupId = parseInt(e.target.value);
              setSelectedGroupId(groupId);

              const group = groups.find(g => g.id === groupId);
              setSelectedGroup(group);
            }}
            className="w-full px-4 py-2 rounded-lg bg-white/20 text-white"
          >
            <option value="">-- Select Group --</option>

            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}

          </select>


          <h3 className="text-xl font-semibold mb-4">
            Create / Edit Module
          </h3>

          <form onSubmit={handleModuleSubmit} className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Module Name"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />

            <input
              type="text"
              placeholder="Academic Year"
              value={moduleYear}
              onChange={(e) => setModuleYear(e.target.value)}
              className="flex-1 min-w-[150px] px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />

            <select
              value={minExpectedCommits}
              onChange={(e) => setMinExpectedCommits(Number(e.target.value))}
              className="w-48 px-4 py-2 rounded-lg bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >

              <option value="" disabled className="text-black">
                MinExpectedCommits
              </option>
              {[...Array(11).keys()].map((num) => (
                <option key={num} value={num} className="text-black">
                  {num}
                </option>

              ))}
            </select>

            <select
              value={inactivityDays}
              onChange={(e) => setInactivityDays(Number(e.target.value))}
              className="w-48 px-4 py-2 rounded-lg bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="" disabled className="text-black">
                InactivityDays
              </option>
              {[...Array(11).keys()].map((num) => (
                <option key={num} value={num} className="text-black">
                  {num}
                </option>
              ))}
            </select>

            <select
              value={smallCommitThreshold}
              onChange={(e) => setSmallCommitThreshold(Number(e.target.value))}
              className="w-48 px-4 py-2 rounded-lg bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="" disabled className="text-black">
                SmallCommitThreshold
              </option>
              {[...Array(11).keys()].map((num) => (
                <option key={num} value={num} className="text-black">
                  {num}
                </option>
              ))}
            </select>


            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg font-semibold hover:opacity-90 transition"
            >
              {editingModuleId ? "Update Module" : "Create Module"}
            </button>
          </form>
        </div>

        {/* ================= MODULE LIST ================= */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-6">Your Modules</h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <div
                key={module.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 shadow-lg hover:scale-105 transition-transform duration-300"
              >
                <h4 className="text-lg font-semibold mb-2">
                  {module.name}
                </h4>
                <p className="text-sm text-gray-300 mb-4">
                  Academic Year: {module.year}
                </p>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleSelectModule(module)}
                    className="px-3 py-1 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-700 transition"
                  >
                    Manage Groups
                  </button>

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= GROUP SECTION ================= */}
        {selectedModuleId && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-6">
              Groups in {selectedModule?.name}
            </h3>

            <form onSubmit={handleGroupSubmit} className="flex gap-4 mb-6">
              <input
                type="text"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />

              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg font-semibold hover:opacity-90 transition"
              >
                {editingGroupId ? "Update Group" : "Create Group"}
              </button>
            </form>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(selectedGroupId
                ? groups.filter(group => group.id === selectedGroupId)
                : groups
              ).map((group) => (
                <div
                  key={group.id}
                  className="bg-white/10 rounded-xl p-4 shadow hover:bg-white/20 transition"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold">{group.name}</span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditGroup(group)}
                        className="px-2 py-1 bg-yellow-500 rounded text-xs hover:bg-yellow-600 transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="px-2 py-1 bg-red-600 rounded text-xs hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Repository Section */}
                  {groupRepositories[group.id] ? (
                    <div className="mt-3 text-sm">
                      <p className="text-gray-300">
                        Platform: {groupRepositories[group.id]?.platform}
                      </p>
                      <a
                        href={groupRepositories[group.id]?.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 underline"
                      >
                        View Repository
                      </a>

                      {repoContributors[group.id] && (
                        <div className="mt-3 text-xs text-gray-300">
                          <p className="font-semibold mb-2">Student Analytics:</p>

                          {repoContributors[group.id].map((student) => (
                            <div key={student.email} className="mb-3 bg-white/10 p-2 rounded">

                              <div
                                className="cursor-pointer flex justify-between items-center"
                                onClick={() => toggleContributor(group.id, student.email)}
                              >
                                <div>
                                  <p className="font-semibold">
                                    {student.name} ({student.email})
                                  </p>
                                  <p>Total Commits: {student.totalCommits}</p>
                                  {student.lowQualityCommits > 0 && (
                                    <p className="text-red-400">
                                      ⚠ {student.lowQualityCommits} Low Quality Commits
                                    </p>
                                  )}

                                  <p>Low Quality Commits: {student.lowQualityCommits ?? 0}</p>

                                  <p>Contribution: {student.contributionPercentage}%</p>

                                  {student.deadlineSpike && (
                                    <p className="text-yellow-400">
                                      ⚠ Deadline Spike Detected (≥5 commits in 24h)
                                    </p>
                                  )}

                                  {student.inactivityGaps?.length > 0 && (
                                    <p className="text-red-400">
                                      ⚠ Inactivity Gap Detected ({student.inactivityGaps.length} times)
                                    </p>
                                  )}


                                </div>

                                <div className="mt-2">
                                  <p className="font-semibold">Commit Activity Timeline:</p>

                                  {Object.entries(student.commitsByDate || {}).map(([date, count]) => (
                                    <div key={date} className="flex justify-between text-xs">
                                      <span>{date}</span>
                                      <span>{count} commits</span>
                                    </div>
                                  ))}
                                </div>


                                <div>
                                  {expandedContributor[group.id]?.[student.email] ? "▲" : "▼"}
                                </div>
                              </div>

                              {expandedContributor[group.id]?.[student.email] && (
                                <div className="ml-3 mt-2 border-l-2 border-gray-400 pl-3">
                                  {student.commits.length === 0 ? (
                                    <p className="text-red-400">No commits ⚠</p>
                                  ) : (
                                    student.commits.map((commit) => (
                                      <div key={commit.sha} className="mb-2">
                                        <p><strong>Message:</strong> {commit.message}</p>
                                        <p>
                                          <strong>Date:</strong>{" "}
                                          {new Date(commit.timestamp).toLocaleString()}
                                        </p>

                                        <p>
                                          <strong>Changes:</strong> +{commit.additions} / -{commit.deletions}
                                        </p>

                                        <p>
                                          <strong>Quality Score:</strong> {commit.qualityScore}
                                          {commit.qualityScore < 60 && (
                                            <span className="text-red-400"> ⚠ Low Quality</span>
                                          )}
                                        </p>

                                        {commit.isGenericMessage && (
                                          <p className="text-yellow-400">⚠ Generic Message</p>
                                        )}

                                        {commit.isSmallCommit && (
                                          <p className="text-yellow-400">⚠ Very Small Commit</p>
                                        )}

                                        {commit.isWhitespaceOnly && (
                                          <p className="text-yellow-400">⚠ Whitespace Only</p>
                                        )}
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex gap-3">

                        <button
                          onClick={() => viewSummary(group.id)}
                          className="px-3 py-1 bg-blue-600 rounded text-xs"
                        >
                          View Summary
                        </button>

                        <button
                          onClick={() => downloadCSV(group.id)}
                          className="px-3 py-1 bg-green-600 rounded text-xs"
                        >
                          Export CSV
                        </button>

                        <button
                          onClick={() => downloadPDF(group.id)}
                          className="px-3 py-1 bg-red-600 rounded text-xs"
                        >
                          Export PDF
                        </button>
                      </div>


                      {repoOverview[group.id] && (
                        <div className="mt-3 text-xs text-gray-300">
                          <p>Default Branch: {repoOverview[group.id].defaultBranch}</p>
                          <p>Total Commits: {repoOverview[group.id].totalCommits}</p>
                          <p>
                            Last Commit:{" "}
                            {new Date(repoOverview[group.id].lastCommitDate).toLocaleString()}
                          </p>

                          <p>
                            Activity Status:{" "}
                            {new Date(repoOverview[group.id].lastCommitDate) >
                              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                              ? "Active 🟢"
                              : "Inactive 🔴"}
                          </p>

                          <p>
                            Last Synced:{" "}
                            {repoOverview[group.id]?.cached
                              ? "From Cache"
                              : "Freshly Fetched"}
                          </p>

                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteRepository(group.id)}
                        className="ml-3 px-2 py-1 bg-red-500 rounded text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Repository URL"
                        value={repoInputs[group.id]?.url || ""}
                        onChange={(e) =>
                          handleRepoInputChange(group.id, "url", e.target.value)
                        }
                        className="w-full px-3 py-1 rounded bg-white/20 text-white mb-2"
                      />

                      <select
                        value={repoInputs[group.id]?.platform || "GITHUB"}
                        onChange={(e) =>
                          handleRepoInputChange(group.id, "platform", e.target.value)
                        }
                        className="w-full px-3 py-1 rounded bg-white/20 text-white mb-2"
                      >
                        <option value="GITHUB">GitHub</option>
                        <option value="GITLAB">GitLab</option>
                      </select>


                      <button
                        onClick={() => handleRepositorySubmit(group.id)}
                        className="w-full px-3 py-1 bg-indigo-600 rounded text-sm"
                      >
                        Link Repository
                      </button>
                    </div>
                  )}
                </div>

              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );

}

export default ConvenorDashboard;
