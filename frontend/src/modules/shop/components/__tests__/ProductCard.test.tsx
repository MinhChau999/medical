import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '@/test/test-utils';
import ProductCard from '../ProductCard';

// Mock Ant Design message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  };
});

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    slug: 'test-product',
    description: 'Test Description',
    image: 'https://example.com/image.jpg',
    price: 100000,
    compareAtPrice: 150000,
    status: 'active',
    category: 'Test Category',
    variantId: 'variant-1',
  };

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test Category')).toBeInTheDocument();
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
  });

  it('displays product image when available', () => {
    render(<ProductCard product={mockProduct} />);

    const image = screen.getByAltText('Test Product');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockProduct.image);
  });

  it('displays "No Image" when image is not available', () => {
    const productWithoutImage = { ...mockProduct, image: undefined };
    render(<ProductCard product={productWithoutImage} />);

    expect(screen.getByText('No Image')).toBeInTheDocument();
  });

  it('calculates and displays discount percentage', () => {
    render(<ProductCard product={mockProduct} />);

    // Discount: (150000 - 100000) / 150000 * 100 = 33%
    expect(screen.getByText('-33%')).toBeInTheDocument();
  });

  it('displays compare at price when available', () => {
    render(<ProductCard product={mockProduct} />);

    // Both prices should be rendered
    const prices = screen.getAllByText(/\$/);
    expect(prices.length).toBeGreaterThan(0);
  });

  it('does not display discount tag when no compare price', () => {
    const productNoDiscount = { ...mockProduct, compareAtPrice: undefined };
    render(<ProductCard product={productNoDiscount} />);

    expect(screen.queryByText(/-%/)).not.toBeInTheDocument();
  });

  it('handles add to cart click', async () => {
    const { message } = await import('antd');
    render(<ProductCard product={mockProduct} />);

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    expect(message.success).toHaveBeenCalledWith('Added to cart!');
  });

  it('links to product detail page', () => {
    render(<ProductCard product={mockProduct} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/shop/products/test-product');
  });

  it('formats price correctly', () => {
    render(<ProductCard product={mockProduct} />);

    // Check if price is formatted (should contain $ or currency symbol)
    const priceElements = screen.getAllByText(/\$/);
    expect(priceElements.length).toBeGreaterThan(0);
  });
});
