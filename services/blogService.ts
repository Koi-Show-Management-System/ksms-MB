import api from './api';

// Blog Category Types
export interface BlogCategory {
  id: string;
  name: string;
  description: string;
}

export interface BlogCategoryResponse {
  data: BlogCategory[];
  statusCode: number;
  message: string;
}

// Blog Post Types
export interface BlogPost {
  id: string;
  imgUrl: string;
  title: string;
  content: string;
  blogCategory: BlogCategory;
  account: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    phone: string;
    status: string;
    role: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string | null;
}

export interface BlogPostsResponse {
  data: {
    size: number;
    page: number;
    total: number;
    totalPages: number;
    items: BlogPost[];
  };
  statusCode: number;
  message: string;
}

export interface BlogPostResponse {
  data: BlogPost;
  statusCode: number;
  message: string;
}

/**
 * Fetch all blog categories
 * @returns Promise with blog categories
 */
export const getAllBlogCategories = async (): Promise<BlogCategoryResponse> => {
  try {
    const response = await api.get<BlogCategoryResponse>('/api/v1/blog-category/get-all');
    return response.data;
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    throw error;
  }
};

/**
 * Fetch blog posts with optional category filter
 * @param page Page number (default: 1)
 * @param size Number of items per page (default: 10)
 * @param blogCategoryId Optional category ID to filter by
 * @returns Promise with blog posts
 */
export const getBlogPosts = async (
  page: number = 1,
  size: number = 10,
  blogCategoryId?: string
): Promise<BlogPostsResponse> => {
  try {
    const params: Record<string, any> = { page, size };
    
    // Add category filter if provided
    if (blogCategoryId) {
      params.blogCategoryId = blogCategoryId;
    }
    
    const response = await api.get<BlogPostsResponse>('/api/v1/blog/get-page', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    throw error;
  }
};

/**
 * Fetch a single blog post by ID
 * @param id Blog post ID
 * @returns Promise with blog post details
 */
export const getBlogPostById = async (id: string): Promise<BlogPostResponse> => {
  try {
    const response = await api.get<BlogPostResponse>(`/api/v1/blog/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching blog post with ID ${id}:`, error);
    throw error;
  }
};
