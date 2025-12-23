import React from 'react';
import { Link } from 'react-router-dom';
import { useBreadcrumbSchema } from '../hooks/useStructuredData';
import SEOHelmet from './SEOHelmet';

const Breadcrumbs = ({ items }) => {
  const breadcrumbSchema = useBreadcrumbSchema(items);

  return (
    <>
      <SEOHelmet structuredData={breadcrumbSchema} />
      <nav className="bg-gray-50 py-4" aria-label="Breadcrumb">
        <div className="container mx-auto px-6">
          <ol className="flex items-center space-x-2 text-sm">
            {items.map((item, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <svg className="w-4 h-4 text-gray-400 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                )}
                {index === items.length - 1 ? (
                  <span className="text-gray-900 font-medium" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link 
                    to={item.url} 
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                    itemProp="item"
                  >
                    <span itemProp="name">{item.name}</span>
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </>
  );
};

export default Breadcrumbs;
