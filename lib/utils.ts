import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const redirectToLogin = (clearToken = false) => {
    if (clearToken && typeof window !== 'undefined') {
        localStorage.removeItem("token");
    }
    window.location.href =
        `${process.env.NEXT_PUBLIC_API_URL}/api/method/frappe.integrations.oauth2.authorize` +
        `?client_id=${process.env.NEXT_PUBLIC_CLIENT_ID}` +
        `&redirect_uri=${process.env.NEXT_PUBLIC_APP_URL}/callback` +
        "&response_type=code" +
        "&scope=all";
};
