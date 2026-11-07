(() => {
  const keys = [
    'hayagsync_students',
    'hayagsync_incidents',
    'hayagsync_appeals',
    'hayagsync_services',
    'hayagsync_expulsions',
    'hayagsync_audit_logs',
    'hayagsync_notifications',
    'hayagsync_settings',
  ];

  const storage = {};
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      storage[key] = null;
      continue;
    }

    try {
      storage[key] = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Could not export ${key}: its localStorage value is invalid JSON.`, { cause: error });
    }
  }

  const snapshot = {
    format: 'hayagsync-localstorage-v1',
    exportedAt: new Date().toISOString(),
    origin: window.location.origin,
    storage,
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'hayagsync-local-backup.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
})();
