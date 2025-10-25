// ============================================
// FRONTEND SOCKET CLIENT CONFIGURATION
// Runs on: http://localhost:3001
// Connects to: Backend Socket.IO Server on http://localhost:3000
// ============================================

import io, { type Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initializeSocket = () => {
	if (socket) return socket;

	const backendUrl =
		process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

	socket = io(backendUrl, {
		reconnection: true,
		reconnectionDelay: 1000,
		reconnectionDelayMax: 5000,
		reconnectionAttempts: 5,
		transports: ["websocket", "polling"],
	});

	socket.on("connect", () => {
		console.log("Frontend Socket connected to backend:", socket?.id);
	});

	socket.on("disconnect", () => {
		console.log("Frontend Socket disconnected from backend");
	});

	socket.on("error", (error) => {
		console.error("Frontend Socket error:", error);
	});

	return socket;
};

export const getSocket = () => {
	if (!socket) {
		return initializeSocket();
	}
	return socket;
};

export const disconnectSocket = () => {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
};
