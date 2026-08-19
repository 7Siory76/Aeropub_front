import { useState, useEffect, useCallback } from 'react';
import { articlesApi, checkHealthApi } from '../api/apiService';
import { toast } from 'react-toastify';

export function useArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchArticles = useCallback(async (showToast = false) => {
    setLoading(true);
    try {
      // 1. Appel du lien de santé API HTTP GET http://localhost:5000/api/health
      await checkHealthApi();
      setIsBackendOnline(true);

      // 2. Appel du lien des articles HTTP GET http://localhost:5000/api/articles
      const data = await articlesApi.getAll();
      setArticles(data || []);

      if (showToast) {
        toast.success(`✨ Catalogue rafraîchi depuis PostgreSQL (${data.length} articles)`);
      }
    } catch (error) {
      setIsBackendOnline(false);
      setArticles([]);
      console.warn('❌ Impossible d\'interroger le BACK_OFFICE:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const categories = ['Tous', ...new Set(articles.map(a => a.category).filter(Boolean))];

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'Tous' || article.category === selectedCategory;
    const matchesSearch = 
      article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return {
    articles: filteredArticles,
    allArticlesCount: articles.length,
    loading,
    isBackendOnline,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    refreshArticles: () => fetchArticles(true)
  };
}
