import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

export interface SystemAppearanceSettings {
    id: number;
    logo_light_path: string | null;
    logo_dark_path: string | null;
    favicon_path: string | null;
    background_image_path: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    enable_dark_mode: boolean;
    default_theme: 'light' | 'dark' | 'system';
    font_family: string;
    custom_css: string | null;
    custom_js: string | null;
}

export interface ImageUploadResponse {
    path: string;
    url: string;
}

export const appearanceApi = {
    /**
     * Get system appearance settings
     */
    getSettings: async (): Promise<SystemAppearanceSettings> => {
        const response = await api.get('/admin/appearance');
        return response.data.data;
    },

    /**
     * Update system appearance settings
     */
    updateSettings: async (settings: Partial<SystemAppearanceSettings>): Promise<SystemAppearanceSettings> => {
        const response = await api.post('/admin/appearance', settings);
        return response.data.data;
    },

    /**
     * Upload appearance image (logo, favicon, background)
     */
    uploadImage: async (file: File, type: 'logo_light' | 'logo_dark' | 'favicon' | 'background'): Promise<ImageUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const response = await api.post('/admin/appearance/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.data;
    },

    /**
     * Delete appearance image
     */
    deleteImage: async (path: string, type: 'logo_light' | 'logo_dark' | 'favicon' | 'background'): Promise<void> => {
        await api.delete('/admin/appearance/delete', {
            data: { path, type },
        });
    },
};

export default appearanceApi;
