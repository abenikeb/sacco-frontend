"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	BarChart3,
	CreditCard,
	Home,
	LogOut,
	Menu,
	PieChart,
	Settings,
	Users,
	X,
	UserPlus,
	DollarSign,
	History,
	Calculator,
	Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { settingsAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
const API_URL = process.env.NEXT_PUBLIC_API_URL

interface DashboardShellProps {
	children: React.ReactNode;
}

interface NavItem {
	title: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	requiredPermissions?: Array<{ resource: string; action: string }>;
	roles?: string[];
}

interface SystemConfig {
	organizationName: string;
	organizationLogo?: string;
}

export function DashboardShell({ children }: DashboardShellProps) {
	const { user, logout, permissionChecker } = useAuth();
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const [orgConfig, setOrgConfig] = useState<SystemConfig | null>(null);
	const [loadingConfig, setLoadingConfig] = useState(true);

	useEffect(() => {
		const fetchOrgConfig = async () => {
			try {
				const config = await settingsAPI.getSystemConfig();
				setOrgConfig(config);
			} catch (error) {
				console.error("Error fetching organization config:", error);
			} finally {
				setLoadingConfig(false);
			}
		};

		fetchOrgConfig();
	}, []);

	const toggleSidebar = () => {
		setIsOpen(!isOpen);
	};

	const closeSidebar = () => {
		setIsOpen(false);
	};

	const navItems: NavItem[] = [
		{
			title: "Dashboard",
			href: "/dashboard",
			icon: Home,
			requiredPermissions: [{ resource: "MEMBERS", action: "VIEW" }],
		},
		{
			title: "Members",
			href: "/dashboard/members",
			icon: Users,
			requiredPermissions: [{ resource: "MEMBERS", action: "VIEW" }],
		},
		{
			title: "Add Member",
			href: "/dashboard/members/add",
			icon: UserPlus,
			requiredPermissions: [{ resource: "MEMBERS", action: "CREATE" }],
		},
		{
			title: "Loans",
			href: "/dashboard/loans/details",
			icon: CreditCard,
			requiredPermissions: [{ resource: "LOANS", action: "VIEW" }],
		},
		{
			title: "Loan Products",
			href: "/dashboard/loans/loan-products",
			icon: Calculator,
			requiredPermissions: [{ resource: "LOANS", action: "VIEW" }],
		},
		{
			title: "Disburse Loans",
			href: "/dashboard/loans/disburse",
			icon: DollarSign,
			requiredPermissions: [{ resource: "LOANS", action: "APPROVE" }],
		},
		{
			title: "Approval History",
			href: "/dashboard/loans/approval-history",
			icon: History,
			requiredPermissions: [{ resource: "LOANS", action: "READ" }],
		},
		{
			title: "Withdrawals",
			href: "/dashboard/withdrawals/approvals",
			icon: CreditCard,
			requiredPermissions: [{ resource: "WITHDRAWALS", action: "APPROVE" }],
		},
		{
			title: "Amortization Calculator",
			href: "/dashboard/loans/calculator",
			icon: Calculator,
			requiredPermissions: [{ resource: "LOANS", action: "READ" }],
		},
		{
			title: "Loan Documents",
			href: "/dashboard/loans/documents",
			icon: Upload,
			requiredPermissions: [{ resource: "LOANS", action: "READ" }],
		},
		{
			title: "Membership Requests",
			href: "/dashboard/membership-requests",
			icon: Users,
			requiredPermissions: [{ resource: "MEMBERS", action: "UPDATE" }],
		},
		{
			title: "Accounting",
			href: "/dashboard/accounting",
			icon: BarChart3,
			requiredPermissions: [{ resource: "ACCOUNTING", action: "VIEW" }],
		},
		{
			title: "Reports",
			href: "/dashboard/reports",
			icon: PieChart,
			requiredPermissions: [{ resource: "REPORTS", action: "VIEW" }],
		},
		{
			title: "Settings",
			href: "/dashboard/settings",
			icon: Settings,
			requiredPermissions: [{ resource: "SETTINGS", action: "UPDATE" }],
		},
	];

	const filteredNavItems = navItems.filter((item) => {
		if (!item.requiredPermissions) return true;

		return item.requiredPermissions.some((perm) =>
			permissionChecker.hasPermission(perm.resource, perm.action)
		);
	});

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 768) {
				setIsOpen(false);
			}
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	if (!user) {
		return <div>Loading... </div>;
	}

	return (
		<div className="flex min-h-screen flex-col bg-gray-100">
			{/* Mobile Header */}
			<header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">
				<Button variant="ghost" size="icon" onClick={toggleSidebar}>
					<Menu className="h-6 w-6" />
					<span className="sr-only">Toggle Menu</span>
				</Button>
				<div className="font-semibold">
					{orgConfig?.organizationName || "MFINS Admin"}
				</div>
				<div className="w-6"></div>
			</header>

			{/* Mobile Sidebar Overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/50 md:hidden"
					onClick={closeSidebar}></div>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-white transition-transform duration-200 ease-in-out md:translate-x-0",
					isOpen ? "translate-x-0" : "-translate-x-full"
				)}>
				<div className="flex h-16 items-center justify-between border-b px-4">
					<div className="flex items-center gap-2">
						{orgConfig?.organizationLogo ? (
							<img
								src={
									`${API_URL}${orgConfig?.organizationLogo}` ||
									"/placeholder.svg"
								}
								alt="Organization Logo"
								className="h-8 w-8 object-contain"
								onError={(e) => {
									// Fallback if image fails to load
									(e.target as HTMLImageElement).style.display = "none";
								}}
							/>
						) : null}
						<div className="font-semibold text-sm">
							{orgConfig?.organizationName || "Ethio Credit MF Admin"}
						</div>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={closeSidebar}
						className="md:hidden">
						<X className="h-5 w-5" />
						<span className="sr-only">Close Menu</span>
					</Button>
				</div>
				<div className="flex flex-col h-[calc(100vh-4rem)]">
					<div className="flex-1 overflow-y-auto py-2">
						<nav className="grid gap-1 px-2">
							{filteredNavItems.map((item, index) => (
								<Link
									key={index}
									href={item.href}
									onClick={closeSidebar}
									className={cn(
										"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ease-in-out hover:bg-gray-100",
										pathname === item.href
											? "bg-blue-100 text-blue-600"
											: "text-gray-700"
									)}>
									<item.icon className="h-5 w-5" />
									{item.title}
								</Link>
							))}
						</nav>
					</div>
					<div className="border-t p-4">
						<div className="mb-2 flex items-center gap-2">
							<div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
								<span className="text-lg font-medium text-blue-700">
									{user?.name ? user.name.charAt(0) : ""}
								</span>
							</div>
							<div>
								<p className="text-sm font-medium">{user?.name}</p>
								<p className="text-xs text-gray-500">
									{user?.role ? user?.role.replace("_", " ") : " "}
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							className="w-full justify-start bg-transparent"
							onClick={() => logout()}>
							<LogOut className="mr-2 h-4 w-4" />
							Log out
						</Button>
					</div>
				</div>
			</aside>

			{/* Main Content */}
			<main
				className={cn(
					"flex-1 transition-all duration-200 ease-in-out",
					"md:ml-64"
				)}>
				<div className="container mx-auto p-4 md:p-6">{children}</div>
			</main>
		</div>
	);
}
// "use client";

// import type React from "react";
// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import {
// 	BarChart3,
// 	CreditCard,
// 	Home,
// 	LogOut,
// 	Menu,
// 	PieChart,
// 	Settings,
// 	Users,
// 	X,
// 	UserPlus,
// 	DollarSign,
// 	History,
// 	Calculator,
// 	Upload,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { useAuth } from "@/components/auth-provider";
// import { settingsAPI } from "@/lib/api";
// import { cn } from "@/lib/utils";

// interface DashboardShellProps {
// 	children: React.ReactNode;
// }

// interface NavItem {
// 	title: string;
// 	href: string;
// 	icon: React.ComponentType<{ className?: string }>;
// 	requiredPermissions?: Array<{ resource: string; action: string }>;
// 	// Keep roles as fallback for backward compatibility
// 	roles?: string[];
// }

// interface SystemConfig {
// 	organizationName: string;
// 	organizationLogo?: string;
// }

// export function DashboardShell({ children }: DashboardShellProps) {
// 	const { user, logout, permissionChecker } = useAuth();
// 	const pathname = usePathname();
// 	const [isOpen, setIsOpen] = useState(false);
// 	const [orgConfig, setOrgConfig] = useState<SystemConfig | null>(null);
// 	const [loadingConfig, setLoadingConfig] = useState(true);

// 	useEffect(() => {
// 		const fetchOrgConfig = async () => {
// 			try {
// 				const config = await settingsAPI.getSystemConfig();
// 				setOrgConfig(config);
// 			} catch (error) {
// 				console.error("Error fetching organization config:", error);
// 			} finally {
// 				setLoadingConfig(false);
// 			}
// 		};

// 		fetchOrgConfig();
// 	}, []);

// 	const toggleSidebar = () => {
// 		setIsOpen(!isOpen);
// 	};

// 	const closeSidebar = () => {
// 		setIsOpen(false);
// 	};

// 	const navItems: NavItem[] = [
// 		{
// 			title: "Dashboard",
// 			href: "/dashboard",
// 			icon: Home,
// 			requiredPermissions: [{ resource: "MEMBERS", action: "VIEW" }],
// 		},
// 		{
// 			title: "Members",
// 			href: "/dashboard/members",
// 			icon: Users,
// 			requiredPermissions: [{ resource: "MEMBERS", action: "VIEW" }],
// 		},
// 		{
// 			title: "Add Member",
// 			href: "/dashboard/members/add",
// 			icon: UserPlus,
// 			requiredPermissions: [{ resource: "MEMBERS", action: "CREATE" }],
// 		},
// 		{
// 			title: "Loans",
// 			href: "/dashboard/loans/details",
// 			icon: CreditCard,
// 			requiredPermissions: [{ resource: "LOANS", action: "VIEW" }],
// 		},
// 		{
// 			title: "Loan Products",
// 			href: "/dashboard/loans/loan-products",
// 			icon: Calculator,
// 			requiredPermissions: [{ resource: "LOANS", action: "VIEW" }],
// 		},
// 		{
// 			title: "Disburse Loans",
// 			href: "/dashboard/loans/disburse",
// 			icon: DollarSign,
// 			requiredPermissions: [{ resource: "LOANS", action: "APPROVE" }],
// 		},
// 		{
// 			title: "Approval History",
// 			href: "/dashboard/loans/approval-history",
// 			icon: History,
// 			requiredPermissions: [{ resource: "LOANS", action: "READ" }],
// 		},
// 		{
// 			title: "Withdrawals",
// 			href: "/dashboard/withdrawals/approvals",
// 			icon: CreditCard,
// 			requiredPermissions: [{ resource: "WITHDRAWALS", action: "APPROVE" }],
// 		},
// 		{
// 			title: "Amortization Calculator",
// 			href: "/dashboard/loans/calculator",
// 			icon: Calculator,
// 			requiredPermissions: [{ resource: "LOANS", action: "READ" }],
// 		},
// 		{
// 			title: "Loan Documents",
// 			href: "/dashboard/loans/documents",
// 			icon: Upload,
// 			requiredPermissions: [{ resource: "LOANS", action: "READ" }],
// 		},
// 		{
// 			title: "Membership Requests",
// 			href: "/dashboard/membership-requests",
// 			icon: Users,
// 			requiredPermissions: [{ resource: "MEMBERS", action: "UPDATE" }],
// 		},
// 		{
// 			title: "Accounting",
// 			href: "/dashboard/accounting",
// 			icon: BarChart3,
// 			requiredPermissions: [{ resource: "ACCOUNTING", action: "VIEW" }],
// 		},
// 		{
// 			title: "Reports",
// 			href: "/dashboard/reports",
// 			icon: PieChart,
// 			requiredPermissions: [{ resource: "REPORTS", action: "VIEW" }],
// 		},
// 		{
// 			title: "Settings",
// 			href: "/dashboard/settings",
// 			icon: Settings,
// 			requiredPermissions: [{ resource: "SETTINGS", action: "UPDATE" }],
// 		},
// 	];

// 	const filteredNavItems = navItems.filter((item) => {
// 		if (!item.requiredPermissions) return true;

// 		return item.requiredPermissions.some((perm) =>
// 			permissionChecker.hasPermission(perm.resource, perm.action)
// 		);
// 	});

// 	useEffect(() => {
// 		const handleResize = () => {
// 			if (window.innerWidth >= 768) {
// 				setIsOpen(false);
// 			}
// 		};

// 		window.addEventListener("resize", handleResize);
// 		return () => window.removeEventListener("resize", handleResize);
// 	}, []);

// 	if (!user) {
// 		return <div>Loading... </div>;
// 	}

// 	return (
// 		<div className="flex min-h-screen flex-col bg-gray-100">
// 			{/* Mobile Header */}
// 			<header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">
// 				<Button variant="ghost" size="icon" onClick={toggleSidebar}>
// 					<Menu className="h-6 w-6" />
// 					<span className="sr-only">Toggle Menu</span>
// 				</Button>
// 				<div className="font-semibold">
// 					{orgConfig?.organizationName || "MFINS Admin"}
// 				</div>
// 				<div className="w-6"></div>
// 			</header>

// 			{/* Mobile Sidebar Overlay */}
// 			{isOpen && (
// 				<div
// 					className="fixed inset-0 z-40 bg-black/50 md:hidden"
// 					onClick={closeSidebar}></div>
// 			)}

// 			{/* Sidebar */}
// 			<aside
// 				className={cn(
// 					"fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-white transition-transform duration-200 ease-in-out md:translate-x-0",
// 					isOpen ? "translate-x-0" : "-translate-x-full"
// 				)}>
// 				<div className="flex h-16 items-center justify-between border-b px-4">
// 					<div className="flex items-center gap-2">
// 						{orgConfig?.organizationLogo && (
// 							<img
// 								src={orgConfig.organizationLogo || "/placeholder.svg"}
// 								alt="Logo"
// 								className="h-8 w-8 object-contain"
// 							/>
// 						)}
// 						<div className="font-semibold text-sm">
// 							{orgConfig?.organizationName || "Ethio Credit MF Admin"}
// 						</div>
// 					</div>
// 					<Button
// 						variant="ghost"
// 						size="icon"
// 						onClick={closeSidebar}
// 						className="md:hidden">
// 						<X className="h-5 w-5" />
// 						<span className="sr-only">Close Menu</span>
// 					</Button>
// 				</div>
// 				<div className="flex flex-col h-[calc(100vh-4rem)]">
// 					<div className="flex-1 overflow-y-auto py-2">
// 						<nav className="grid gap-1 px-2">
// 							{filteredNavItems.map((item, index) => (
// 								<Link
// 									key={index}
// 									href={item.href}
// 									onClick={closeSidebar}
// 									className={cn(
// 										"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ease-in-out hover:bg-gray-100",
// 										pathname === item.href
// 											? "bg-blue-100 text-blue-600"
// 											: "text-gray-700"
// 									)}>
// 									<item.icon className="h-5 w-5" />
// 									{item.title}
// 								</Link>
// 							))}
// 						</nav>
// 					</div>
// 					<div className="border-t p-4">
// 						<div className="mb-2 flex items-center gap-2">
// 							<div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
// 								<span className="text-lg font-medium text-blue-700">
// 									{user?.name ? user.name.charAt(0) : ""}
// 								</span>
// 							</div>
// 							<div>
// 								<p className="text-sm font-medium">{user?.name}</p>
// 								<p className="text-xs text-gray-500">
// 									{user?.role ? user?.role.replace("_", " ") : " "}
// 								</p>
// 							</div>
// 						</div>
// 						<Button
// 							variant="outline"
// 							size="sm"
// 							className="w-full justify-start bg-transparent"
// 							onClick={() => logout()}>
// 							<LogOut className="mr-2 h-4 w-4" />
// 							Log out
// 						</Button>
// 					</div>
// 				</div>
// 			</aside>

// 			{/* Main Content */}
// 			<main
// 				className={cn(
// 					"flex-1 transition-all duration-200 ease-in-out",
// 					"md:ml-64"
// 				)}>
// 				<div className="container mx-auto p-4 md:p-6">{children}</div>
// 			</main>
// 		</div>
// 	);
// }
