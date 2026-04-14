const DAY_MS = 24 * 60 * 60 * 1000;

exports.analyzeCommitPatterns = (commits, config) => {

    const inactivityDays = config?.inactivityDays || 7;
    const minExpectedCommits = config?.minExpectedCommits || 3;

    if (!commits || commits.length === 0) {
        return {
            inactivityGaps: [],
            deadlineSpike: false,
            commitsByDate: {}
        };
    }

    // Sort commits by timestamp
    const sorted = commits
        .map(c => new Date(c.timestamp))
        .sort((a, b) => a - b);

    let inactivityGaps = [];

    // Detect gaps > 7 days
    for (let i = 1; i < sorted.length; i++) {
        const diffDays = (sorted[i] - sorted[i - 1]) / DAY_MS;

        if (diffDays >= inactivityDays) {
            inactivityGaps.push({
                from: sorted[i - 1],
                to: sorted[i],
                gapDays: Math.floor(diffDays),
            });
        }
    }

    // Detect deadline spike (>= 5 commits in 24h)
    let deadlineSpike = false;

    for (let i = 0; i < sorted.length; i++) {
        let count = 1;

        for (let j = i + 1; j < sorted.length; j++) {
            if ((sorted[j] - sorted[i]) <= DAY_MS) {
                count++;
            }
        }

        if (count >= 5) {
            deadlineSpike = true;
            break;
        }
    }

    // Commit distribution per day
    const commitsByDate = {};

    commits.forEach(c => {
        const date = new Date(c.timestamp).toISOString().split("T")[0];

        commitsByDate[date] = (commitsByDate[date] || 0) + 1;
    });

    return {
        inactivityGaps,
        deadlineSpike,
        commitsByDate
    };
};
