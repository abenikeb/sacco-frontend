"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { LockKeyhole, User } from "lucide-react";
import { PasswordInput } from "@/components/ui/passwordInput";

export default function LoginPage() {
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [rememberMe, setRememberMe] = useState(false);
	const router = useRouter();
	const { login } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		const result = await login(identifier, password);

		if (result.success) {
			router.push(result.redirectUrl as string);
		} else {
			setError("Invalid credentials");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
			<div className="w-full max-w-md">
				<Card className="border-slate-200 shadow-xl">
					<CardHeader className="space-y-1 text-center">
						<div className="flex justify-center mb-2">
							<div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
								<LockKeyhole className="h-6 w-6 text-slate-600" />
							</div>
						</div>
						<CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
						<CardDescription>
							Sign in to your account to continue
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="identifier" className="text-sm font-medium">
									ET Number
								</Label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
										<User className="h-4 w-4 text-slate-400" />
									</div>
									<Input
										id="identifier"
										name="identifier"
										type="text"
										required
										className="pl-10"
										placeholder="Enter your ET number"
										value={identifier}
										onChange={(e) => setIdentifier(e.target.value)}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="password" className="text-sm font-medium">
										Password
									</Label>
									<a
										href="#"
										className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
										Forgot password?
									</a>
								</div>

								<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
									<LockKeyhole className="h-4 w-4 text-slate-400" />
								</div>
								<PasswordInput
									id="password"
									name="password"
									type="password"
									required
									className="pl-10"
									placeholder="Enter your password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
								/>
							</div>

							{error && (
								<div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
									{error}
								</div>
							)}

							<div className="flex items-center space-x-2">
								<Checkbox
									id="remember"
									checked={rememberMe}
									onCheckedChange={(checked) =>
										setRememberMe(checked as boolean)
									}
								/>
								<Label
									htmlFor="remember"
									className="text-sm text-blue-500 font-normal">
									Remember me for 30 days
								</Label>
							</div>

							<Button
								type="submit"
								className="w-full bg-blue-800 hover:bg-blue-700 text-white">
								Sign in
							</Button>
						</form>
					</CardContent>
					<CardFooter className="flex justify-center border-t p-4">
						<p className="text-sm text-slate-500">
							Don't have an account?{" "}
							<a
								href="/membership"
								className="font-medium text-slate-800 hover:underline">
								Register
							</a>
						</p>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
