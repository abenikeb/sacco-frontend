export type Permission = {
	resource: string;
	action:
		| "VIEW"
		| "READ"
		| "CREATE"
		| "UPDATE"
		| "DELETE"
		| "APPROVE"
		| "REJECT";
};

export class PermissionChecker {
	private permissions: Permission[];

	constructor(permissions: Permission[] = []) {
		this.permissions = permissions;
	}

	setPermissions(permissions: Permission[]) {
		this.permissions = permissions;
	}

	hasPermission(resource: string, action: string): boolean {
		return this.permissions.some(
			(p) => p.resource === resource && p.action === action
		);
	}

	canView(resource: string): boolean {
		return this.hasPermission(resource, "VIEW");
	}

	canRead(resource: string): boolean {
		return this.hasPermission(resource, "READ");
	}

	canCreate(resource: string): boolean {
		return this.hasPermission(resource, "CREATE");
	}

	canUpdate(resource: string): boolean {
		return this.hasPermission(resource, "UPDATE");
	}

	canDelete(resource: string): boolean {
		return this.hasPermission(resource, "DELETE");
	}

	canApprove(resource: string): boolean {
		return this.hasPermission(resource, "APPROVE");
	}

	canReject(resource: string): boolean {
		return this.hasPermission(resource, "REJECT");
	}

	getResourcePermissions(resource: string): string[] {
		return this.permissions
			.filter((p) => p.resource === resource)
			.map((p) => p.action);
	}
}
