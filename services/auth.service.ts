import API from "../lib/axios";

/**
 * Login a user
 */
export const loginUser = async (data: { email: string; password: string }) => {
  try {
    const res = await API.post("/auth/login", data);
    return res.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || "Login failed";
    throw new Error(message);
  }
};

/**
 * Register a new user
 */
export const register = async (data: any) => {
  try {
    const res = await API.post("/auth/signup", data);
    return res.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || "Registration failed";
    throw new Error(message);
  }
};