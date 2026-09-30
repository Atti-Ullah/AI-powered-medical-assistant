// Browser-side helpers shared by the admin dashboard pages

// Calls an admin API with the logged-in user's token and returns the parsed body.
// Throws an Error carrying the API's message when the request fails.
export async function adminRequest(token, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // non-JSON error body
  }
  if (!response.ok || (payload && payload.success === false)) {
    throw new Error((payload && payload.message) || `Request failed (${response.status})`);
  }
  return payload;
}

// "5 minutes ago" style label for notification timestamps
export function timeAgo(value) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  const plural = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;
  if (minutes < 60) return plural(minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, 'hour');
  const days = Math.floor(hours / 24);
  if (days < 30) return plural(days, 'day');
  return new Date(value).toLocaleDateString();
}

export function formatUptime(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Turn the live system status into a list of alerts, most severe first
export function buildAlerts(status) {
  if (!status) return [];
  const alerts = [];
  const date = status.checkedAt ? status.checkedAt.split('T')[0] : '';

  if (!status.database.connected) {
    alerts.push({
      id: 'database',
      severity: 'error',
      title: 'Database unavailable',
      description:
        'MongoDB cannot be reached. The platform is running on the local file-based fallback; some features (AI Doctor history, password-reset tokens across restarts) may be limited.',
      date,
    });
  }
  if (status.security.defaultAdminPassword) {
    alerts.push({
      id: 'admin-password',
      severity: 'error',
      title: 'Default administrator password in use',
      description: 'An administrator account still uses the documented demo password. Change it under Settings > Change password.',
      date,
    });
  }
  if (!status.security.jwtSecretConfigured) {
    alerts.push({
      id: 'jwt',
      severity: 'warning',
      title: 'JWT secret not configured',
      description: 'JWT_SECRET is not set, so a development-only fallback secret is being used.',
      date,
    });
  }
  if (!status.config.aiAssistantConfigured) {
    alerts.push({
      id: 'ai',
      severity: 'warning',
      title: 'AI assistant not configured',
      description: 'GEMINI_API_KEY is missing, so the AI Doctor and guide assistants cannot answer.',
      date,
    });
  }
  if (status.security.adminCount < 2) {
    alerts.push({
      id: 'admins',
      severity: 'info',
      title: 'Only one administrator account',
      description: 'Consider adding a second administrator so access is not lost if one account is locked.',
      date,
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      id: 'ok',
      severity: 'info',
      title: 'All systems operational',
      description: 'No issues detected in the latest health check.',
      date,
    });
  }
  const order = { error: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}

// Saves text as a file in the browser
export function downloadFile(filename, content, mime = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const csvCell = (value) => {
  const text = String(value ?? '');
  // Prefix formula-looking values so spreadsheets do not execute them
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function toCsv(rows, columns) {
  const header = columns.map((c) => csvCell(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => csvCell(row[c.key])).join(','));
  return [header, ...lines].join('\r\n');
}
