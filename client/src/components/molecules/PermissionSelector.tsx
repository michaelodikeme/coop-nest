"use client"

import { useState, useMemo } from 'react';
import { PERMISSIONS, getPermissionsByModule } from '@/lib/constants/permissions';
import type { Permission } from '@/types/role.types';

interface PermissionSelectorProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
  error?: string;
}

export default function PermissionSelector({
  selectedPermissions,
  onChange,
  disabled = false,
  error,
}: PermissionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const permissionsByModule = useMemo(() => getPermissionsByModule(), []);

  // Filter permissions based on search query
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) {
      return permissionsByModule;
    }

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, Permission[]> = {};

    Object.entries(permissionsByModule).forEach(([module, permissions]) => {
      const matchingPerms = permissions.filter(
        (perm) =>
          perm.name.toLowerCase().includes(query) ||
          perm.description.toLowerCase().includes(query)
      );

      if (matchingPerms.length > 0) {
        filtered[module] = matchingPerms;
      }
    });

    return filtered;
  }, [permissionsByModule, searchQuery]);

  // Auto-expand modules that have search results
  useMemo(() => {
    if (searchQuery.trim()) {
      setExpandedModules(new Set(Object.keys(filteredModules)));
    }
  }, [searchQuery, filteredModules]);

  const toggleModule = (module: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  const handlePermissionToggle = (permissionName: string) => {
    if (disabled) return;

    const newPermissions = selectedPermissions.includes(permissionName)
      ? selectedPermissions.filter((p) => p !== permissionName)
      : [...selectedPermissions, permissionName];

    onChange(newPermissions);
  };

  const handleSelectAllModule = (module: string) => {
    if (disabled) return;

    const modulePermissions = permissionsByModule[module].map((p) => p.name);
    const allSelected = modulePermissions.every((p) =>
      selectedPermissions.includes(p)
    );

    let newPermissions: string[];
    if (allSelected) {
      // Deselect all
      newPermissions = selectedPermissions.filter(
        (p) => !modulePermissions.includes(p)
      );
    } else {
      // Select all
      const toAdd = modulePermissions.filter(
        (p) => !selectedPermissions.includes(p)
      );
      newPermissions = [...selectedPermissions, ...toAdd];
    }

    onChange(newPermissions);
  };

  const isModuleAllSelected = (module: string) => {
    const modulePermissions = permissionsByModule[module].map((p) => p.name);
    return modulePermissions.every((p) => selectedPermissions.includes(p));
  };

  const getModuleSelectedCount = (module: string) => {
    const modulePermissions = permissionsByModule[module].map((p) => p.name);
    return modulePermissions.filter((p) => selectedPermissions.includes(p)).length;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search permissions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={disabled}
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={disabled}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Selection Summary */}
      <div className="flex items-center justify-between px-4 py-2 bg-blue-50 rounded-lg">
        <span className="text-sm font-medium text-blue-900">
          Selected: {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''}
        </span>
        {selectedPermissions.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Permissions by Module */}
      <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {Object.keys(filteredModules).length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm">No permissions found</p>
          </div>
        ) : (
          Object.entries(filteredModules).map(([module, permissions]) => {
            const isExpanded = expandedModules.has(module);
            const selectedCount = getModuleSelectedCount(module);
            const allSelected = isModuleAllSelected(module);

            return (
              <div key={module} className="bg-white">
                {/* Module Header */}
                <div className="px-4 py-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleModule(module)}
                      className="flex items-center space-x-2 flex-1 text-left hover:text-blue-600 disabled:cursor-not-allowed"
                      disabled={disabled}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          isExpanded ? 'transform rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <span className="font-medium text-gray-900">
                        {module}
                        <span className="ml-2 text-sm text-gray-500 font-normal">
                          ({selectedCount}/{permissions.length})
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAllModule(module)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={disabled}
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                {/* Module Permissions */}
                {isExpanded && (
                  <div className="px-4 py-2 space-y-2">
                    {permissions.map((permission) => {
                      const isSelected = selectedPermissions.includes(permission.name);

                      return (
                        <label
                          key={permission.name}
                          className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                            disabled ? 'opacity-50 cursor-not-allowed' : ''
                          } ${isSelected ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handlePermissionToggle(permission.name)}
                            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                            disabled={disabled}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {permission.name}
                              </p>
                              {permission.requiredApprovalLevel !== undefined && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Level {permission.requiredApprovalLevel}+
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {permission.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
