"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { membersAPI } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

const formSchema = z.object({
	name: z.string().min(2, {
		message: "Name must be at least 2 characters",
	}),
	email: z
		.string()
		.email({ message: "Invalid email address" })
		.optional()
		.or(z.literal("")),
	phone: z
		.string()
		.min(7, { message: "Phone must be at least 7 characters" })
		.optional()
		.or(z.literal("")),
	salary: z
		.string()
		.refine((val) => !val || !isNaN(Number(val)), {
			message: "Salary must be a valid number",
		})
		.optional()
		.or(z.literal("")),
	department: z.string().optional(),
	division: z.string().optional(),
	section: z.string().optional(),
	group: z.string().optional(),
	national_id_front: z
		.instanceof(File)
		.refine(
			(file) => file.size <= 5 * 1024 * 1024,
			"Front image must be less than 5MB"
		)
		.refine(
			(file) =>
				["image/jpeg", "image/png", "application/pdf"].includes(file.type),
			"Front image must be JPEG, PNG, or PDF"
		)
		.optional(),
	national_id_back: z
		.instanceof(File)
		.refine(
			(file) => file.size <= 5 * 1024 * 1024,
			"Back image must be less than 5MB"
		)
		.refine(
			(file) =>
				["image/jpeg", "image/png", "application/pdf"].includes(file.type),
			"Back image must be JPEG, PNG, or PDF"
		)
		.optional(),
});

interface Member {
	id: number;
	memberNumber: string;
	etNumber: number;
	name: string;
	email?: string;
	phone?: string;
	department?: string;
	division?: string;
	section?: string;
	group?: string;
	salary?: number;
	national_id_front?: string;
	national_id_back?: string;
	createdAt: string;
	updatedAt: string;
}

export default function EditMemberPage() {
	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const memberId = params.id as string;

	const [member, setMember] = useState<Member | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const frontFileInputRef = useRef<HTMLInputElement>(null);
	const backFileInputRef = useRef<HTMLInputElement>(null);
	const [frontFilePreview, setFrontFilePreview] = useState<string>("");
	const [backFilePreview, setBackFilePreview] = useState<string>("");

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			salary: "",
			department: "",
			division: "",
			section: "",
			group: "",
		},
	});

	// Fetch member data on mount
	useEffect(() => {
		const fetchMember = async () => {
			try {
				const response = await membersAPI.getMemberbyId(memberId);
				const memberData = response.data || response;
				setMember(memberData);

				// Populate form with member data
				form.reset({
					name: memberData.name,
					email: memberData.email || "",
					phone: memberData.phone || "",
					salary: memberData.salary?.toString() || "",
					department: memberData.department || "",
					division: memberData.division || "",
					section: memberData.section || "",
					group: memberData.group || "",
				});

				// Set image previews
				if (memberData.national_id_front) {
					setFrontFilePreview(memberData.national_id_front);
				}
				if (memberData.national_id_back) {
					setBackFilePreview(memberData.national_id_back);
				}
			} catch (error: any) {
				console.error("Error fetching member:", error);
				toast({
					title: "Error",
					description: "Failed to load member details",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchMember();
	}, [memberId]);

	const handleFileChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		fieldName: "national_id_front" | "national_id_back",
		setPreview: (preview: string) => void
	) => {
		const file = e.target.files?.[0];
		if (file) {
			form.setValue(fieldName, file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	// async function onSubmit(values: z.infer<typeof formSchema>) {
	// 	setIsSubmitting(true);
	// 	try {
	// 		const formData = new FormData();
	// 		formData.append("name", values.name);
	// 		console.log({
	// 			values,
	// 		});
	// 		if (values.email) formData.append("email", values.email);
	// 		if (values.phone) formData.append("phone", values.phone);
	// 		if (values.salary) formData.append("salary", values.salary);
	// 		if (values.department) formData.append("department", values.department);
	// 		if (values.division) formData.append("division", values.division);
	// 		if (values.section) formData.append("section", values.section);
	// 		if (values.group) formData.append("group", values.group);

	// 		// Only append files if they were changed (new File objects)
	// 		if (values.national_id_front instanceof File) {
	// 			formData.append("national_id_front", values.national_id_front);
	// 		}
	// 		if (values.national_id_back instanceof File) {
	// 			formData.append("national_id_back", values.national_id_back);
	// 		}

	// 		console.log("Submitting form data:", formData);

	// 		// await membersAPI.updateMemberWithFiles(memberId, formData);

	// 		// toast({
	// 		// 	title: "Success",
	// 		// 	description: "Member updated successfully",
	// 		// });

	// 		// router.push(`/members/${memberId}`);
	// 	} catch (error: any) {
	// 		console.error("Error updating member:", error);
	// 		const errorMessage =
	// 			error.response?.data?.message ||
	// 			"Failed to update member. Please try again.";
	// 		toast({
	// 			title: "Error",
	// 			description: errorMessage,
	// 			variant: "destructive",
	// 		});
	// 	} finally {
	// 		setIsSubmitting(false);
	// 	}
	// }
	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsSubmitting(true);

		try {
			const formData = new FormData();

			// Append base fields
			formData.append("name", values.name);
			if (values.email) formData.append("email", values.email);
			if (values.phone) formData.append("phone", values.phone);
			if (values.salary)
				formData.append("salary", Number(values.salary) as any);
			if (values.department) formData.append("department", values.department);
			if (values.division) formData.append("division", values.division);
			if (values.section) formData.append("section", values.section);
			if (values.group) formData.append("group", values.group);
			// if (values.etNumber) formData.append("etNumber", values.etNumber); // <- user input, unique

			// Append file fields only if they are new File objects
			if (values.national_id_front instanceof File) {
				formData.append("national_id_front", values.national_id_front);
			}
			if (values.national_id_back instanceof File) {
				formData.append("national_id_back", values.national_id_back);
			}

			//Correct debug log (FormData objects aren't inspectable directly)
			console.log(
				"Submitting form data:",
				Array.from(formData.entries()).map(([k, v]) => [
					k,
					v instanceof File ? v.name : v,
				])
			);

			// Uncomment to send to your backend API
			await membersAPI.updateMemberWithFiles(memberId, formData);
			toast({
				title: "Success",
				description: "Member updated successfully",
			});
			router.push(`/dashboard/members`);
		} catch (error: any) {
			console.error("Error updating member:", error);
			const errorMessage =
				error.response?.data?.message ||
				"Failed to update member. Please try again.";

			toast({
				title: "Error",
				description: errorMessage,
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	if (isLoading) {
		return (
			<div className="space-y-6 p-6 max-w-2xl mx-auto">
				<Button variant="ghost" disabled>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back
				</Button>
				<div className="space-y-4">
					{[...Array(4)].map((_, i) => (
						<Skeleton key={i} className="h-32 w-full" />
					))}
				</div>
			</div>
		);
	}

	if (!member) {
		return (
			<div className="space-y-6 p-6 max-w-2xl mx-auto">
				<Button variant="ghost" onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back
				</Button>
				<Card>
					<CardContent className="pt-6">
						<p className="text-center text-muted-foreground">
							Member not found
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6 max-w-2xl mx-auto">
			<Button variant="ghost" onClick={() => router.back()}>
				<ArrowLeft className="h-4 w-4 mr-2" />
				Back
			</Button>

			<div>
				<h1 className="text-3xl font-bold">Edit Member</h1>
				<p className="text-muted-foreground mt-2">
					Update {member.name}'s information
				</p>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					{/* Personal Information Section */}
					<Card>
						<CardHeader>
							<CardTitle>Personal Information</CardTitle>
							<CardDescription>Update member's basic details</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="bg-muted p-3 rounded-md">
								<p className="text-sm text-muted-foreground">Member ID</p>
								<p className="font-medium">{member.memberNumber}</p>
							</div>

							<div className="bg-muted p-3 rounded-md">
								<p className="text-sm text-muted-foreground">ET Number</p>
								<p className="font-medium">{member.etNumber}</p>
							</div>

							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Full Name *</FormLabel>
										<FormControl>
											<Input placeholder="John Doe" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="john@example.com"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Phone</FormLabel>
											<FormControl>
												<Input placeholder="+1234567890" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="salary"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Salary</FormLabel>
										<FormControl>
											<Input type="number" placeholder="0.00" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					{/* Organization Information Section */}
					<Card>
						<CardHeader>
							<CardTitle>Organization Details</CardTitle>
							<CardDescription>
								Update organizational hierarchy information
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="division"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Division</FormLabel>
											<FormControl>
												<Input placeholder="e.g., HR Division" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="department"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Department</FormLabel>
											<FormControl>
												<Input placeholder="e.g., Human Resources" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="section"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Section</FormLabel>
											<FormControl>
												<Input placeholder="e.g., Recruitment" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="group"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Group</FormLabel>
											<FormControl>
												<Input placeholder="e.g., Admin Group" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</CardContent>
					</Card>

					{/* National ID Upload Section */}
					<Card>
						<CardHeader>
							<CardTitle>National ID Documents</CardTitle>
							<CardDescription>
								Update national ID documents (optional - upload only to replace)
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Front Image Upload */}
							<div className="space-y-3">
								<label className="text-sm font-medium">
									National ID - Front
								</label>
								<input
									ref={frontFileInputRef}
									type="file"
									accept="image/jpeg,image/png,application/pdf"
									onChange={(e) =>
										handleFileChange(
											e,
											"national_id_front",
											setFrontFilePreview
										)
									}
									className="hidden"
								/>
								<div
									onClick={() => frontFileInputRef.current?.click()}
									className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-accent transition-colors">
									{frontFilePreview ? (
										<div className="space-y-2">
											<img
												src={frontFilePreview || "/placeholder.svg"}
												alt="Front ID Preview"
												className="max-h-40 mx-auto rounded"
											/>
											{form.getValues("national_id_front") instanceof File && (
												<p className="text-sm text-muted-foreground">
													{form.getValues("national_id_front")?.name}
												</p>
											)}
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													setFrontFilePreview("");
													form.setValue("national_id_front", undefined as any);
												}}>
												Remove
											</Button>
										</div>
									) : (
										<div className="space-y-2">
											<p className="text-sm font-medium">
												Click to upload or drag and drop
											</p>
											<p className="text-xs text-muted-foreground">
												JPEG, PNG or PDF (max 5MB)
											</p>
										</div>
									)}
								</div>
								{form.formState.errors.national_id_front && (
									<p className="text-sm text-destructive">
										{form.formState.errors.national_id_front.message}
									</p>
								)}
							</div>

							{/* Back Image Upload */}
							<div className="space-y-3">
								<label className="text-sm font-medium">
									National ID - Back
								</label>
								<input
									ref={backFileInputRef}
									type="file"
									accept="image/jpeg,image/png,application/pdf"
									onChange={(e) =>
										handleFileChange(e, "national_id_back", setBackFilePreview)
									}
									className="hidden"
								/>
								<div
									onClick={() => backFileInputRef.current?.click()}
									className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-accent transition-colors">
									{backFilePreview ? (
										<div className="space-y-2">
											<img
												src={backFilePreview || "/placeholder.svg"}
												alt="Back ID Preview"
												className="max-h-40 mx-auto rounded"
											/>
											{form.getValues("national_id_back") instanceof File && (
												<p className="text-sm text-muted-foreground">
													{form.getValues("national_id_back")?.name}
												</p>
											)}
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													setBackFilePreview("");
													form.setValue("national_id_back", undefined as any);
												}}>
												Remove
											</Button>
										</div>
									) : (
										<div className="space-y-2">
											<p className="text-sm font-medium">
												Click to upload or drag and drop
											</p>
											<p className="text-xs text-muted-foreground">
												JPEG, PNG or PDF (max 5MB)
											</p>
										</div>
									)}
								</div>
								{form.formState.errors.national_id_back && (
									<p className="text-sm text-destructive">
										{form.formState.errors.national_id_back.message}
									</p>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Submit Buttons */}
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
							disabled={isSubmitting}>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting} className="flex-1">
							{isSubmitting ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
