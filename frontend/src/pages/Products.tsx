import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../services/api.ts';

interface Product {
  productReferenceId?: string;
  id?: string;
  name?: string;
  displayName?: string;
  description?: string;
  shortDescription?: string;
  pricing?: {
    amount: number;
    currency: string;
    interval?: string;
  };
  price?: {
    amount: number;
    currency: string;
  };
  [key: string]: any;
}

const Products: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProducts();
      console.log('Products API Response:', response);
      // Extract products from content.results based on API structure
      const productsData = response?.content?.results || response?.content || response || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError(err.response?.data?.detail || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (product: Product) => {
    // Handle direct price field (number) - this is what the API returns
    if (typeof product.price === 'number') {
      const currency = product.isoCurrencyCode || '';
      return `${currency} ${Number(product.price).toLocaleString()}`;
    }
    
    // Handle pricing object (fallback)
    if (product.pricing && typeof product.pricing === 'object') {
      const amount = product.pricing.amount;
      const currency = product.pricing.currency || '';
      const interval = 'interval' in product.pricing ? `/${product.pricing.interval}` : '';
      return `${currency} ${amount}${interval}`;
    }
    
    return 'Price not available';
  };

  const getProductDisplayName = (product: Product) => {
    return product.name || product.displayName || product.productReferenceId || product.id || 'Unknown Product';
  };

  const getProductDescription = (product: Product) => {
    return product.description || product.shortDescription || 'No description available';
  };

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    const name = getProductDisplayName(product).toLowerCase();
    const description = getProductDescription(product).toLowerCase();
    const productId = (product.productReferenceId || product.id || '').toLowerCase();
    
    return name.includes(searchLower) || 
           description.includes(searchLower) || 
           productId.includes(searchLower);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-starlink-darker flex items-center justify-center">
        <div className="text-starlink-text text-lg">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-starlink-darker p-3 md:p-6 lg:p-8 ml-[25px] md:ml-0">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-starlink-text-secondary hover:text-starlink-text transition-colors mb-3 text-sm"
          >
            <span>←</span>
            <span>Back to Admin Portal</span>
          </button>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-xl md:text-3xl font-bold text-starlink-text">
              Available Products
            </h1>
            <span className="px-4 py-2 bg-starlink-accent text-white rounded-full text-sm">
              {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-200 px-3 py-2 rounded mb-4 text-sm">
            {error}
            <button
              onClick={fetchProducts}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-4 md:mb-6">
          <input
            type="text"
            placeholder="Search products by name, description, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 md:py-3 bg-starlink-gray border border-starlink-border rounded text-starlink-text placeholder-starlink-text-secondary focus:outline-none focus:border-starlink-accent text-sm md:text-base"
          />
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredProducts.map((product, index) => (
              <div
                key={product.productReferenceId || product.id || index}
                className="card p-4 md:p-6 bg-starlink-gray border border-starlink-border hover:border-starlink-accent transition-all duration-200"
              >
                {/* Product Name */}
                <h3 className="text-lg md:text-xl font-bold text-starlink-text mb-2">
                  {getProductDisplayName(product)}
                </h3>

                {/* Product Description */}
                <p className="text-xs md:text-sm text-starlink-text-secondary mb-4 line-clamp-3">
                  {getProductDescription(product)}
                </p>

                {/* Pricing */}
                <div className="p-3 bg-starlink-light rounded border border-starlink-border mb-3">
                  <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Pricing</p>
                  <p className="text-sm md:text-base text-starlink-text font-semibold">
                    {formatPrice(product)}
                  </p>
                </div>

                {/* Product Reference ID */}
                {(product.productReferenceId || product.id) && (
                  <div className="p-3 bg-starlink-darker rounded">
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Product ID</p>
                    <p className="text-xs text-starlink-text font-mono break-all">
                      {product.productReferenceId || product.id}
                    </p>
                  </div>
                )}

                {/* Additional Details */}
                {Object.keys(product).filter(key => 
                  !['productReferenceId', 'id', 'name', 'displayName', 'description', 'shortDescription', 'pricing', 'price', 'isoCurrencyCode', 'isSla', 'dataProducts', 'maxNumberOfUserTerminals'].includes(key)
                ).length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs md:text-sm text-starlink-accent hover:text-starlink-accent/80 transition-colors">
                      View More Details
                    </summary>
                    <div className="mt-2 space-y-2">
                      {Object.entries(product)
                        .filter(([key]) => 
                          !['productReferenceId', 'id', 'name', 'displayName', 'description', 'shortDescription', 'pricing', 'price', 'isoCurrencyCode', 'isSla', 'dataProducts', 'maxNumberOfUserTerminals'].includes(key)
                        )
                        .map(([key, value]) => {
                          const label = key.replace(/([A-Z])/g, ' $1').replace(/^\w/, (c) => c.toUpperCase());
                          return (
                            <div key={key} className="p-2 bg-starlink-darker rounded">
                              <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">{label}</p>
                              <p className="text-xs text-starlink-text break-words">
                                {value !== null && value !== undefined ? String(value) : 'N/A'}
                              </p>
                            </div>
                          );
                        })
                      }
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 md:p-12 bg-starlink-gray border border-starlink-border text-center">
            <p className="text-sm md:text-base text-starlink-text-secondary">
              {searchTerm ? 'No products match your search criteria.' : 'No products available.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;