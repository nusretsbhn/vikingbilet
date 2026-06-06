const ROLE_HIERARCHY = {
  viewer: 0,
  editor: 1,
  admin: 2,
};

function requireRole(minRole) {
  const minLevel = ROLE_HIERARCHY[minRole];
  if (minLevel === undefined) {
    throw new Error(`Unknown role: ${minRole}`);
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] ?? -1;
    if (userLevel < minLevel) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }

    next();
  };
}

module.exports = requireRole;
