import api from './api';

export interface HomepageSettings {
  id?: number;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonLink: string;
  aboutTitle: string;
  aboutContent: string;
  yearsExperience: number;
  happyCustomers: number;
  productsCount: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImageUrl?: string;
  showPromoBanner: boolean;
  promoBannerText?: string;
  showNewsletter: boolean;
  newsletterTitle?: string;
  primaryColor: string;
  secondaryColor: string;
  features: Array<{
    id: number;
    icon: string;
    title: string;
    description: string;
  }>;
  heroImages: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NewsletterSubscription {
  email: string;
}

class HomepageService {
  private baseURL = '/homepage';

  // Get homepage settings
  async getSettings(): Promise<HomepageSettings> {
    const response = await api.get(`${this.baseURL}/settings`);
    return response.data.data;
  }

  // Update homepage settings
  async updateSettings(settings: Partial<HomepageSettings>): Promise<HomepageSettings> {
    const response = await api.put(`${this.baseURL}/settings`, settings);
    return response.data.data;
  }

  // Subscribe to newsletter
  async subscribeNewsletter(data: NewsletterSubscription): Promise<void> {
    await api.post(`${this.baseURL}/newsletter/subscribe`, data);
  }

  // Upload hero images
  async uploadHeroImages(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post(`${this.baseURL}/upload/hero-images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }
}

export default new HomepageService();
