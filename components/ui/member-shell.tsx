"use client";

import type React from "react";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	BarChart3,
	CreditCard,
	FileText,
	Home,
	LogOut,
	Menu,
	PiggyBank,
	Settings,
	User,
	X,
	Upload,
	Calculator,
	FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import { authAPI } from "@/lib/api";

interface MemberShellProps {
	children: React.ReactNode;
}

export function MemberShell({ children }: MemberShellProps) {
	let { user, logout } = useAuth();
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);

	const toggleSidebar = () => {
		setIsOpen(!isOpen);
	};

	const closeSidebar = () => {
		setIsOpen(false);
	};

	const navItems = [
		{
			title: "Dashboard",
			href: "/member",
			icon: Home,
		},

		{
			title: "Savings & Transactions",
			href: "/member/savings",
			icon: PiggyBank,
		},
		{
			title: "Loans",
			href: "/member/loans",
			icon: CreditCard,
		},
		{
			title: "Apply for Loan",
			href: "/member/loans/apply",
			icon: FileText,
		},
		{
			title: "Loan Calculator",
			href: "/member/loans/calculator",
			icon: Calculator,
		},
		// {
		// 	title: "KYC Documents",
		// 	href: "/member/kyc",
		// 	icon: Upload,
		// },
		// {
		// 	title: "Membership Requests",
		// 	href: "/member/membership",
		// 	icon: FileCheck,
		// },
		// {
		// 	title: "Willing Deposit Request",
		// 	href: "/member/willing-deposit/request",
		// 	icon: PiggyBank,
		// },
		// {
		// 	title: "Willing Deposit History",
		// 	href: "/member/willing-deposit/history",
		// 	icon: FileCheck,
		// },
		// {
		// 	title: "Reports",
		// 	href: "/member/reports",
		// 	icon: BarChart3,
		// },
		// {
		// 	title: "My Profile",
		// 	href: "/member/profile",
		// 	icon: User,
		// },
		// {
		// 	title: "Settings",
		// 	href: "/member/settings",
		// 	icon: Settings,
		// },
	];
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
				<div className="font-semibold">Member Portal</div>
				<div className="w-6"></div> {/* Spacer for alignment */}
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
					<div className="font-semibold">Member Portal</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={closeSidebar}
						className="md:hidden">
						<X className="h-5 w-5" />
						<span className="sr-only">Close Menu</span>
					</Button>
				</div>
				<div className="flex flex-col">
					<div className="flex-1 overflow-auto py-2">
						<nav className="grid gap-1 px-2">
							{navItems.map((item, index) => (
								<Link
									key={index}
									href={item.href}
									onClick={closeSidebar}
									className={cn(
										"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100",
										pathname === item.href
											? "bg-gray-100 text-blue-600"
											: "text-gray-700"
									)}>
									<item.icon className="h-4 w-4" />
									{item.title}
								</Link>
							))}
						</nav>
					</div>
					<div className="mt-auto border-t p-4">
						<div className="mb-2 flex items-center gap-2">
							<div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
								<span className="text-sm font-medium text-blue-700">
									{user?.name.charAt(0)}
								</span>
							</div>
							<div>
								<p className="text-sm font-medium">{user?.name}</p>
								<p className="text-xs text-gray-500">Member</p>
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							className="w-full justify-start"
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
					"md:ml-64" // Always pushed on desktop
				)}>
				<div className="container mx-auto p-4 md:p-6">{children}</div>
			</main>
		</div>
	);
}
