import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mail, Video, Search, Plus, Minus } from 'lucide-react';
import { allSupportArticles, faqsByCategory } from '../../utils/supportData'; // Import the content

// --- Reusable Components ---
const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 py-6">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left gap-4">
        <span className="text-lg font-medium text-gray-900">{question}</span>
        {isOpen ? <Minus className="w-5 h-5 text-[#219377] flex-shrink-0" /> : <Plus className="w-5 h-5 text-gray-500 flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="mt-4 pr-8 text-gray-600 leading-relaxed animate-fade-in">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

const SearchResultItem = ({ result }) => (
  <li className="border-b border-gray-100 last:border-none py-3">
    <Link to={`/support/article/${result.id}`} className="group">
      <h3 className="font-semibold text-[#219377] group-hover:underline">{result.title}</h3>
      <p className="text-sm text-gray-600">{result.content.substring(0, 120)}...</p>
    </Link>
  </li>
);


// --- Main Support Page ---
const SupportPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Memoized search results for performance.
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return allSupportArticles.filter(article =>
      article.title.toLowerCase().includes(lowercasedQuery) ||
      article.content.toLowerCase().includes(lowercasedQuery) ||
      article.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery))
    );
  }, [searchQuery]);

  return (
    <div className="bg-white">
      {/* SECTION 1: HERO & SEARCH */}
      <div className="bg-gray-50/70 text-center px-4 py-20 lg:py-28">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#219377] tracking-tight animate-fade-in-up">
          How can we help?
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-700 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          From quick questions to step-by-step tutorials, we're here to ensure you get the most out of our platform.
        </p>
        <div className="mt-8 max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for answers (e.g., 'how to add tenant')"
              className="w-full px-5 py-4 text-lg border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-[#219377] focus:border-[#219377] transition"
            />
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          </div>
        </div>
      </div>
      
      {/* Conditionally Render Search Results or Support Channels */}
      {searchQuery.trim() ? (
        <div className="container mx-auto px-6 max-w-4xl -mt-16 relative z-10 pb-20">
            <div className="bg-white rounded-2xl shadow-2xl border p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-4">Search Results ({searchResults.length})</h2>
                {searchResults.length > 0 ? (
                    <ul className="space-y-2">
                        {searchResults.map(result => (
                            <SearchResultItem key={result.id} result={result} />
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600 text-center py-8">No results found for "{searchQuery}". Try another search term or browse the topics below.</p>
                )}
            </div>
        </div>
      ) : (
        <div className="container mx-auto px-6 py-20 lg:py-24">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <BookOpen className="w-10 h-10 text-[#219377] mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Knowledge Base</h3>
              <p className="text-gray-600">Browse our comprehensive library of articles and guides.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <Video className="w-10 h-10 text-[#219377] mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Video Tutorials</h3>
              <p className="text-gray-600">Watch step-by-step videos that walk you through features.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <Mail className="w-10 h-10 text-[#219377] mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Email Support</h3>
              <p className="text-gray-600">Can't find an answer? Email us at <a href="mailto:support@threalty.app" className="text-[#219377] font-medium">support@threalty.app</a>.</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: FAQ ACCORDION */}
      <div className="bg-gray-50/70 py-20 lg:py-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Browse Topics</h2>
          </div>
          <div className="space-y-2">
            {Object.entries(faqsByCategory).map(([category, items]) => (
              <div key={category} className="pt-8">
                <h3 className="text-2xl font-bold text-[#219377] mb-4">{category}</h3>
                {items.map((faq, i) => (
                  <FaqItem key={i} question={faq.title} answer={faq.content} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>
        {`
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out both;
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.39, 0.575, 0.565, 1) both;
        }
        `}
      </style>
    </div>
  );
};

export default SupportPage;