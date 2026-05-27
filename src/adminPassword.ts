const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

if (!adminPassword) {
	throw new Error("Missing VITE_ADMIN_PASSWORD. Copy .env.example to .env.local and set your admin password.");
}

export default adminPassword;
