"use client";

import { useAuth } from "@/components/auth-provider";

export function usePermissions() {
	const { permissionChecker } = useAuth();

	return {
		canView: (resource: string) => permissionChecker.canView(resource),
		canRead: (resource: string) => permissionChecker.canRead(resource),
		canCreate: (resource: string) => permissionChecker.canCreate(resource),
		canUpdate: (resource: string) => permissionChecker.canUpdate(resource),
		canDelete: (resource: string) => permissionChecker.canDelete(resource),
		canApprove: (resource: string) => permissionChecker.canApprove(resource),
		canReject: (resource: string) => permissionChecker.canReject(resource),
		hasPermission: (resource: string, action: string) =>
			permissionChecker.hasPermission(resource, action),
	};
}
