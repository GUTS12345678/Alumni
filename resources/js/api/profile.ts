import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

export interface SocialLinks {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    github?: string;
}

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    phone_number: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    profile_picture_path: string | null;
    cover_photo_path: string | null;
    social_links: SocialLinks | null;
    preferred_theme: 'light' | 'dark' | 'system';
    preferred_language: string;
}

export interface ImageUploadResponse {
    path: string;
    url: string;
}

export const profileApi = {
    /**
     * Get authenticated user's profile
     */
    getProfile: async (): Promise<UserProfile> => {
        const response = await api.get('/profile');
        return response.data.data;
    },

    /**
     * Update user profile
     */
    updateProfile: async (profile: Partial<UserProfile>): Promise<UserProfile> => {
        const response = await api.post('/profile', profile);
        return response.data.data;
    },

    /**
     * Upload profile or cover photo
     */
    uploadImage: async (file: File, type: 'profile_picture' | 'cover_photo'): Promise<ImageUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const response = await api.post('/profile/upload-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.data;
    },

    /**
     * Delete profile or cover photo
     */
    deleteImage: async (type: 'profile_picture' | 'cover_photo'): Promise<void> => {
        await api.delete('/profile/delete-image', {
            data: { type },
        });
    },

    /**
     * Update password
     */
    updatePassword: async (
        currentPassword: string,
        newPassword: string,
        newPasswordConfirmation: string
    ): Promise<void> => {
        await api.post('/profile/password', {
            current_password: currentPassword,
            new_password: newPassword,
            new_password_confirmation: newPasswordConfirmation,
        });
    },
};

export default profileApi;
