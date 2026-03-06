"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Pencil, Clock } from "lucide-react";
import { formatRelativeTime, formatFullTimestamp } from "@/lib/format-time";

interface TemplateRow {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TemplatesListProps {
  templates: TemplateRow[];
}

export function TemplatesList({ templates }: TemplatesListProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center text-gray-400">
        No templates yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
              Template
            </th>
            <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
              Updated
            </th>
            <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-12">
              &nbsp;
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {templates.map((template) => (
            <tr
              key={template.id}
              className="hover:bg-gray-50/50 transition-colors"
            >
              <td className="px-5 py-3.5">
                <Link
                  href={`/admin/templates/${template.id}`}
                  className="text-sm font-medium text-gray-900 hover:text-primary transition-colors"
                >
                  {template.name}
                </Link>
              </td>
              <td className="px-5 py-3.5">
                {template.is_active ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </td>
              <td className="px-5 py-3.5">
                <span
                  className="flex items-center gap-1 text-xs text-gray-400"
                  title={formatFullTimestamp(template.updated_at)}
                >
                  <Clock size={11} />
                  {formatRelativeTime(template.updated_at)}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <Link
                  href={`/admin/templates/${template.id}`}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 inline-flex transition-colors"
                >
                  <Pencil size={14} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
