"use client";

import { useState, useEffect } from "react";
import { settingsAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RolePermissions {
	role: string;
	permissions: string[];
}

export function RolesPermissionsSection() {
	const [roles, setRoles] = useState<string[]>([]);
	const [rolePermissions, setRolePermissions] = useState<
		Record<string, string[]>
	>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchRolesAndPermissions();
	}, []);

	const fetchRolesAndPermissions = async () => {
		try {
			setLoading(true);
			const rolesData = await settingsAPI.getAllRoles();
			setRoles(rolesData.roles);

			const permissions: Record<string, string[]> = {};
			for (const role of rolesData.roles) {
				const permData = await settingsAPI.getRolePermissions(role);
				permissions[role] = permData.permissions;
			}
			setRolePermissions(permissions);
		} catch (error) {
			console.error("Error fetching roles:", error);
		} finally {
			setLoading(false);
		}
	};

	const getPermissionColor = (permission: string) => {
		if (permission.includes("view")) return "bg-blue-100 text-blue-800";
		if (permission.includes("create")) return "bg-green-100 text-green-800";
		if (permission.includes("approve")) return "bg-yellow-100 text-yellow-800";
		if (permission.includes("manage")) return "bg-red-100 text-red-800";
		return "bg-gray-100 text-gray-800";
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold">Roles & Permissions</h3>
				<p className="text-sm text-gray-600">Define access control by role</p>
			</div>

			{loading ? (
				<div className="text-center py-8">Loading roles...</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{roles.map((role) => (
						<Card key={role}>
							<CardHeader>
								<CardTitle className="text-base">{role}</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{rolePermissions[role]?.map((permission) => (
										<Badge
											key={permission}
											className={getPermissionColor(permission)}>
											{permission.replace(/_/g, " ")}
										</Badge>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
