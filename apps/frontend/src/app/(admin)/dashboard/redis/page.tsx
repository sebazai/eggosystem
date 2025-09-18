"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Key,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { useRedisKeys } from "@/hooks/data/dashboard/useRedisKeys";
import { useRedisKeyData } from "@/hooks/data/dashboard/useRedisKeyData";
import { useDeleteRedisKey } from "@/hooks/data/dashboard/useDeleteRedisKey";
import { useDebounce } from "@/hooks/useDebounce";

export default function RedisManagementPage() {
  const { user } = useAuth();
  const [searchPattern, setSearchPattern] = useState("");
  const [debouncedSearchPattern, setDebouncedSearchPattern] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedKeyName, setSelectedKeyName] = useState<string | null>(null);

  // Debounce the search pattern with 500ms delay
  const debouncedPattern = useDebounce(searchPattern, 500);

  // Check if user has admin role for delete operations
  const canDelete = user?.roles.includes("admin") || false;

  // Update debounced search pattern when debounced value changes
  useEffect(() => {
    if (
      debouncedPattern &&
      debouncedPattern.trim() !== "" &&
      debouncedPattern.trim() !== "*"
    ) {
      setDebouncedSearchPattern(debouncedPattern);
      setCurrentPage(1); // Reset to first page when search changes
    } else {
      setDebouncedSearchPattern("");
    }
  }, [debouncedPattern]);

  // Use data hooks
  const {
    keys,
    pagination,
    isLoading: keysLoading,
    isError: keysError,
    mutate: refetchKeys
  } = useRedisKeys({
    pattern: debouncedSearchPattern,
    page: currentPage,
    limit: pageSize
  });
  const {
    keyData: selectedKey,
    isLoading: keyDataLoading,
    isError: keyDataError
  } = useRedisKeyData(selectedKeyName);
  const { deleteKey, isDeleting, error: deleteError } = useDeleteRedisKey();

  const handleDeleteKey = async (key: string) => {
    if (!canDelete) {
      return;
    }

    if (!confirm(`Are you sure you want to delete the key "${key}"?`)) {
      return;
    }

    const success = await deleteKey(key);
    if (success) {
      // Refresh the keys list and clear selected key
      refetchKeys();
      setSelectedKeyName(null);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPattern(e.target.value);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleKeyClick = (key: string) => {
    setSelectedKeyName(key);
  };

  const formatValue = (value: string | null, type: string) => {
    if (value === null) return "null";

    // Try to parse as JSON for prettifying
    if (type === "string") {
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        // If not valid JSON, return as is
        return value;
      }
    }

    return value;
  };

  // Not sure if these would be better in backend?
  const _getValuePreview = (value: string | null, type: string) => {
    if (value === null) return "null";

    const formatted = formatValue(value, type);
    if (formatted.length > 100) {
      return formatted.substring(0, 100) + "...";
    }
    return formatted;
  };

  const formatTTL = (ttl: number) => {
    if (ttl === -1) return "No expiration";
    if (ttl === -2) return "Key doesn't exist";
    const days = Math.floor(ttl / 86400);
    const hours = Math.floor((ttl % 86400) / 3600);
    const minutes = Math.floor((ttl % 3600) / 60);
    const seconds = ttl % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getInsertionTime = (ttl: number) => {
    if (ttl === -1) return "No expiration - cannot determine insertion time";
    if (ttl === -2) return "Key doesn't exist";

    // Calculate when the key was inserted by working backwards from current time
    const now = new Date();
    const insertionTime = new Date(now.getTime() + ttl * 1000);

    return insertionTime.toLocaleString();
  };

  // Determine loading and error states
  const isLoading = keysLoading || keyDataLoading || isDeleting;
  const error = keysError || keyDataError || deleteError;

  // Short-circuit returns for loading states
  if (isLoading) {
    return (
      <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Redis Management</h1>
              <p className="text-muted-foreground">
                Manage Redis keys and data
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading Redis data...</p>
            </div>
          </div>
        </div>
      </WithRoleProtection>
    );
  }

  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Redis Management</h1>
            <p className="text-muted-foreground">Manage Redis keys and data</p>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Keys List */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Redis Keys
              </CardTitle>
              <CardDescription>
                {debouncedSearchPattern ? (
                  <>
                    {pagination.total} key{pagination.total !== 1 ? "s" : ""}{" "}
                    found
                    {pagination.totalPages > 1 && (
                      <>
                        {" "}
                        (page {pagination.page} of {pagination.totalPages})
                      </>
                    )}
                  </>
                ) : (
                  "Enter a search pattern to find keys"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <div className="mb-4">
                <Input
                  placeholder="Search pattern (e.g., user:*, session:*)"
                  value={searchPattern}
                  onChange={handleSearchInputChange}
                />
              </div>

              {/* Page Size Selector */}
              {debouncedSearchPattern && (
                <div className="flex items-center gap-2 mb-4">
                  <label className="text-sm text-muted-foreground">
                    Page size:
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) =>
                      handlePageSizeChange(parseInt(e.target.value))
                    }
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-1">
                {!debouncedSearchPattern ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter a search pattern to find Redis keys</p>
                    <p className="text-xs mt-2">
                      Examples: user:*, session:*, cache:*
                    </p>
                  </div>
                ) : keys.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No keys found for pattern: {debouncedSearchPattern}
                  </div>
                ) : (
                  keys.map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                      onClick={() => handleKeyClick(key)}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Key className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate font-mono text-sm">
                          {key}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleKeyClick(key);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteKey(key);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination Controls */}
              {debouncedSearchPattern && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total} keys
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Details */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Key Details</CardTitle>
              <CardDescription>
                {selectedKey
                  ? `Viewing: ${selectedKey.key}`
                  : "Select a key to view details"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              {selectedKey ? (
                <div className="space-y-4 flex flex-col h-full">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Key
                    </label>
                    <p className="font-mono text-sm break-all">
                      {selectedKey.key}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Type
                    </label>
                    <div className="mt-1">
                      <Badge variant="outline">{selectedKey.type}</Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      TTL
                    </label>
                    <p className="text-sm">{formatTTL(selectedKey.ttl)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Insertion Time
                    </label>
                    <p className="text-sm">
                      {getInsertionTime(selectedKey.ttl)}
                    </p>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="text-sm font-medium text-muted-foreground">
                      Value
                    </label>
                    <div className="mt-1 p-3 bg-muted rounded-md flex-1 overflow-auto">
                      <pre className="text-sm whitespace-pre-wrap break-all font-mono">
                        {formatValue(selectedKey.value, selectedKey.type)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Click on a key to view its details
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </WithRoleProtection>
  );
}
