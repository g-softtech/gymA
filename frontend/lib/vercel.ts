export const addDomainToVercel = async (domain: string) => {
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  const token = process.env.VERCEL_API_TOKEN;

  if (!projectId || !token) {
    throw new Error("Missing Vercel credentials in environment variables");
  }

  let url = `https://api.vercel.com/v10/projects/${projectId}/domains`;
  if (teamId) {
    url += `?teamId=${teamId}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: domain }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to add domain to Vercel: ${response.status} ${errorBody}`);
  }

  return response.json();
};

export const verifyDomainStatus = async (domain: string) => {
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  const token = process.env.VERCEL_API_TOKEN;

  if (!projectId || !token) {
    throw new Error("Missing Vercel credentials in environment variables");
  }

  let url = `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}`;
  if (teamId) {
    url += `?teamId=${teamId}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch domain status from Vercel: ${response.status} ${errorBody}`);
  }

  return response.json();
};

export const removeDomainFromVercel = async (domain: string) => {
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  const token = process.env.VERCEL_API_TOKEN;

  if (!projectId || !token) {
    throw new Error("Missing Vercel credentials in environment variables");
  }

  let url = `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}`;
  if (teamId) {
    url += `?teamId=${teamId}`;
  }

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to remove domain from Vercel: ${response.status} ${errorBody}`);
  }

  return response.json();
};
