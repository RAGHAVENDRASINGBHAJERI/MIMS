import { useState } from 'react';
import { Button } from '@/components/ui/button';
import api from '@/services/api';

export function ApiTest() {
  const [result, setResult] = useState<string>('');

  const testApi = async () => {
    try {
      console.log('Testing API connection...');
      console.log('API base URL:', api.defaults.baseURL);
      console.log('Full health URL:', `${api.defaults.baseURL}/health`);
      const response = await api.get('/health');
      console.log('API test response:', response);
      setResult(`Success: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      console.error('API test error:', error);
      setResult(`Error: ${error.message} - ${error.response?.status} - ${error.response?.data}`);
    }
  };

  const testAuth = async () => {
    try {
      console.log('Testing auth endpoint...');
      console.log('API base URL:', api.defaults.baseURL);
      console.log('Full auth URL:', `${api.defaults.baseURL}/auth/register`);
      const response = await api.post('/auth/register', {
        name: 'test',
        email: `test${Date.now()}@example.com`,
        password: 'password123'
      });
      console.log('Auth test response:', response);
      setResult(`Auth Success: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      console.error('Auth test error:', error);
      setResult(`Auth Error: ${error.message} - ${error.response?.status} - ${error.response?.data}`);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-4">API Test</h3>
      <div className="space-x-2 mb-4">
        <Button onClick={testApi}>Test Health Endpoint</Button>
        <Button onClick={testAuth}>Test Auth Endpoint</Button>
      </div>
      <div className="p-2 bg-gray-100 rounded text-sm">
        <pre>{result}</pre>
      </div>
    </div>
  );
}
