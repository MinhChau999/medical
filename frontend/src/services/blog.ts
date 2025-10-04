import api from './api';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  authorId?: string;
  authorEmail?: string;
  category?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  views?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBlogPostDto {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

export interface UpdateBlogPostDto extends Partial<CreateBlogPostDto> {}

export interface BlogFilter {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class BlogService {
  async getPosts(filter?: BlogFilter): Promise<{
    data: BlogPost[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await api.get('/blog', { params: filter });
    return response.data;
  }

  async getPost(slug: string): Promise<BlogPost> {
    const response = await api.get(`/blog/${slug}`);
    return response.data.data;
  }

  async createPost(data: CreateBlogPostDto): Promise<BlogPost> {
    const response = await api.post('/blog', data);
    return response.data.data;
  }

  async updatePost(id: string, data: UpdateBlogPostDto): Promise<BlogPost> {
    const response = await api.put(`/blog/${id}`, data);
    return response.data.data;
  }

  async deletePost(id: string): Promise<void> {
    await api.delete(`/blog/${id}`);
  }

  async getCategories(): Promise<{ category: string; count: number }[]> {
    const response = await api.get('/blog/categories');
    return response.data.data;
  }

  async getStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    total_views: number;
  }> {
    const response = await api.get('/blog/stats/overview');
    return response.data.data;
  }
}

export const blogService = new BlogService();
