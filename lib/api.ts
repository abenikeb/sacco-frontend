import { MemberData } from "@/app/models";
import axios from "axios";
import { response } from "express";
import { string } from "prop-types";

export interface LoanApprovalHistoryQuery {
	search?: string;
	status?: "ALL" | "PENDING" | "APPROVED" | "REJECTED";
	fromDate?: string;
	toDate?: string;
	page?: number;
	pageSize?: number;
}

export enum MembershipApproval {
	APPROVED,
	PENDING,
	REJECTED,
}

// i will create a model.ts

const API_BASE_URL = "/api";

const api = axios.create({
	baseURL: API_BASE_URL,
	withCredentials: true, // ✅ Important for cookies (session/token)
	headers: {
		"Content-Type": "application/json",
		"Cache-Control": "no-cache, no-store, must-revalidate",
		"Pragma": "no-cache",
		"Expires": "0",
	},
});

// 🧩 Request Interceptor
api.interceptors.request.use(
	(config) => {
		// Add a timestamp param to bypass caching automatically
		if (config.method?.toUpperCase() === "GET") {
			const separator = config.url?.includes("?") ? "&" : "?";
			config.url = `${config.url}${separator}t=${Date.now()}`;
		}

		// console.log("[API Request]", config.method?.toUpperCase(), config.url);
		return config;
	},
	(error) => {
		console.error("[API Request Error]", error);
		return Promise.reject(error);
	}
);

// 🧩 Response Interceptor
api.interceptors.response.use(
	(response) => {
		// console.log("[API Response]", response.status, response.config.url);
		return response;
	},
	(error) => {
		const isAuthError = error.response?.status === 401;
		const isBrowser = typeof window !== "undefined";
		const pathname = isBrowser ? window.location.pathname : "";

		const isSafeToRedirect =
			pathname !== "/login" &&
			!pathname.startsWith("/.well-known") &&
			!pathname.match(/\.(js|json|css|map|ico|png|jpg|jpeg)$/);

		console.error("[API Error]", {
			status: error.response?.status,
			url: error.config?.url,
			data: error.response?.data,
		});

		if (isAuthError && isBrowser && isSafeToRedirect) {
			console.warn("[API] Unauthorized - redirecting to login");
			window.location.href = `/login?callbackUrl=${encodeURIComponent(
				pathname
			)}`;
		}

		return Promise.reject(error);
	}
);

//
// ---------- API WRAPPERS ----------
//

export const dashboardAPI = {
	getDashboardData: async () => {
		const response = await api.get("/dashboard");
		return response.data;
	},
};

export const authAPI = {
	login: async (identifier: string, password: string) => {
		const response = await api.post("/auth/login", { identifier, password });
		return { user: response.data.user };
	},

	logout: async () => {
		const response = await api.post("/auth/logout");
		return response.data;
	},

	session: async () => {
		const response = await api.get("/auth/session");
		return response.data;
	},

	signup: async (data: {
		name: string;
		email: string;
		phone: string;
		password: string;
		role?: string;
	}) => {
		const response = await api.post("/auth/register", data);
		return response.data;
	},
};

export const membersAPI = {
	getMember: async (etNumber: string) => {
		const response = await api.get(`/members/${etNumber}`);
		return response.data;
	},

	getMembersByDate: async (effectiveDate: Date) => {
		const response = await api.get("/members__", {
			params: { effectiveDate: effectiveDate.toISOString() },
		});
		return response.data;
	},

	getMembers: async () => {
		const response = await api.get(`/members__`);
		return response.data;
	},
	// this needs to be checked
	uploadKYC: async (formData: FormData) => {
		const response = await api.post("/member/kyc-upload", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
		return response.data;
	},

	importMembers: async (members: MemberData[]) => {
		const response = await api.post("/members__/import", members, {
			headers: {
				"Content-Type": "application/json",
			},
		});
		return response.data;
	},

	getWillingDeposits: async (userId: number | undefined) => {
		const response = await api.get(
			`/willing-deposit/requests?memberId=${userId}`
		);
		return response.data;
	},

	willingDepositRequest: async (data: {
		amount: number;
		reason: string;
		paymentMethod: string;
		memberId: number | undefined;
	}) => {
		const response = await api.post("/willing-deposit/request", data);
		return response.data;
	},
};

export const membersLoanAPI = {
	apply: async (formData: {
		amount: number;
		interestRate: number;
		tenureMonths: number;
		purpose: string;
		coSigner1?: string;
		coSigner2?: string;
		agreement: File;
	}) => {
		const data = new FormData();
		data.append("amount", String(formData.amount));
		data.append("interestRate", String(formData.interestRate));
		data.append("tenureMonths", String(formData.tenureMonths));
		data.append("purpose", formData.purpose);
		if (formData.coSigner1) data.append("coSigner1", formData.coSigner1);
		if (formData.coSigner2) data.append("coSigner2", formData.coSigner2);
		data.append("agreement", formData.agreement);

		const response = await api.post(`/loans/apply`, data, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});

		return response.data;
	},

	loanEligibilityReq: async () => {
		const response = await api.get("/members/loan-eligibility");
		return response.data;
	},

	getLoans: async () => {
		const response = await api.get("/members/loans");
		return response.data;
	},

	getLoansById: async (Id: string[] | string) => {
		const response = await api.get(`/members/loans/${Id}`);
		return response.data;
	},

	calculateLoan: async (data: {
		loanAmount: number;
		interestRate: number;
		loanTerm: number;
		repaymentFrequency: "monthly" | "quarterly" | "annually";
	}) => {
		const response = await api.post("/loans/calculate", data);
		return response.data;
	},

	payLoanRepayment: async (
		loanId: string | string[],
		repaymentId: string | number,
		data: {
			amount: number;
			reference?: string;
			sourceType: string;
		}
	) => {
		const response = await api.post(
			`/members/loans/${loanId}/repayments/${repaymentId}/pay`,
			data
		);
		return response.data;
	},
};

export const membersSavingsAPI = {
	getSavingsAndTransactions: async (
		etNumber: string,
		period: string,
		type: string
	) => {
		const response = await api.get(
			`/members/${etNumber}/savings-and-transactions`,
			{ params: { period, type } } // axios handles query strings automatically
		);
		return response.data;
	},
};

export const loanAPI = {
	getLoan: async () => {
		const response = await api.get("/loans");
		return response.data;
	},
	getLoanById: async (id: string[] | string) => {
		let param: number;

		if (typeof id === "string") {
			param = Number.parseInt(id, 10);
		} else {
			// join array into single string, then parse
			param = Number.parseInt(id.join(""), 10);
		}

		const response = await api.get(`/loans/${param}`);
		return response.data;
	},
	getLoanApprovalHistory: async (query: LoanApprovalHistoryQuery = {}) => {
		const response = await api.get("/loans/approval-history", {
			params: query,
		});
		return response.data;
	},
	getPendingLoans: async () => {
		const response = await api.get("/loans/pending");
		return response.data;
	},
	getDisbursedLoan: async () => {
		const response = await api.get("/loans/disbursed");
		return response.data;
	},
	approveLoans: async (id: number, status: string, comment: string) => {
		const response = await api.post(`/loans/approve/${id}`, {
			status,
			comment,
		});
		return response.data;
	},
};

export const loanCalculator = {
	getCalculated: async (
		loanAmount: number,
		interestRate: number,
		loanTerm: number,
		repaymentFrequency: "monthly" | "quarterly" | "annually"
	) => {
		const result = await api.post("/loans/calculate", {
			loanAmount,
			interestRate,
			loanTerm,
			repaymentFrequency,
		});
		return result.data;
	},
};

export const loanAgreement = {
	getLoanAgreement: async () => {
		const response = await api.get("/loans/agreement-template", {
			responseType: "blob",
		});
		return response.data;
	},
};

export const loanDocument = {
	getLoanDocumentById: async (documentId: number) => {
		const response = await api.get(`/member/loans/documents/${documentId}`);
		return response.data;
	},

	getLoanDocumentByUrl: async (URL: string) => {
		const response = await api.get(
			`/members/documents/view?url=${encodeURIComponent(URL)}`,
			{
				responseType: "blob",
			}
		);
		return response.data;
	},

	getLoanDocument: async () => {
		const response = await api.get("/members/loans/documents");
		return response.data;
	},
};

export const notificationAPI = {
	getNotifications: async () => {
		const response = await api.get("/notifications");
		console.log({
			response,
		});
		return response.data?.notifications;
	},
	updateNotifications: async (id: number, status: string) => {
		const response = await api.patch(`/notifications/${id}/read`, { status });
		console.log({
			response,
		});
		return response.data;
	},
};

export const membershipAPI = {
	getMembershipRequests: async () => {
		const response = await api.get("/membership/requests");
		return response.data;
	},
	getMembershipRequestById: async (id: number, status: string) => {
		const response = await api.patch(`/membership/requests/${id}`, { status });
		return response.data;
	},
	membershipRequest: async (data: FormData) => {
		const response = await api.post("/membership/request", data, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	},
};

export default api;
