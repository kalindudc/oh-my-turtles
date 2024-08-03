// utils/api.ts
export const requestApiKey = async (): Promise<string | null> => {
  try {
    const response = await fetch('/api/getApiKey', {
      method: 'GET',
      credentials: 'include', // to include the cookie
    });

    if (response.ok) {
      const data = await response.json();
      return data.apiKey;
    } else {
      console.error('Failed to fetch API key');
      return null;
    }
  } catch (error) {
    console.error('Error fetching API key:', error);
    return null;
  }
};
