import client from './client';

export interface AIChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string;
}

export interface AIChartData {
  type: 'bar' | 'pie' | 'line' | 'none';
  title: string;
  labels: string[];
  datasets: AIChartDataset[];
}

export interface AIResponse {
  text: string;
  sqlQuery?: string;
  explanation?: string;
  chart?: AIChartData;
  data?: any[];
}

export const aiApi = {
  query: async (message: string, context?: string): Promise<AIResponse> => {
    const response = await client.post<AIResponse>('/ai/query', { message, context });
    return response.data;
  },
};
