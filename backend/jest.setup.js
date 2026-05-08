const Module = require('module');
const fs = require('fs');
const path = require('path');

// Register TypeScript require hook for generated Prisma client
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id.includes('generated/prisma') && id.endsWith('.ts')) {
    // For now, just return empty object to prevent errors
    // This is a temporary fix - proper solution would be to transpile TS at runtime
    return {};
  }
  return originalRequire.apply(this, arguments);
};
