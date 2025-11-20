import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

export interface DepartmentAppearance {
    id: number;
    name: string;
    logo_path: string | null;
    background_image_path: string | null;
    primary_color: string;
    secondary_color: string;
    custom_css: string | null;
}

export interface ImageUploadResponse {
    path: string;
    url: string;
}

export const departmentAppearanceApi = {
    /**
     * Get department appearance settings
     */
    getSettings: async (departmentId: number): Promise<DepartmentAppearance> => {
        const response = await api.get(`/admin/departments/${departmentId}/appearance`);
        return response.data.data;
    },

    /**
     * Update department appearance settings
     */
    updateSettings: async (
        departmentId: number,
        settings: Partial<DepartmentAppearance>
    ): Promise<DepartmentAppearance> => {
        const response = await api.post(`/admin/departments/${departmentId}/appearance`, settings);
        return response.data.data;
    },

    /**
     * Upload department image (logo or background)
     */
    uploadImage: async (
        departmentId: number,
        file: File,
        type: 'logo' | 'background'
    ): Promise<ImageUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const response = await api.post(`/admin/departments/${departmentId}/appearance/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.data;
    },

    /**
     * Delete department image
     */
    deleteImage: async (departmentId: number, path: string, type: 'logo' | 'background'): Promise<void> => {
        await api.delete(`/admin/departments/${departmentId}/appearance/delete`, {
            data: { path, type },
        });
    },
};

export default departmentAppearanceApi;
