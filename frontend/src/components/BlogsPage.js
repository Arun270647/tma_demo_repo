import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, User, ArrowRight, Search } from 'lucide-react';
import Header from './landing/Header';
import Footer from './landing/Footer';
import SEOHelmet from './SEOHelmet';
import Breadcrumbs from './Breadcrumbs';

export default function BlogsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/blog/public/posts?limit=50`);

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blogs' }
  ];

  return (
    <>
      <SEOHelmet
        title="Blog - Track My Academy | Sports Management Insights & Resources"
        description="Explore articles, insights, and resources about sports academy management, athlete development, coaching best practices, and sports technology innovations from Track My Academy."
        keywords="sports academy blog, coaching articles, athlete development, sports management insights, academy best practices, sports technology blog"
        canonical="/blogs"
      />

      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <Breadcrumbs items={breadcrumbItems} />

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 lg:px-12 xl:px-24 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight animate-fade-in">
              Blog
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              Insights, stories, and resources to help you build and grow your sports academy.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full pl-12 pr-4 py-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-20 px-6 lg:px-12 xl:px-24">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading articles...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {searchQuery ? 'No articles found' : 'No articles yet'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? 'Try adjusting your search query'
                    : 'Check back soon for insightful articles about sports academy management'}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post, index) => (
                  <article
                    key={post.id}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 opacity-0 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
                    onClick={() => navigate(`/blogs/${post.slug}`)}
                  >
                    {post.cover_image_url && (
                      <div className="overflow-hidden h-48">
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="p-6">
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {post.title}
                      </h2>

                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {post.author_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.published_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </div>

                      {post.read_time_minutes && (
                        <div className="mt-3 text-xs text-gray-500">
                          {post.read_time_minutes} min read
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 lg:px-12 xl:px-24 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to transform your academy?
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-10">
              Join hundreds of academies already using Track My Academy to streamline
              their operations and grow their programs.
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
