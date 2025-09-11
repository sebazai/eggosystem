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
import { Search, Database, Key, Trash2, Eye } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { clientApiFetch } from "@/lib/apiClient";
import type {
  RedisKey,
  RedisKeysResponse,
  RedisKeyDataResponse,
  RedisDeleteResponse
} from "@eggosystem/types";

export default function RedisManagementPage() {
  const { user } = useAuth();
  const [_keys, setKeys] = useState<string[]>([]);
  const [filteredKeys, setFilteredKeys] = useState<string[]>([]);
  const [searchPattern, setSearchPattern] = useState("");
  const [selectedKey, setSelectedKey] = useState<RedisKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has admin role for delete operations
  const canDelete = user?.roles.includes("admin") || false;

  const fetchKeys = async (pattern: string = "*") => {
    setLoading(true);
    setError(null);
    const response = await clientApiFetch<RedisKeysResponse>(
      `/api/v1/dashboard/redis/keys?pattern=${encodeURIComponent(pattern)}`
    );

    if (response.success) {
      setKeys(response.data);
      setFilteredKeys(response.data);
    } else {
      setError("Failed to fetch Redis keys");
    }
    setLoading(false);
  };

  const fetchKeyData = async (key: string) => {
    setLoading(true);
    setError(null);
    const response = await clientApiFetch<RedisKeyDataResponse>(
      `/api/v1/dashboard/redis/keys/${encodeURIComponent(key)}`
    );

    if (response.success) {
      setSelectedKey(response.data);
    } else {
      setError("Failed to fetch key data");
    }
    setLoading(false);
  };

  const deleteKey = async (key: string) => {
    if (!canDelete) {
      setError("You don't have permission to delete keys");
      return;
    }

    if (!confirm(`Are you sure you want to delete the key "${key}"?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    const response = await clientApiFetch<RedisDeleteResponse>(
      `/api/v1/dashboard/redis/keys/${encodeURIComponent(key)}`,
      {
        method: "DELETE"
      }
    );

    if (response.success) {
      // Refresh the keys list
      await fetchKeys(searchPattern || "*");
      setSelectedKey(null);
    } else {
      setError("Failed to delete key");
    }
    setLoading(false);
  };

  const handleSearch = () => {
    const pattern = searchPattern.trim() || "*";
    fetchKeys(pattern);
  };

  const handleKeyClick = (key: string) => {
    fetchKeyData(key);
  };

  const formatValue = (value: string | null, type: string) => {
    if (value === null) return "null";

    // Try to parse as JSON for prettifying
    if (type === "string") {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
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

  useEffect(() => {
    fetchKeys();
  }, []);

  return (
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
              {filteredKeys.length} key{filteredKeys.length !== 1 ? "s" : ""}{" "}
              found
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Search pattern (e.g., user:*, session:*)"
                value={searchPattern}
                onChange={(e) => setSearchPattern(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : filteredKeys.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No keys found
                </div>
              ) : (
                filteredKeys.map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => handleKeyClick(key)}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Key className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate font-mono text-sm">{key}</span>
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
                            deleteKey(key);
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
                  <p className="text-sm">{getInsertionTime(selectedKey.ttl)}</p>
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
  );
}
