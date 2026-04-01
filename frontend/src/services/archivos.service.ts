import api from './api';

export interface UploadResponse {
  url: string;
  filename: string;
}

export const archivosService = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return api
      .post<UploadResponse>('/archivos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((response) => response.data);
  },
};
