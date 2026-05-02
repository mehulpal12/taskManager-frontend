import API from "@/lib/axios";

/**
 * Create a new project
 */
export const createProject = async (data: {
  name: string;
}) => {
  try {
    if (!data?.name || data.name.trim().length < 2) {
      throw new Error("Project name must be at least 2 characters");
    }

    const res = await API.post("/projects", data);

    return res.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      "Failed to create project";

    throw new Error(message);
  }
};

/**
 * Fetch all projects for the current user
 */
export const getProjects = async () => {
  try {
    const res = await API.get("/projects");
    return Array.isArray(res.data) ? res.data : [];
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      "Failed to fetch projects";
    throw new Error(message);
  }
};