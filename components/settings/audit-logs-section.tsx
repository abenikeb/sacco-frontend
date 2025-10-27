"use client";

import { useState, useEffect } from "react";
import { settingsAPI } from "@/lib/api";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AuditLog {
	id: number;
	action: string;
	actor: string;
	resource: string;
	resourceId: number;
	details: string;
	timestamp: string;
	status: string;
}

export function AuditLogsSection() {
	const [logs, setLogs] = useState<AuditLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);

	useEffect(() => {
		fetchAuditLogs();
	}, [page]);

	const fetchAuditLogs = async () => {
		try {
			setLoading(true);
			const data = await settingsAPI.getAuditLogs(page, 50);
			setLogs(data.logs);
		} catch (error) {
			console.error("Error fetching audit logs:", error);
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status: string) => {
		return status === "SUCCESS"
			? "bg-green-100 text-green-800"
			: "bg-red-100 text-red-800";
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold">Audit Trail & Activity Logs</h3>
				<p className="text-sm text-gray-600">
					Track all system activities and changes
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Activity Logs</CardTitle>
					<CardDescription>Recent system activities</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="text-center py-8">Loading logs...</div>
					) : (
						<div className="space-y-3">
							{logs.map((log) => (
								<div
									key={log.id}
									className="border rounded-lg p-4 hover:bg-gray-50">
									<div className="flex justify-between items-start mb-2">
										<div>
											<p className="font-medium">{log.action}</p>
											<p className="text-sm text-gray-600">{log.details}</p>
										</div>
										<Badge className={getStatusColor(log.status)}>
											{log.status}
										</Badge>
									</div>
									<div className="flex justify-between text-xs text-gray-500">
										<span>By: {log.actor}</span>
										<span>{new Date(log.timestamp).toLocaleString()}</span>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
