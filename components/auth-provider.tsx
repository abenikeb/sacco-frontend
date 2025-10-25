"use client";

import { createContext, useContext, useEffect, useState } from "react";
// import type { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";

// dashboard-shell.tsx (client component)
type UserRole = "ACCOUNTANT" | "MANAGER" | "SUPERVISOR" | "COMMITTEE"; // define your own enum or string union here

type User = {
	id: number;
	name: string;
	email: string;
	role: UserRole;
	memberId?: number;
	etNumber?: any;
};

type AuthContextType = {
	user: User | null;
	loading: boolean;
	login: (
		identifier: string,
		password: string
	) => Promise<{ success: boolean; redirectUrl?: string; user?: User }>;
	logout: () => Promise<void>;
	isAuthenticated: boolean;
	etNumber?: any;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(() => {
		if (typeof window !== "undefined") {
			const storedUser = localStorage.getItem("user");
			return storedUser ? JSON.parse(storedUser) : null;
		}
		return null;
	});

	const [loading, setLoading] = useState(true);
	const router = useRouter();

	// Load user from localStorage if token exists
	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		// console.log("[Component] user from AuthContext(UseEffect):", user);
		if (!user) {
			// router.push('/')
			return;
		}

		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}
		setLoading(false);
	}, []);

	const login = async (
		identifier: string,
		password: string
	): Promise<{ success: boolean; redirectUrl?: string; user?: User }> => {
		// console.log("[AuthProvider] login() called with:", identifier);
		try {
			setLoading(true);
			const { user } = await authAPI.login(identifier, password);
			// console.log("[AuthProvider] login() response user:", user);
			console.log(user);

			if (user) {
				localStorage.setItem("user", JSON.stringify(user));
				setUser(user);
				// console.log("[AuthProvider] User set:", user);

				const params = new URLSearchParams(window.location.search);
				const callbackUrl =
					params.get("callbackUrl") ||
					(user.role === "MEMBER" ? "/member" : "/dashboard");

				return { success: true, redirectUrl: callbackUrl, user: user };
			} else {
				console.warn("[AuthProvider] Login failed: no user or token");
				return { success: false };
			}
		} catch (error) {
			console.error("[AuthProvider] Login error:", error);
			return { success: false };
		} finally {
			setLoading(false);
		}
	};

	const logout = async (): Promise<void> => {
		try {
			setLoading(true);
			await authAPI.logout();
		} catch (error) {
			// Ignore error but clear data
		} finally {
			localStorage.removeItem("user");
			setUser(null);
			router.push("/login");
			setLoading(false);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				login,
				logout,
				isAuthenticated: !!user,
				etNumber: user?.etNumber,
			}}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
}
